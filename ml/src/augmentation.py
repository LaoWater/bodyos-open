"""
Data Augmentation — Expand training data with realistic pose variations.

Uses all 33 MediaPipe landmarks.

Augmentations:
- Horizontal mirror (swap L/R landmark pairs)
- Gaussian noise (sigma=0.005-0.01)
- Slight rotation (+/-5 degrees)
- Body proportion scaling (+/-10% per limb segment)

Phase labels carry through unchanged — they describe exercise position, not body shape.
"""

import numpy as np

# MediaPipe 33-landmark left/right swap pairs
LR_SWAP_PAIRS = [
    (1, 4),    # l_eye_inner <-> r_eye_inner
    (2, 5),    # l_eye <-> r_eye
    (3, 6),    # l_eye_outer <-> r_eye_outer
    (7, 8),    # l_ear <-> r_ear
    (9, 10),   # l_mouth <-> r_mouth
    (11, 12),  # l_shoulder <-> r_shoulder
    (13, 14),  # l_elbow <-> r_elbow
    (15, 16),  # l_wrist <-> r_wrist
    (17, 18),  # l_pinky <-> r_pinky
    (19, 20),  # l_index <-> r_index
    (21, 22),  # l_thumb <-> r_thumb
    (23, 24),  # l_hip <-> r_hip
    (25, 26),  # l_knee <-> r_knee
    (27, 28),  # l_ankle <-> r_ankle
    (29, 30),  # l_heel <-> r_heel
    (31, 32),  # l_foot_index <-> r_foot_index
]

# Limb segments for body proportion scaling (parent_idx, child_idx)
LIMB_SEGMENTS = [
    (11, 13),  # l_shoulder -> l_elbow (upper arm)
    (13, 15),  # l_elbow -> l_wrist (forearm)
    (12, 14),  # r_shoulder -> r_elbow
    (14, 16),  # r_elbow -> r_wrist
    (23, 25),  # l_hip -> l_knee (thigh)
    (25, 27),  # l_knee -> l_ankle (shin)
    (24, 26),  # r_hip -> r_knee
    (26, 28),  # r_knee -> r_ankle
]

# Downstream joints affected by scaling each segment
DOWNSTREAM_MAP = {
    11: [13, 15, 17, 19, 21],
    13: [15, 17, 19, 21],
    12: [14, 16, 18, 20, 22],
    14: [16, 18, 20, 22],
    23: [25, 27, 29, 31],
    25: [27, 29, 31],
    24: [26, 28, 30, 32],
    26: [28, 30, 32],
}


def mirror_horizontal(landmarks_33: np.ndarray) -> np.ndarray:
    """Mirror pose horizontally by flipping x-coordinates and swapping L/R pairs."""
    mirrored = landmarks_33.copy()
    mirrored[:, 0] = -mirrored[:, 0]

    for l, r in LR_SWAP_PAIRS:
        mirrored[l], mirrored[r] = mirrored[r].copy(), mirrored[l].copy()

    return mirrored


def add_noise(landmarks_33: np.ndarray, sigma: float = 0.008) -> np.ndarray:
    """Add small Gaussian noise to landmarks."""
    noise = np.random.normal(0, sigma, landmarks_33.shape).astype(np.float32)
    return landmarks_33 + noise


def rotate_2d(landmarks_33: np.ndarray, max_angle_deg: float = 5.0) -> np.ndarray:
    """Apply small random 2D rotation around the hip center (origin in normalized space)."""
    angle = np.random.uniform(-max_angle_deg, max_angle_deg)
    rad = np.radians(angle)
    cos_a, sin_a = np.cos(rad), np.sin(rad)

    rotated = landmarks_33.copy()
    x = landmarks_33[:, 0]
    y = landmarks_33[:, 1]
    rotated[:, 0] = x * cos_a - y * sin_a
    rotated[:, 1] = x * sin_a + y * cos_a

    return rotated


def scale_limb_proportions(
    landmarks_33: np.ndarray,
    max_scale_pct: float = 0.10,
) -> np.ndarray:
    """Scale individual limb segment lengths to simulate different body proportions."""
    result = landmarks_33.copy()

    for parent, child in LIMB_SEGMENTS:
        scale = 1.0 + np.random.uniform(-max_scale_pct, max_scale_pct)

        direction = result[child] - result[parent]
        original_length = np.linalg.norm(direction)

        if original_length < 1e-6:
            continue

        new_direction = direction * scale
        displacement = new_direction - direction

        downstream = DOWNSTREAM_MAP.get(parent, [])
        for joint in downstream:
            if joint >= child:
                result[joint] += displacement

    return result


def augment_sample(
    landmarks_33: np.ndarray,
    apply_mirror: bool = True,
    apply_noise: bool = True,
    apply_rotation: bool = True,
    apply_proportion: bool = True,
    noise_sigma: float = 0.008,
    rotation_max_deg: float = 5.0,
    proportion_max_pct: float = 0.10,
) -> list[np.ndarray]:
    """Generate augmented versions of a single landmark sample (~6 variants)."""
    augmented = []

    if apply_mirror:
        augmented.append(mirror_horizontal(landmarks_33))

    if apply_noise:
        augmented.append(add_noise(landmarks_33, noise_sigma))

    if apply_rotation:
        augmented.append(rotate_2d(landmarks_33, rotation_max_deg))

    if apply_proportion:
        augmented.append(scale_limb_proportions(landmarks_33, proportion_max_pct))

    if apply_noise and apply_rotation and apply_proportion:
        combined = add_noise(landmarks_33, noise_sigma)
        combined = rotate_2d(combined, rotation_max_deg)
        combined = scale_limb_proportions(combined, proportion_max_pct)
        augmented.append(combined)

    if apply_mirror and apply_noise and apply_proportion:
        mirrored = mirror_horizontal(landmarks_33)
        combined = add_noise(mirrored, noise_sigma)
        combined = scale_limb_proportions(combined, proportion_max_pct)
        augmented.append(combined)

    return augmented


def augment_dataset(
    landmarks: np.ndarray,
    phases: np.ndarray,
    exercise_ids: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Augment an entire dataset. Includes originals + ~6 augmented per sample."""
    all_landmarks = [landmarks]
    all_phases = [phases]
    all_exercise_ids = [exercise_ids]

    for i in range(len(landmarks)):
        aug_samples = augment_sample(landmarks[i])
        for aug in aug_samples:
            all_landmarks.append(aug[np.newaxis])
            all_phases.append(phases[i:i+1])
            all_exercise_ids.append(exercise_ids[i:i+1])

    return (
        np.concatenate(all_landmarks, axis=0),
        np.concatenate(all_phases, axis=0),
        np.concatenate(all_exercise_ids, axis=0),
    )
