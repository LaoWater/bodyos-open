import { getItem, setItem, addToIndex, getCollection } from './storage';
import type { Achievement, UserAchievement } from '../types/models';

const DEF_PREFIX = 'achievement';
const DEF_INDEX = 'achievements:index';
const UNLOCK_PREFIX = 'user_achievement';
const UNLOCK_INDEX = 'user_achievements:index';

export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  { id: 'first_scan', name: 'First Scan', description: 'Complete your first posture assessment', icon: 'scan-outline', category: 'posture', condition: 'assessments >= 1' },
  { id: 'first_session', name: 'Iron Starter', description: 'Complete your first workout session', icon: 'barbell-outline', category: 'strength', condition: 'sessions >= 1' },
  { id: 'week_streak', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: 'flame-outline', category: 'consistency', condition: 'streak >= 7' },
  { id: 'posture_improved', name: 'Standing Tall', description: 'Improve your posture score', icon: 'trending-up-outline', category: 'posture', condition: 'posture_improved' },
  { id: 'five_sessions', name: 'Dedicated', description: 'Complete 5 workout sessions', icon: 'fitness-outline', category: 'strength', condition: 'sessions >= 5' },
  { id: 'ten_sessions', name: 'Committed', description: 'Complete 10 workout sessions', icon: 'trophy-outline', category: 'milestones', condition: 'sessions >= 10' },
  { id: 'three_scans', name: 'Body Mapper', description: 'Complete 3 posture assessments', icon: 'body-outline', category: 'posture', condition: 'assessments >= 3' },
  { id: 'month_streak', name: 'Monthly Legend', description: 'Maintain a 30-day streak', icon: 'star-outline', category: 'consistency', condition: 'streak >= 30' },
  { id: 'first_photo', name: 'Snapshot', description: 'Take your first progress photo', icon: 'camera-outline', category: 'milestones', condition: 'photos >= 1' },
  { id: 'perfect_form', name: 'Perfect Form', description: 'Score 90+ on form analysis', icon: 'shield-checkmark-outline', category: 'strength', condition: 'form_score >= 90' },
];

export async function getDefinitions(): Promise<Achievement[]> {
  return ACHIEVEMENT_DEFINITIONS;
}

export async function saveDefinition(achievement: Achievement): Promise<void> {
  await setItem(`${DEF_PREFIX}:${achievement.id}`, achievement);
  await addToIndex(DEF_INDEX, achievement.id);
}

export async function getUnlocked(): Promise<UserAchievement[]> {
  return getCollection<UserAchievement>(UNLOCK_PREFIX, UNLOCK_INDEX);
}

export async function isUnlocked(achievementId: string): Promise<boolean> {
  const item = await getItem<UserAchievement>(`${UNLOCK_PREFIX}:${achievementId}`);
  return item !== null;
}

export async function unlock(achievementId: string): Promise<UserAchievement | null> {
  const already = await isUnlocked(achievementId);
  if (already) return null;

  const ua: UserAchievement = {
    achievementId,
    unlockedAt: new Date().toISOString(),
  };
  await setItem(`${UNLOCK_PREFIX}:${achievementId}`, ua);
  await addToIndex(UNLOCK_INDEX, achievementId);
  return ua;
}

export async function checkAndUnlock(stats: {
  assessments: number;
  sessions: number;
  streak: number;
  photos: number;
  postureImproved: boolean;
  bestFormScore: number;
}): Promise<UserAchievement[]> {
  const newlyUnlocked: UserAchievement[] = [];

  const checks: { id: string; condition: boolean }[] = [
    { id: 'first_scan', condition: stats.assessments >= 1 },
    { id: 'first_session', condition: stats.sessions >= 1 },
    { id: 'week_streak', condition: stats.streak >= 7 },
    { id: 'posture_improved', condition: stats.postureImproved },
    { id: 'five_sessions', condition: stats.sessions >= 5 },
    { id: 'ten_sessions', condition: stats.sessions >= 10 },
    { id: 'three_scans', condition: stats.assessments >= 3 },
    { id: 'month_streak', condition: stats.streak >= 30 },
    { id: 'first_photo', condition: stats.photos >= 1 },
    { id: 'perfect_form', condition: stats.bestFormScore >= 90 },
  ];

  for (const check of checks) {
    if (check.condition) {
      const result = await unlock(check.id);
      if (result) newlyUnlocked.push(result);
    }
  }

  return newlyUnlocked;
}
