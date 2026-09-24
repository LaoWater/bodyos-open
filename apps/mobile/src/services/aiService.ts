import { getItem, setItem, addToIndex, getCollection } from './storage';
import { supabase } from './supabase';
import * as userService from './userService';
import * as assessmentService from './assessmentService';
import type { AIConversation, AIMessage, AIMessageFeedback } from '../types/models';

const PREFIX = 'conversation';
const INDEX = 'conversations:index';

// ---------------------------------------------------------------------------
// Chat mode management
// ---------------------------------------------------------------------------
export type ChatMode = 'demo' | 'real';
let chatMode: ChatMode = 'demo';

export function getChatMode(): ChatMode {
  return chatMode;
}

export function setChatMode(mode: ChatMode) {
  chatMode = mode;
}

// ---------------------------------------------------------------------------
// Demo mode helpers (original local‑storage implementation)
// ---------------------------------------------------------------------------
async function demoGetConversations(): Promise<AIConversation[]> {
  const items = await getCollection<AIConversation>(PREFIX, INDEX);
  return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

async function demoGetConversationById(id: string): Promise<AIConversation | null> {
  return getItem<AIConversation>(`${PREFIX}:${id}`);
}

async function demoCreateConversation(conversation: AIConversation): Promise<void> {
  await setItem(`${PREFIX}:${conversation.id}`, conversation);
  await addToIndex(INDEX, conversation.id);
}

function generateMockResponse(userMessage: string, context: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('posture') || lower.includes('alignment')) {
    if (context.includes('posture score')) {
      return "Based on your latest assessment, your posture is improving! Focus on shoulder blade retraction exercises and hip flexor stretches to continue making progress. Try wall angels — 3 sets of 10 reps daily.";
    }
    return "Good question about posture! Complete a body scan first so I can give you personalized recommendations based on your specific alignment patterns.";
  }

  if (lower.includes('workout') || lower.includes('exercise') || lower.includes('routine')) {
    return "Your active workout plan is designed to build a strong foundation. Focus on compound movements with proper form — quality over quantity. Make sure you're hitting the prescribed RPE range and resting adequately between sets.";
  }

  if (lower.includes('stretch') || lower.includes('mobility') || lower.includes('flexibility')) {
    return "For mobility work, I recommend a daily routine: Cat-Cow (10 reps), World's Greatest Stretch (5 per side), Hip 90/90s (8 per side), and Thoracic Rotations (10 per side). Hold each position for 2-3 breaths.";
  }

  if (lower.includes('shoulder')) {
    return "Shoulder health is crucial! Key exercises: Face Pulls (3×15), External Rotations with band (3×12), and Dead Hangs (3×30sec). Add these as a warm-up before upper body sessions.";
  }

  if (lower.includes('pain') || lower.includes('injury') || lower.includes('hurt')) {
    return "I'm not a medical professional, so please consult a doctor or physiotherapist for pain concerns. In general: reduce load, focus on mobility, and avoid exercises that reproduce the pain. I can suggest alternative movements once you know what to avoid.";
  }

  if (lower.includes('progress') || lower.includes('improve')) {
    return "Consistency is the key to progress! You're building great habits. Track your lifts, take regular progress photos, and reassess your posture monthly. Small improvements compound into big transformations.";
  }

  return "Great question! I'm here to help with workout planning, posture improvement, exercise form, and mobility work. Be more specific about what you'd like to work on, and I'll give you targeted advice based on your body data.";
}

async function demoSendMessage(conversationId: string, userMessage: string): Promise<AIMessage> {
  const conversation = await demoGetConversationById(conversationId);
  if (!conversation) throw new Error('Conversation not found');

  const userMsg: AIMessage = {
    id: `msg_${Date.now()}_user`,
    role: 'user',
    content: userMessage,
    createdAt: new Date().toISOString(),
  };
  conversation.messages.push(userMsg);

  const context = await buildContext();
  const responseContent = generateMockResponse(userMessage, context);

  const assistantMsg: AIMessage = {
    id: `msg_${Date.now()}_assistant`,
    role: 'assistant',
    content: responseContent,
    createdAt: new Date().toISOString(),
  };
  conversation.messages.push(assistantMsg);
  conversation.updatedAt = new Date().toISOString();

  await setItem(`${PREFIX}:${conversationId}`, conversation);
  return assistantMsg;
}

// ---------------------------------------------------------------------------
// Real mode helpers (Supabase + Edge Function)
// ---------------------------------------------------------------------------
async function realGetConversations(): Promise<AIConversation[]> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id, title, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title ?? 'Coach Chat',
    messages: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function realGetConversationById(id: string): Promise<AIConversation | null> {
  const { data: convo, error: convoError } = await supabase
    .from('ai_conversations')
    .select('id, title, created_at, updated_at')
    .eq('id', id)
    .single();

  if (convoError || !convo) return null;

  const { data: msgs, error: msgsError } = await supabase
    .from('ai_messages')
    .select('id, role, content, feedback, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (msgsError) throw msgsError;

  return {
    id: convo.id,
    title: convo.title ?? 'Coach Chat',
    messages: (msgs ?? []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      feedback: m.feedback ?? undefined,
      createdAt: m.created_at,
    })),
    createdAt: convo.created_at,
    updatedAt: convo.updated_at,
  };
}

async function realCreateConversation(title: string): Promise<AIConversation> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ title })
    .select('id, title, created_at, updated_at')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    messages: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

async function realSendMessage(conversationId: string, userMessage: string): Promise<AIMessage> {
  const context = await buildContext();

  const { data, error } = await supabase.functions.invoke('chat-coach', {
    body: {
      conversation_id: conversationId,
      message: userMessage,
      user_context: context,
    },
  });

  if (error) throw error;

  return {
    id: data.id,
    role: 'assistant',
    content: data.content,
    createdAt: data.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Public API (delegates based on chatMode)
// ---------------------------------------------------------------------------
export async function buildContext(): Promise<string> {
  const profile = await userService.getProfile();
  const latest = await assessmentService.getLatest();
  const streak = await userService.getStreak();

  let ctx = 'User context: ';
  if (profile) {
    ctx += `Name: ${profile.name}. Goals: ${profile.goals.join(', ')}. `;
    ctx += `Equipment: ${profile.equipment.join(', ')}. `;
    ctx += `Schedule: ${profile.scheduleDays.length} days/week. `;
  }
  if (latest) {
    ctx += `Latest posture score: ${latest.score}/100. `;
    if (latest.issues.length > 0) {
      ctx += `Issues: ${latest.issues.map((i) => i.area).join(', ')}. `;
    }
  }
  if (streak.current > 0) {
    ctx += `Current streak: ${streak.current} days. `;
  }
  return ctx;
}

export async function getConversations(): Promise<AIConversation[]> {
  return chatMode === 'demo' ? demoGetConversations() : realGetConversations();
}

export async function getConversationById(id: string): Promise<AIConversation | null> {
  return chatMode === 'demo' ? demoGetConversationById(id) : realGetConversationById(id);
}

export async function createConversation(conversationOrTitle: AIConversation | string): Promise<AIConversation | void> {
  if (chatMode === 'demo') {
    if (typeof conversationOrTitle === 'string') {
      const convo: AIConversation = {
        id: `conv_${Date.now()}`,
        title: conversationOrTitle,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await demoCreateConversation(convo);
      return convo;
    }
    await demoCreateConversation(conversationOrTitle);
    return conversationOrTitle;
  }
  const title = typeof conversationOrTitle === 'string' ? conversationOrTitle : conversationOrTitle.title;
  return realCreateConversation(title);
}

export async function sendMessage(conversationId: string, userMessage: string): Promise<AIMessage> {
  return chatMode === 'demo'
    ? demoSendMessage(conversationId, userMessage)
    : realSendMessage(conversationId, userMessage);
}

export async function submitFeedback(messageId: string, feedback: AIMessageFeedback): Promise<void> {
  if (chatMode === 'demo') return; // no-op in demo
  const { error } = await supabase
    .from('ai_messages')
    .update({ feedback })
    .eq('id', messageId);
  if (error) throw error;
}
