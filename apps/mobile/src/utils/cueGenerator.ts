/**
 * Cue Generator — ML-driven coaching cues from pose correction output.
 *
 * Compares raw vs corrected landmarks per joint. If displacement exceeds
 * threshold, generates exercise-specific coaching cues.
 *
 * Features:
 * - Phase-aware contextual cues
 * - Exercise-specific cue lookup table
 * - Max 2-3 cues at a time, prioritized by displacement
 * - Hysteresis debounce (0.5s on/off) to prevent flicker
 */

import { ExerciseId } from './poseNormalization';
import { CorrectionResult } from '../hooks/usePoseCorrection';

export interface CoachingCue {
  joint: string;
  message: string;
  severity: 'warning' | 'critical';
  displacement: number;
}

// Displacement threshold (in normalized coordinates) to trigger a cue
const CUE_THRESHOLD = 0.02;
const CRITICAL_THRESHOLD = 0.05;

// Maximum simultaneous cues
const MAX_CUES = 3;

// Hysteresis timing (ms)
const DEBOUNCE_ON = 500;
const DEBOUNCE_OFF = 500;

// MoveNet 17 keypoint names
const JOINT_NAMES = [
  'nose', 'l_eye', 'r_eye', 'l_ear', 'r_ear',
  'l_shoulder', 'r_shoulder', 'l_elbow', 'r_elbow',
  'l_wrist', 'r_wrist', 'l_hip', 'r_hip',
  'l_knee', 'r_knee', 'l_ankle', 'r_ankle',
];

// Exercise-specific cue messages keyed by joint name
// Each maps a joint to a correction message for that exercise
type CueLookup = Record<string, { warning: string; critical: string }>;

const PLANK_CUES: CueLookup = {
  l_hip: { warning: 'Slight hip drop — engage core', critical: 'Hip sagging — tighten core' },
  r_hip: { warning: 'Slight hip drop — engage core', critical: 'Hip sagging — tighten core' },
  l_shoulder: { warning: 'Check shoulder position', critical: 'Shoulders forward of wrists — shift back' },
  r_shoulder: { warning: 'Check shoulder position', critical: 'Shoulders forward of wrists — shift back' },
  l_knee: { warning: 'Keep legs straight', critical: 'Legs bending — push through heels' },
  r_knee: { warning: 'Keep legs straight', critical: 'Legs bending — push through heels' },
};

const PUSHUP_CUES: CueLookup = {
  l_elbow: { warning: 'Elbows flaring out slightly', critical: 'Elbows too wide — tuck closer to body' },
  r_elbow: { warning: 'Elbows flaring out slightly', critical: 'Elbows too wide — tuck closer to body' },
  l_hip: { warning: 'Core slightly loose', critical: 'Hip sagging — tighten core' },
  r_hip: { warning: 'Core slightly loose', critical: 'Hip sagging — tighten core' },
  l_shoulder: { warning: 'Check shoulder alignment', critical: 'Shoulders uneven — level them out' },
  r_shoulder: { warning: 'Check shoulder alignment', critical: 'Shoulders uneven — level them out' },
  l_wrist: { warning: 'Hands slightly off position', critical: 'Hands too wide — bring closer' },
  r_wrist: { warning: 'Hands slightly off position', critical: 'Hands too wide — bring closer' },
};

const LUNGE_CUES: CueLookup = {
  l_knee: { warning: 'Front knee drifting', critical: 'Knee caving in — push outward over toes' },
  r_knee: { warning: 'Front knee drifting', critical: 'Knee caving in — push outward over toes' },
  l_hip: { warning: 'Slight lean detected', critical: 'Torso leaning — stay upright' },
  r_hip: { warning: 'Slight lean detected', critical: 'Torso leaning — stay upright' },
  l_shoulder: { warning: 'Upper body tilting', critical: 'Shoulders uneven — square them up' },
  r_shoulder: { warning: 'Upper body tilting', critical: 'Shoulders uneven — square them up' },
  l_ankle: { warning: 'Check foot position', critical: 'Back foot unstable — plant firmly' },
  r_ankle: { warning: 'Check foot position', critical: 'Back foot unstable — plant firmly' },
};

const EXERCISE_CUES: Record<ExerciseId, CueLookup> = {
  0: PLANK_CUES,
  1: PUSHUP_CUES,
  2: LUNGE_CUES,
};

// Phase-aware contextual additions
function getPhaseContext(exerciseId: ExerciseId, phase: number): string | null {
  if (exerciseId === 1) { // pushup
    if (phase >= 0.3 && phase <= 0.7) return 'At the bottom — ';
    if (phase < 0.2 || phase > 0.8) return 'At the top — ';
  }
  if (exerciseId === 2) { // lunge
    if (phase >= 0.3 && phase <= 0.7) return 'In the lunge — ';
    if (phase < 0.15 || phase > 0.85) return 'Standing — ';
  }
  return null;
}

/**
 * Cue generator with hysteresis state management.
 */
export class CueGenerator {
  private activeCues = new Map<string, { cue: CoachingCue; activeSince: number }>();
  private suppressedJoints = new Map<string, number>(); // joint -> suppression end time

  /**
   * Generate coaching cues from a correction result.
   * Call this every time the model produces output.
   */
  generateCues(
    correction: CorrectionResult,
    exerciseId: ExerciseId,
  ): CoachingCue[] {
    const now = Date.now();
    const cueLookup = EXERCISE_CUES[exerciseId];
    const candidates: CoachingCue[] = [];

    // Check each joint for displacement above threshold
    for (let i = 0; i < 17; i++) {
      const displacement = correction.jointDisplacements[i];
      const jointName = JOINT_NAMES[i];

      if (displacement < CUE_THRESHOLD) {
        // Joint is fine — check if we need to deactivate
        const active = this.activeCues.get(jointName);
        if (active && now - active.activeSince > DEBOUNCE_OFF) {
          this.activeCues.delete(jointName);
          this.suppressedJoints.set(jointName, now + DEBOUNCE_ON);
        }
        continue;
      }

      // Check suppression
      const suppressUntil = this.suppressedJoints.get(jointName);
      if (suppressUntil && now < suppressUntil) continue;
      this.suppressedJoints.delete(jointName);

      const severity = displacement >= CRITICAL_THRESHOLD ? 'critical' : 'warning';
      const lookup = cueLookup[jointName];
      if (!lookup) continue;

      let message = lookup[severity];

      // Add phase context
      const phaseCtx = getPhaseContext(exerciseId, correction.phase);
      if (phaseCtx) {
        message = phaseCtx + message.charAt(0).toLowerCase() + message.slice(1);
      }

      const cue: CoachingCue = { joint: jointName, message, severity, displacement };
      candidates.push(cue);

      // Track activation time for hysteresis
      if (!this.activeCues.has(jointName)) {
        this.activeCues.set(jointName, { cue, activeSince: now });
      }
    }

    // Sort by displacement (most severe first) and limit
    candidates.sort((a, b) => b.displacement - a.displacement);
    return candidates.slice(0, MAX_CUES);
  }

  /** Reset all state. Call when switching exercises or stopping analysis. */
  reset(): void {
    this.activeCues.clear();
    this.suppressedJoints.clear();
  }
}

/**
 * Rep counter using phase signal.
 * A full rep = phase crossing 0.5 going down, then crossing 0.5 going back up.
 */
export class RepCounter {
  private repCount = 0;
  private lastPhase = 0;
  private wentBelow = false;

  update(phase: number): number {
    if (this.lastPhase >= 0.5 && phase < 0.5) {
      this.wentBelow = true;
    }
    if (this.wentBelow && this.lastPhase < 0.5 && phase >= 0.5) {
      this.repCount++;
      this.wentBelow = false;
    }
    this.lastPhase = phase;
    return this.repCount;
  }

  get count(): number {
    return this.repCount;
  }

  reset(): void {
    this.repCount = 0;
    this.lastPhase = 0;
    this.wentBelow = false;
  }
}
