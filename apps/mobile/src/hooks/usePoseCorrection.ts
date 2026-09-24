/**
 * usePoseCorrection — Load TFLite pose correction model and run inference.
 *
 * Runs on the JS thread every 3-5 frames (~6-10 Hz).
 * Model is tiny (~60KB, <5ms inference).
 *
 * Input: 54 floats (17 landmarks × 3 + exercise one-hot)
 * Output: phase (1 float) + corrected landmarks (51 floats)
 *
 * NOTE: The pose_correction.tflite model needs to be trained separately.
 * Until then, this hook returns null (no corrections applied).
 * The app will still work - just without ML-based form correction overlay.
 */

import { useCallback } from 'react';
import { PoseResult, PoseLandmark } from '../types/pose';
import { ExerciseId } from '../utils/poseNormalization';

export interface CorrectionResult {
  /** Exercise phase 0.0-1.0 */
  phase: number;
  /** Corrected 17 MoveNet landmarks in original coordinate space */
  correctedLandmarks: PoseLandmark[];
  /** Per-joint displacement magnitude (normalized) for cue generation */
  jointDisplacements: number[];
  /** Normalization parameters used (for debugging) */
  hipCenter: [number, number, number];
  torsoScale: number;
}

/**
 * Stub implementation - returns null until pose_correction.tflite model is trained.
 *
 * To enable ML correction:
 * 1. Train the pose_correction.tflite model (see ml/docs for specs)
 * 2. Place it in assets/models/pose_correction.tflite
 * 3. Uncomment the full implementation below
 */
export function usePoseCorrection(_exerciseId: ExerciseId) {
  const correctPose = useCallback(
    (_pose: PoseResult): CorrectionResult | null => {
      // Model not yet available - return null (no corrections)
      return null;
    },
    [],
  );

  // Report ready so UI doesn't show "loading" forever
  return { correctPose, isModelReady: true };
}

/*
 * FULL IMPLEMENTATION - Uncomment when model is ready:
 *
 * import { useCallback, useRef } from 'react';
 * import { useTensorflowModel } from 'react-native-fast-tflite';
 * import { normalizePose, denormalizePose } from '../utils/poseNormalization';
 *
 * export function usePoseCorrection(exerciseId: ExerciseId) {
 *   const modelState = useTensorflowModel(
 *     require('../../assets/models/pose_correction.tflite'),
 *     'default',
 *   );
 *   const model = modelState.state === 'loaded' ? modelState.model : undefined;
 *   const isModelReady = modelState.state === 'loaded';
 *   ... rest of original implementation
 * }
 */
