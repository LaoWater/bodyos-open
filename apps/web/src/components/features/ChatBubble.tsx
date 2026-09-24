import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import type { Message } from '@/types/models';

interface ChatBubbleProps {
  message: Message;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-[16px] px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-br-sm'
            : 'glass text-text-primary rounded-bl-sm'
        )}
      >
        {/* Simple markdown-like rendering */}
        <div className="space-y-2">
          {message.content.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-2" />;

            // Bold text
            const rendered = line.replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="font-semibold">$1</strong>'
            );

            // Numbered list
            if (/^\d+\./.test(line)) {
              return (
                <div key={i} className="pl-2" dangerouslySetInnerHTML={{ __html: rendered }} />
              );
            }

            // Bullet
            if (line.startsWith('- ')) {
              return (
                <div key={i} className="pl-2 flex gap-2">
                  <span className="text-accent-secondary mt-0.5">&#8226;</span>
                  <span dangerouslySetInnerHTML={{ __html: rendered.slice(2) }} />
                </div>
              );
            }

            return <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />;
          })}
        </div>
        <div className={cn('text-[10px] mt-2', isUser ? 'text-white/60' : 'text-text-tertiary')}>
          {formatRelativeTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
