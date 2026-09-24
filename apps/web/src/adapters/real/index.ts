// Real adapter — Supabase-backed implementation
import { supabase } from '@/lib/supabase';
import type { Message, Conversation, SessionLog, ExerciseLog, UserProfile, BodyCheckpoint, WorkoutPlan, WorkoutSession, ActivityFeedItem, Achievement } from '@/types/models';
import { generateId } from '@/lib/utils';

// ─── Profile ─────────────────────────────────────────────────

export const fetchProfile = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.full_name ?? '',
    email: user.email ?? '',
    avatar_url: data.avatar_url,
    streak: data.streak ?? 0,
    goals: data.goals ?? [],
    biometrics: {
      age: data.date_of_birth ? Math.floor((Date.now() - new Date(data.date_of_birth).getTime()) / 31557600000) : undefined,
      height: data.height_cm,
      weight: data.weight_kg,
      gender: data.gender,
    },
    painPoints: data.pain_points ? Object.keys(data.pain_points) : [],
    movementPhilosophy: data.movement_philosophies ?? [],
    schedule: {
      days: [],
      timeOfDay: data.preferred_workout_time ?? 'morning',
      duration: data.available_time_per_session ?? '30min',
    },
    equipment: data.equipment ?? [],
    units: 'metric',
    createdAt: data.created_at,
  };
};

export const updateProfile = async (updates: Record<string, unknown>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) console.error('[BodyOS] Profile update failed:', error.message);
  return !error;
};

// ─── Body Checkpoints ────────────────────────────────────────

export const fetchCheckpoints = async (): Promise<BodyCheckpoint[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('body_checkpoints')
    .select('*, checkpoint_photos(*)')
    .eq('user_id', user.id)
    .order('checkpoint_date', { ascending: false });

  if (error || !data) return [];

  return data.map((cp: any) => ({
    id: cp.id,
    userId: cp.user_id,
    date: cp.checkpoint_date,
    score: cp.overall_score ?? 0,
    status: cp.status,
    photos: (cp.checkpoint_photos ?? []).map((p: any) => ({
      id: p.id,
      angle: p.photo_type,
      url: p.photo_url,
      score: p.analysis_results?.score,
    })),
    focusAreas: [],
    aiSummary: cp.notes,
  }));
};

export const fetchCheckpoint = async (id: string): Promise<BodyCheckpoint | null> => {
  const { data, error } = await supabase
    .from('body_checkpoints')
    .select('*, checkpoint_photos(*)')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    date: data.checkpoint_date,
    score: data.overall_score ?? 0,
    status: data.status,
    photos: (data.checkpoint_photos ?? []).map((p: any) => ({
      id: p.id,
      angle: p.photo_type,
      url: p.photo_url,
      score: p.analysis_results?.score,
    })),
    focusAreas: [],
    aiSummary: data.notes,
  };
};

// ─── Sessions ────────────────────────────────────────────────

export const fetchSessions = async (): Promise<WorkoutSession[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('exercise_sessions')
    .select('*, session_reps(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    exercise: s.exercise_type,
    date: s.created_at,
    duration: `${s.duration_seconds ?? 0}s`,
    formScore: s.avg_score,
    reps: s.total_reps,
  }));
};

export const fetchSession = async (id: string): Promise<WorkoutSession | null> => {
  const { data, error } = await supabase
    .from('exercise_sessions')
    .select('*, session_reps(*)')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    exercise: data.exercise_type,
    date: data.created_at,
    duration: `${data.duration_seconds ?? 0}s`,
    formScore: data.avg_score,
    reps: data.total_reps,
    feedback: (data.session_reps ?? []).flatMap((r: any) =>
      (r.issues ?? []).map((issue: string) => ({
        id: generateId(),
        type: 'improvement' as const,
        message: issue,
      }))
    ),
  };
};

// ─── Workout Plans ───────────────────────────────────────────

export const fetchWorkoutPlans = async (): Promise<WorkoutPlan[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', user.id);

  if (error || !data) return [];

  return data.map((p: any) => ({
    id: p.id,
    name: p.name,
    goal: p.goal ?? '',
    daysPerWeek: p.days_per_week ?? 3,
    days: p.plan_data?.days ?? [],
    isActive: p.is_active,
  }));
};

export const fetchActivePlan = async (): Promise<WorkoutPlan | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    goal: data.goal ?? '',
    daysPerWeek: data.days_per_week ?? 3,
    days: data.plan_data?.days ?? [],
    isActive: true,
  };
};

// ─── Coach / Conversations ───────────────────────────────────

export const fetchConversations = async (): Promise<Conversation[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  return data.map((c: any) => ({
    id: c.id,
    userId: c.user_id,
    title: c.title,
    lastMessage: c.last_message ?? '',
    updatedAt: c.updated_at,
    messages: c.messages ?? [],
  }));
};

export const fetchConversation = async (id: string): Promise<Conversation | null> => {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    lastMessage: data.last_message ?? '',
    updatedAt: data.updated_at,
    messages: data.messages ?? [],
  };
};

export const sendMessage = async (_conversationId: string, _content: string): Promise<Message> => {
  // TODO: Wire to AI backend (OpenAI via Edge Function)
  return {
    id: generateId(),
    role: 'assistant',
    content: 'AI coaching coming soon in real mode.',
    timestamp: new Date().toISOString(),
  };
};

export const createConversation = async (title: string): Promise<Conversation> => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ user_id: user?.id, title, messages: [] })
    .select()
    .single();

  if (error || !data) {
    return { id: generateId(), userId: user?.id ?? '', title, lastMessage: '', updatedAt: new Date().toISOString(), messages: [] };
  }

  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    lastMessage: '',
    updatedAt: data.updated_at,
    messages: [],
  };
};

// ─── Activity Feed ───────────────────────────────────────────

export const fetchActivityFeed = async (): Promise<ActivityFeedItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('activity_feed')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];

  return data.map((a: any) => ({
    id: a.id,
    type: a.activity_type,
    title: a.title,
    subtitle: a.description ?? '',
    timestamp: a.created_at,
    badge: a.metadata?.badge,
  }));
};

// ─── Achievements ────────────────────────────────────────────

export const fetchAchievements = async (): Promise<Achievement[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: achievements } = await supabase
    .from('achievements')
    .select('*, user_achievements!left(unlocked_at)')
    .order('sort_order');

  if (!achievements) return [];

  return achievements.map((a: any) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    icon: a.icon ?? 'trophy',
    unlocked: a.user_achievements?.length > 0,
    unlockedDate: a.user_achievements?.[0]?.unlocked_at,
  }));
};

// ─── Workout Logging ─────────────────────────────────────────

export const logWorkoutSession = async (dayId: string, exercises: ExerciseLog[]): Promise<SessionLog> => {
  return {
    id: generateId(),
    dayId,
    date: new Date().toISOString(),
    exercises,
    completed: true,
  };
};
