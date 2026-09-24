import { useNavigate } from 'react-router';
import { ArrowLeft, Sparkles, Bug, Zap, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

type ChangeType = 'feature' | 'fix' | 'improvement' | 'release';

interface ChangelogEntry {
  version: string;
  date: string;
  type: ChangeType;
  title: string;
  changes: string[];
}

const typeConfig: Record<ChangeType, { icon: React.ReactNode; variant: 'success' | 'error' | 'info' | 'warning'; label: string }> = {
  feature: { icon: <Sparkles className="w-4 h-4" />, variant: 'success', label: 'Feature' },
  fix: { icon: <Bug className="w-4 h-4" />, variant: 'error', label: 'Fix' },
  improvement: { icon: <Zap className="w-4 h-4" />, variant: 'info', label: 'Improvement' },
  release: { icon: <Package className="w-4 h-4" />, variant: 'warning', label: 'Release' },
};

const changelog: ChangelogEntry[] = [
  {
    version: '1.3.0',
    date: 'February 12, 2026',
    type: 'feature',
    title: 'Web Platform Launch',
    changes: [
      'New web landing page with interactive feature previews',
      'Web command center for deep session analysis',
      'Light and dark theme support with smooth transitions',
      'Full responsive design across all breakpoints',
      'Contact form and comprehensive documentation pages',
    ],
  },
  {
    version: '1.2.0',
    date: 'February 8, 2026',
    type: 'feature',
    title: 'Body Checkpoint System',
    changes: [
      '4-angle body checkpoint capture with ML scoring',
      'Focus area detection with severity mapping',
      'Body blueprint SVG visualization',
      'Checkpoint timeline with progress tracking',
      'Posture score trends across checkpoints',
    ],
  },
  {
    version: '1.1.2',
    date: 'February 5, 2026',
    type: 'improvement',
    title: 'Performance Optimization Pass',
    changes: [
      'ConstellationBackground rewritten: 5 native opacity pulses (was 35 JS animations)',
      'Progressive rendering with skeleton placeholders',
      'Frame processor throttled to 10 FPS for battery efficiency',
      'Single batched setState in all data hooks',
      'Deferred data fetch via InteractionManager',
    ],
  },
  {
    version: '1.1.0',
    date: 'February 1, 2026',
    type: 'feature',
    title: 'User Archetype & Onboarding',
    changes: [
      '8-step onboarding flow with skip support',
      'Movement philosophy selection (10 options)',
      'Pain point mapping with severity cycling',
      'Equipment and schedule preferences',
      'Biometric data collection (optional)',
    ],
  },
  {
    version: '1.0.1',
    date: 'January 28, 2026',
    type: 'fix',
    title: 'Camera & TFLite Stability',
    changes: [
      'Fixed TFLite model reload on mode switch (keep AnalyzeModeView mounted)',
      'Fixed worklet createRunOnJS render-time crash',
      'Added 4-second auto-pass timeout for framing check',
      'Vision camera isActive + useIsFocused guard',
      'Frame processor set to undefined when camera inactive',
    ],
  },
  {
    version: '1.0.0',
    date: 'January 20, 2026',
    type: 'release',
    title: 'Initial Release',
    changes: [
      'Real-time pose detection with MoveNet Lightning',
      'On-device 17-keypoint tracking mapped to 33 MediaPipe landmarks',
      'Demo mode with pre-recorded lunge and push-up videos',
      'AI coaching with ElevenLabs TTS (Adam voice)',
      'Glassmorphism UI with constellation background',
      'Record & Send workflow for cloud analysis',
    ],
  },
];

export default function Changelog() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <ThemeToggle size="sm" />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-14">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary tracking-[-0.02em] mb-3">
              Changelog
            </h1>
            <p className="text-text-secondary">
              Every improvement, feature, and fix — chronologically documented.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-8 bottom-8 w-px bg-border-default" />

            <div className="space-y-8">
              {changelog.map((entry, i) => {
                const config = typeConfig[entry.type];
                return (
                  <motion.div
                    key={entry.version}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="relative flex gap-5"
                  >
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-bg-tertiary border border-border-default flex items-center justify-center text-accent-primary z-10">
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 glass rounded-[16px] p-5 md:p-6">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="font-mono text-sm font-bold text-text-primary">v{entry.version}</span>
                        <Badge variant={config.variant}>{config.label}</Badge>
                        <span className="text-xs text-text-tertiary ml-auto">{entry.date}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-text-primary mb-3">{entry.title}</h3>
                      <ul className="space-y-1.5">
                        {entry.changes.map((change) => (
                          <li key={change} className="flex items-start gap-2.5 text-sm text-text-secondary">
                            <span className="w-1 h-1 rounded-full bg-accent-primary/50 flex-shrink-0 mt-2" />
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
