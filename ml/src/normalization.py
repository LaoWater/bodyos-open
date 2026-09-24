"""
Pose Normalization — Hip-centered, torso-scaled landmark normalization.

Uses all 33 MediaPipe landmarks (no MoveNet subset).

Critical: This implementation must be replicated identically in TypeScript
(src/utils/poseNormalization.ts) for on-device inference consistency.
"""

import numpy as np

# MediaPipe 33-landmark indices for hip center and shoulder center
L_HIP = 23
R_HIP = 24
L_SHOULDER = 11
R_SHOULDER = 12

NUM_LANDMARKS = 33
LANDMARK_DIM = 3  # x, y, z
LANDMARK_FLAT = NUM_LANDMARKS * LANDMARK_DIM  # 99

# Minimum torso scale to avoid division by zero
MIN_TORSO_SCALE = 0.01

# Exercise name to ID mapping — expand as exercises are added
EXERCISE_IDS = {"pushup": 0, "lunge": 1}
NUM_EXERCISES = len(EXERCISE_IDS)

# Total model input size: 99 landmarks + NUM_EXERCISES one-hot
INPUT_DIM = LANDMARK_FLAT + NUM_EXERCISES  # 101 currently


def compute_hip_center(landmarks_33: np.ndarray) -> np.ndarray:
    """Compute hip center as midpoint of left and right hip.

    Args:
        landmarks_33: (33, 3) MediaPipe landmarks

    Returns:
        (3,) hip center coordinates
    """
    return (landmarks_33[L_HIP] + landmarks_33[R_HIP]) / 2.0


def compute_torso_scale(landmarks_33: np.ndarray) -> float:
    """Compute torso scale as distance from hip center to shoulder center.

    Args:
        landmarks_33: (33, 3) MediaPipe landmarks

    Returns:
        Scalar torso scale value (clipped to MIN_TORSO_SCALE)
    """
    hip_center = compute_hip_center(landmarks_33)
    shoulder_center = (landmarks_33[L_SHOULDER] + landmarks_33[R_SHOULDER]) / 2.0
    scale = float(np.linalg.norm(shoulder_center - hip_center))
    return max(scale, MIN_TORSO_SCALE)


def normalize_landmarks(landmarks_33: np.ndarray) -> tuple[np.ndarray, np.ndarray, float]:
    """Normalize 33 MediaPipe landmarks: center on hips, scale by torso length.

    Args:
        landmarks_33: (33, 3) MediaPipe landmarks

    Returns:
        Tuple of (normalized_landmarks (33, 3), hip_center (3,), torso_scale (float))
    """
    hip_center = compute_hip_center(landmarks_33)
    torso_scale = compute_torso_scale(landmarks_33)
    normalized = (landmarks_33 - hip_center) / torso_scale
    return normalized, hip_center, torso_scale


def denormalize_landmarks(
    normalized: np.ndarray,
    hip_center: np.ndarray,
    torso_scale: float,
) -> np.ndarray:
    """Reverse normalization using the user's own body parameters.

    Args:
        normalized: (33, 3) normalized landmarks
        hip_center: (3,) original hip center
        torso_scale: original torso scale

    Returns:
        (33, 3) denormalized landmarks in original coordinate space
    """
    return normalized * torso_scale + hip_center


def normalize_batch(landmarks_batch: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Normalize a batch of landmark frames.

    Args:
        landmarks_batch: (N, 33, 3) batch of MediaPipe landmarks

    Returns:
        Tuple of (normalized (N, 33, 3), hip_centers (N, 3), torso_scales (N,))
    """
    n = landmarks_batch.shape[0]
    normalized = np.zeros_like(landmarks_batch)
    hip_centers = np.zeros((n, 3), dtype=np.float32)
    torso_scales = np.zeros(n, dtype=np.float32)

    for i in range(n):
        normalized[i], hip_centers[i], torso_scales[i] = normalize_landmarks(landmarks_batch[i])

    return normalized, hip_centers, torso_scales


def prepare_model_input(
    normalized_33: np.ndarray,
    exercise_id: int,
    num_exercises: int = NUM_EXERCISES,
) -> np.ndarray:
    """Prepare flattened model input: 33*3 landmark coords + exercise one-hot.

    Args:
        normalized_33: (33, 3) normalized landmarks
        exercise_id: exercise index from EXERCISE_IDS
        num_exercises: total number of exercise classes

    Returns:
        (99 + num_exercises,) flattened input vector
    """
    flat = normalized_33.flatten()  # (99,)
    one_hot = np.zeros(num_exercises, dtype=np.float32)
    one_hot[exercise_id] = 1.0
    return np.concatenate([flat, one_hot])
