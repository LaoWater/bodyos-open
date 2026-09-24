import { PoseLandmark, PoseResult } from '../types/pose';

// Base standing pose (normalized 0-1 coordinates, facing camera)
const BASE_POSE: [number, number, number][] = [
  // 0: nose
  [0.50, 0.12, 0.0],
  // 1-6: eyes (inner/outer)
  [0.48, 0.10, -0.01], [0.47, 0.10, -0.01], [0.46, 0.10, 0.0],
  [0.52, 0.10, -0.01], [0.53, 0.10, -0.01], [0.54, 0.10, 0.0],
  // 7-8: ears
  [0.44, 0.11, 0.02], [0.56, 0.11, 0.02],
  // 9-10: mouth
  [0.48, 0.14, 0.0], [0.52, 0.14, 0.0],
  // 11-12: shoulders
  [0.38, 0.22, 0.0], [0.62, 0.22, 0.0],
  // 13-14: elbows
  [0.32, 0.36, 0.0], [0.68, 0.36, 0.0],
  // 15-16: wrists
  [0.30, 0.48, 0.0], [0.70, 0.48, 0.0],
  // 17-18: pinky
  [0.29, 0.50, 0.0], [0.71, 0.50, 0.0],
  // 19-20: index
  [0.30, 0.51, 0.0], [0.70, 0.51, 0.0],
  // 21-22: thumb
  [0.31, 0.49, 0.0], [0.69, 0.49, 0.0],
  // 23-24: hips
  [0.42, 0.52, 0.0], [0.58, 0.52, 0.0],
  // 25-26: knees
  [0.41, 0.70, 0.0], [0.59, 0.70, 0.0],
  // 27-28: ankles
  [0.40, 0.88, 0.0], [0.60, 0.88, 0.0],
  // 29-30: heels
  [0.39, 0.90, 0.01], [0.61, 0.90, 0.01],
  // 31-32: foot index
  [0.41, 0.92, -0.01], [0.59, 0.92, -0.01],
];

function jitter(val: number, amount: number = 0.005): number {
  return val + (Math.random() - 0.5) * 2 * amount;
}

export function generateMockPoseFrame(): PoseResult {
  const landmarks: PoseLandmark[] = BASE_POSE.map(([x, y, z], i) => {
    // Face landmarks get lower visibility (we skip drawing them)
    const isFace = i <= 10;
    return {
      x: jitter(x),
      y: jitter(y),
      z: jitter(z, 0.01),
      visibility: isFace ? 0.3 + Math.random() * 0.3 : 0.85 + Math.random() * 0.15,
    };
  });

  return {
    landmarks,
    timestamp: Date.now(),
  };
}
