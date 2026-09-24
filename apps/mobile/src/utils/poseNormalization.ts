/**
 * Pose Normalization — Hip-centered, torso-scaled landmark normalization.
 *
 * MUST match the Python implementation in ml/src/normalization.py exactly.
 * Any divergence will cause model inference to produce incorrect results.
 */

import { PoseLandmark, MOVENET_TO_MEDIAPIPE } from '../types/pose';

export type ExerciseId = 0 | 1 | 2; // 0=plank, 1=pushup, 2=lunge

export const EXERCISE_NAMES: Record<ExerciseId, string> = {
  0: 'plank',
  1: 'pushup',
  2: 'lunge',
};

// MoveNet 17-keypoint order mapped from MediaPipe 33 indices
// Must match ml/src/normalization.py MOVENET_INDICES
const MOVENET_MEDIAPIPE_INDICES = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

// Within the 17 MoveNet keypoints, indices for normalization anchors
const MOVENET_L_HIP = 11;
const MOVENET_R_HIP = 12;
const MOVENET_L_SHOULDER = 5;
const MOVENET_R_SHOULDER = 6;

const MIN_TORSO_SCALE = 0.01;
const NUM_EXERCISES = 3;

export interface NormalizationResult {
  /** Flattened model input: 51 landmark values + 3 exercise one-hot = 54 */
  input: Float32Array;
  /** Hip center for denormalization */
  hipCenter: [number, number, number];
  /** Torso scale for denormalization */
  torsoScale: number;
}

/**
 * Extract 17 MoveNet-compatible landmarks from a PoseResult (33 landmarks).
 * Returns [x, y, z] for each of the 17 keypoints.
 */
function extractMoveNetLandmarks(landmarks: PoseLandmark[]): number[][] {
  return MOVENET_MEDIAPIPE_INDICES.map(idx => {
    const lm = landmarks[idx];
    return [lm.x, lm.y, lm.z];
  });
}

/**
 * Normalize pose landmarks and prepare model input.
 *
 * Steps:
 * 1. Extract 17 MoveNet landmarks from 33 MediaPipe
 * 2. Compute hip center (midpoint of L/R hip)
 * 3. Compute torso scale (hip center to shoulder center distance)
 * 4. Center on hips, divide by torso scale
 * 5. Flatten to 51 values + append exercise one-hot (3) = 54 total
 */
export function normalizePose(
  landmarks: PoseLandmark[],
  exerciseId: ExerciseId,
): NormalizationResult {
  // Extract 17 keypoints
  const lm17 = extractMoveNetLandmarks(landmarks);

  // Hip center
  const hipCenter: [number, number, number] = [
    (lm17[MOVENET_L_HIP][0] + lm17[MOVENET_R_HIP][0]) / 2,
    (lm17[MOVENET_L_HIP][1] + lm17[MOVENET_R_HIP][1]) / 2,
    (lm17[MOVENET_L_HIP][2] + lm17[MOVENET_R_HIP][2]) / 2,
  ];

  // Shoulder center
  const shoulderCenter: [number, number, number] = [
    (lm17[MOVENET_L_SHOULDER][0] + lm17[MOVENET_R_SHOULDER][0]) / 2,
    (lm17[MOVENET_L_SHOULDER][1] + lm17[MOVENET_R_SHOULDER][1]) / 2,
    (lm17[MOVENET_L_SHOULDER][2] + lm17[MOVENET_R_SHOULDER][2]) / 2,
  ];

  // Torso scale = distance from hip center to shoulder center
  const dx = shoulderCenter[0] - hipCenter[0];
  const dy = shoulderCenter[1] - hipCenter[1];
  const dz = shoulderCenter[2] - hipCenter[2];
  const torsoScale = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), MIN_TORSO_SCALE);

  // Build input: normalized landmarks (51) + exercise one-hot (3) = 54
  const input = new Float32Array(51 + NUM_EXERCISES);

  for (let i = 0; i < 17; i++) {
    const offset = i * 3;
    input[offset] = (lm17[i][0] - hipCenter[0]) / torsoScale;
    input[offset + 1] = (lm17[i][1] - hipCenter[1]) / torsoScale;
    input[offset + 2] = (lm17[i][2] - hipCenter[2]) / torsoScale;
  }

  // Exercise one-hot
  input[51 + exerciseId] = 1.0;

  return { input, hipCenter, torsoScale };
}

/**
 * Denormalize corrected landmarks back to the user's coordinate space.
 * Uses the user's own hip center and torso scale so corrections
 * adapt to their body proportions.
 */
export function denormalizePose(
  correctedFlat: Float32Array | number[],
  hipCenter: [number, number, number],
  torsoScale: number,
): PoseLandmark[] {
  const landmarks: PoseLandmark[] = [];

  for (let i = 0; i < 17; i++) {
    const offset = i * 3;
    landmarks.push({
      x: correctedFlat[offset] * torsoScale + hipCenter[0],
      y: correctedFlat[offset + 1] * torsoScale + hipCenter[1],
      z: correctedFlat[offset + 2] * torsoScale + hipCenter[2],
      visibility: 1.0,
    });
  }

  return landmarks;
}

/**
 * Map MoveNet 17-keypoint index to MediaPipe LandmarkIndex for display.
 * Returns the MediaPipe index corresponding to a MoveNet keypoint index.
 */
export function moveNetToMediaPipeIndex(moveNetIdx: number): number {
  return MOVENET_MEDIAPIPE_INDICES[moveNetIdx];
}
