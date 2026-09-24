// A small guided launcher; no accounts or API keys required.
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
const cwd=fileURLToPath(new URL('../apps/web/',import.meta.url));
if(Number(process.versions.node.split('.')[0])<22){console.error('Install Node.js 22 or newer, then run this again.');process.exit(1);}
const run=(args)=>new Promise(resolve=>{
 const child=spawn(process.platform==='win32'?'cmd.exe':'npm',process.platform==='win32'?['/d','/c','npm',...args]:args,{cwd,stdio:'inherit'});
 child.on('error',()=>{console.error('npm could not start. Install Node.js with npm.');resolve(1);});child.on('exit',code=>resolve(code??1));
});
console.log('BodyOS web demo — runs locally with sample data.');
if(!existsSync(new URL('../apps/web/node_modules/',import.meta.url))){
 const prompt=createInterface({input:process.stdin,output:process.stdout});
 const answer=await prompt.question('Install the web dependencies from package-lock.json? [y/N] ');prompt.close();
 if(!/^y(es)?$/i.test(answer.trim()))process.exit(0);
 const code=await run(['ci']);if(code)process.exit(code);
}
console.log('Open the address below in your browser, then choose Try Demo. Press Ctrl+C here to stop.');
process.exitCode=await run(['run','dev']);
