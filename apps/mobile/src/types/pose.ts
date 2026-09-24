export interface PoseLandmark {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  z: number; // depth estimate
  visibility: number; // 0-1 confidence
}

export interface PoseResult {
  landmarks: PoseLandmark[];
  timestamp: number;
}

export enum LandmarkIndex {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
  LEFT_HEEL = 29,
  RIGHT_HEEL = 30,
  LEFT_FOOT_INDEX = 31,
  RIGHT_FOOT_INDEX = 32,
}

// Bone connections between landmarks (skip face: start from shoulders)
export const POSE_CONNECTIONS: [LandmarkIndex, LandmarkIndex][] = [
  // Torso
  [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.RIGHT_SHOULDER],
  [LandmarkIndex.LEFT_HIP, LandmarkIndex.RIGHT_HIP],
  [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_HIP],
  [LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_HIP],
  // Left arm
  [LandmarkIndex.LEFT_SHOULDER, LandmarkIndex.LEFT_ELBOW],
  [LandmarkIndex.LEFT_ELBOW, LandmarkIndex.LEFT_WRIST],
  // Right arm
  [LandmarkIndex.RIGHT_SHOULDER, LandmarkIndex.RIGHT_ELBOW],
  [LandmarkIndex.RIGHT_ELBOW, LandmarkIndex.RIGHT_WRIST],
  // Left leg
  [LandmarkIndex.LEFT_HIP, LandmarkIndex.LEFT_KNEE],
  [LandmarkIndex.LEFT_KNEE, LandmarkIndex.LEFT_ANKLE],
  [LandmarkIndex.LEFT_ANKLE, LandmarkIndex.LEFT_HEEL],
  [LandmarkIndex.LEFT_ANKLE, LandmarkIndex.LEFT_FOOT_INDEX],
  // Right leg
  [LandmarkIndex.RIGHT_HIP, LandmarkIndex.RIGHT_KNEE],
  [LandmarkIndex.RIGHT_KNEE, LandmarkIndex.RIGHT_ANKLE],
  [LandmarkIndex.RIGHT_ANKLE, LandmarkIndex.RIGHT_HEEL],
  [LandmarkIndex.RIGHT_ANKLE, LandmarkIndex.RIGHT_FOOT_INDEX],
];

/**
 * MoveNet outputs 17 keypoints. This maps each MoveNet index
 * to the corresponding MediaPipe LandmarkIndex (33 total).
 * Unmapped MediaPipe landmarks (fingers, face details, heels, foot indices)
 * will be set to visibility 0.
 *
 * MoveNet keypoint order:
 * 0: nose, 1: left_eye, 2: right_eye, 3: left_ear, 4: right_ear,
 * 5: left_shoulder, 6: right_shoulder, 7: left_elbow, 8: right_elbow,
 * 9: left_wrist, 10: right_wrist, 11: left_hip, 12: right_hip,
 * 13: left_knee, 14: right_knee, 15: left_ankle, 16: right_ankle
 */
export const MOVENET_TO_MEDIAPIPE: Record<number, LandmarkIndex> = {
  0: LandmarkIndex.NOSE,
  1: LandmarkIndex.LEFT_EYE,
  2: LandmarkIndex.RIGHT_EYE,
  3: LandmarkIndex.LEFT_EAR,
  4: LandmarkIndex.RIGHT_EAR,
  5: LandmarkIndex.LEFT_SHOULDER,
  6: LandmarkIndex.RIGHT_SHOULDER,
  7: LandmarkIndex.LEFT_ELBOW,
  8: LandmarkIndex.RIGHT_ELBOW,
  9: LandmarkIndex.LEFT_WRIST,
  10: LandmarkIndex.RIGHT_WRIST,
  11: LandmarkIndex.LEFT_HIP,
  12: LandmarkIndex.RIGHT_HIP,
  13: LandmarkIndex.LEFT_KNEE,
  14: LandmarkIndex.RIGHT_KNEE,
  15: LandmarkIndex.LEFT_ANKLE,
  16: LandmarkIndex.RIGHT_ANKLE,
};

export const MOVENET_KEYPOINT_COUNT = 17;
export const MEDIAPIPE_LANDMARK_COUNT = 33;

export type FormQuality = 'good' | 'warning' | 'bad';

export interface FormFeedback {
  score: number; // 0-100
  jointQualities: Map<LandmarkIndex, FormQuality>;
  tips: string[];
}
