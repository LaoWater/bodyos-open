"""
MediaPipe Confidence Threshold Testing
=======================================
Tests different detection/tracking confidence thresholds to find optimal settings.

Uses MediaPipe Tasks API (2024+).

This script helps answer:
- What's the optimal min_detection_confidence for each exercise type?
- What's the optimal min_tracking_confidence?
- How do these thresholds affect frame-to-frame stability?

Usage:
    python test_confidence_thresholds.py --video ../data/portrait/pushup.mov
"""

import argparse
import json
import os
import time
import urllib.request
from dataclasses import dataclass
from itertools import product
from pathlib import Path

import cv2
import matplotlib.pyplot as plt
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


def download_model(variant: str = "heavy") -> Path:
    """Download pose model if not present."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODEL_DIR / f"pose_landmarker_{variant}.task"
    if not model_path.exists():
        print(f"Downloading pose_landmarker_{variant}...")
        urllib.request.urlretrieve(MODELS[variant], model_path)
        print(f"Saved to {model_path}")
    return model_path


@dataclass
class ThresholdResult:
    """Results for a specific threshold combination."""
    detection_conf: float
    tracking_conf: float
    detection_rate: float
    avg_visibility: float
    jitter_score: float  # Lower = more stable
    missed_frames: int
    total_frames: int


def compute_jitter(landmarks_sequence: list[np.ndarray]) -> float:
    """
    Compute jitter (frame-to-frame variation) in landmark positions.
    Lower values indicate more stable tracking.
    """
    if len(landmarks_sequence) < 2:
        return 0.0

    diffs = []
    for i in range(1, len(landmarks_sequence)):
        prev = landmarks_sequence[i - 1]
        curr = landmarks_sequence[i]
        if prev is not None and curr is not None:
            diff = np.sqrt(np.sum((curr - prev) ** 2, axis=1)).mean()
            diffs.append(diff)

    return float(np.mean(diffs)) if diffs else 0.0


def test_thresholds(
    video_path: str,
    detection_confs: list[float],
    tracking_confs: list[float],
    model_variant: str = "heavy",
) -> list[ThresholdResult]:
    """Test all combinations of detection and tracking confidence thresholds."""
    results = []

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    # Pre-read all frames to memory for consistent testing
    print("Loading video frames...")
    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    cap.release()
    print(f"Loaded {len(frames)} frames")

    model_path = download_model(model_variant)

    # Test each threshold combination
    combinations = list(product(detection_confs, tracking_confs))
    print(f"Testing {len(combinations)} threshold combinations...")

    for det_conf, track_conf in tqdm(combinations):
        landmarks_seq = []
        visibilities = []

        base_options = mp_tasks.BaseOptions(model_asset_path=str(model_path))
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            min_pose_detection_confidence=det_conf,
            min_tracking_confidence=track_conf,
            num_poses=1,
        )

        timestamp_ms = 0

        with vision.PoseLandmarker.create_from_options(options) as landmarker:
            for frame in frames:
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
                timestamp_ms += 33

                result = landmarker.detect_for_video(mp_image, timestamp_ms)

                if not result.pose_landmarks or len(result.pose_landmarks) == 0:
                    landmarks_seq.append(None)
                else:
                    lm = result.pose_landmarks[0]
                    landmarks = np.array([[l.x, l.y, l.z] for l in lm], dtype=np.float32)
                    visibility = np.array([l.visibility for l in lm], dtype=np.float32)
                    landmarks_seq.append(landmarks)
                    visibilities.append(visibility.mean())

        # Compute metrics
        detected_count = sum(1 for l in landmarks_seq if l is not None)
        detection_rate = detected_count / len(frames)
        avg_visibility = float(np.mean(visibilities)) if visibilities else 0.0

        valid_landmarks = [l for l in landmarks_seq if l is not None]
        jitter = compute_jitter(valid_landmarks)

        results.append(ThresholdResult(
            detection_conf=det_conf,
            tracking_conf=track_conf,
            detection_rate=detection_rate,
            avg_visibility=avg_visibility,
            jitter_score=jitter,
            missed_frames=len(frames) - detected_count,
            total_frames=len(frames),
        ))

    return results


def generate_report(results: list[ThresholdResult], output_dir: str, video_name: str):
    """Generate analysis report and visualizations."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("\n" + "="*60)
    print("THRESHOLD ANALYSIS REPORT")
    print("="*60)

    # Find best configurations
    best_by_detection = max(results, key=lambda r: r.detection_rate)
    best_by_stability = min(results, key=lambda r: r.jitter_score if r.detection_rate > 0.5 else float('inf'))
    best_balanced = max(results, key=lambda r: r.detection_rate * 0.7 + (1 - r.jitter_score * 10) * 0.3)

    print("\n--- Best by Detection Rate ---")
    print(f"  det_conf={best_by_detection.detection_conf}, track_conf={best_by_detection.tracking_conf}")
    print(f"  Detection Rate: {best_by_detection.detection_rate:.2%}")
    print(f"  Jitter: {best_by_detection.jitter_score:.5f}")

    print("\n--- Best by Stability (min jitter, >50% detection) ---")
    print(f"  det_conf={best_by_stability.detection_conf}, track_conf={best_by_stability.tracking_conf}")
    print(f"  Detection Rate: {best_by_stability.detection_rate:.2%}")
    print(f"  Jitter: {best_by_stability.jitter_score:.5f}")

    print("\n--- Best Balanced ---")
    print(f"  det_conf={best_balanced.detection_conf}, track_conf={best_balanced.tracking_conf}")
    print(f"  Detection Rate: {best_balanced.detection_rate:.2%}")
    print(f"  Jitter: {best_balanced.jitter_score:.5f}")

    # Create heatmaps
    det_confs = sorted(set(r.detection_conf for r in results))
    track_confs = sorted(set(r.tracking_conf for r in results))

    detection_matrix = np.zeros((len(det_confs), len(track_confs)))
    jitter_matrix = np.zeros((len(det_confs), len(track_confs)))

    for r in results:
        i = det_confs.index(r.detection_conf)
        j = track_confs.index(r.tracking_conf)
        detection_matrix[i, j] = r.detection_rate
        jitter_matrix[i, j] = r.jitter_score

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # Detection rate heatmap
    im1 = axes[0].imshow(detection_matrix, cmap="RdYlGn", aspect="auto", vmin=0, vmax=1)
    axes[0].set_xticks(range(len(track_confs)))
    axes[0].set_xticklabels([f"{c:.1f}" for c in track_confs])
    axes[0].set_yticks(range(len(det_confs)))
    axes[0].set_yticklabels([f"{c:.1f}" for c in det_confs])
    axes[0].set_xlabel("Tracking Confidence")
    axes[0].set_ylabel("Detection Confidence")
    axes[0].set_title("Detection Rate")
    plt.colorbar(im1, ax=axes[0])

    # Jitter heatmap
    im2 = axes[1].imshow(jitter_matrix, cmap="RdYlGn_r", aspect="auto")
    axes[1].set_xticks(range(len(track_confs)))
    axes[1].set_xticklabels([f"{c:.1f}" for c in track_confs])
    axes[1].set_yticks(range(len(det_confs)))
    axes[1].set_yticklabels([f"{c:.1f}" for c in det_confs])
    axes[1].set_xlabel("Tracking Confidence")
    axes[1].set_ylabel("Detection Confidence")
    axes[1].set_title("Jitter (lower = more stable)")
    plt.colorbar(im2, ax=axes[1])

    plt.suptitle(f"Threshold Analysis: {video_name}")
    plt.tight_layout()
    plt.savefig(output_dir / f"threshold_analysis_{video_name}.png", dpi=150)
    plt.close()

    print(f"\nVisualization saved to {output_dir / f'threshold_analysis_{video_name}.png'}")

    # Save detailed results
    report = {
        "video": video_name,
        "recommendations": {
            "best_detection_rate": {
                "detection_conf": best_by_detection.detection_conf,
                "tracking_conf": best_by_detection.tracking_conf,
                "detection_rate": best_by_detection.detection_rate,
                "jitter": best_by_detection.jitter_score,
            },
            "best_stability": {
                "detection_conf": best_by_stability.detection_conf,
                "tracking_conf": best_by_stability.tracking_conf,
                "detection_rate": best_by_stability.detection_rate,
                "jitter": best_by_stability.jitter_score,
            },
            "best_balanced": {
                "detection_conf": best_balanced.detection_conf,
                "tracking_conf": best_balanced.tracking_conf,
                "detection_rate": best_balanced.detection_rate,
                "jitter": best_balanced.jitter_score,
            },
        },
        "all_results": [
            {
                "detection_conf": r.detection_conf,
                "tracking_conf": r.tracking_conf,
                "detection_rate": r.detection_rate,
                "avg_visibility": r.avg_visibility,
                "jitter_score": r.jitter_score,
                "missed_frames": r.missed_frames,
            }
            for r in results
        ],
    }

    with open(output_dir / f"threshold_results_{video_name}.json", "w") as f:
        json.dump(report, f, indent=2)

    print(f"Detailed results saved to {output_dir / f'threshold_results_{video_name}.json'}")


def main():
    parser = argparse.ArgumentParser(description="Test MediaPipe confidence thresholds")
    parser.add_argument("--video", type=str, required=True,
                        help="Path to test video")
    parser.add_argument("--output_dir", type=str, default="./results",
                        help="Directory for output reports")
    parser.add_argument("--model", type=str, default="heavy", choices=["lite", "full", "heavy"],
                        help="MediaPipe PoseLandmarker model variant")

    args = parser.parse_args()

    # Threshold ranges to test
    detection_confs = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
    tracking_confs = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]

    print(f"Testing video: {args.video}")
    print(f"Detection thresholds: {detection_confs}")
    print(f"Tracking thresholds: {tracking_confs}")

    results = test_thresholds(
        args.video,
        detection_confs,
        tracking_confs,
        args.model,
    )

    video_name = Path(args.video).stem
    generate_report(results, args.output_dir, video_name)


if __name__ == "__main__":
    main()
