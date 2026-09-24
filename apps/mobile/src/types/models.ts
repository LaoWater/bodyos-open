export type AppMode = 'demo' | 'real';

export type FitnessGoal =
  | 'build_strength'
  | 'improve_posture'
  | 'increase_mobility'
  | 'lose_weight'
  | 'general_fitness'
  | 'body_performance'
  | 'recovery'
  | 'pain_management'
  | 'general_wellness';

export type Equipment = 'full_gym' | 'dumbbells' | 'bodyweight' | 'resistance_bands' | 'kettlebells' | 'pull_up_bar';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type TimePreference = 'morning' | 'afternoon' | 'evening';
export type SessionDuration = 30 | 45 | 60 | 90;
export type UnitSystem = 'metric' | 'imperial';

// Archetype types
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type PainSeverity = 'mild' | 'moderate' | 'severe';

export type BodyArea =
  | 'neck'
  | 'shoulders'
  | 'upper_back'
  | 'lower_back'
  | 'knees'
  | 'ankles'
  | 'wrists'
  | 'hips'
  | 'elbows'
  | 'feet';

export type MovementPhilosophy =
  | 'calisthenics'
  | 'strength_training'
  | 'powerlifting'
  | 'olympic_lifting'
  | 'yoga_flexibility'
  | 'martial_arts'
  | 'sprint_agility'
  | 'functional_fitness'
  | 'rehabilitation'
  | 'hybrid_mixed';

export interface PainPoint {
  area: BodyArea;
  severity: PainSeverity;
}

// Checkpoint types
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CheckpointPhotoType = 'anterior' | 'posterior' | 'lateral_left' | 'lateral_right';

export interface CheckpointPhoto {
  id: string;
  checkpointId: string;
  photoType: CheckpointPhotoType;
  photoUrl: string;
  overlayUrl?: string;
  rawLandmarks?: number[];
  analysisResults?: {
    score: number;
    issues: { area: string; description: string; severity: string }[];
  };
  processingStatus: ProcessingStatus;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  createdAt: string;
}

export interface BodyCheckpoint {
  id: string;
  checkpointDate: string;
  status: ProcessingStatus;
  notes?: string;
  photos: CheckpointPhoto[];
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  goals: FitnessGoal[];
  scheduleDays: DayOfWeek[];
  timePreference: TimePreference;
  sessionDuration: SessionDuration;
  equipment: Equipment[];
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
  // Archetype fields (optional for skip-ability & backward compatibility)
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
  gender?: Gender;
  painPoints?: PainPoint[];
  experienceLevel?: ExperienceLevel;
  movementPhilosophies?: MovementPhilosophy[];
}

export interface UserSettings {
  haptics: boolean;
  skeletonOverlay: boolean;
  notifications: boolean;
  units: UnitSystem;
  voiceFeedback: boolean;
}

export interface UserStreak {
  current: number;
  longest: number;
  lastActivityDate: string;
}

export type PostureIssueSeverity = 'mild' | 'moderate' | 'severe';

export interface PostureIssue {
  area: string;
  description: string;
  severity: PostureIssueSeverity;
}

export interface PostureAssessment {
  id: string;
  score: number;
  landmarks: number[];
  issues: PostureIssue[];
  aiSummary: string;
  photoUrls: { front?: string; side?: string; back?: string };
  createdAt: string;
}

export type PhotoType = 'front' | 'side' | 'back';

export interface ProgressPhoto {
  id: string;
  photoUrl: string;
  type: PhotoType;
  weight?: number;
  notes?: string;
  tags: string[];
  createdAt: string;
}

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'core' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'full_body';
export type ExerciseCategory = 'compound' | 'isolation' | 'bodyweight' | 'mobility' | 'cardio';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface CoachingCues {
  setup: string[];
  execution: string[];
  commonMistakes: string[];
  personalizedNotes?: string[];
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  difficulty: Difficulty;
  coachingCues: CoachingCues;
}

export interface WorkoutPlanExercise {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  notes?: string;
}

export interface WorkoutPlanDay {
  id: string;
  dayIndex: number;
  name: string;
  focus: string;
  exercises: WorkoutPlanExercise[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  goal: FitnessGoal;
  daysPerWeek: number;
  days: WorkoutPlanDay[];
  isActive: boolean;
  createdAt: string;
}

export interface SessionSet {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  formScore?: number;
}

export interface WorkoutSession {
  id: string;
  planId?: string;
  planDayId?: string;
  exercises: {
    exerciseId: string;
    sets: SessionSet[];
  }[];
  startedAt: string;
  completedAt?: string;
  mood?: 'great' | 'good' | 'okay' | 'tough';
  notes?: string;
}

export type AIMessageRole = 'assistant' | 'user';

export type AIMessageFeedback = 'positive' | 'negative' | null;

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  feedback?: AIMessageFeedback;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export type AchievementCategory = 'consistency' | 'strength' | 'posture' | 'milestones';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  condition: string;
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: string;
}

export type ActivityType = 'assessment' | 'workout' | 'achievement' | 'photo' | 'streak' | 'plan';

export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  metric?: string;
  referenceId?: string;
  createdAt: string;
}
