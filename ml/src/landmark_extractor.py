"""
Landmark Extractor — MediaPipe PoseLandmarker (Tasks API, 2024+).
Extracts 33 landmarks per frame from exercise videos.
Supports .mov, .mp4, and other common formats.
Outputs JSON + numpy .npz files.

Uses the Tasks API (mediapipe.tasks.python.vision.PoseLandmarker),
NOT the deprecated Solutions API (mp.solutions.pose).
"""

import json
import os
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision
from tqdm import tqdm

# ─── Model Downloads ──────────────────────────────────────────────────────────

MODEL_DIR = Path(__file__).parent.parent / "models" / "mediapipe"

POSE_MODELS = {
    "lite": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    "full": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
    "heavy": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task",
}


def download_model(variant: str = "heavy") -> Path:
    """Download pose landmarker .task file if not present."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODEL_DIR / f"pose_landmarker_{variant}.task"
    if not model_path.exists():
        print(f"Downloading pose_landmarker_{variant}.task ...")
        urllib.request.urlretrieve(POSE_MODELS[variant], model_path)
        print(f"Saved to {model_path}")
    return model_path


# ─── Frame Quality ───────────────────────────────────────────────────────────
# Simple quality check: did MediaPipe detect a pose with enough visible joints?
# "usable" = pose detected, major joints visible  →  used for training
# "no_pose" = no detection at all  →  skipped

MIN_MAJOR_VISIBILITY = 0.5          # per-joint confidence threshold
MIN_MAJOR_RATIO = 0.6               # fraction of major joints that must be visible

# Major joints = shoulders, elbows, wrists, hips, knees, ankles
MAJOR_JOINT_INDICES = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]

VIDEO_EXTENSIONS = {".mov", ".mp4", ".avi", ".mkv"}

# Prefer native formats — if both .mov and .mp4 exist for same stem, keep .mov
PREFERRED_EXTENSIONS = [".mov", ".mp4", ".avi", ".mkv"]

FrameQuality = Literal["usable", "no_pose"]


@dataclass
class FrameResult:
    frame_idx: int
    landmarks: np.ndarray     # (33, 3) — x, y, z normalized
    visibility: np.ndarray    # (33,) — confidence per landmark
    quality: FrameQuality
    avg_visibility: float


@dataclass
class VideoResult:
    video_path: str
    exercise: str
    fps: float
    frame_count: int
    frame_width: int
    frame_height: int
    frames: list[FrameResult] = field(default_factory=list)


def assess_frame_quality(
    landmarks: np.ndarray | None,
    visibility: np.ndarray | None,
) -> tuple[FrameQuality, float]:
    """Check if a frame has a usable pose detection.

    Returns:
        (quality, avg_visibility) — "usable" if enough major joints are
        confidently detected, "no_pose" otherwise.
    """
    if landmarks is None or visibility is None:
        return "no_pose", 0.0

    major_vis = visibility[MAJOR_JOINT_INDICES]
    visible_count = (major_vis >= MIN_MAJOR_VISIBILITY).sum()
    total_major = len(MAJOR_JOINT_INDICES)
    avg_vis = float(visibility.mean())

    if visible_count < total_major * MIN_MAJOR_RATIO:
        return "no_pose", avg_vis

    return "usable", avg_vis


# ─── Core Extraction ─────────────────────────────────────────────────────────

def extract_video(
    video_path: str,
    exercise: str,
    model_variant: str = "heavy",
) -> VideoResult:
    """Extract 33 landmarks from a video using MediaPipe PoseLandmarker (Tasks API).

    Args:
        video_path: Path to .mov or .mp4 file
        exercise: Exercise name (e.g. "pushup", "lunge")
        model_variant: "lite", "full", or "heavy"
    """
    model_path = download_model(model_variant)

    base_options = mp_tasks.BaseOptions(model_asset_path=str(model_path))
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        min_pose_detection_confidence=0.5,
        min_tracking_confidence=0.5,
        num_poses=1,
    )

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    result = VideoResult(
        video_path=video_path,
        exercise=exercise,
        fps=fps,
        frame_count=frame_count,
        frame_width=frame_width,
        frame_height=frame_height,
    )

    timestamp_ms = 0
    frame_interval_ms = int(1000 / fps)

    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        for frame_idx in tqdm(range(frame_count), desc=f"Processing {Path(video_path).name}"):
            ret, frame = cap.read()
            if not ret:
                break

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            timestamp_ms += frame_interval_ms

            detection = landmarker.detect_for_video(mp_image, timestamp_ms)

            if detection.pose_landmarks and len(detection.pose_landmarks) > 0:
                lm_list = detection.pose_landmarks[0]  # First (only) person
                landmarks = np.array(
                    [[lm.x, lm.y, lm.z] for lm in lm_list],
                    dtype=np.float32,
                )
                visibility = np.array(
                    [lm.visibility for lm in lm_list],
                    dtype=np.float32,
                )
            else:
                landmarks = None
                visibility = None

            quality, avg_vis = assess_frame_quality(landmarks, visibility)

            # Store zeros for no-pose frames (keeps arrays stackable)
            if landmarks is None:
                landmarks = np.zeros((33, 3), dtype=np.float32)
                visibility = np.zeros(33, dtype=np.float32)

            result.frames.append(FrameResult(
                frame_idx=frame_idx,
                landmarks=landmarks,
                visibility=visibility,
                quality=quality,
                avg_visibility=avg_vis,
            ))

    cap.release()
    return result


# ─── Save / Load ─────────────────────────────────────────────────────────────

def save_results(result: VideoResult, output_dir: str) -> dict[str, str]:
    """Save extraction results as JSON metadata + numpy arrays.

    JSON contains a clean summary (no per-frame dumps).
    NPZ contains the full landmark + visibility arrays.
    """
    os.makedirs(output_dir, exist_ok=True)
    video_name = Path(result.video_path).stem

    all_landmarks = np.stack([f.landmarks for f in result.frames])    # (N, 33, 3)
    all_visibility = np.stack([f.visibility for f in result.frames])  # (N, 33)

    usable = sum(1 for f in result.frames if f.quality == "usable")
    no_pose = sum(1 for f in result.frames if f.quality == "no_pose")
    total = len(result.frames)
    avg_vis_all = float(np.mean([f.avg_visibility for f in result.frames if f.quality == "usable"])) if usable > 0 else 0.0

    npz_path = os.path.join(output_dir, f"{video_name}.npz")
    np.savez_compressed(npz_path, landmarks=all_landmarks, visibility=all_visibility)

    metadata = {
        "video_path": result.video_path,
        "exercise": result.exercise,
        "fps": result.fps,
        "frame_count": result.frame_count,
        "frame_width": result.frame_width,
        "frame_height": result.frame_height,
        "extracted_frames": total,
        "usable_frames": usable,
        "no_pose_frames": no_pose,
        "usable_pct": round(100 * usable / max(total, 1), 1),
        "avg_visibility": round(avg_vis_all, 4),
    }

    json_path = os.path.join(output_dir, f"{video_name}.json")
    with open(json_path, "w") as f:
        json.dump(metadata, f, indent=2)

    return {"npz": npz_path, "json": json_path}


def _deduplicate_videos(video_files: list[Path]) -> list[Path]:
    """If both .mov and .mp4 exist for the same stem, keep only the preferred one."""
    by_stem: dict[str, list[Path]] = {}
    for f in video_files:
        by_stem.setdefault(f.stem, []).append(f)

    result = []
    for stem, files in sorted(by_stem.items()):
        if len(files) == 1:
            result.append(files[0])
        else:
            # Pick by preferred extension order
            picked = None
            for ext in PREFERRED_EXTENSIONS:
                for f in files:
                    if f.suffix.lower() == ext:
                        picked = f
                        break
                if picked:
                    break
            result.append(picked or files[0])
    return sorted(result)


def extract_all(
    raw_videos_dir: str = "data/raw_videos",
    output_dir: str = "data/extracted",
    model_variant: str = "heavy",
) -> list[dict]:
    """Extract landmarks from all videos organized by exercise folder.

    Scans for .mov, .mp4, and other common video formats.
    If both .mov and .mp4 exist for the same video, processes only the .mov.
    Auto-downloads the model .task file on first run.
    """
    raw_path = Path(raw_videos_dir)
    results = []

    for exercise_dir in sorted(raw_path.iterdir()):
        if not exercise_dir.is_dir():
            continue
        exercise = exercise_dir.name

        all_videos = sorted(
            f for f in exercise_dir.iterdir()
            if f.suffix.lower() in VIDEO_EXTENSIONS
        )
        video_files = _deduplicate_videos(all_videos)

        if len(all_videos) != len(video_files):
            skipped = set(all_videos) - set(video_files)
            for s in skipped:
                print(f"  Skipping duplicate: {s.name}")

        for video_file in video_files:
            print(f"\n{'='*60}")
            print(f"Exercise: {exercise} | Video: {video_file.name}")
            print(f"{'='*60}")

            video_result = extract_video(str(video_file), exercise, model_variant)
            saved = save_results(video_result, output_dir)

            usable = sum(1 for f in video_result.frames if f.quality == "usable")
            total = len(video_result.frames)
            print(f"  Usable frames: {usable}/{total} ({100*usable/max(total,1):.1f}%)")

            results.append({
                "exercise": exercise,
                "video": video_file.name,
                "total_frames": total,
                "usable_frames": usable,
                **saved,
            })

    return results
