# BodyOS — Data Reference

**Companion to**: `BODYOS_WEB_SPEC.md`  
**Version**: 2.0  
**Date**: 2026-02-12

---

## 1. Domain Models

### User & Profile

```typescript
interface UserProfile {
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
```

### Body Intelligence

```typescript
interface BodyCheckpoint {
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

interface CheckpointPhoto {
  id: string;
  angle: 'anterior' | 'posterior' | 'lateral_left' | 'lateral_right';
  url: string;
  score?: number;
}

interface FocusArea {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  landmarkIndices: number[];
}
```

### Pose Data

```typescript
interface PoseLandmark {
  index: number;       // MediaPipe 0-32
  x: number;
  y: number;
  z: number;
  visibility: number;
}

interface PoseFrame {
  timestamp: number;
  landmarks: PoseLandmark[];
  formScore: number;
}
```

### Sessions

```typescript
interface WorkoutSession {
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

interface FeedbackItem {
  id: string;
  type: 'positive' | 'improvement';
  message: string;
}
```

### Workouts

```typescript
interface WorkoutPlan {
  id: string;
  name: string;
  goal: string;
  daysPerWeek: number;
  days: WorkoutDay[];
  isActive: boolean;
}

interface WorkoutDay {
  id: string;
  name: string;
  muscleGroups: string[];
  exercises: ExercisePrescription[];
}

interface ExercisePrescription {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  repsRange: string;
  restSeconds: number;
  coachingCues: string;
}

interface SessionLog {
  id: string;
  dayId: string;
  date: string;
  mood?: string;
  exercises: ExerciseLog[];
  completed: boolean;
}

interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
}

interface SetLog {
  reps: number;
  weight: number;
  rpe?: number;
  completed: boolean;
}
```

### Coach / AI

```typescript
interface Conversation {
  id: string;
  userId: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  messages: Message[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feedback?: 'positive' | 'negative';
}
```

### Activity & Achievements

```typescript
interface ActivityFeedItem {
  id: string;
  type: 'workout' | 'checkpoint' | 'streak' | 'achievement';
  title: string;
  subtitle: string;
  timestamp: string;
  badge?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
}
```

---

## 2. AI Context Contract

Every AI coach request must include a structured context payload. This is what makes the coach contextually intelligent rather than generic.

### Payload Shape

```typescript
interface AICoachContext {
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

  recentMessages: Message[];  // Last 10 for continuity
}
```

### AI Response Style (System Prompt Rules)

- Plain text, concise, actionable coaching language
- Performance-oriented, not clinical
- Reference user's body data and training history naturally
- For pain/injury mentions: acknowledge, suggest professional consultation, provide movement modifications
- Never shame, never hype. Calm authority.
- Use preferred language: "focus areas" not "issues", "improve" not "fix", "opportunity" not "problem"

---

## 3. Adapter Pattern

### Purpose

Every data-fetching hook resolves through an adapter factory. This enables the demo/real dual mode that is core to the product.

### Structure

```
src/adapters/
├── demo/               # Mock data — seeded, offline, no auth
│   ├── demoData.ts     # Seed datasets
│   ├── demoProfile.ts
│   ├── demoWorkouts.ts
│   ├── demoCheckpoints.ts
│   ├── demoSessions.ts
│   └── demoCoach.ts
├── real/               # Supabase-backed — live, authenticated
│   ├── supabaseClient.ts
│   ├── profileAdapter.ts
│   ├── workoutAdapter.ts
│   ├── checkpointAdapter.ts
│   ├── sessionAdapter.ts
│   └── coachAdapter.ts
└── index.ts            # Factory — returns demo or real based on mode
```

### Factory

```typescript
// adapters/index.ts
import { useAppModeStore } from '../stores/appModeStore';
import * as demo from './demo';
import * as real from './real';

export function useAdapter() {
  const mode = useAppModeStore((s) => s.mode);
  return mode === 'demo' ? demo : real;
}
```

### Usage in Hooks

```typescript
// hooks/useUserProfile.ts
export function useUserProfile() {
  const adapter = useAdapter();
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => adapter.fetchProfile(),
  });
}
```

All hooks follow this pattern: `useCheckpoints`, `useSessions`, `useWorkouts`, `useCoach`, `useActivityFeed`, etc.

---

## 4. State Management

### Zustand Stores

```typescript
// stores/authStore.ts
interface AuthStore {
  user: UserProfile | null;
  session: SupabaseSession | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// stores/appModeStore.ts
interface AppModeStore {
  mode: 'demo' | 'real';
  setMode: (mode: 'demo' | 'real') => void;
  isDemo: () => boolean;
}

// stores/uiStore.ts
interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}
```

### TanStack Query Convention

- Query keys follow `['domain', 'entity', ...params]` pattern
- All hooks use the adapter factory
- Stale-while-revalidate as default strategy
- Prefetch on link hover for anticipated navigation

---

## 5. Folder Structure

```
src/
├── components/
│   ├── layout/          # AppShell, Sidebar, PageContainer
│   ├── ui/              # GlassCard, Button, Badge, Input, Modal, Toast, Skeleton
│   ├── charts/          # FormScoreRing, LineChart, BodyBlueprint, HeatMap
│   └── features/        # WorkoutCard, CheckpointCard, ChatBubble, SessionCard, etc.
│
├── pages/               # One file per route
│
├── stores/              # Zustand stores
│
├── hooks/               # TanStack Query hooks
│
├── adapters/            # Demo + Real data adapters
│   ├── demo/
│   ├── real/
│   └── index.ts
│
├── types/               # All TypeScript interfaces
│   ├── models.ts
│   ├── pose.ts
│   └── api.ts
│
├── lib/                 # Utilities
│   ├── supabase.ts
│   ├── aiContext.ts
│   └── utils.ts
│
├── styles/
│   └── globals.css
│
├── assets/
│
├── App.tsx
└── main.tsx
```

---

## 6. Build & Deploy

### Development

```bash
git clone <repo-url>
cd bodyos-web
npm install
cp .env.example .env.local
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev              # → http://localhost:8080
```

### Scripts

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "lint": "eslint src --ext ts,tsx",
  "format": "prettier --write src",
  "typecheck": "tsc --noEmit",
  "test": "vitest"
}
```

### Vercel Deploy

```bash
vercel          # Preview
vercel --prod   # Production
```

Environment variables in Vercel dashboard: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

---

## 7. Glossary

| Term | Definition |
|------|------------|
| Pose Landmarks | 33 body keypoints detected by MediaPipe (x, y, z, visibility) |
| Form Score | 0-100 quality rating based on joint alignment and movement patterns |
| ROM | Range of Motion — degrees of joint articulation |
| Tempo | Eccentric-pause-concentric-pause timing (e.g., 2-0-2-0) |
| Checkpoint | Multi-angle posture assessment snapshot (4 photos + ML analysis) |
| Focus Area | A detected movement pattern or alignment with room for improvement |
| Tensegrity | Structural principle: the body is a continuous tension network |
| Anatomy Trains | Thomas Myers' model of fascial meridians connecting muscle chains |
| FMS | Functional Movement Screen — Gray Cook's assessment framework |
| RPE | Rate of Perceived Exertion — subjective intensity scale (1-10) |
| Adapter | Abstraction layer that switches between demo mock data and real Supabase |
| BFF | Backend for Frontend — optional server layer for context assembly |

---

*Companion to `BODYOS_WEB_SPEC.md`*
