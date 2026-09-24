import { useRef, useState, useCallback } from 'react';
import { CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';

export type RecordingState = 'idle' | 'recording' | 'saving';

export function useCamera() {
  const cameraRef = useRef<CameraView>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [lastSavedUri, setLastSavedUri] = useState<string | null>(null);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || recordingState !== 'idle') return;

    setRecordingState('recording');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const video = await cameraRef.current.recordAsync();

      if (video?.uri) {
        setRecordingState('saving');
        const asset = await MediaLibrary.createAssetAsync(video.uri);
        setLastSavedUri(asset.uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error('Recording error:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setRecordingState('idle');
    }
  }, [recordingState]);

  const stopRecording = useCallback(() => {
    if (!cameraRef.current || recordingState !== 'recording') return;
    cameraRef.current.stopRecording();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [recordingState]);

  return {
    cameraRef,
    recordingState,
    facing,
    flash,
    lastSavedUri,
    toggleFacing,
    toggleFlash,
    startRecording,
    stopRecording,
  };
}
