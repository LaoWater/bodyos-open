import { useState, useEffect, useCallback, useReducer } from 'react';
import type { PostureAssessment } from '../types/models';
import * as assessmentService from '../services/assessmentService';

interface AssessmentState {
  assessments: PostureAssessment[];
  latest: PostureAssessment | null;
  loading: boolean;
}

export function useAssessments() {
  const [state, setState] = useState<AssessmentState>({
    assessments: [],
    latest: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const [all, lat] = await Promise.all([
      assessmentService.getAll(),
      assessmentService.getLatest(),
    ]);
    // Single batched setState instead of 3 separate calls
    setState({ assessments: all, latest: lat, loading: false });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (assessment: PostureAssessment) => {
    await assessmentService.create(assessment);
    await refresh();
  }, [refresh]);

  const compare = useCallback(async (id1: string, id2: string) => {
    return assessmentService.getComparison(id1, id2);
  }, []);

  return { ...state, create, compare, refresh };
}
