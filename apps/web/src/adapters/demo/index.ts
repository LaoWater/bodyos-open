import {
  demoProfile,
  demoCheckpoints,
  demoSessions,
  demoWorkoutPlans,
  demoConversations,
  demoActivityFeed,
  demoAchievements,
} from './demoData';
import type { Message, Conversation, SessionLog, ExerciseLog } from '@/types/models';
import { generateId } from '@/lib/utils';

// Small delay to simulate network
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export async function fetchProfile() {
  await delay();
  return demoProfile;
}

export async function fetchCheckpoints() {
  await delay();
  return demoCheckpoints;
}

export async function fetchCheckpoint(id: string) {
  await delay();
  return demoCheckpoints.find((c) => c.id === id) ?? null;
}

export async function fetchSessions() {
  await delay();
  return demoSessions;
}

export async function fetchSession(id: string) {
  await delay();
  return demoSessions.find((s) => s.id === id) ?? null;
}

export async function fetchWorkoutPlans() {
  await delay();
  return demoWorkoutPlans;
}

export async function fetchActivePlan() {
  await delay();
  return demoWorkoutPlans.find((p) => p.isActive) ?? null;
}

export async function fetchConversations() {
  await delay();
  return demoConversations;
}

export async function fetchConversation(id: string) {
  await delay();
  return demoConversations.find((c) => c.id === id) ?? null;
}

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  await delay(800);
  const conversation = demoConversations.find((c) => c.id === conversationId);

  const userMessage: Message = {
    id: generateId(),
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  };

  if (conversation) {
    conversation.messages.push(userMessage);
  }

  // Simulate AI response
  const responses = [
    'Based on your recent sessions, I can see consistent improvement in your form scores. Your push-up form scored 87 — that\'s excellent. Keep focusing on elbow positioning during the later reps when fatigue sets in.',
    'Looking at your body checkpoint data, your shoulder symmetry has improved since January. The mobility work is clearly helping. I\'d recommend continuing the thoracic spine work and adding some loaded carries to reinforce the pattern.',
    'Your training consistency is strong — 12 days and counting. Remember that recovery is part of the process. On your rest days, consider light mobility work or a 20-minute walk to support active recovery.',
    'Great question. Based on your movement philosophy and goals, I\'d suggest prioritizing compound movements that challenge multiple chains simultaneously. Your Foundation Strength plan is well-designed for this.',
  ];

  const aiMessage: Message = {
    id: generateId(),
    role: 'assistant',
    content: responses[Math.floor(Math.random() * responses.length)],
    timestamp: new Date().toISOString(),
  };

  if (conversation) {
    conversation.messages.push(aiMessage);
    conversation.lastMessage = aiMessage.content.slice(0, 60) + '...';
    conversation.updatedAt = aiMessage.timestamp;
  }

  return aiMessage;
}

export async function createConversation(title: string): Promise<Conversation> {
  await delay();
  const conv: Conversation = {
    id: generateId(),
    userId: 'demo-user-001',
    title,
    lastMessage: '',
    updatedAt: new Date().toISOString(),
    messages: [],
  };
  demoConversations.unshift(conv);
  return conv;
}

export async function fetchActivityFeed() {
  await delay();
  return demoActivityFeed;
}

export async function fetchAchievements() {
  await delay();
  return demoAchievements;
}

export async function logWorkoutSession(_dayId: string, _exercises: ExerciseLog[]): Promise<SessionLog> {
  await delay(500);
  return {
    id: generateId(),
    dayId: _dayId,
    date: new Date().toISOString(),
    exercises: _exercises,
    completed: true,
  };
}

export async function updateProfile(updates: Record<string, unknown>) {
  await delay();
  Object.assign(demoProfile, updates);
  return demoProfile;
}
