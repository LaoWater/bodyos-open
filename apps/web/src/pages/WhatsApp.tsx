import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MessageSquare } from 'lucide-react';

export default function WhatsApp() {
  return (
    <PageContainer title="WhatsApp" subtitle="Coaching on your favorite messaging app">
      <GlassCard variant="elevated" className="max-w-lg mx-auto p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="w-10 h-10 text-success" />
        </div>

        <Badge variant="info" className="mb-4">Coming Soon</Badge>

        <h2 className="font-display text-2xl font-bold text-text-primary mb-3">
          Coach on WhatsApp
        </h2>

        <p className="text-sm text-text-secondary leading-relaxed mb-6">
          Get coaching reminders, check-ins, and quick movement guidance directly through WhatsApp.
          Your coach will have full context of your training history and body data.
        </p>

        <ul className="text-sm text-text-secondary text-left space-y-2 mb-8">
          <li className="flex items-center gap-2">
            <span className="text-success">&#10003;</span> Daily workout reminders
          </li>
          <li className="flex items-center gap-2">
            <span className="text-success">&#10003;</span> Quick form check — send a video, get instant feedback
          </li>
          <li className="flex items-center gap-2">
            <span className="text-success">&#10003;</span> Progress check-ins with your body data
          </li>
          <li className="flex items-center gap-2">
            <span className="text-success">&#10003;</span> Ask anything about your training
          </li>
        </ul>

        <Button disabled className="w-full">
          Connect WhatsApp
        </Button>
        <p className="text-xs text-text-tertiary mt-3">
          We&apos;ll notify you when this feature is available.
        </p>
      </GlassCard>
    </PageContainer>
  );
}
