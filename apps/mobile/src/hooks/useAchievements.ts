import { useState, useEffect, useCallback } from 'react';
import type { Achievement, UserAchievement } from '../types/models';
import * as achievementService from '../services/achievementService';

export function useAchievements() {
  const [definitions, setDefinitions] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [defs, unl] = await Promise.all([
      achievementService.getDefinitions(),
      achievementService.getUnlocked(),
    ]);
    setDefinitions(defs);
    setUnlocked(unl);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const isUnlocked = useCallback((achievementId: string) => {
    return unlocked.some((u) => u.achievementId === achievementId);
  }, [unlocked]);

  const checkTriggers = useCallback(async (stats: {
    assessments: number;
    sessions: number;
    streak: number;
    photos: number;
    postureImproved: boolean;
    bestFormScore: number;
  }) => {
    const newly = await achievementService.checkAndUnlock(stats);
    if (newly.length > 0) await refresh();
    return newly;
  }, [refresh]);

  return { definitions, unlocked, loading, isUnlocked, checkTriggers, refresh };
}
