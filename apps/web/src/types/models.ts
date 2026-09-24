export type AppMode = 'demo' | 'real';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  streak: number;
  goals: string[];
  biometrics: {
    age?: number;
    height?: number;
    weight?: number;
    gender?: string;
  };
  painPoints: string[];
  movementPhilosophy: string[];
  schedule: {
    days: string[];
    timeOfDay: string;
    duration: string;
  };
  equipment: string[];
  units: 'metric' | 'imperial';
  createdAt: string;
}

export interface BodyCheckpoint {
  id: string;
  userId: string;
  date: string;
  score: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  photos: CheckpointPhoto[];
  focusAreas: FocusArea[];
  landmarks?: PoseLandmark[];
  aiSummary?: string;
}

export interface CheckpointPhoto {
  id: string;
  angle: 'anterior' | 'posterior' | 'lateral_left' | 'lateral_right';
  url: string;
  score?: number;
}

export interface FocusArea {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  landmarkIndices: number[];
}

export interface PoseLandmark {
  index: number;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseFrame {
  timestamp: number;
  landmarks: PoseLandmark[];
  formScore: number;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  exercise: string;
  date: string;
  duration: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  formScore?: number;
  reps?: number;
  avgTempo?: string;
  poseData?: PoseFrame[];
  feedback?: FeedbackItem[];
}

export interface FeedbackItem {
  id: string;
  type: 'positive' | 'improvement';
  message: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  goal: string;
  daysPerWeek: number;
  days: WorkoutDay[];
  isActive: boolean;
}

export interface WorkoutDay {
  id: string;
  name: string;
  muscleGroups: string[];
  exercises: ExercisePrescription[];
}

export interface ExercisePrescription {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  repsRange: string;
  restSeconds: number;
  coachingCues: string;
}

export interface SessionLog {
  id: string;
  dayId: string;
  date: string;
  mood?: string;
  exercises: ExerciseLog[];
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
}

export interface SetLog {
  reps: number;
  weight: number;
  rpe?: number;
  completed: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  messages: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feedback?: 'positive' | 'negative';
}

export interface ActivityFeedItem {
  id: string;
  type: 'workout' | 'checkpoint' | 'streak' | 'achievement';
  title: string;
  subtitle: string;
  timestamp: string;
  badge?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
}

export interface AICoachContext {
  profile: {
    name: string;
    goals: string[];
    schedule: UserProfile['schedule'];
    equipment: string[];
    painPoints: string[];
    movementPhilosophy: string[];
  };
  latestCheckpoint: {
    score: number;
    focusAreas: string[];
    date: string;
  } | null;
  recentWorkouts: {
    sessionsThisWeek: number;
    avgFormScore: number;
    lastWorkout: string;
    volumeTrend: 'increasing' | 'stable' | 'decreasing';
  };
  streak: number;
  achievementsUnlocked: number;
  recentMessages: Message[];
}
