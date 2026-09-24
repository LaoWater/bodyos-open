import { useState, useEffect, useCallback } from 'react';
import type { AIConversation, AIMessage, AIMessageFeedback } from '../types/models';
import * as aiService from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export function useAI() {
  const { isAuthenticated } = useAuth();
  const { state: { appMode }, setAppMode } = useApp();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<AIConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const convos = await aiService.getConversations();
      setConversations(convos);
      if (convos.length > 0) {
        const latest = await aiService.getConversationById(convos[0].id);
        setActiveConversation(latest);
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to load conversations');
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Sync AI service chat mode with appMode
  useEffect(() => {
    if (appMode === 'real') {
      aiService.setChatMode('real');
      setIsDemo(false);
    } else {
      aiService.setChatMode('demo');
      setIsDemo(true);
    }
  }, [appMode]);

  const sendMessage = useCallback(async (text: string) => {
    if (!activeConversation) return null;
    setSending(true);
    setError(null);
    try {
      // Optimistically add user message to UI
      const tempUserMsg: AIMessage = {
        id: `tmp_${Date.now()}_user`,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };
      setActiveConversation((prev) =>
        prev ? { ...prev, messages: [...prev.messages, tempUserMsg] } : prev,
      );

      const response = await aiService.sendMessage(activeConversation.id, text);

      // Refresh conversation to get final state (includes both messages with DB ids in real mode)
      const updated = await aiService.getConversationById(activeConversation.id);
      setActiveConversation(updated);
      setSending(false);
      return response;
    } catch (err: any) {
      setError(err.message ?? 'Failed to send message');
      // Reload conversation to remove optimistic message
      const updated = await aiService.getConversationById(activeConversation.id);
      setActiveConversation(updated);
      setSending(false);
      return null;
    }
  }, [activeConversation]);

  const exitDemo = useCallback(async (): Promise<'needs_auth' | 'ok'> => {
    if (!isAuthenticated) {
      return 'needs_auth';
    }

    setError(null);
    try {
      aiService.setChatMode('real');
      setIsDemo(false);
      await setAppMode('real');

      // Create a fresh real conversation
      const newConvo = await aiService.createConversation('Coach Chat');
      if (newConvo) {
        setActiveConversation({
          ...newConvo,
          messages: [],
        });
        setConversations((prev) => [newConvo as AIConversation, ...prev]);
      }
    } catch (err: any) {
      // Revert to demo mode on failure
      aiService.setChatMode('demo');
      setIsDemo(true);
      setError(err.message ?? 'Failed to connect to live chat. Please try again.');
    }
    return 'ok';
  }, [isAuthenticated, setAppMode]);

  const enterDemo = useCallback(() => {
    aiService.setChatMode('demo');
    setIsDemo(true);
    refresh();
  }, [refresh]);

  const newConversation = useCallback(async (title = 'Coach Chat') => {
    setError(null);
    try {
      const newConvo = await aiService.createConversation(title);
      if (newConvo) {
        setActiveConversation(newConvo as AIConversation);
        setConversations((prev) => [newConvo as AIConversation, ...prev]);
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to create conversation');
    }
  }, []);

  const selectConversation = useCallback(async (id: string) => {
    setLoading(true);
    const convo = await aiService.getConversationById(id);
    setActiveConversation(convo);
    setLoading(false);
  }, []);

  const submitFeedback = useCallback(async (messageId: string, feedback: AIMessageFeedback) => {
    try {
      await aiService.submitFeedback(messageId, feedback);
      // Update local state
      setActiveConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === messageId ? { ...m, feedback } : m,
          ),
        };
      });
    } catch (err: any) {
      setError(err.message ?? 'Failed to submit feedback');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    conversations,
    activeConversation,
    loading,
    sending,
    isDemo,
    error,
    sendMessage,
    refresh,
    exitDemo,
    enterDemo,
    newConversation,
    selectConversation,
    submitFeedback,
    clearError,
  };
}
