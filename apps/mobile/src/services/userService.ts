import { getItem, setItem, removeItem } from './storage';
import type { AppMode, UserProfile, UserSettings, UserStreak } from '../types/models';

const KEYS = {
  profile: 'user:profile',
  settings: 'user:settings',
  streak: 'user:streak',
  appMode: 'app:mode',
};

const DEFAULT_SETTINGS: UserSettings = {
  haptics: true,
  skeletonOverlay: true,
  notifications: true,
  units: 'metric',
  voiceFeedback: true,
};

const DEFAULT_STREAK: UserStreak = {
  current: 0,
  longest: 0,
  lastActivityDate: '',
};

export async function getProfile(): Promise<UserProfile | null> {
  return getItem<UserProfile>(KEYS.profile);
}

export async function updateProfile(profile: UserProfile): Promise<void> {
  await setItem(KEYS.profile, { ...profile, updatedAt: new Date().toISOString() });
}

export async function getSettings(): Promise<UserSettings> {
  const settings = await getItem<UserSettings>(KEYS.settings);
  return settings ?? DEFAULT_SETTINGS;
}

export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await setItem(KEYS.settings, updated);
  return updated;
}

export async function getStreak(): Promise<UserStreak> {
  const streak = await getItem<UserStreak>(KEYS.streak);
  return streak ?? DEFAULT_STREAK;
}

export async function updateStreak(streak: UserStreak): Promise<void> {
  await setItem(KEYS.streak, streak);
}

export async function getAppMode(): Promise<AppMode | null> {
  return getItem<AppMode>(KEYS.appMode);
}

export async function setAppMode(mode: AppMode): Promise<void> {
  await setItem(KEYS.appMode, mode);
}

export async function clearAppMode(): Promise<void> {
  await removeItem(KEYS.appMode);
}

export async function incrementStreak(): Promise<UserStreak> {
  const streak = await getStreak();
  const today = new Date().toISOString().split('T')[0];

  if (streak.lastActivityDate === today) return streak;

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const isConsecutive = streak.lastActivityDate === yesterday;

  const updated: UserStreak = {
    current: isConsecutive ? streak.current + 1 : 1,
    longest: Math.max(streak.longest, isConsecutive ? streak.current + 1 : 1),
    lastActivityDate: today,
  };
  await updateStreak(updated);
  return updated;
}
