import { useAppModeStore } from '@/stores/appModeStore';
import * as demo from './demo';
import * as real from './real';

export function useAdapter() {
  const mode = useAppModeStore((s) => s.mode);
  return mode === 'demo' ? demo : real;
}

export type Adapter = typeof demo;
