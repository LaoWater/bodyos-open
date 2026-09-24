import { useEffect, useState } from 'react';
import { setAudioModeAsync } from 'expo-audio';

export type AudioSessionStatus = 'initializing' | 'ready' | 'error';

export function useAudioSession() {
  const [status, setStatus] = useState<AudioSessionStatus>('initializing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    configureAudioSession();
  }, []);

  async function configureAudioSession() {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
      });
      setStatus('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatus('error');
    }
  }

  return { status, error, reconfigure: configureAudioSession };
}
