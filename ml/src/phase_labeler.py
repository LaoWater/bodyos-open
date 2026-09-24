"""
Phase Labeler — Auto-detect movement cycles and label exercise phases.

Each frame gets a phase value 0.0-1.0 representing position in range of motion:
  - Cyclic (push-ups, lunges): 0.0=start, 0.5=deepest point, 1.0=back to start
  - Static (plank): ~0.5 constant with minor breathing variation

Uses key joint angles to detect cycles via peak/valley detection.
"""

import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from scipy.signal import find_peaks, savgol_filter

# MediaPipe landmark indices
L_SHOULDER, R_SHOULDER = 11, 12
L_ELBOW, R_ELBOW = 13, 14
L_WRIST, R_WRIST = 15, 16
L_HIP, R_HIP = 23, 24
L_KNEE, R_KNEE = 25, 26
L_ANKLE, R_ANKLE = 27, 28

# Exercise-specific primary angle definitions
# Each maps to (point_a, vertex, point_c) landmark indices for angle calculation
EXERCISE_ANGLES = {
    "pushup": {
        "primary": (L_SHOULDER, L_ELBOW, L_WRIST),  # Elbow angle
        "secondary": (R_SHOULDER, R_ELBOW, R_WRIST),
    },
    "lunge": {
        "primary": (L_HIP, L_KNEE, L_ANKLE),  # Front knee angle
        "secondary": (R_HIP, R_KNEE, R_ANKLE),
    },
    "plank": {
        "primary": (L_SHOULDER, L_HIP, L_ANKLE),  # Body line angle
        "secondary": (R_SHOULDER, R_HIP, R_ANKLE),
    },
}


@dataclass
class PhaseLabel:
    frame_idx: int
    phase: float  # 0.0 - 1.0
    rep_number: int  # Which rep this frame belongs to (-1 for plank)
    primary_angle: float  # The angle used for cycle detection


def compute_angle(landmarks: np.ndarray, a: int, b: int, c: int) -> float:
    """Compute angle at vertex b formed by points a-b-c, in degrees."""
    va = landmarks[a, :2] - landmarks[b, :2]
    vc = landmarks[c, :2] - landmarks[b, :2]

    dot = np.dot(va, vc)
    mag_a = np.linalg.norm(va)
    mag_c = np.linalg.norm(vc)

    if mag_a == 0 or mag_c == 0:
        return 0.0

    cos_angle = np.clip(dot / (mag_a * mag_c), -1.0, 1.0)
    return float(np.degrees(np.arccos(cos_angle)))


def compute_angle_series(
    all_landmarks: np.ndarray,
    exercise: str,
) -> np.ndarray:
    """Compute primary angle for each frame. Returns (N,) array of angles."""
    config = EXERCISE_ANGLES[exercise]
    a, b, c = config["primary"]
    n_frames = all_landmarks.shape[0]
    angles = np.zeros(n_frames, dtype=np.float32)

    for i in range(n_frames):
        angles[i] = compute_angle(all_landmarks[i], a, b, c)

    return angles


def smooth_signal(signal: np.ndarray, window: int = 7) -> np.ndarray:
    """Smooth angle signal using Savitzky-Golay filter."""
    if len(signal) < window:
        return signal
    # Ensure window is odd
    if window % 2 == 0:
        window += 1
    return savgol_filter(signal, window_length=window, polyorder=2)


def label_plank(
    all_landmarks: np.ndarray,
    angles: np.ndarray,
) -> list[PhaseLabel]:
    """Label plank frames — roughly constant phase with minor breathing variation."""
    n_frames = len(angles)
    smoothed = smooth_signal(angles, window=15)

    # Normalize angle variation to small oscillation around 0.5
    if smoothed.max() - smoothed.min() > 0.01:
        normalized = (smoothed - smoothed.min()) / (smoothed.max() - smoothed.min())
        # Map to 0.45-0.55 range (minor breathing variation)
        phases = 0.45 + normalized * 0.10
    else:
        phases = np.full(n_frames, 0.5)

    return [
        PhaseLabel(
            frame_idx=i,
            phase=float(phases[i]),
            rep_number=-1,
            primary_angle=float(angles[i]),
        )
        for i in range(n_frames)
    ]


def label_cyclic(
    all_landmarks: np.ndarray,
    angles: np.ndarray,
    exercise: str,
) -> list[PhaseLabel]:
    """Label cyclic exercise frames using peak/valley detection on angle signal."""
    n_frames = len(angles)
    smoothed = smooth_signal(angles, window=7)

    # Determine if peaks = extended (start) or peaks = contracted (deepest)
    # For push-ups: large elbow angle = arms extended (start=0.0)
    # For lunges: large knee angle = standing (start=0.0)
    # So peaks in angle = phase 0.0/1.0, valleys = phase 0.5

    # Find peaks (extended position = phase 0.0) and valleys (deepest = phase 0.5)
    # Use prominence to filter noise
    signal_range = smoothed.max() - smoothed.min()
    min_prominence = max(signal_range * 0.15, 5.0)  # At least 15% of range or 5 degrees
    min_distance = 10  # At least 10 frames between peaks

    peaks, _ = find_peaks(smoothed, prominence=min_prominence, distance=min_distance)
    valleys, _ = find_peaks(-smoothed, prominence=min_prominence, distance=min_distance)

    if len(peaks) < 1 or len(valleys) < 1:
        # Fallback: treat entire video as one rep
        print(f"  Warning: Could not detect clear cycles for {exercise}. "
              f"Peaks={len(peaks)}, Valleys={len(valleys)}. Using single-rep fallback.")
        phases = np.linspace(0, 1, n_frames)
        return [
            PhaseLabel(frame_idx=i, phase=float(phases[i]), rep_number=0,
                       primary_angle=float(angles[i]))
            for i in range(n_frames)
        ]

    # Merge peaks and valleys into ordered keypoints with phase labels
    keypoints = []
    for p in peaks:
        keypoints.append((int(p), 0.0))  # Extended = phase 0.0
    for v in valleys:
        keypoints.append((int(v), 0.5))  # Deepest = phase 0.5
    keypoints.sort(key=lambda x: x[0])

    # Interpolate phase between keypoints
    phases = np.zeros(n_frames, dtype=np.float32)

    # Before first keypoint: extrapolate from first keypoint
    if keypoints[0][0] > 0:
        phases[:keypoints[0][0]] = keypoints[0][1]

    # Between keypoints: linear interpolation accounting for cyclic wrapping
    for i in range(len(keypoints) - 1):
        start_frame, start_phase = keypoints[i]
        end_frame, end_phase = keypoints[i + 1]
        n = end_frame - start_frame

        if n <= 0:
            continue

        # Handle phase wrapping (0.0 -> 0.5 is forward, 0.5 -> 1.0/0.0 is return)
        if start_phase == 0.0 and end_phase == 0.5:
            # Going down: 0.0 -> 0.5
            interp = np.linspace(start_phase, end_phase, n, endpoint=False)
        elif start_phase == 0.5 and end_phase == 0.0:
            # Coming back up: 0.5 -> 1.0
            interp = np.linspace(0.5, 1.0, n, endpoint=False)
        else:
            # General case
            interp = np.linspace(start_phase, end_phase, n, endpoint=False)

        phases[start_frame:end_frame] = interp

    # After last keypoint: extrapolate
    last_frame, last_phase = keypoints[-1]
    if last_frame < n_frames:
        phases[last_frame:] = last_phase

    # Assign rep numbers based on phase 0.0 crossings
    rep_numbers = np.zeros(n_frames, dtype=int)
    current_rep = 0
    for i in range(1, n_frames):
        # New rep starts when phase wraps from near 1.0 back to near 0.0
        if phases[i] < 0.1 and phases[i - 1] > 0.9:
            current_rep += 1
        rep_numbers[i] = current_rep

    return [
        PhaseLabel(
            frame_idx=i,
            phase=float(phases[i] % 1.0),
            rep_number=int(rep_numbers[i]),
            primary_angle=float(angles[i]),
        )
        for i in range(n_frames)
    ]


def label_video(
    all_landmarks: np.ndarray,
    exercise: str,
) -> list[PhaseLabel]:
    """Label all frames in a video with exercise phase."""
    if exercise not in EXERCISE_ANGLES:
        raise ValueError(f"Unknown exercise: {exercise}. Expected one of {list(EXERCISE_ANGLES.keys())}")

    angles = compute_angle_series(all_landmarks, exercise)

    if exercise == "plank":
        return label_plank(all_landmarks, angles)
    else:
        return label_cyclic(all_landmarks, angles, exercise)


def save_labels(
    labels: list[PhaseLabel],
    all_landmarks: np.ndarray,
    exercise: str,
    video_name: str,
    output_dir: str = "data/labeled",
) -> dict[str, str]:
    """Save phase-labeled data as npz + JSON."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    phases = np.array([l.phase for l in labels], dtype=np.float32)
    rep_numbers = np.array([l.rep_number for l in labels], dtype=np.int32)
    primary_angles = np.array([l.primary_angle for l in labels], dtype=np.float32)

    # Save arrays
    npz_path = str(Path(output_dir) / f"{video_name}_labeled.npz")
    np.savez_compressed(
        npz_path,
        landmarks=all_landmarks,
        phases=phases,
        rep_numbers=rep_numbers,
        primary_angles=primary_angles,
    )

    # Save metadata
    n_reps = int(rep_numbers.max()) + 1 if len(rep_numbers) > 0 else 0
    metadata = {
        "video_name": video_name,
        "exercise": exercise,
        "total_frames": len(labels),
        "total_reps": n_reps if exercise != "plank" else 0,
        "phase_range": [float(phases.min()), float(phases.max())],
        "angle_range": [float(primary_angles.min()), float(primary_angles.max())],
    }

    json_path = str(Path(output_dir) / f"{video_name}_labeled.json")
    with open(json_path, "w") as f:
        json.dump(metadata, f, indent=2)

    return {"npz": npz_path, "json": json_path}
