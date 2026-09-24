import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppModeStore } from '@/stores/appModeStore';
import { cn } from '@/lib/utils';
import { Settings as SettingsIcon, User, Shield } from 'lucide-react';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-2"
      role="switch"
      aria-checked={checked}
    >
      <span className="text-sm text-text-primary">{label}</span>
      <div className={cn(
        'w-10 h-6 rounded-full transition-colors relative',
        checked ? 'bg-accent-primary' : 'bg-bg-tertiary'
      )}>
        <div className={cn(
          'w-4 h-4 rounded-full bg-white absolute top-1 transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1'
        )} />
      </div>
    </button>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<'preferences' | 'account'>('preferences');
  const { mode, setMode } = useAppModeStore();
  const [skeleton, setSkeleton] = useState(true);
  const [voice, setVoice] = useState(true);
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');

  return (
    <PageContainer title="Settings" subtitle="Manage your preferences and account">
      {/* Tab toggle */}
      <div className="flex gap-2 mb-6">
        {([
          { key: 'preferences' as const, label: 'Preferences', icon: <SettingsIcon className="w-4 h-4" /> },
          { key: 'account' as const, label: 'Account', icon: <User className="w-4 h-4" /> },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-medium transition-colors',
              tab === t.key
                ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                : 'text-text-secondary hover:bg-bg-tertiary'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'preferences' && (
        <div className="space-y-4 max-w-xl">
          <GlassCard className="p-5">
            <h3 className="text-sm font-medium text-text-primary mb-4">Display</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary">Units</span>
                <div className="flex bg-bg-tertiary rounded-[6px] p-0.5">
                  {(['metric', 'imperial'] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => setUnits(u)}
                      className={cn(
                        'px-3 py-1 text-xs font-medium rounded-[4px] transition-colors capitalize',
                        units === u ? 'bg-accent-primary text-white' : 'text-text-secondary'
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <Toggle checked={skeleton} onChange={setSkeleton} label="Skeleton overlay" />
              <Toggle checked={voice} onChange={setVoice} label="Voice coaching" />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="text-sm font-medium text-text-primary mb-2">App Mode</h3>
            <p className="text-xs text-text-secondary mb-4">
              Demo mode uses sample data. Switch to Real mode for live, authenticated data.
            </p>
            <div className="flex gap-2">
              {(['demo', 'real'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 px-4 py-3 rounded-[8px] text-sm font-medium transition-all capitalize',
                    mode === m
                      ? m === 'demo'
                        ? 'bg-warning/15 text-warning border border-warning/20'
                        : 'bg-success/15 text-success border border-success/20'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                  )}
                >
                  {m} Mode
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === 'account' && (
        <div className="space-y-4 max-w-xl">
          <GlassCard className="p-5">
            <h3 className="text-sm font-medium text-text-primary mb-4">Change Password</h3>
            <div className="space-y-3">
              <Input label="Current Password" type="password" placeholder="••••••••" />
              <Input label="New Password" type="password" placeholder="••••••••" />
              <Button size="sm">Update Password</Button>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="text-sm font-medium text-text-primary mb-2">Export Data</h3>
            <p className="text-xs text-text-secondary mb-3">Download all your data in JSON format.</p>
            <Button variant="secondary" size="sm">Export My Data</Button>
          </GlassCard>

          <GlassCard className="p-5 border border-error/20">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-error" />
              <h3 className="text-sm font-medium text-error">Danger Zone</h3>
            </div>
            <p className="text-xs text-text-secondary mb-3">
              Permanently delete your account and all associated data.
            </p>
            <Button variant="danger" size="sm">Delete Account</Button>
          </GlassCard>
        </div>
      )}
    </PageContainer>
  );
}
