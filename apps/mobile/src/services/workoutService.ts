import { getItem, setItem, addToIndex, getCollection } from './storage';
import type { WorkoutPlan, WorkoutSession, Exercise, SessionSet } from '../types/models';

const PLAN_PREFIX = 'plan';
const PLAN_INDEX = 'plans:index';
const SESSION_PREFIX = 'session';
const SESSION_INDEX = 'sessions:index';
const EXERCISE_PREFIX = 'exercise';
const EXERCISE_INDEX = 'exercises:index';

export async function getPlans(): Promise<WorkoutPlan[]> {
  return getCollection<WorkoutPlan>(PLAN_PREFIX, PLAN_INDEX);
}

export async function getActivePlan(): Promise<WorkoutPlan | null> {
  const plans = await getPlans();
  return plans.find((p) => p.isActive) ?? null;
}

export async function createPlan(plan: WorkoutPlan): Promise<void> {
  if (plan.isActive) {
    const plans = await getPlans();
    for (const p of plans) {
      if (p.isActive) {
        await setItem(`${PLAN_PREFIX}:${p.id}`, { ...p, isActive: false });
      }
    }
  }
  await setItem(`${PLAN_PREFIX}:${plan.id}`, plan);
  await addToIndex(PLAN_INDEX, plan.id);
}

export async function getExercises(): Promise<Exercise[]> {
  return getCollection<Exercise>(EXERCISE_PREFIX, EXERCISE_INDEX);
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  return getItem<Exercise>(`${EXERCISE_PREFIX}:${id}`);
}

export async function saveExercise(exercise: Exercise): Promise<void> {
  await setItem(`${EXERCISE_PREFIX}:${exercise.id}`, exercise);
  await addToIndex(EXERCISE_INDEX, exercise.id);
}

export async function getSessions(): Promise<WorkoutSession[]> {
  const items = await getCollection<WorkoutSession>(SESSION_PREFIX, SESSION_INDEX);
  return items.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export async function getSessionById(id: string): Promise<WorkoutSession | null> {
  return getItem<WorkoutSession>(`${SESSION_PREFIX}:${id}`);
}

export async function startSession(session: WorkoutSession): Promise<void> {
  await setItem(`${SESSION_PREFIX}:${session.id}`, session);
  await addToIndex(SESSION_INDEX, session.id);
}

export async function logSet(sessionId: string, exerciseId: string, set: SessionSet): Promise<void> {
  const session = await getSessionById(sessionId);
  if (!session) return;
  const exerciseEntry = session.exercises.find((e) => e.exerciseId === exerciseId);
  if (exerciseEntry) {
    exerciseEntry.sets.push(set);
  } else {
    session.exercises.push({ exerciseId, sets: [set] });
  }
  await setItem(`${SESSION_PREFIX}:${sessionId}`, session);
}

export async function completeSession(sessionId: string, mood?: WorkoutSession['mood'], notes?: string): Promise<void> {
  const session = await getSessionById(sessionId);
  if (!session) return;
  session.completedAt = new Date().toISOString();
  if (mood) session.mood = mood;
  if (notes) session.notes = notes;
  await setItem(`${SESSION_PREFIX}:${sessionId}`, session);
}
