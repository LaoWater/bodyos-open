"""
MediaPipe Model Complexity Comparison
=====================================
Compares Lite, Full, and Heavy PoseLandmarker model variants.

Uses MediaPipe Tasks API (2024+).

Tests:
- Accuracy (detection rate, visibility scores)
- Speed (inference time)
- Stability (frame-to-frame jitter)

Usage:
    python test_model_complexity.py --video_dir ../data/portrait
"""

import argparse
import json
import os
import time
import urllib.request
from dataclasses import dataclass
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

VARIANT_NAMES = {"lite": "Lite", "full": "Full", "heavy": "Heavy"}

# Major body joints
MAJOR_JOINTS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]


def download_model(variant: str) -> Path:
    """Download pose model if not present."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODEL_DIR / f"pose_landmarker_{variant}.task"
    if not model_path.exists():
        print(f"Downloading pose_landmarker_{variant}...")
        urllib.request.urlretrieve(MODELS[variant], model_path)
        print(f"Saved to {model_path}")
    return model_path


@dataclass
class ComplexityResult:
    """Results for a specific model variant."""
    variant: str
    variant_name: str
    detection_rate: float
    avg_visibility: float
    major_joint_visibility: float
    avg_inference_ms: float
    jitter_score: float
    video_count: int
    frame_count: int


def compute_jitter(landmarks_list: list) -> float:
    """Compute average frame-to-frame movement (jitter)."""
    if len(landmarks_list) < 2:
        return 0.0

    diffs = []
    for i in range(1, len(landmarks_list)):
        prev, curr = landmarks_list[i - 1], landmarks_list[i]
        if prev is not None and curr is not None:
            diff = np.sqrt(np.sum((curr - prev) ** 2, axis=1)).mean()
            diffs.append(diff)

    return float(np.mean(diffs)) if diffs else 0.0


def test_variant_on_video(video_path: str, variant: str) -> dict:
    """Test a specific model variant on a single video."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open: {video_path}")

    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    cap.release()

    if not frames:
        return None

    # Setup MediaPipe Tasks API
    model_path = download_model(variant)
    base_options = mp_tasks.BaseOptions(model_asset_path=str(model_path))
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        min_pose_detection_confidence=0.5,
        min_tracking_confidence=0.5,
        num_poses=1,
    )

    landmarks_list = []
    visibilities = []
    major_visibilities = []
    inference_times = []
    timestamp_ms = 0

    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        for frame in frames:
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
            timestamp_ms += 33

            start = time.perf_counter()
            result = landmarker.detect_for_video(mp_image, timestamp_ms)
            inference_times.append((time.perf_counter() - start) * 1000)

            if not result.pose_landmarks or len(result.pose_landmarks) == 0:
                landmarks_list.append(None)
            else:
                lm = result.pose_landmarks[0]
                landmarks = np.array([[l.x, l.y, l.z] for l in lm], dtype=np.float32)
                visibility = np.array([l.visibility for l in lm], dtype=np.float32)

                landmarks_list.append(landmarks)
                visibilities.append(visibility.mean())
                major_visibilities.append(visibility[MAJOR_JOINTS].mean())

    detected = sum(1 for l in landmarks_list if l is not None)

    return {
        "total_frames": len(frames),
        "detected_frames": detected,
        "detection_rate": detected / len(frames),
        "avg_visibility": float(np.mean(visibilities)) if visibilities else 0.0,
        "major_joint_visibility": float(np.mean(major_visibilities)) if major_visibilities else 0.0,
        "avg_inference_ms": float(np.mean(inference_times)),
        "jitter": compute_jitter([l for l in landmarks_list if l is not None]),
    }


def test_all_variants(video_dir: str) -> list[ComplexityResult]:
    """Test all model variants on all videos in directory."""
    video_dir = Path(video_dir)
    videos = list(video_dir.rglob("*.mp4")) + list(video_dir.rglob("*.mov"))

    if not videos:
        print(f"No videos found in {video_dir}")
        return []

    print(f"Found {len(videos)} videos")

    results_by_variant = {"lite": [], "full": [], "heavy": []}

    for variant in ["lite", "full", "heavy"]:
        print(f"\n--- Testing {VARIANT_NAMES[variant]} ---")

        for video_path in tqdm(videos, desc=f"{VARIANT_NAMES[variant]}"):
            try:
                result = test_variant_on_video(str(video_path), variant)
                if result:
                    results_by_variant[variant].append(result)
            except Exception as e:
                print(f"Error on {video_path.name}: {e}")

    # Aggregate results
    final_results = []
    for variant, video_results in results_by_variant.items():
        if not video_results:
            continue

        final_results.append(ComplexityResult(
            variant=variant,
            variant_name=VARIANT_NAMES[variant],
            detection_rate=float(np.mean([r["detection_rate"] for r in video_results])),
            avg_visibility=float(np.mean([r["avg_visibility"] for r in video_results])),
            major_joint_visibility=float(np.mean([r["major_joint_visibility"] for r in video_results])),
            avg_inference_ms=float(np.mean([r["avg_inference_ms"] for r in video_results])),
            jitter_score=float(np.mean([r["jitter"] for r in video_results])),
            video_count=len(video_results),
            frame_count=sum(r["total_frames"] for r in video_results),
        ))

    return final_results


def generate_report(results: list[ComplexityResult], output_dir: str):
    """Generate comparison report."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("\n" + "="*70)
    print("MODEL VARIANT COMPARISON")
    print("="*70)

    print(f"\n{'Variant':<12} {'Detect%':<10} {'Visibility':<12} {'Major Joints':<14} {'Speed(ms)':<12} {'Jitter':<10}")
    print("-" * 70)

    for r in results:
        print(f"{r.variant_name:<12} {r.detection_rate:>8.1%}  {r.avg_visibility:>10.3f}  "
              f"{r.major_joint_visibility:>12.3f}  {r.avg_inference_ms:>10.1f}  {r.jitter_score:>8.5f}")

    # Recommendations
    print("\n--- Recommendations ---")
    best_accuracy = max(results, key=lambda r: r.detection_rate * r.major_joint_visibility)
    best_speed = min(results, key=lambda r: r.avg_inference_ms)
    best_balance = max(results, key=lambda r: r.detection_rate * 0.5 + (1 / r.avg_inference_ms) * 0.3 + (1 - r.jitter_score * 100) * 0.2)

    print(f"  Best Accuracy: {best_accuracy.variant_name}")
    print(f"  Best Speed: {best_speed.variant_name} ({best_speed.avg_inference_ms:.1f}ms)")
    print(f"  Best Balance: {best_balance.variant_name}")

    # Visualization
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))

    names = [r.variant_name for r in results]
    x = range(len(names))

    # Detection Rate
    axes[0, 0].bar(x, [r.detection_rate for r in results], color=["#90CAF9", "#42A5F5", "#1565C0"])
    axes[0, 0].set_xticks(x)
    axes[0, 0].set_xticklabels(names)
    axes[0, 0].set_ylabel("Detection Rate")
    axes[0, 0].set_title("Detection Rate by Variant")
    axes[0, 0].set_ylim(0, 1)

    # Major Joint Visibility
    axes[0, 1].bar(x, [r.major_joint_visibility for r in results], color=["#A5D6A7", "#66BB6A", "#2E7D32"])
    axes[0, 1].set_xticks(x)
    axes[0, 1].set_xticklabels(names)
    axes[0, 1].set_ylabel("Avg Visibility")
    axes[0, 1].set_title("Major Joint Visibility")
    axes[0, 1].set_ylim(0, 1)

    # Inference Time
    axes[1, 0].bar(x, [r.avg_inference_ms for r in results], color=["#FFCC80", "#FFA726", "#EF6C00"])
    axes[1, 0].set_xticks(x)
    axes[1, 0].set_xticklabels(names)
    axes[1, 0].set_ylabel("Time (ms)")
    axes[1, 0].set_title("Avg Inference Time")

    # Jitter
    axes[1, 1].bar(x, [r.jitter_score for r in results], color=["#CE93D8", "#AB47BC", "#6A1B9A"])
    axes[1, 1].set_xticks(x)
    axes[1, 1].set_xticklabels(names)
    axes[1, 1].set_ylabel("Jitter Score")
    axes[1, 1].set_title("Frame-to-Frame Jitter (lower = better)")

    plt.suptitle("MediaPipe PoseLandmarker Variant Comparison", fontsize=14)
    plt.tight_layout()
    plt.savefig(output_dir / "complexity_comparison.png", dpi=150)
    plt.close()

    print(f"\nVisualization saved to {output_dir / 'complexity_comparison.png'}")

    # Save JSON
    report = {
        "summary": [
            {
                "variant": r.variant,
                "name": r.variant_name,
                "detection_rate": r.detection_rate,
                "avg_visibility": r.avg_visibility,
                "major_joint_visibility": r.major_joint_visibility,
                "avg_inference_ms": r.avg_inference_ms,
                "jitter_score": r.jitter_score,
                "video_count": r.video_count,
                "frame_count": r.frame_count,
            }
            for r in results
        ],
        "recommendations": {
            "best_accuracy": best_accuracy.variant_name,
            "best_speed": best_speed.variant_name,
            "best_balance": best_balance.variant_name,
        },
    }

    with open(output_dir / "complexity_comparison.json", "w") as f:
        json.dump(report, f, indent=2)

    print(f"Report saved to {output_dir / 'complexity_comparison.json'}")


def main():
    parser = argparse.ArgumentParser(description="Compare MediaPipe PoseLandmarker model variants")
    parser.add_argument("--video_dir", type=str, default="../data/portrait",
                        help="Directory containing test videos")
    parser.add_argument("--output_dir", type=str, default="./results",
                        help="Directory for output")

    args = parser.parse_args()

    results = test_all_variants(args.video_dir)

    if results:
        generate_report(results, args.output_dir)


if __name__ == "__main__":
    main()
