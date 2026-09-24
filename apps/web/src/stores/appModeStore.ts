import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppMode } from '@/types/models';

interface AppModeStore {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isDemo: () => boolean;
}

export const useAppModeStore = create<AppModeStore>()(
  persist(
    (set, get) => ({
      mode: 'demo',
      setMode: (mode) => set({ mode }),
      isDemo: () => get().mode === 'demo',
    }),
    { name: 'bodyos-app-mode' }
  )
);
