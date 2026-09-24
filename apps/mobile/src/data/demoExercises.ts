/**
 * Demo exercise registry — bundled videos + pre-computed landmark keyframes.
 *
 * Each exercise has a set of keyframe poses (start → mid → end positions).
 * The DemoModeView interpolates between keyframes based on video playback
 * progress, producing smooth skeleton overlay without needing the TFLite model.
 *
 * Landmark format: 33 MediaPipe landmarks, each [x, y, z] normalized 0-1.
 * Face landmarks (0-10) get low visibility so SkeletonOverlay skips them.
 */

import { PoseLandmark, PoseResult } from '../types/pose';

export interface DemoExercise {
  id: string;
  label: string;
  /** require() asset for the bundled video — undefined until real videos are added */
  video?: number;
  /** Keyframe poses: array of { t: 0-1 progress, landmarks: 33×[x,y,z] } */
  keyframes: DemoKeyframe[];
  /** Whether the exercise loops (e.g., reps) */
  looping: boolean;
}

export interface DemoKeyframe {
  /** Progress through the video, 0.0 = start, 1.0 = end */
  t: number;
  /** 33 landmarks as [x, y, z] */
  landmarks: [number, number, number][];
}

// ─── Face landmarks (shared across all poses, low visibility) ────────────────
const FACE: [number, number, number][] = [
  [0.50, 0.12, 0.0],   // 0: nose
  [0.48, 0.10, -0.01],  // 1: left eye inner
  [0.47, 0.10, -0.01],  // 2: left eye
  [0.46, 0.10, 0.0],    // 3: left eye outer
  [0.52, 0.10, -0.01],  // 4: right eye inner
  [0.53, 0.10, -0.01],  // 5: right eye
  [0.54, 0.10, 0.0],    // 6: right eye outer
  [0.44, 0.11, 0.02],   // 7: left ear
  [0.56, 0.11, 0.02],   // 8: right ear
  [0.48, 0.14, 0.0],    // 9: mouth left
  [0.52, 0.14, 0.0],    // 10: mouth right
];

/** Build a full 33-landmark array from face + body (22 body landmarks, indices 11-32) */
function fullPose(body: [number, number, number][]): [number, number, number][] {
  return [...FACE, ...body];
}

// ─── SQUAT ───────────────────────────────────────────────────────────────────
const SQUAT_STANDING: [number, number, number][] = [
  // 11-12: shoulders
  [0.38, 0.22, 0.0], [0.62, 0.22, 0.0],
  // 13-14: elbows (arms forward for balance)
  [0.36, 0.32, -0.05], [0.64, 0.32, -0.05],
  // 15-16: wrists
  [0.38, 0.40, -0.10], [0.62, 0.40, -0.10],
  // 17-18: pinky
  [0.37, 0.42, -0.10], [0.63, 0.42, -0.10],
  // 19-20: index
  [0.39, 0.42, -0.10], [0.61, 0.42, -0.10],
  // 21-22: thumb
  [0.40, 0.41, -0.09], [0.60, 0.41, -0.09],
  // 23-24: hips
  [0.42, 0.52, 0.0], [0.58, 0.52, 0.0],
  // 25-26: knees
  [0.42, 0.70, 0.0], [0.58, 0.70, 0.0],
  // 27-28: ankles
  [0.42, 0.88, 0.0], [0.58, 0.88, 0.0],
  // 29-30: heels
  [0.41, 0.90, 0.01], [0.59, 0.90, 0.01],
  // 31-32: foot index
  [0.43, 0.92, -0.01], [0.57, 0.92, -0.01],
];

const SQUAT_BOTTOM: [number, number, number][] = [
  // 11-12: shoulders (dropped lower)
  [0.38, 0.35, 0.0], [0.62, 0.35, 0.0],
  // 13-14: elbows
  [0.36, 0.45, -0.08], [0.64, 0.45, -0.08],
  // 15-16: wrists
  [0.38, 0.52, -0.12], [0.62, 0.52, -0.12],
  // 17-18: pinky
  [0.37, 0.54, -0.12], [0.63, 0.54, -0.12],
  // 19-20: index
  [0.39, 0.54, -0.12], [0.61, 0.54, -0.12],
  // 21-22: thumb
  [0.40, 0.53, -0.11], [0.60, 0.53, -0.11],
  // 23-24: hips (dropped significantly)
  [0.40, 0.65, -0.05], [0.60, 0.65, -0.05],
  // 25-26: knees (forward)
  [0.38, 0.78, -0.10], [0.62, 0.78, -0.10],
  // 27-28: ankles
  [0.42, 0.88, 0.0], [0.58, 0.88, 0.0],
  // 29-30: heels
  [0.41, 0.90, 0.01], [0.59, 0.90, 0.01],
  // 31-32: foot index
  [0.43, 0.92, -0.01], [0.57, 0.92, -0.01],
];

// ─── LUNGE ───────────────────────────────────────────────────────────────────
const LUNGE_STANDING: [number, number, number][] = [
  [0.38, 0.22, 0.0], [0.62, 0.22, 0.0],     // shoulders
  [0.35, 0.36, 0.0], [0.65, 0.36, 0.0],     // elbows
  [0.36, 0.48, 0.0], [0.64, 0.48, 0.0],     // wrists
  [0.35, 0.50, 0.0], [0.65, 0.50, 0.0],     // pinky
  [0.37, 0.50, 0.0], [0.63, 0.50, 0.0],     // index
  [0.38, 0.49, 0.0], [0.62, 0.49, 0.0],     // thumb
  [0.42, 0.52, 0.0], [0.58, 0.52, 0.0],     // hips
  [0.42, 0.70, 0.0], [0.58, 0.70, 0.0],     // knees
  [0.42, 0.88, 0.0], [0.58, 0.88, 0.0],     // ankles
  [0.41, 0.90, 0.01], [0.59, 0.90, 0.01],   // heels
  [0.43, 0.92, -0.01], [0.57, 0.92, -0.01], // foot index
];

const LUNGE_DOWN: [number, number, number][] = [
  [0.42, 0.28, 0.0], [0.62, 0.28, 0.0],     // shoulders (slightly shifted)
  [0.39, 0.42, 0.0], [0.65, 0.42, 0.0],     // elbows
  [0.40, 0.52, 0.0], [0.64, 0.52, 0.0],     // wrists
  [0.39, 0.54, 0.0], [0.65, 0.54, 0.0],     // pinky
  [0.41, 0.54, 0.0], [0.63, 0.54, 0.0],     // index
  [0.42, 0.53, 0.0], [0.62, 0.53, 0.0],     // thumb
  [0.44, 0.55, 0.0], [0.58, 0.55, 0.0],     // hips (dropped)
  [0.35, 0.72, -0.08], [0.62, 0.72, 0.05],  // knees (front knee forward, back knee down)
  [0.34, 0.88, 0.0], [0.65, 0.88, 0.0],     // ankles (split stance)
  [0.33, 0.90, 0.01], [0.66, 0.90, 0.01],   // heels
  [0.35, 0.92, -0.01], [0.64, 0.92, -0.01], // foot index
];

// ─── PUSH-UP ─────────────────────────────────────────────────────────────────
// Side view — person facing left
const PUSHUP_FACE: [number, number, number][] = [
  [0.22, 0.30, 0.0],   // 0: nose (side view, head left)
  [0.21, 0.28, -0.01], [0.20, 0.28, -0.01], [0.19, 0.28, 0.0],
  [0.23, 0.28, -0.01], [0.24, 0.28, -0.01], [0.25, 0.28, 0.0],
  [0.18, 0.29, 0.02], [0.26, 0.29, 0.02],
  [0.21, 0.32, 0.0], [0.23, 0.32, 0.0],
];

const PUSHUP_UP: [number, number, number][] = [
  [0.28, 0.32, 0.0], [0.28, 0.32, 0.05],    // shoulders (stacked, side view)
  [0.22, 0.50, 0.0], [0.22, 0.50, 0.05],    // elbows (straight)
  [0.20, 0.62, 0.0], [0.20, 0.62, 0.05],    // wrists on ground
  [0.19, 0.63, 0.0], [0.19, 0.63, 0.05],
  [0.21, 0.63, 0.0], [0.21, 0.63, 0.05],
  [0.20, 0.61, 0.0], [0.20, 0.61, 0.05],
  [0.52, 0.35, 0.0], [0.52, 0.35, 0.05],    // hips (body straight plank)
  [0.72, 0.38, 0.0], [0.72, 0.38, 0.05],    // knees
  [0.88, 0.42, 0.0], [0.88, 0.42, 0.05],    // ankles
  [0.89, 0.43, 0.01], [0.89, 0.43, 0.06],
  [0.87, 0.44, -0.01], [0.87, 0.44, 0.04],
];

const PUSHUP_DOWN: [number, number, number][] = [
  [0.28, 0.42, 0.0], [0.28, 0.42, 0.05],    // shoulders (lowered)
  [0.18, 0.38, 0.0], [0.18, 0.38, 0.05],    // elbows (bent out)
  [0.20, 0.62, 0.0], [0.20, 0.62, 0.05],    // wrists (stay on ground)
  [0.19, 0.63, 0.0], [0.19, 0.63, 0.05],
  [0.21, 0.63, 0.0], [0.21, 0.63, 0.05],
  [0.20, 0.61, 0.0], [0.20, 0.61, 0.05],
  [0.52, 0.42, 0.0], [0.52, 0.42, 0.05],    // hips (slight sag)
  [0.72, 0.42, 0.0], [0.72, 0.42, 0.05],    // knees
  [0.88, 0.44, 0.0], [0.88, 0.44, 0.05],    // ankles
  [0.89, 0.45, 0.01], [0.89, 0.45, 0.06],
  [0.87, 0.46, -0.01], [0.87, 0.46, 0.04],
];

// ─── PLANK ───────────────────────────────────────────────────────────────────
// Similar to push-up top position but static with slight breathing movement
const PLANK_HOLD: [number, number, number][] = [
  [0.25, 0.34, 0.0], [0.25, 0.34, 0.05],    // shoulders
  [0.20, 0.50, 0.0], [0.20, 0.50, 0.05],    // elbows (on forearms)
  [0.18, 0.60, 0.0], [0.18, 0.60, 0.05],    // wrists
  [0.17, 0.61, 0.0], [0.17, 0.61, 0.05],
  [0.19, 0.61, 0.0], [0.19, 0.61, 0.05],
  [0.18, 0.59, 0.0], [0.18, 0.59, 0.05],
  [0.52, 0.36, 0.0], [0.52, 0.36, 0.05],    // hips
  [0.72, 0.38, 0.0], [0.72, 0.38, 0.05],    // knees
  [0.88, 0.40, 0.0], [0.88, 0.40, 0.05],    // ankles
  [0.89, 0.41, 0.01], [0.89, 0.41, 0.06],
  [0.87, 0.42, -0.01], [0.87, 0.42, 0.04],
];

const PLANK_SAG: [number, number, number][] = [
  [0.25, 0.36, 0.0], [0.25, 0.36, 0.05],    // shoulders (slightly lower)
  [0.20, 0.51, 0.0], [0.20, 0.51, 0.05],    // elbows
  [0.18, 0.61, 0.0], [0.18, 0.61, 0.05],    // wrists
  [0.17, 0.62, 0.0], [0.17, 0.62, 0.05],
  [0.19, 0.62, 0.0], [0.19, 0.62, 0.05],
  [0.18, 0.60, 0.0], [0.18, 0.60, 0.05],
  [0.52, 0.40, 0.0], [0.52, 0.40, 0.05],    // hips (slight sag — breathing)
  [0.72, 0.39, 0.0], [0.72, 0.39, 0.05],    // knees
  [0.88, 0.41, 0.0], [0.88, 0.41, 0.05],    // ankles
  [0.89, 0.42, 0.01], [0.89, 0.42, 0.06],
  [0.87, 0.43, -0.01], [0.87, 0.43, 0.04],
];

// ─── Video assets ─────────────────────────────────────────────────────────────
// Add your own consented demo recordings here; the public edition uses sample pose keyframes.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pushupOverlayVideo = undefined;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lungeOverlayVideo = undefined;

// ─── Exercise registry ───────────────────────────────────────────────────────

export const DEMO_EXERCISES: DemoExercise[] = [
  {
    id: 'lunge',
    label: 'Lunge',
    video: lungeOverlayVideo,
    keyframes: [
      { t: 0.0, landmarks: fullPose(LUNGE_STANDING) },
      { t: 0.25, landmarks: fullPose(LUNGE_DOWN) },
      { t: 0.5, landmarks: fullPose(LUNGE_STANDING) },
      { t: 0.75, landmarks: fullPose(LUNGE_DOWN) },
      { t: 1.0, landmarks: fullPose(LUNGE_STANDING) },
    ],
    looping: true,
  },
  {
    id: 'pushup',
    label: 'Push-Up',
    video: pushupOverlayVideo,
    keyframes: [
      { t: 0.0, landmarks: [...PUSHUP_FACE, ...PUSHUP_UP] },
      { t: 0.25, landmarks: [...PUSHUP_FACE, ...PUSHUP_DOWN] },
      { t: 0.5, landmarks: [...PUSHUP_FACE, ...PUSHUP_UP] },
      { t: 0.75, landmarks: [...PUSHUP_FACE, ...PUSHUP_DOWN] },
      { t: 1.0, landmarks: [...PUSHUP_FACE, ...PUSHUP_UP] },
    ],
    looping: true,
  },
  {
    id: 'squat',
    label: 'Squat',
    keyframes: [
      { t: 0.0, landmarks: fullPose(SQUAT_STANDING) },
      { t: 0.25, landmarks: fullPose(SQUAT_BOTTOM) },
      { t: 0.5, landmarks: fullPose(SQUAT_STANDING) },
      { t: 0.75, landmarks: fullPose(SQUAT_BOTTOM) },
      { t: 1.0, landmarks: fullPose(SQUAT_STANDING) },
    ],
    looping: true,
  },
  {
    id: 'plank',
    label: 'Plank',
    keyframes: [
      { t: 0.0, landmarks: [...PUSHUP_FACE, ...PLANK_HOLD] },
      { t: 0.25, landmarks: [...PUSHUP_FACE, ...PLANK_SAG] },
      { t: 0.5, landmarks: [...PUSHUP_FACE, ...PLANK_HOLD] },
      { t: 0.75, landmarks: [...PUSHUP_FACE, ...PLANK_SAG] },
      { t: 1.0, landmarks: [...PUSHUP_FACE, ...PLANK_HOLD] },
    ],
    looping: true,
  },
];

// ─── Interpolation helpers ───────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

const JITTER_AMOUNT = 0.003;

function jitter(val: number): number {
  return val + (Math.random() - 0.5) * 2 * JITTER_AMOUNT;
}

/**
 * Given a progress value (0-1) and the exercise keyframes,
 * interpolate to produce a PoseResult with natural-looking movement.
 */
export function interpolatePose(
  keyframes: DemoKeyframe[],
  progress: number,
): PoseResult {
  // Clamp
  const t = Math.max(0, Math.min(1, progress));

  // Find surrounding keyframes
  let before = keyframes[0];
  let after = keyframes[keyframes.length - 1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i].t && t <= keyframes[i + 1].t) {
      before = keyframes[i];
      after = keyframes[i + 1];
      break;
    }
  }

  // Local interpolation factor
  const range = after.t - before.t;
  const localT = range > 0 ? smoothstep((t - before.t) / range) : 0;

  const landmarks: PoseLandmark[] = before.landmarks.map(([bx, by, bz], idx) => {
    const [ax, ay, az] = after.landmarks[idx];
    const isFace = idx <= 10;
    return {
      x: jitter(lerp(bx, ax, localT)),
      y: jitter(lerp(by, ay, localT)),
      z: lerp(bz, az, localT),
      visibility: isFace ? 0.3 : 0.92 + Math.random() * 0.08,
    };
  });

  return {
    landmarks,
    timestamp: Date.now(),
  };
}
