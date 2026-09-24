import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

// Shared permission state — single source of truth across all hook consumers
let _state = { camera: false, mic: false, media: false };
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

function getSnapshot() {
  return _state;
}

async function check() {
  const [cam, mic, media] = await Promise.all([
    Camera.getCameraPermissionsAsync(),
    Camera.getMicrophonePermissionsAsync(),
    MediaLibrary.getPermissionsAsync(),
  ]);
  const next = { camera: cam.granted, mic: mic.granted, media: media.granted };
  if (next.camera !== _state.camera || next.mic !== _state.mic || next.media !== _state.media) {
    _state = next;
    notify();
  }
}

// Check on module load
check();

export function useAppPermissions() {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  // Re-check when app comes to foreground (e.g. returning from Settings)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => sub.remove();
  }, []);

  const requestAll = useCallback(async () => {
    const cam = await Camera.requestCameraPermissionsAsync();
    const mic = await Camera.requestMicrophonePermissionsAsync();
    const media = await MediaLibrary.requestPermissionsAsync();
    _state = { camera: cam.granted, mic: mic.granted, media: media.granted };
    notify();
  }, []);

  return {
    allGranted: state.camera && state.mic && state.media,
    cameraGranted: state.camera,
    micGranted: state.mic,
    mediaGranted: state.media,
    requestAll,
  };
}
