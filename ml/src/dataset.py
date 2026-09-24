"""
Dataset — Load, split, and prepare training data.

Uses all 33 MediaPipe landmarks (no MoveNet subset).
Phase 1: correct-form-only training (input = correct, target = correct).

Handles:
- Loading phase-labeled data from npz files
- Train/val/test split by video (not frame)
- Data augmentation
- Random landmark masking to simulate occlusion
"""

import json
from pathlib import Path

import numpy as np

from .normalization import (
    EXERCISE_IDS,
    LANDMARK_FLAT,
    NUM_EXERCISES,
    NUM_LANDMARKS,
    normalize_landmarks,
    prepare_model_input,
)
from .augmentation import augment_dataset

MASK_PROBABILITY = 0.15


def load_labeled_data(labeled_dir: str = "data/labeled") -> dict:
    """Load all phase-labeled npz files.

    Returns:
        Dict with keys: landmarks_33, phases, exercise_names, video_names
    """
    labeled_path = Path(labeled_dir)
    data = {
        "landmarks_33": [],
        "phases": [],
        "exercise_names": [],
        "video_names": [],
    }

    for npz_file in sorted(labeled_path.glob("*_labeled.npz")):
        loaded = np.load(npz_file)
        landmarks = loaded["landmarks"]  # (N, 33, 3)
        phases = loaded["phases"]  # (N,)

        json_file = npz_file.with_suffix("").with_suffix(".json")
        if json_file.exists():
            with open(json_file) as f:
                meta = json.load(f)
            exercise = meta["exercise"]
        else:
            exercise = npz_file.stem.split("_")[0]

        video_name = npz_file.stem.replace("_labeled", "")

        data["landmarks_33"].append(landmarks)
        data["phases"].append(phases)
        data["exercise_names"].append(exercise)
        data["video_names"].append(video_name)

    return data


def prepare_dataset(
    data: dict,
    augment: bool = True,
    mask_fraction: float = 0.3,
) -> dict:
    """Prepare full dataset from loaded labeled data.

    Phase 1 (correct-form-only): Both input and target landmarks come from
    the same correct-form video. The model learns the ideal pose manifold.
    Augmented inputs provide variation; targets remain the clean originals.

    Args:
        data: Output from load_labeled_data()
        augment: Whether to apply data augmentation
        mask_fraction: Fraction of samples to apply random landmark masking

    Returns:
        Dict with inputs, phase_targets, landmark_targets, video_indices
    """
    all_inputs = []
    all_phase_targets = []
    all_landmark_targets = []
    video_indices = []

    for vid_idx, (lm33, phases, exercise) in enumerate(zip(
        data["landmarks_33"], data["phases"], data["exercise_names"]
    )):
        exercise_id = EXERCISE_IDS.get(exercise, 0)
        n_frames = lm33.shape[0]

        for i in range(n_frames):
            # Normalize all 33 landmarks
            normalized, _, _ = normalize_landmarks(lm33[i])

            # Model input: 99 landmark coords + exercise one-hot
            model_input = prepare_model_input(normalized, exercise_id, NUM_EXERCISES)

            # Target: the same normalized correct-form landmarks (flattened)
            target_landmarks = normalized.flatten()

            all_inputs.append(model_input)
            all_phase_targets.append(phases[i])
            all_landmark_targets.append(target_landmarks)
            video_indices.append(vid_idx)

    inputs = np.array(all_inputs, dtype=np.float32)
    phase_targets = np.array(all_phase_targets, dtype=np.float32)
    landmark_targets = np.array(all_landmark_targets, dtype=np.float32)
    video_indices = np.array(video_indices, dtype=np.int32)

    if augment:
        # Extract landmark portion for augmentation
        lm_portion = inputs[:, :LANDMARK_FLAT].reshape(-1, NUM_LANDMARKS, 3)
        exercise_ids = np.argmax(inputs[:, LANDMARK_FLAT:LANDMARK_FLAT + NUM_EXERCISES], axis=1)

        aug_lm, aug_phases, aug_ex = augment_dataset(
            lm_portion, phase_targets, exercise_ids
        )

        # Rebuild inputs with augmented data
        n_aug = aug_lm.shape[0]
        input_dim = LANDMARK_FLAT + NUM_EXERCISES
        aug_inputs = np.zeros((n_aug, input_dim), dtype=np.float32)
        aug_inputs[:, :LANDMARK_FLAT] = aug_lm.reshape(n_aug, -1)
        for i in range(n_aug):
            aug_inputs[i, LANDMARK_FLAT + aug_ex[i]] = 1.0

        # For augmented samples, targets remain the ORIGINAL correct form
        n_orig = inputs.shape[0]
        aug_landmark_targets = np.zeros((n_aug, LANDMARK_FLAT), dtype=np.float32)
        aug_landmark_targets[:n_orig] = landmark_targets

        # Repeat original targets for each augmented variant
        idx = n_orig
        for i in range(n_orig):
            n_augs_per_sample = 6
            remaining = min(n_augs_per_sample, n_aug - idx)
            for _ in range(remaining):
                if idx >= n_aug:
                    break
                aug_landmark_targets[idx] = landmark_targets[i]
                idx += 1

        inputs = aug_inputs
        phase_targets = aug_phases
        landmark_targets = aug_landmark_targets

        # Extend video indices for augmented data
        n_new = n_aug - len(video_indices)
        if n_new > 0:
            extra_indices = np.zeros(n_new, dtype=np.int32)
            idx = 0
            for i in range(len(video_indices)):
                for _ in range(6):
                    if idx >= n_new:
                        break
                    extra_indices[idx] = video_indices[i]
                    idx += 1
            video_indices = np.concatenate([video_indices, extra_indices])

    # Random landmark masking on a fraction of samples
    if mask_fraction > 0:
        n_mask = int(len(inputs) * mask_fraction)
        mask_indices = np.random.choice(len(inputs), n_mask, replace=False)
        for idx in mask_indices:
            n_zero = np.random.randint(1, 4)
            zero_landmarks = np.random.choice(NUM_LANDMARKS, n_zero, replace=False)
            for lm_idx in zero_landmarks:
                start = lm_idx * 3
                inputs[idx, start:start+3] = 0.0

    return {
        "inputs": inputs,
        "phase_targets": phase_targets,
        "landmark_targets": landmark_targets,
        "video_indices": video_indices[:len(inputs)],
    }


def split_by_video(
    dataset: dict,
    train_frac: float = 0.8,
    val_frac: float = 0.1,
    seed: int = 42,
) -> tuple[dict, dict, dict]:
    """Split dataset by video (not by frame) into train/val/test."""
    rng = np.random.RandomState(seed)
    video_ids = dataset["video_indices"]
    unique_videos = np.unique(video_ids)
    rng.shuffle(unique_videos)

    n_videos = len(unique_videos)
    n_train = max(1, int(n_videos * train_frac))
    n_val = max(1, int(n_videos * val_frac))

    train_videos = set(unique_videos[:n_train])
    val_videos = set(unique_videos[n_train:n_train + n_val])
    test_videos = set(unique_videos[n_train + n_val:])

    if not test_videos and len(val_videos) > 1:
        test_videos = {val_videos.pop()}

    def select(video_set):
        mask = np.array([v in video_set for v in video_ids])
        return {
            "inputs": dataset["inputs"][mask],
            "phase_targets": dataset["phase_targets"][mask],
            "landmark_targets": dataset["landmark_targets"][mask],
        }

    return select(train_videos), select(val_videos), select(test_videos)
