import { useState, useRef, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ChatBubble } from '@/components/features/ChatBubble';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useConversations, useConversation, useSendMessage, useCreateConversation } from '@/hooks/useCoach';
import { useAppModeStore } from '@/stores/appModeStore';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Plus, Send, MessageCircle } from 'lucide-react';

const suggestionChips = [
  'How can I improve my squat depth?',
  'Review my latest checkpoint',
  'Create a mobility routine',
  'Analyze my training trends',
];

export default function Coach() {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mode = useAppModeStore((s) => s.mode);

  const { data: conversations, isLoading: convsLoading } = useConversations();
  const { data: activeConv } = useConversation(activeConvId);
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();

  // Auto-select first conversation
  useEffect(() => {
    if (!activeConvId && conversations?.length) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeConvId) return;
    const content = input;
    setInput('');
    sendMessage.mutate({ conversationId: activeConvId, content });
  };

  const handleNewConversation = async () => {
    const conv = await createConversation.mutateAsync('New conversation');
    setActiveConvId(conv.id);
    setMobilePanelOpen(false);
  };

  const handleChip = (text: string) => {
    if (!activeConvId) return;
    sendMessage.mutate({ conversationId: activeConvId, content: text });
  };

  return (
    <PageContainer title="Coach" subtitle="AI-powered movement coaching">
      <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Conversation list — desktop */}
        <div className={cn(
          'w-[280px] flex-shrink-0 flex flex-col',
          'hidden lg:flex'
        )}>
          <Button
            className="mb-3 w-full"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleNewConversation}
            loading={createConversation.isPending}
          >
            New Conversation
          </Button>

          <div className="flex-1 overflow-y-auto space-y-1">
            {convsLoading ? (
              <CardSkeleton />
            ) : conversations?.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={cn(
                  'w-full text-left px-3 py-3 rounded-[8px] transition-colors',
                  activeConvId === conv.id
                    ? 'bg-accent-primary/10 border border-accent-primary/20'
                    : 'hover:bg-bg-tertiary'
                )}
              >
                <div className="text-sm font-medium text-text-primary truncate">{conv.title}</div>
                <div className="text-xs text-text-tertiary truncate mt-0.5">{conv.lastMessage}</div>
                <div className="text-[10px] text-text-disabled mt-1">{formatRelativeTime(conv.updatedAt)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile conversation toggle */}
        <button
          onClick={() => setMobilePanelOpen(!mobilePanelOpen)}
          className="lg:hidden fixed bottom-20 right-4 z-20 w-12 h-12 rounded-full bg-accent-primary text-white shadow-glow flex items-center justify-center"
        >
          <MessageCircle className="w-5 h-5" />
        </button>

        {/* Chat panel */}
        <GlassCard className="flex-1 flex flex-col overflow-hidden">
          {/* Mode badge */}
          <div className="px-5 py-3 border-b border-border-subtle flex items-center gap-2">
            <Badge variant={mode === 'demo' ? 'warning' : 'success'}>
              {mode === 'demo' ? 'Demo' : 'Live'}
            </Badge>
            <span className="text-sm text-text-secondary">
              {activeConv?.title || 'Select a conversation'}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {activeConv?.messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}

            {/* Suggestion chips when empty or after AI response */}
            {(!activeConv?.messages.length || activeConv?.messages[activeConv.messages.length - 1]?.role === 'assistant') && (
              <div className="flex flex-wrap gap-2 pt-2">
                {suggestionChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleChip(chip)}
                    className="px-3 py-1.5 text-xs text-accent-primary border border-accent-primary/20 rounded-full hover:bg-accent-primary/10 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {sendMessage.isPending && (
              <div className="flex justify-start">
                <div className="glass rounded-[16px] rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="px-5 py-4 border-t border-border-subtle">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about your movement, request a plan, review your progress..."
                className="flex-1 px-4 py-2.5 bg-bg-tertiary border border-border-default rounded-[8px] text-sm text-text-primary placeholder:text-text-disabled outline-hidden focus:border-border-strong transition-colors"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sendMessage.isPending}
                icon={<Send className="w-4 h-4" />}
                className="px-3"
              >
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageContainer>
  );
}
