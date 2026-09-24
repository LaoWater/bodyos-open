from pathlib import Path
import os, shutil, json, re

import sys
source=Path(__file__).resolve().parents[1]
if len(sys.argv)!=2:raise SystemExit('Usage: python scripts/export-community.py <new-output-folder>')
destination=Path(sys.argv[1]).resolve()
if destination==source or destination.is_relative_to(source):raise SystemExit('Choose a new folder outside this checkout')
if destination.exists():raise SystemExit('The output folder already exists; choose a fresh folder')
destination.mkdir(parents=True)
excluded_dirs={'.git','node_modules','Pods','build','dist','.expo','.idea','.vscode','.claude','__pycache__','.venv','venv','_archive','xcuserdata','DerivedData','results','data','models','demo-videos','.ipynb_checkpoints'}
allowed_suffixes={'.ts','.tsx','.js','.jsx','.cjs','.mjs','.json','.md','.txt','.py','.ipynb','.sql','.toml','.yaml','.yml','.html','.css','.scss','.svg','.png','.jpg','.jpeg','.webp','.ico','.mp4','.swift','.m','.h','.plist','.pbxproj','.xcworkspacedata','.xcscheme','.storyboard','.xcprivacy','.xcconfig','.entitlements','.lock','.example','.gradle','.properties','.sh','.rb','.xml','.kt','.java','.env','.gitignore','.gcloudignore','.bat','.ps1'}
special_names={'LICENSE','Podfile','Gemfile','gradlew','.gitignore','.gcloudignore','.xcode.env'}
root_files=['README.md','LICENSE','AGENTS.md','CONTRIBUTING.md','SECURITY.md','.gitignore','.gcloudignore','cloudbuild.web.yaml']

def permitted(p):
    rel=p.relative_to(source)
    if any(part in excluded_dirs for part in rel.parts[:-1]): return False
    # The mobile sample pose arrays are source code, not the extracted training dataset.
    if '/src/data/' in '/'+rel.as_posix():
        pass
    name=p.name.lower()
    if name.startswith('.env') and name!='.env.example': return False
    if any(word in name for word in ['debug','compile','compilation','credentials','service-account','service_account']): return False
    if p.suffix.lower() not in allowed_suffixes and p.name not in special_names: return False
    return True

files=[source/f for f in root_files]
for folder in ['apps','ml','supabase','docs','.github','scripts']:
    base=source/folder
    if not base.exists():continue
    for current,dirs,names in os.walk(base):
        # src/data contains handcrafted fixture code and must stay in the application.
        dirs[:]=[d for d in dirs if d not in excluded_dirs or (d=='data' and Path(current).name=='src')]
        for name in names:
            p=Path(current)/name
            if p.is_symlink():raise RuntimeError('Review symlink: '+str(p.relative_to(source)))
            rel=p.relative_to(source).as_posix()
            if '/src/data/' in '/'+rel:
                if p.suffix in {'.ts','.tsx','.js'}:files.append(p)
            elif permitted(p):files.append(p)

for p in files:
    rel=p.relative_to(source); target=destination/rel
    assert target.resolve().is_relative_to(destination)
    target.parent.mkdir(parents=True,exist_ok=True)
    if p.suffix=='.ipynb':
        notebook=json.loads(p.read_text(encoding='utf-8'))
        for cell in notebook.get('cells',[]):
            if cell.get('cell_type')=='code':cell['outputs']=[];cell['execution_count']=None
            cell['metadata']={}
        notebook['metadata']={k:v for k,v in notebook.get('metadata',{}).items() if k in ['kernelspec','language_info']}
        target.write_text(json.dumps(notebook,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
    else:shutil.copy2(p,target)

# Preserve private recordings in the development checkout. The public app uses
# its existing optional-video path with the handcrafted sample skeleton instead.
demo=destination/'apps/mobile/src/data/demoExercises.ts'
s=demo.read_text(encoding='utf-8')
s=re.sub(r"require\('../../assets/demo-videos/[^']+'\)", 'undefined',s)
s=s.replace('// Heavy overlay versions — the videos already contain the skeleton/pose overlay','// Add your own consented demo recordings here; the public edition uses sample pose keyframes.')
demo.write_text(s,encoding='utf-8')
web_demo=destination/'apps/web/src/adapters/demo/demoData.ts'
web_source=web_demo.read_text(encoding='utf-8')
web_source=re.sub(r"(?m)^    videoUrl: '/media/demo-videos/[^']+',\n", '', web_source)
web_demo.write_text(web_source,encoding='utf-8')
app=destination/'apps/mobile/app.json';config=json.loads(app.read_text(encoding='utf-8'))
config.get('expo',{}).pop('owner',None)
config.get('expo',{}).get('extra',{}).pop('eas',None)
app.write_text(json.dumps(config,indent=2)+'\n',encoding='utf-8')
project=destination/'apps/mobile/ios/BodyOS.xcodeproj/project.pbxproj'
if project.exists():project.write_text(re.sub(r'DEVELOPMENT_TEAM = [^;]*;', 'DEVELOPMENT_TEAM = "";',project.read_text(encoding='utf-8')),encoding='utf-8')
print(json.dumps({'files':len(files),'destination':str(destination),'bytes':sum(p.stat().st_size for p in destination.rglob('*') if p.is_file() and '.git' not in p.parts)}))

# Report only filenames and signature categories; never print matched values.
patterns={
 'private key':rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
 'provider token':rb'\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{25,}|gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}|AIza[A-Za-z0-9_-]{30,}|sb_secret_[A-Za-z0-9_-]{20,})',
 'embedded JWT':rb'eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}',
 'password URL':rb'(?:postgres|postgresql|mysql)://[^\s/:]+:[^\s@]{3,}@',
}
findings=[]
binary={'.png','.jpg','.jpeg','.webp','.ico','.mp4'}
for p in destination.rglob('*'):
    if not p.is_file() or '.git' in p.parts or p.suffix.lower() in binary:continue
    for label,pat in patterns.items():
        if re.search(pat,p.read_bytes()):findings.append({'file':p.relative_to(destination).as_posix(),'signature':label})
print(json.dumps({'findings':findings}))
if findings:raise SystemExit('Review findings before publication')
