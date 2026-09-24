import { useState, useCallback } from 'react';
import { useEffect } from 'react';
import type { WorkoutPlan, WorkoutSession, Exercise, SessionSet } from '../types/models';
import * as workoutService from '../services/workoutService';

interface WorkoutState {
  activePlan: WorkoutPlan | null;
  sessions: WorkoutSession[];
  exercises: Exercise[];
  loading: boolean;
}

export function useWorkouts() {
  const [state, setState] = useState<WorkoutState>({
    activePlan: null,
    sessions: [],
    exercises: [],
    loading: true,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const [plan, sess, exs] = await Promise.all([
      workoutService.getActivePlan(),
      workoutService.getSessions(),
      workoutService.getExercises(),
    ]);
    // Single batched setState instead of 4 separate calls
    setState({ activePlan: plan, sessions: sess, exercises: exs, loading: false });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const startSession = useCallback(async (session: WorkoutSession) => {
    await workoutService.startSession(session);
    await refresh();
    return session;
  }, [refresh]);

  const logSet = useCallback(async (sessionId: string, exerciseId: string, set: SessionSet) => {
    await workoutService.logSet(sessionId, exerciseId, set);
  }, []);

  const completeSession = useCallback(async (sessionId: string, mood?: WorkoutSession['mood'], notes?: string) => {
    await workoutService.completeSession(sessionId, mood, notes);
    await refresh();
  }, [refresh]);

  const getExerciseById = useCallback((id: string) => {
    return state.exercises.find((e) => e.id === id) ?? null;
  }, [state.exercises]);

  return { ...state, startSession, logSet, completeSession, getExerciseById, refresh };
}
