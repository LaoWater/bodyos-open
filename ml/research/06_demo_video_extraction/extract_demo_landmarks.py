"""
Demo Video Landmark Extraction - Multi-Model Comparison
========================================================
Extracts pose landmarks from demo videos using multiple models:
- MediaPipe PoseLandmarker (Lite/Full/Heavy) via Tasks API
- MoveNet Lightning & Thunder (optional, requires TensorFlow)

Uses MediaPipe Tasks API (2024+).

Outputs landmarks in formats ready for comparison and keyframe generation.

Usage:
    python extract_demo_landmarks.py [--video pushup|all]
"""

import argparse
import json
import os
import time
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision as mp_vision
from tqdm import tqdm

# TensorFlow for MoveNet
try:
    import tensorflow as tf
    import tensorflow_hub as hub
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("TensorFlow not available. MoveNet models will be skipped.")

# ─── Constants ────────────────────────────────────────────────────────────────

DEMO_VIDEOS_DIR = Path(__file__).parent.parent / "data" / "portrait"
OUTPUT_DIR = Path(__file__).parent / "results"
MODEL_DIR = Path(__file__).parent / "models"

# MediaPipe 33 landmark names
MEDIAPIPE_LANDMARKS = [
    "nose", "left_eye_inner", "left_eye", "left_eye_outer",
    "right_eye_inner", "right_eye", "right_eye_outer",
    "left_ear", "right_ear", "mouth_left", "mouth_right",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_pinky", "right_pinky",
    "left_index", "right_index", "left_thumb", "right_thumb",
    "left_hip", "right_hip", "left_knee", "right_knee",
    "left_ankle", "right_ankle", "left_heel", "right_heel",
    "left_foot_index", "right_foot_index"
]

# MoveNet 17 landmark names
MOVENET_LANDMARKS = [
    "nose", "left_eye", "right_eye", "left_ear", "right_ear",
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle"
]

# Mapping MoveNet indices to MediaPipe indices (for comparison)
MOVENET_TO_MEDIAPIPE = {
    0: 0,    # nose
    1: 2,    # left_eye
    2: 5,    # right_eye
    3: 7,    # left_ear
    4: 8,    # right_ear
    5: 11,   # left_shoulder
    6: 12,   # right_shoulder
    7: 13,   # left_elbow
    8: 14,   # right_elbow
    9: 15,   # left_wrist
    10: 16,  # right_wrist
    11: 23,  # left_hip
    12: 24,  # right_hip
    13: 25,  # left_knee
    14: 26,  # right_knee
    15: 27,  # left_ankle
    16: 28,  # right_ankle
}

# ─── Model Setup ─────────────────────────────────────────────────────────────

MEDIAPIPE_MODEL_URLS = {
    "lite": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    "full": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
    "heavy": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task",
}


def download_model(variant: str) -> Path:
    """Download MediaPipe Task model if not present."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODEL_DIR / f"pose_landmarker_{variant}.task"
    if not model_path.exists():
        print(f"  Downloading pose_landmarker_{variant}...")
        urllib.request.urlretrieve(MEDIAPIPE_MODEL_URLS[variant], model_path)
        print(f"  Saved to {model_path}")
    return model_path


@dataclass
class ExtractionResult:
    """Result from extracting landmarks from a video."""
    model_name: str
    video_name: str
    fps: float
    frame_count: int
    frame_width: int
    frame_height: int
    landmarks: np.ndarray      # (N, num_joints, 3) - x, y, z
    visibility: np.ndarray     # (N, num_joints)
    inference_times: list      # ms per frame
    landmark_names: list[str]

    @property
    def avg_inference_ms(self) -> float:
        return float(np.mean(self.inference_times)) if self.inference_times else 0.0

    @property
    def avg_visibility(self) -> float:
        return float(np.mean(self.visibility[self.visibility > 0]))

    @property
    def detection_rate(self) -> float:
        # Frame has detection if at least 5 joints have visibility > 0.3
        detected = np.sum(self.visibility > 0.3, axis=1) >= 5
        return float(np.mean(detected))


# ─── MediaPipe Tasks API ─────────────────────────────────────────────────────

def extract_mediapipe_tasks(
    frames: list[np.ndarray],
    model_variant: Literal["lite", "full", "heavy"] = "heavy",
) -> tuple[np.ndarray, np.ndarray, list]:
    """Extract landmarks using MediaPipe Tasks API."""
    model_path = download_model(model_variant)

    base_options = mp_tasks.BaseOptions(model_asset_path=str(model_path))
    options = mp_vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=mp_vision.RunningMode.IMAGE,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
        output_segmentation_masks=False,
    )

    landmarks_list = []
    visibility_list = []
    times = []

    with mp_vision.PoseLandmarker.create_from_options(options) as landmarker:
        for frame in tqdm(frames, desc=f"  mediapipe_{model_variant}"):
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)

            start = time.perf_counter()
            result = landmarker.detect(mp_image)
            times.append((time.perf_counter() - start) * 1000)

            if not result.pose_landmarks or len(result.pose_landmarks) == 0:
                landmarks_list.append(np.zeros((33, 3), dtype=np.float32))
                visibility_list.append(np.zeros(33, dtype=np.float32))
            else:
                lm = result.pose_landmarks[0]
                landmarks_list.append(np.array(
                    [[l.x, l.y, l.z] for l in lm], dtype=np.float32
                ))
                visibility_list.append(np.array(
                    [l.visibility for l in lm], dtype=np.float32
                ))

    return np.stack(landmarks_list), np.stack(visibility_list), times


# ─── MoveNet ──────────────────────────────────────────────────────────────────

def load_movenet_model(variant: Literal["lightning", "thunder"] = "lightning"):
    """Load MoveNet model from TF Hub."""
    if not TF_AVAILABLE:
        raise RuntimeError("TensorFlow not available")

    urls = {
        "lightning": "https://tfhub.dev/google/movenet/singlepose/lightning/4",
        "thunder": "https://tfhub.dev/google/movenet/singlepose/thunder/4",
    }
    input_sizes = {"lightning": 192, "thunder": 256}

    print(f"  Loading MoveNet {variant} from TF Hub...")
    model = hub.load(urls[variant])
    movenet = model.signatures["serving_default"]

    return movenet, input_sizes[variant]


def extract_movenet(
    frames: list[np.ndarray],
    variant: Literal["lightning", "thunder"] = "lightning",
) -> tuple[np.ndarray, np.ndarray, list]:
    """Extract landmarks using MoveNet."""
    movenet, input_size = load_movenet_model(variant)

    landmarks_list = []
    visibility_list = []
    times = []

    for frame in tqdm(frames, desc=f"  movenet_{variant}"):
        input_image = tf.image.resize_with_pad(
            tf.expand_dims(frame, axis=0),
            input_size, input_size
        )
        input_image = tf.cast(input_image, dtype=tf.int32)

        start = time.perf_counter()
        outputs = movenet(input_image)
        times.append((time.perf_counter() - start) * 1000)

        # Output shape: (1, 1, 17, 3) - y, x, confidence
        keypoints = outputs["output_0"].numpy()[0, 0]

        landmarks_list.append(np.array(
            [[kp[1], kp[0], 0.0] for kp in keypoints],  # x, y, z=0
            dtype=np.float32
        ))
        visibility_list.append(np.array(
            [kp[2] for kp in keypoints], dtype=np.float32
        ))

    return np.stack(landmarks_list), np.stack(visibility_list), times


# ─── Video Loading ────────────────────────────────────────────────────────────

def load_video_frames(video_path: Path) -> tuple[list[np.ndarray], float, int, int]:
    """Load all frames from a video as RGB numpy arrays."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

    cap.release()
    return frames, fps, width, height


# ─── Main Extraction Pipeline ─────────────────────────────────────────────────

def extract_all_models(video_path: Path) -> list[ExtractionResult]:
    """Extract landmarks using all available models."""
    print(f"\n{'='*70}")
    print(f"Processing: {video_path.name}")
    print(f"{'='*70}")

    frames, fps, width, height = load_video_frames(video_path)
    print(f"  Loaded {len(frames)} frames @ {fps:.1f} FPS ({width}x{height})")

    results = []
    video_name = video_path.stem.lower()

    # 1. MediaPipe Tasks - Lite
    print("\n[1/5] MediaPipe PoseLandmarker - Lite")
    try:
        lm, vis, times = extract_mediapipe_tasks(frames, model_variant="lite")
        results.append(ExtractionResult(
            model_name="mediapipe_lite",
            video_name=video_name,
            fps=fps, frame_count=len(frames), frame_width=width, frame_height=height,
            landmarks=lm, visibility=vis, inference_times=times,
            landmark_names=MEDIAPIPE_LANDMARKS,
        ))
    except Exception as e:
        print(f"  Failed: {e}")

    # 2. MediaPipe Tasks - Full
    print("\n[2/5] MediaPipe PoseLandmarker - Full")
    try:
        lm, vis, times = extract_mediapipe_tasks(frames, model_variant="full")
        results.append(ExtractionResult(
            model_name="mediapipe_full",
            video_name=video_name,
            fps=fps, frame_count=len(frames), frame_width=width, frame_height=height,
            landmarks=lm, visibility=vis, inference_times=times,
            landmark_names=MEDIAPIPE_LANDMARKS,
        ))
    except Exception as e:
        print(f"  Failed: {e}")

    # 3. MediaPipe Tasks - Heavy
    print("\n[3/5] MediaPipe PoseLandmarker - Heavy")
    try:
        lm, vis, times = extract_mediapipe_tasks(frames, model_variant="heavy")
        results.append(ExtractionResult(
            model_name="mediapipe_heavy",
            video_name=video_name,
            fps=fps, frame_count=len(frames), frame_width=width, frame_height=height,
            landmarks=lm, visibility=vis, inference_times=times,
            landmark_names=MEDIAPIPE_LANDMARKS,
        ))
    except Exception as e:
        print(f"  Failed: {e}")

    # 4. MoveNet Lightning
    if TF_AVAILABLE:
        print("\n[4/5] MoveNet Lightning")
        try:
            lm, vis, times = extract_movenet(frames, variant="lightning")
            results.append(ExtractionResult(
                model_name="movenet_lightning",
                video_name=video_name,
                fps=fps, frame_count=len(frames), frame_width=width, frame_height=height,
                landmarks=lm, visibility=vis, inference_times=times,
                landmark_names=MOVENET_LANDMARKS,
            ))
        except Exception as e:
            print(f"  Failed: {e}")
    else:
        print("\n[4/5] MoveNet Lightning - Skipped (TensorFlow not available)")

    # 5. MoveNet Thunder
    if TF_AVAILABLE:
        print("\n[5/5] MoveNet Thunder")
        try:
            lm, vis, times = extract_movenet(frames, variant="thunder")
            results.append(ExtractionResult(
                model_name="movenet_thunder",
                video_name=video_name,
                fps=fps, frame_count=len(frames), frame_width=width, frame_height=height,
                landmarks=lm, visibility=vis, inference_times=times,
                landmark_names=MOVENET_LANDMARKS,
            ))
        except Exception as e:
            print(f"  Failed: {e}")
    else:
        print("\n[5/5] MoveNet Thunder - Skipped (TensorFlow not available)")

    return results


def save_results(results: list[ExtractionResult], output_dir: Path):
    """Save extraction results."""
    output_dir.mkdir(parents=True, exist_ok=True)

    for r in results:
        npz_path = output_dir / f"{r.video_name}_{r.model_name}.npz"
        np.savez_compressed(
            npz_path,
            landmarks=r.landmarks,
            visibility=r.visibility,
            inference_times=np.array(r.inference_times),
        )

        meta = {
            "model_name": r.model_name,
            "video_name": r.video_name,
            "fps": r.fps,
            "frame_count": r.frame_count,
            "frame_width": r.frame_width,
            "frame_height": r.frame_height,
            "avg_inference_ms": r.avg_inference_ms,
            "avg_visibility": r.avg_visibility,
            "detection_rate": r.detection_rate,
            "landmark_names": r.landmark_names,
        }
        json_path = output_dir / f"{r.video_name}_{r.model_name}.json"
        with open(json_path, "w") as f:
            json.dump(meta, f, indent=2)

    print(f"\nSaved {len(results)} extraction results to {output_dir}")


def print_comparison(results: list[ExtractionResult]):
    """Print comparison table."""
    print(f"\n{'='*80}")
    print("MODEL COMPARISON")
    print(f"{'='*80}")
    print(f"{'Model':<25} {'Detection':<12} {'Avg Vis':<10} {'Inference':<12} {'Joints':<8}")
    print("-" * 80)

    for r in sorted(results, key=lambda x: -x.detection_rate):
        print(
            f"{r.model_name:<25} "
            f"{r.detection_rate:>10.1%}  "
            f"{r.avg_visibility:>8.3f}  "
            f"{r.avg_inference_ms:>10.1f}ms "
            f"{len(r.landmark_names):>6}"
        )


def main():
    parser = argparse.ArgumentParser(description="Extract landmarks from demo videos")
    parser.add_argument(
        "--video", type=str, default="all",
        help="Which video to process (filename stem, or 'all')"
    )
    args = parser.parse_args()

    # Find videos
    videos = []
    if args.video == "all":
        videos = (
            list(DEMO_VIDEOS_DIR.glob("*.mov")) +
            list(DEMO_VIDEOS_DIR.glob("*.MOV")) +
            list(DEMO_VIDEOS_DIR.glob("*.mp4")) +
            list(DEMO_VIDEOS_DIR.glob("*.MP4"))
        )
    else:
        for ext in [".mov", ".MOV", ".mp4", ".MP4"]:
            candidate = DEMO_VIDEOS_DIR / f"{args.video}{ext}"
            if candidate.exists():
                videos.append(candidate)
                break

    if not videos:
        print(f"No videos found in {DEMO_VIDEOS_DIR}")
        return

    print(f"Found {len(videos)} video(s): {[v.name for v in videos]}")

    all_results = []
    for video_path in videos:
        results = extract_all_models(video_path)
        all_results.extend(results)
        print_comparison(results)
        save_results(results, OUTPUT_DIR / video_path.stem.lower())

    print(f"\n{'='*80}")
    print("DONE! Next steps:")
    print("  1. Review results in ml/research/06_demo_video_extraction/results/")
    print("  2. Run: python generate_keyframes.py --model mediapipe_heavy")
    print("  3. Copy generated keyframes to src/data/demoExercises.ts")
    print(f"{'='*80}")


if __name__ == "__main__":
    main()
