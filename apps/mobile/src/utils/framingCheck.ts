/**
 * Framing Check — Validate user is at proper distance before analysis starts.
 *
 * Checks bounding box coverage (30-85% of frame) and major joint visibility.
 * Returns actionable messages to guide the user into proper framing.
 */

import { PoseResult, LandmarkIndex } from '../types/pose';

export type FramingStatus = 'good' | 'too_far' | 'too_close' | 'off_center' | 'incomplete';

export interface FramingResult {
  status: FramingStatus;
  message: string | null;
  bboxCoverage: number;
  visibleMajorJoints: number;
}

// Bounding box coverage thresholds (fraction of frame area)
const MIN_BBOX_COVERAGE = 0.08;
const MAX_BBOX_COVERAGE = 0.90;

// Minimum visibility threshold for a landmark to count as "visible"
const VISIBILITY_THRESHOLD = 0.05;

// Major joints that must be visible for analysis
const MAJOR_JOINTS: LandmarkIndex[] = [
  LandmarkIndex.LEFT_SHOULDER,
  LandmarkIndex.RIGHT_SHOULDER,
  LandmarkIndex.LEFT_HIP,
  LandmarkIndex.RIGHT_HIP,
  LandmarkIndex.LEFT_KNEE,
  LandmarkIndex.RIGHT_KNEE,
  LandmarkIndex.LEFT_ANKLE,
  LandmarkIndex.RIGHT_ANKLE,
];

// Minimum fraction of major joints that must be visible
const MIN_MAJOR_JOINT_RATIO = 0.4;

// Center tolerance (how far off-center the body midpoint can be)
const CENTER_TOLERANCE = 0.30;

/**
 * Check if the user is properly framed for pose analysis.
 */
export function checkFraming(pose: PoseResult | null): FramingResult {
  if (!pose || pose.landmarks.length < 33) {
    return {
      status: 'incomplete',
      message: 'Step into the frame',
      bboxCoverage: 0,
      visibleMajorJoints: 0,
    };
  }

  const landmarks = pose.landmarks;

  // Count visible major joints
  let visibleMajorJoints = 0;
  for (const idx of MAJOR_JOINTS) {
    if (landmarks[idx].visibility >= VISIBILITY_THRESHOLD) {
      visibleMajorJoints++;
    }
  }

  if (visibleMajorJoints < MAJOR_JOINTS.length * MIN_MAJOR_JOINT_RATIO) {
    return {
      status: 'incomplete',
      message: 'Make sure your full body is visible',
      bboxCoverage: 0,
      visibleMajorJoints,
    };
  }

  // Compute bounding box of visible landmarks
  let xMin = 1, xMax = 0, yMin = 1, yMax = 0;
  let visibleCount = 0;

  for (let i = 11; i < 33; i++) { // Skip face landmarks
    if (landmarks[i].visibility >= VISIBILITY_THRESHOLD) {
      xMin = Math.min(xMin, landmarks[i].x);
      xMax = Math.max(xMax, landmarks[i].x);
      yMin = Math.min(yMin, landmarks[i].y);
      yMax = Math.max(yMax, landmarks[i].y);
      visibleCount++;
    }
  }

  if (visibleCount < 3) {
    return {
      status: 'incomplete',
      message: 'Step into the frame',
      bboxCoverage: 0,
      visibleMajorJoints,
    };
  }

  const bboxCoverage = (xMax - xMin) * (yMax - yMin);

  // Check coverage
  if (bboxCoverage < MIN_BBOX_COVERAGE) {
    return {
      status: 'too_far',
      message: 'Move closer to the camera',
      bboxCoverage,
      visibleMajorJoints,
    };
  }

  if (bboxCoverage > MAX_BBOX_COVERAGE) {
    return {
      status: 'too_close',
      message: 'Step back from the camera',
      bboxCoverage,
      visibleMajorJoints,
    };
  }

  // Check centering
  const bodyCenterX = (xMin + xMax) / 2;
  const bodyCenterY = (yMin + yMax) / 2;

  if (Math.abs(bodyCenterX - 0.5) > CENTER_TOLERANCE ||
      Math.abs(bodyCenterY - 0.5) > CENTER_TOLERANCE) {
    return {
      status: 'off_center',
      message: 'Center yourself in the frame',
      bboxCoverage,
      visibleMajorJoints,
    };
  }

  return {
    status: 'good',
    message: null,
    bboxCoverage,
    visibleMajorJoints,
  };
}
