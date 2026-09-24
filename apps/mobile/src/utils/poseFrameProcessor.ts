/**
 * Real-time pose detection frame processor using MediaPipe PoseLandmarker
 * via a native Swift VisionCamera plugin.
 *
 * All pixel processing happens in native Swift. JS only unpacks the
 * 33-landmark result array and keeps lightweight runtime telemetry.
 */

import { useRef, useEffect, useMemo, useState } from 'react';
import { runAtTargetFps, useFrameProcessor, VisionCameraProxy } from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import {
  PoseResult,
  PoseLandmark,
  MEDIAPIPE_LANDMARK_COUNT,
} from '../types/pose';

// Target processing cadence in JS worklet (native plugin may still skip internally)
const TARGET_FPS = 10;

type RawPoseResult = {
  landmarks: number[];
  timestamp: number;
};

export function usePoseFrameProcessor(
  onPoseDetected: (result: PoseResult | null) => void,
) {
  const [lastFrameProcessorTickMs, setLastFrameProcessorTickMs] = useState(0);
  const [lastPoseResultMs, setLastPoseResultMs] = useState(0);

  // Initialize the native plugin once
  const plugin = useMemo(() => {
    return VisionCameraProxy.initFrameProcessorPlugin('detectPose', {});
  }, []);
  const isModelReady = plugin != null;

  useEffect(() => {
    if (plugin != null) {
      console.log('[PoseFrameProcessor] Native detectPose plugin initialized');
    } else {
      console.warn('[PoseFrameProcessor] Failed to initialize detectPose plugin');
    }
  }, [plugin]);

  // Stable worklet bridge — create once and update the callback ref.
  const callbackRef = useRef(onPoseDetected);
  useEffect(() => {
    callbackRef.current = onPoseDetected;
  }, [onPoseDetected]);

  const lastPoseWriteRef = useRef(0);
  const onPoseDetectedJS = useRunOnJS((result: PoseResult | null) => {
    if (result != null) {
      const now = Date.now();
      if (now - lastPoseWriteRef.current >= 500) {
        lastPoseWriteRef.current = now;
        setLastPoseResultMs(now);
      }
    }
    callbackRef.current(result);
  }, []);

  // Heartbeat from worklet -> JS so the UI can detect a stalled frame processor.
  const lastHeartbeatWriteRef = useRef(0);
  const onFrameProcessorTickJS = useRunOnJS(() => {
    const now = Date.now();
    if (now - lastHeartbeatWriteRef.current < 1000) return;
    lastHeartbeatWriteRef.current = now;
    setLastFrameProcessorTickMs(now);
  }, []);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (plugin == null) return;

      runAtTargetFps(TARGET_FPS, () => {
        onFrameProcessorTickJS();

        // Call native Swift MediaPipe plugin — returns null when no detection.
        const raw = plugin.call(frame) as RawPoseResult | null | undefined;

        if (
          raw == null ||
          raw.landmarks == null ||
          !Array.isArray(raw.landmarks)
        ) {
          onPoseDetectedJS(null);
          return;
        }

        const flatLandmarks = raw.landmarks;
        const expectedLength = MEDIAPIPE_LANDMARK_COUNT * 4; // x, y, z, visibility per landmark

        if (flatLandmarks.length < expectedLength) {
          onPoseDetectedJS(null);
          return;
        }

        // Unpack flat array [x0,y0,z0,v0, x1,y1,z1,v1, ...] into PoseLandmark[]
        const landmarks: PoseLandmark[] = [];

        for (let i = 0; i < MEDIAPIPE_LANDMARK_COUNT; i++) {
          const offset = i * 4;
          const rawX = flatLandmarks[offset];
          const rawY = flatLandmarks[offset + 1];
          const rawZ = flatLandmarks[offset + 2];
          const rawVisibility = flatLandmarks[offset + 3];

          if (
            !Number.isFinite(rawX) ||
            !Number.isFinite(rawY) ||
            !Number.isFinite(rawZ) ||
            !Number.isFinite(rawVisibility)
          ) {
            onPoseDetectedJS(null);
            return;
          }

          // Keep coordinates in bounds so rendering/framing cannot explode on outliers.
          const x = Math.max(0, Math.min(1, rawX));
          const y = Math.max(0, Math.min(1, rawY));
          const z = rawZ;
          const visibility = Math.max(0, Math.min(1, rawVisibility));

          landmarks.push({ x, y, z, visibility });
        }

        const result: PoseResult = {
          landmarks,
          timestamp: raw.timestamp,
        };

        onPoseDetectedJS(result);
      });
    },
    [plugin, onPoseDetectedJS, onFrameProcessorTickJS],
  );

  return { frameProcessor, isModelReady, lastFrameProcessorTickMs, lastPoseResultMs };
}
