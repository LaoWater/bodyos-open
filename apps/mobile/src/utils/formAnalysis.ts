import { PoseLandmark, PoseResult, LandmarkIndex, FormQuality, FormFeedback } from '../types/pose';

/**
 * Calculate the angle (in degrees) at point B formed by points A-B-C.
 */
export function calculateAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;

  const dot = abx * cbx + aby * cby;
  const magAB = Math.sqrt(abx * abx + aby * aby);
  const magCB = Math.sqrt(cbx * cbx + cby * cby);

  if (magAB === 0 || magCB === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

function qualityFromAngle(angle: number, ideal: number, warnThresh: number, badThresh: number): FormQuality {
  const diff = Math.abs(angle - ideal);
  if (diff <= warnThresh) return 'good';
  if (diff <= badThresh) return 'warning';
  return 'bad';
}

/**
 * Analyze the pose and return a form score + per-joint quality map + feedback tips.
 */
export function getFormScore(pose: PoseResult): FormFeedback {
  const l = pose.landmarks;
  const jointQualities = new Map<LandmarkIndex, FormQuality>();
  const tips: string[] = [];
  let totalScore = 100;

  // Check shoulder alignment (should be roughly level)
  const shoulderDiff = Math.abs(l[LandmarkIndex.LEFT_SHOULDER].y - l[LandmarkIndex.RIGHT_SHOULDER].y);
  if (shoulderDiff > 0.04) {
    jointQualities.set(LandmarkIndex.LEFT_SHOULDER, 'bad');
    jointQualities.set(LandmarkIndex.RIGHT_SHOULDER, 'bad');
    tips.push('Shoulders are uneven — try to level them');
    totalScore -= 20;
  } else if (shoulderDiff > 0.02) {
    jointQualities.set(LandmarkIndex.LEFT_SHOULDER, 'warning');
    jointQualities.set(LandmarkIndex.RIGHT_SHOULDER, 'warning');
    tips.push('Slight shoulder tilt detected');
    totalScore -= 8;
  } else {
    jointQualities.set(LandmarkIndex.LEFT_SHOULDER, 'good');
    jointQualities.set(LandmarkIndex.RIGHT_SHOULDER, 'good');
  }

  // Check hip alignment
  const hipDiff = Math.abs(l[LandmarkIndex.LEFT_HIP].y - l[LandmarkIndex.RIGHT_HIP].y);
  if (hipDiff > 0.04) {
    jointQualities.set(LandmarkIndex.LEFT_HIP, 'bad');
    jointQualities.set(LandmarkIndex.RIGHT_HIP, 'bad');
    tips.push('Hips are uneven — check your stance');
    totalScore -= 15;
  } else if (hipDiff > 0.02) {
    jointQualities.set(LandmarkIndex.LEFT_HIP, 'warning');
    jointQualities.set(LandmarkIndex.RIGHT_HIP, 'warning');
    tips.push('Minor hip tilt');
    totalScore -= 5;
  } else {
    jointQualities.set(LandmarkIndex.LEFT_HIP, 'good');
    jointQualities.set(LandmarkIndex.RIGHT_HIP, 'good');
  }

  // Check left knee angle (hip-knee-ankle)
  const leftKneeAngle = calculateAngle(
    l[LandmarkIndex.LEFT_HIP],
    l[LandmarkIndex.LEFT_KNEE],
    l[LandmarkIndex.LEFT_ANKLE],
  );
  const leftKneeQ = qualityFromAngle(leftKneeAngle, 175, 15, 30);
  jointQualities.set(LandmarkIndex.LEFT_KNEE, leftKneeQ);
  if (leftKneeQ === 'warning') { tips.push('Left knee slightly bent'); totalScore -= 5; }
  if (leftKneeQ === 'bad') { tips.push('Left knee overly bent'); totalScore -= 12; }

  // Check right knee angle
  const rightKneeAngle = calculateAngle(
    l[LandmarkIndex.RIGHT_HIP],
    l[LandmarkIndex.RIGHT_KNEE],
    l[LandmarkIndex.RIGHT_ANKLE],
  );
  const rightKneeQ = qualityFromAngle(rightKneeAngle, 175, 15, 30);
  jointQualities.set(LandmarkIndex.RIGHT_KNEE, rightKneeQ);
  if (rightKneeQ === 'warning') { tips.push('Right knee slightly bent'); totalScore -= 5; }
  if (rightKneeQ === 'bad') { tips.push('Right knee overly bent'); totalScore -= 12; }

  // Head forward check: nose should be roughly above midpoint of shoulders
  const shoulderMidX = (l[LandmarkIndex.LEFT_SHOULDER].x + l[LandmarkIndex.RIGHT_SHOULDER].x) / 2;
  const headOffset = Math.abs(l[LandmarkIndex.NOSE].x - shoulderMidX);
  if (headOffset > 0.06) {
    tips.push('Head is off-center — align with your spine');
    totalScore -= 10;
  } else if (headOffset > 0.03) {
    tips.push('Head slightly off-center');
    totalScore -= 4;
  }

  if (tips.length === 0) {
    tips.push('Great form! Keep it up');
  }

  return {
    score: Math.max(0, Math.min(100, totalScore)),
    jointQualities,
    tips,
  };
}
