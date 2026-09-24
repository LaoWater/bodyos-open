import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppMode, UserProfile, UserSettings, UserStreak } from '../types/models';
import * as userService from '../services/userService';

interface AppState {
  user: UserProfile | null;
  settings: UserSettings;
  streak: UserStreak;
  onboardingComplete: boolean;
  appMode: AppMode | null;
  isLoading: boolean;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: UserProfile | null }
  | { type: 'SET_SETTINGS'; payload: UserSettings }
  | { type: 'SET_STREAK'; payload: UserStreak }
  | { type: 'SET_ONBOARDING_COMPLETE'; payload: boolean }
  | { type: 'SET_APP_MODE'; payload: AppMode | null }
  | { type: 'INIT'; payload: { user: UserProfile | null; settings: UserSettings; streak: UserStreak; appMode: AppMode | null } };

const initialState: AppState = {
  user: null,
  settings: {
    haptics: true,
    skeletonOverlay: true,
    notifications: true,
    units: 'metric',
    voiceFeedback: true,
  },
  streak: { current: 0, longest: 0, lastActivityDate: '' },
  onboardingComplete: false,
  appMode: null,
  isLoading: true,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        onboardingComplete: action.payload?.onboardingComplete ?? false,
      };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_STREAK':
      return { ...state, streak: action.payload };
    case 'SET_ONBOARDING_COMPLETE':
      return { ...state, onboardingComplete: action.payload };
    case 'SET_APP_MODE':
      return { ...state, appMode: action.payload };
    case 'INIT':
      return {
        ...state,
        user: action.payload.user,
        settings: action.payload.settings,
        streak: action.payload.streak,
        appMode: action.payload.appMode,
        onboardingComplete: action.payload.user?.onboardingComplete ?? false,
        isLoading: false,
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  updateUser: (user: UserProfile) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  refreshStreak: () => Promise<void>;
  setAppMode: (mode: AppMode) => Promise<void>;
  clearAppMode: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const [user, settings, streak, appMode] = await Promise.all([
        userService.getProfile(),
        userService.getSettings(),
        userService.getStreak(),
        userService.getAppMode(),
      ]);
      dispatch({ type: 'INIT', payload: { user, settings, streak, appMode } });
    })();
  }, []);

  const updateUser = async (user: UserProfile) => {
    await userService.updateProfile(user);
    dispatch({ type: 'SET_USER', payload: user });
  };

  const updateSettings = async (settings: Partial<UserSettings>) => {
    const updated = await userService.updateSettings(settings);
    dispatch({ type: 'SET_SETTINGS', payload: updated });
  };

  const refreshStreak = async () => {
    const streak = await userService.getStreak();
    dispatch({ type: 'SET_STREAK', payload: streak });
  };

  const setAppMode = async (mode: AppMode) => {
    await userService.setAppMode(mode);
    dispatch({ type: 'SET_APP_MODE', payload: mode });
  };

  const clearAppMode = async () => {
    await userService.clearAppMode();
    dispatch({ type: 'SET_APP_MODE', payload: null });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, updateUser, updateSettings, refreshStreak, setAppMode, clearAppMode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
