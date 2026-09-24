"""
Pose Model Overlay Comparison
==============================
Takes a video, runs it through MediaPipe PoseLandmarker (lite/full/heavy),
and outputs overlay videos so you can visually compare how each model tracks.

Uses MediaPipe Tasks API (2024+).

Usage:
    python analyze_orientation_accuracy.py --video ../data/portrait/pushup.mov
    python analyze_orientation_accuracy.py --video ../data/portrait/pushup.mov --models lite heavy
    python analyze_orientation_accuracy.py --video ../data/portrait/pushup.mov --side-by-side
"""

import argparse
import json
import os
import time
import urllib.request
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision
from tqdm import tqdm

# ─── Model Setup ─────────────────────────────────────────────────────────────

MODEL_DIR = Path(__file__).parent / "models"

MODELS = {
    "lite": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    "full": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
    "heavy": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task",
}

# Skeleton connections for drawing
CONNECTIONS = [
    # Torso
    (11, 12), (11, 23), (12, 24), (23, 24),
    # Left arm
    (11, 13), (13, 15),
    # Right arm
    (12, 14), (14, 16),
    # Left leg
    (23, 25), (25, 27),
    # Right leg
    (24, 26), (26, 28),
]

# Colors per model variant (BGR)
MODEL_COLORS = {
    "lite":  (0, 200, 255),   # Orange
    "full":  (0, 255, 0),     # Green
    "heavy": (255, 100, 0),   # Blue
}


def download_model(variant: str) -> Path:
    """Download pose model if not present."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODEL_DIR / f"pose_landmarker_{variant}.task"
    if not model_path.exists():
        print(f"Downloading pose_landmarker_{variant}...")
        urllib.request.urlretrieve(MODELS[variant], model_path)
        print(f"Saved to {model_path}")
    return model_path


# ─── Drawing ──────────────────────────────────────────────────────────────────

def draw_skeleton(frame, landmarks, color, label=None, vis_threshold=0.5):
    """Draw skeleton overlay on frame. Returns the frame."""
    h, w = frame.shape[:2]

    # Draw bones
    for start_idx, end_idx in CONNECTIONS:
        lm_a = landmarks[start_idx]
        lm_b = landmarks[end_idx]

        if lm_a.visibility < vis_threshold or lm_b.visibility < vis_threshold:
            continue

        pt_a = (int(lm_a.x * w), int(lm_a.y * h))
        pt_b = (int(lm_b.x * w), int(lm_b.y * h))
        cv2.line(frame, pt_a, pt_b, color, 2, cv2.LINE_AA)

    # Draw joints
    for i, lm in enumerate(landmarks):
        if lm.visibility < vis_threshold:
            continue
        pt = (int(lm.x * w), int(lm.y * h))
        cv2.circle(frame, pt, 4, color, -1, cv2.LINE_AA)
        cv2.circle(frame, pt, 5, (0, 0, 0), 1, cv2.LINE_AA)

    # Label
    if label:
        cv2.putText(frame, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX,
                    0.8, color, 2, cv2.LINE_AA)

    return frame


def draw_metrics(frame, variant, detection_rate, avg_vis, inference_ms, y_offset=0):
    """Draw metrics text on frame."""
    color = MODEL_COLORS.get(variant, (255, 255, 255))
    h = frame.shape[0]
    y_base = h - 80 + y_offset

    text = f"{variant.upper()}: det={detection_rate:.0%} vis={avg_vis:.2f} {inference_ms:.0f}ms"
    cv2.putText(frame, text, (10, y_base), cv2.FONT_HERSHEY_SIMPLEX,
                0.5, color, 1, cv2.LINE_AA)


# ─── Core: Run model on video ────────────────────────────────────────────────

def process_video(video_path: str, variant: str):
    """
    Run a model variant on a video.
    Returns: list of (landmarks_or_None, inference_ms) per frame.
    """
    model_path = download_model(variant)
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

    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    results = []
    timestamp_ms = 0

    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        for _ in tqdm(range(frame_count), desc=f"  {variant}"):
            ret, frame = cap.read()
            if not ret:
                break

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            timestamp_ms += 33

            start = time.perf_counter()
            result = landmarker.detect_for_video(mp_image, timestamp_ms)
            elapsed_ms = (time.perf_counter() - start) * 1000

            if result.pose_landmarks and len(result.pose_landmarks) > 0:
                results.append((result.pose_landmarks[0], elapsed_ms))
            else:
                results.append((None, elapsed_ms))

    cap.release()
    return results


# ─── Output: Individual overlay videos ────────────────────────────────────────

def generate_overlay_video(video_path: str, variant: str, detections: list, output_dir: Path):
    """Write an overlay video for one model variant."""
    output_dir.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    stem = Path(video_path).stem
    out_path = output_dir / f"{stem}_{variant}_overlay.mp4"
    writer = cv2.VideoWriter(str(out_path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))

    color = MODEL_COLORS.get(variant, (0, 255, 0))

    # Compute summary stats
    detected = sum(1 for lm, _ in detections if lm is not None)
    det_rate = detected / max(len(detections), 1)
    avg_ms = np.mean([ms for _, ms in detections])

    vis_scores = []
    for lm, _ in detections:
        if lm is not None:
            vis_scores.append(np.mean([l.visibility for l in lm]))
    avg_vis = np.mean(vis_scores) if vis_scores else 0

    for i, (landmarks, ms) in enumerate(detections):
        ret, frame = cap.read()
        if not ret:
            break

        if landmarks is not None:
            draw_skeleton(frame, landmarks, color, label=f"{variant.upper()} | {ms:.0f}ms")
        else:
            cv2.putText(frame, f"{variant.upper()} | NO DETECTION", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2, cv2.LINE_AA)

        # Stats bar at bottom
        draw_metrics(frame, variant, det_rate, avg_vis, avg_ms)

        writer.write(frame)

    cap.release()
    writer.release()
    print(f"  -> {out_path}")
    return out_path


# ─── Output: Side-by-side comparison video ────────────────────────────────────

def generate_side_by_side(video_path: str, all_detections: dict, output_dir: Path):
    """Write a side-by-side video with all model variants."""
    output_dir.mkdir(parents=True, exist_ok=True)
    variants = list(all_detections.keys())
    n_variants = len(variants)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # Scale each panel to fit side-by-side (target max width ~1920)
    panel_w = min(orig_w, 1920 // n_variants)
    scale = panel_w / orig_w
    panel_h = int(orig_h * scale)
    total_w = panel_w * n_variants

    stem = Path(video_path).stem
    out_path = output_dir / f"{stem}_comparison.mp4"
    writer = cv2.VideoWriter(str(out_path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (total_w, panel_h))

    for frame_idx in range(frame_count):
        ret, frame = cap.read()
        if not ret:
            break

        panels = []
        for variant in variants:
            panel = cv2.resize(frame.copy(), (panel_w, panel_h))
            color = MODEL_COLORS.get(variant, (0, 255, 0))

            detections = all_detections[variant]
            if frame_idx < len(detections):
                landmarks, ms = detections[frame_idx]
                if landmarks is not None:
                    draw_skeleton(panel, landmarks, color, label=f"{variant.upper()} | {ms:.0f}ms")
                else:
                    cv2.putText(panel, f"{variant.upper()} | MISS", (10, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2, cv2.LINE_AA)

            panels.append(panel)

        combined = np.hstack(panels)
        writer.write(combined)

    cap.release()
    writer.release()
    print(f"  -> {out_path}")
    return out_path


# ─── Summary stats (printed + JSON) ──────────────────────────────────────────

def print_summary(video_path: str, all_detections: dict, output_dir: Path):
    """Print comparison table and save JSON report."""
    output_dir.mkdir(parents=True, exist_ok=True)
    stem = Path(video_path).stem

    print(f"\n{'='*65}")
    print(f"  MODEL COMPARISON: {Path(video_path).name}")
    print(f"{'='*65}")
    print(f"  {'Variant':<8} {'Detection':<12} {'Avg Vis':<10} {'Avg ms':<10}")
    print(f"  {'-'*40}")

    report = {}

    for variant, detections in all_detections.items():
        detected = sum(1 for lm, _ in detections if lm is not None)
        det_rate = detected / max(len(detections), 1)
        avg_ms = np.mean([ms for _, ms in detections])

        vis_scores = []
        for lm, _ in detections:
            if lm is not None:
                vis_scores.append(np.mean([l.visibility for l in lm]))
        avg_vis = np.mean(vis_scores) if vis_scores else 0

        print(f"  {variant:<8} {det_rate:>9.1%}   {avg_vis:>8.3f}   {avg_ms:>7.1f}")

        report[variant] = {
            "detection_rate": det_rate,
            "avg_visibility": float(avg_vis),
            "avg_inference_ms": float(avg_ms),
            "total_frames": len(detections),
            "detected_frames": detected,
        }

    print(f"{'='*65}\n")

    json_path = output_dir / f"{stem}_report.json"
    with open(json_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"  Report: {json_path}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Compare pose models visually with skeleton overlays")
    parser.add_argument("--video", type=str, default="../data/portrait/pushup.mov",
                        help="Path to input video")
    parser.add_argument("--models", type=str, nargs="+", default=["lite", "full", "heavy"],
                        choices=["lite", "full", "heavy"],
                        help="Model variants to compare")
    parser.add_argument("--output_dir", type=str, default="./results",
                        help="Directory for output videos")
    parser.add_argument("--side-by-side", action="store_true",
                        help="Also generate a side-by-side comparison video")

    args = parser.parse_args()
    output_dir = Path(args.output_dir)

    print(f"Video: {args.video}")
    print(f"Models: {args.models}")
    print()

    # Run all models
    all_detections = {}
    for variant in args.models:
        print(f"Running {variant}...")
        all_detections[variant] = process_video(args.video, variant)

    # Generate individual overlay videos
    print("\nGenerating overlay videos...")
    for variant, detections in all_detections.items():
        generate_overlay_video(args.video, variant, detections, output_dir)

    # Side-by-side
    if args.side_by_side:
        print("\nGenerating side-by-side comparison...")
        generate_side_by_side(args.video, all_detections, output_dir)

    # Stats
    print_summary(args.video, all_detections, output_dir)


if __name__ == "__main__":
    main()
