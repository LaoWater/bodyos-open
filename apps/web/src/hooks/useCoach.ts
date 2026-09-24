import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdapter } from '@/adapters';

export function useConversations() {
  const adapter = useAdapter();
  return useQuery({
    queryKey: ['coach', 'conversations'],
    queryFn: () => adapter.fetchConversations(),
  });
}

export function useConversation(id: string | null) {
  const adapter = useAdapter();
  return useQuery({
    queryKey: ['coach', 'conversation', id],
    queryFn: () => adapter.fetchConversation(id!),
    enabled: !!id,
  });
}

export function useSendMessage() {
  const adapter = useAdapter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      adapter.sendMessage(conversationId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['coach', 'conversations'] });
    },
  });
}

export function useCreateConversation() {
  const adapter = useAdapter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title: string) => adapter.createConversation(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'conversations'] });
    },
  });
}
