"""
MoveNet vs MediaPipe — Visual Overlay Comparison
=================================================
Runs all candidate on-device models against our test videos and outputs
overlay mp4s so you can see them side-by-side.

The question we're answering:
    For on-device (Swift under-the-hood, React UI), should we use
    MoveNet Lightning/Thunder (TFLite) or MediaPipe Lite/Full (Tasks API)?
    And for cloud (Cloud Run uploaded video), Heavy is already our pick.

Models tested:
    MediaPipe:  lite, full, heavy  (Tasks API, .task files)
    MoveNet:    lightning, thunder  (TF Hub -> TFLite, requires tensorflow)

Auto-discovers all .mov/.mp4 in research/data/portrait/.

Usage:
    python compare_detectors.py
    python compare_detectors.py --video pushup.mov
    python compare_detectors.py --models mp_lite mn_lightning --side-by-side
    python compare_detectors.py --models mp_lite mp_heavy mn_lightning mn_thunder --side-by-side
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

# TensorFlow for MoveNet (optional)
try:
    import tensorflow as tf
    import tensorflow_hub as hub
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

# ─── Paths ────────────────────────────────────────────────────────────────────

VIDEO_DIR = Path(__file__).parent.parent / "data" / "portrait"
MODEL_DIR = Path(__file__).parent / "models"
OUTPUT_DIR = Path(__file__).parent / "results"

# ─── Model Registry ──────────────────────────────────────────────────────────

MEDIAPIPE_URLS = {
    "lite": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    "full": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
    "heavy": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task",
}

MOVENET_HUB_URLS = {
    "lightning": "https://tfhub.dev/google/movenet/singlepose/lightning/4",
    "thunder":   "https://tfhub.dev/google/movenet/singlepose/thunder/4",
}
MOVENET_INPUT_SIZES = {"lightning": 192, "thunder": 256}

# Short aliases -> (family, variant)
MODEL_ALIASES = {
    "mp_lite":      ("mediapipe", "lite"),
    "mp_full":      ("mediapipe", "full"),
    "mp_heavy":     ("mediapipe", "heavy"),
    "mn_lightning":  ("movenet",   "lightning"),
    "mn_thunder":    ("movenet",   "thunder"),
}

ALL_MODELS = list(MODEL_ALIASES.keys())

# Skeleton connections — MediaPipe (33 landmarks, we draw the body)
MP_CONNECTIONS = [
    (11, 12), (11, 23), (12, 24), (23, 24),  # Torso
    (11, 13), (13, 15),                        # Left arm
    (12, 14), (14, 16),                        # Right arm
    (23, 25), (25, 27),                        # Left leg
    (24, 26), (26, 28),                        # Right leg
]

# Skeleton connections — MoveNet (17 landmarks)
MN_CONNECTIONS = [
    (5, 6),                     # Shoulders
    (5, 7), (7, 9),             # Left arm
    (6, 8), (8, 10),            # Right arm
    (5, 11), (6, 12), (11, 12), # Torso
    (11, 13), (13, 15),         # Left leg
    (12, 14), (14, 16),         # Right leg
]

# Colors per model (BGR)
MODEL_COLORS = {
    "mp_lite":      (0, 200, 255),   # Orange
    "mp_full":      (0, 255, 0),     # Green
    "mp_heavy":     (255, 100, 0),   # Blue
    "mn_lightning":  (255, 0, 255),   # Magenta
    "mn_thunder":    (0, 255, 255),   # Cyan
}


# ─── Model Download / Load ───────────────────────────────────────────────────

def download_mediapipe(variant: str) -> Path:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    path = MODEL_DIR / f"pose_landmarker_{variant}.task"
    if not path.exists():
        print(f"  Downloading pose_landmarker_{variant}...")
        urllib.request.urlretrieve(MEDIAPIPE_URLS[variant], path)
    return path


_movenet_cache = {}

def load_movenet(variant: str):
    """Load MoveNet from TF Hub (cached)."""
    if variant in _movenet_cache:
        return _movenet_cache[variant]
    if not TF_AVAILABLE:
        return None
    print(f"  Loading MoveNet {variant} from TF Hub...")
    model = hub.load(MOVENET_HUB_URLS[variant])
    movenet = model.signatures["serving_default"]
    _movenet_cache[variant] = movenet
    return movenet


# ─── Detection: unified result format ────────────────────────────────────────
#
# Each frame result is a dict:
#   { "landmarks": [(x, y, vis), ...], "connections": [...], "ms": float }
# or None if no detection.
#
# MediaPipe gives 33 landmarks (normalized 0-1).
# MoveNet gives 17 landmarks (y, x, conf — we flip to x, y, conf, normalized 0-1).

def run_mediapipe_on_video(video_path: str, variant: str) -> list:
    """Run MediaPipe PoseLandmarker on a video. Returns per-frame results."""
    model_path = download_mediapipe(variant)
    base_options = mp_tasks.BaseOptions(model_asset_path=str(model_path))
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        min_pose_detection_confidence=0.5,
        min_tracking_confidence=0.5,
        num_poses=1,
    )

    cap = cv2.VideoCapture(video_path)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    results = []
    ts = 0

    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        for _ in tqdm(range(frame_count), desc=f"  mp_{variant}", leave=False):
            ret, frame = cap.read()
            if not ret:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            ts += 33

            t0 = time.perf_counter()
            det = landmarker.detect_for_video(mp_image, ts)
            ms = (time.perf_counter() - t0) * 1000

            if det.pose_landmarks and len(det.pose_landmarks) > 0:
                lm = det.pose_landmarks[0]
                landmarks = [(l.x, l.y, l.visibility) for l in lm]
                results.append({"landmarks": landmarks, "connections": MP_CONNECTIONS, "ms": ms})
            else:
                results.append(None)

    cap.release()
    return results


def run_movenet_on_video(video_path: str, variant: str) -> list:
    """Run MoveNet on a video. Returns per-frame results."""
    if not TF_AVAILABLE:
        print(f"  Skipping mn_{variant} — TensorFlow not installed")
        return None

    movenet = load_movenet(variant)
    if movenet is None:
        return None

    input_size = MOVENET_INPUT_SIZES[variant]

    cap = cv2.VideoCapture(video_path)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    results = []

    for _ in tqdm(range(frame_count), desc=f"  mn_{variant}", leave=False):
        ret, frame = cap.read()
        if not ret:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        input_image = tf.image.resize_with_pad(tf.expand_dims(rgb, axis=0), input_size, input_size)
        input_image = tf.cast(input_image, dtype=tf.int32)

        t0 = time.perf_counter()
        outputs = movenet(input_image)
        ms = (time.perf_counter() - t0) * 1000

        kps = outputs["output_0"].numpy()[0, 0]  # (17, 3) — y, x, conf

        # Convert to x, y, conf
        landmarks = [(float(kp[1]), float(kp[0]), float(kp[2])) for kp in kps]

        # Valid if >= 5 joints above 0.3
        if sum(1 for _, _, c in landmarks if c > 0.3) >= 5:
            results.append({"landmarks": landmarks, "connections": MN_CONNECTIONS, "ms": ms})
        else:
            results.append(None)

    cap.release()
    return results


def run_model(video_path: str, alias: str) -> list:
    """Dispatch to the right runner."""
    family, variant = MODEL_ALIASES[alias]
    if family == "mediapipe":
        return run_mediapipe_on_video(video_path, variant)
    else:
        return run_movenet_on_video(video_path, variant)


# ─── Drawing ──────────────────────────────────────────────────────────────────

def draw_skeleton(frame, landmarks, connections, color, label=None, vis_threshold=0.4):
    """Draw a skeleton on a frame from normalized (x, y, vis) landmarks."""
    h, w = frame.shape[:2]

    for a, b in connections:
        if a >= len(landmarks) or b >= len(landmarks):
            continue
        xa, ya, va = landmarks[a]
        xb, yb, vb = landmarks[b]
        if va < vis_threshold or vb < vis_threshold:
            continue
        pt_a = (int(xa * w), int(ya * h))
        pt_b = (int(xb * w), int(yb * h))
        cv2.line(frame, pt_a, pt_b, color, 2, cv2.LINE_AA)

    for x, y, v in landmarks:
        if v < vis_threshold:
            continue
        pt = (int(x * w), int(y * h))
        cv2.circle(frame, pt, 4, color, -1, cv2.LINE_AA)
        cv2.circle(frame, pt, 5, (0, 0, 0), 1, cv2.LINE_AA)

    if label:
        cv2.putText(frame, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2, cv2.LINE_AA)

    return frame


# ─── Output: individual overlays ──────────────────────────────────────────────

def write_overlay(video_path: str, alias: str, detections: list, out_dir: Path) -> Path:
    """Write a single overlay video for one model."""
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = Path(video_path).stem
    color = MODEL_COLORS.get(alias, (0, 255, 0))

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    out_path = out_dir / f"{stem}_{alias}_overlay.mp4"
    writer = cv2.VideoWriter(str(out_path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))

    for i, det in enumerate(detections):
        ret, frame = cap.read()
        if not ret:
            break
        if det is not None:
            ms = det["ms"]
            draw_skeleton(frame, det["landmarks"], det["connections"], color,
                          label=f"{alias} | {ms:.0f}ms")
        else:
            cv2.putText(frame, f"{alias} | MISS", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)
        writer.write(frame)

    cap.release()
    writer.release()
    return out_path


# ─── Output: side-by-side ────────────────────────────────────────────────────

def write_side_by_side(video_path: str, all_detections: dict, out_dir: Path) -> Path:
    """Write a side-by-side comparison video."""
    out_dir.mkdir(parents=True, exist_ok=True)
    aliases = list(all_detections.keys())
    n = len(aliases)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    orig_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    orig_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # Scale panels — target max ~1920 wide
    panel_w = min(orig_w, 1920 // n)
    scale = panel_w / orig_w
    panel_h = int(orig_h * scale)
    total_w = panel_w * n

    stem = Path(video_path).stem
    out_path = out_dir / f"{stem}_comparison.mp4"
    writer = cv2.VideoWriter(str(out_path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (total_w, panel_h))

    for idx in range(frame_count):
        ret, frame = cap.read()
        if not ret:
            break

        panels = []
        for alias in aliases:
            panel = cv2.resize(frame.copy(), (panel_w, panel_h))
            color = MODEL_COLORS.get(alias, (0, 255, 0))

            dets = all_detections[alias]
            if idx < len(dets) and dets[idx] is not None:
                det = dets[idx]
                draw_skeleton(panel, det["landmarks"], det["connections"], color,
                              label=f"{alias} | {det['ms']:.0f}ms")
            else:
                cv2.putText(panel, f"{alias} | MISS", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2, cv2.LINE_AA)
            panels.append(panel)

        writer.write(np.hstack(panels))

    cap.release()
    writer.release()
    return out_path


# ─── Stats ────────────────────────────────────────────────────────────────────

def compute_stats(detections: list) -> dict:
    """Compute summary stats for a model's detections."""
    total = len(detections)
    detected = sum(1 for d in detections if d is not None)
    det_rate = detected / max(total, 1)

    ms_list = [d["ms"] for d in detections if d is not None]
    avg_ms = float(np.mean(ms_list)) if ms_list else 0.0

    vis_list = []
    for d in detections:
        if d is not None:
            vis_list.append(np.mean([v for _, _, v in d["landmarks"]]))
    avg_vis = float(np.mean(vis_list)) if vis_list else 0.0

    return {
        "total_frames": total,
        "detected_frames": detected,
        "detection_rate": det_rate,
        "avg_inference_ms": avg_ms,
        "avg_visibility": avg_vis,
    }


def print_table(video_name: str, all_stats: dict):
    """Print a nice comparison table."""
    print(f"\n{'='*75}")
    print(f"  {video_name}")
    print(f"{'='*75}")
    print(f"  {'Model':<16} {'Family':<12} {'Detection':<11} {'Avg Vis':<9} {'Avg ms':<9} {'On-device?'}")
    print(f"  {'-'*70}")

    for alias, stats in all_stats.items():
        family, variant = MODEL_ALIASES[alias]
        on_device = "yes (fast)" if alias in ("mp_lite", "mn_lightning") else \
                    "maybe"      if alias in ("mp_full", "mn_thunder") else \
                    "cloud only"

        print(f"  {alias:<16} {family:<12} {stats['detection_rate']:>8.1%}   "
              f"{stats['avg_visibility']:>7.3f}   {stats['avg_inference_ms']:>6.1f}   {on_device}")

    print(f"{'='*75}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def find_videos(video_arg: str = None) -> list[Path]:
    """Find videos to process."""
    if video_arg:
        # Specific video
        path = VIDEO_DIR / video_arg
        if path.exists():
            return [path]
        # Try without extension
        for ext in [".mov", ".MOV", ".mp4", ".MP4"]:
            path = VIDEO_DIR / f"{video_arg}{ext}"
            if path.exists():
                return [path]
        raise FileNotFoundError(f"Video not found: {video_arg} in {VIDEO_DIR}")

    # Auto-discover all (deduplicate — Windows glob is case-insensitive)
    seen = set()
    videos = []
    for pattern in ["*.mov", "*.MOV", "*.mp4", "*.MP4"]:
        for p in VIDEO_DIR.glob(pattern):
            resolved = p.resolve()
            if resolved not in seen:
                seen.add(resolved)
                videos.append(p)
    videos.sort()
    if not videos:
        raise FileNotFoundError(f"No videos found in {VIDEO_DIR}")
    return videos


def main():
    parser = argparse.ArgumentParser(
        description="MoveNet vs MediaPipe — visual overlay comparison",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Models:
  mp_lite       MediaPipe PoseLandmarker Lite     (fast, on-device candidate)
  mp_full       MediaPipe PoseLandmarker Full     (balanced)
  mp_heavy      MediaPipe PoseLandmarker Heavy    (best accuracy, cloud)
  mn_lightning   MoveNet Lightning                 (fast, on-device candidate)
  mn_thunder     MoveNet Thunder                   (better accuracy, slower)

Examples:
  python compare_detectors.py
  python compare_detectors.py --video pushup.mov --side-by-side
  python compare_detectors.py --models mp_lite mn_lightning --side-by-side
  python compare_detectors.py --models mp_lite mp_heavy mn_lightning mn_thunder --side-by-side
        """,
    )
    parser.add_argument("--video", type=str, default=None,
                        help="Specific video filename (default: all in data/portrait/)")
    parser.add_argument("--models", type=str, nargs="+", default=ALL_MODELS,
                        choices=ALL_MODELS, metavar="MODEL",
                        help=f"Models to compare (default: all). Choices: {ALL_MODELS}")
    parser.add_argument("--side-by-side", action="store_true",
                        help="Generate a side-by-side comparison video")
    parser.add_argument("--output_dir", type=str, default=None,
                        help="Output directory (default: results/)")

    args = parser.parse_args()
    out_dir = Path(args.output_dir) if args.output_dir else OUTPUT_DIR

    # Check MoveNet availability
    mn_requested = [m for m in args.models if m.startswith("mn_")]
    if mn_requested and not TF_AVAILABLE:
        print(f"\n  WARNING: MoveNet models requested ({mn_requested}) but TensorFlow is not installed.")
        print(f"  Install with: pip install tensorflow tensorflow-hub")
        print(f"  Continuing with MediaPipe models only...\n")
        args.models = [m for m in args.models if not m.startswith("mn_")]

    if not args.models:
        print("No models to run!")
        return

    videos = find_videos(args.video)
    print(f"Videos: {[v.name for v in videos]}")
    print(f"Models: {args.models}")
    print()

    full_report = {}

    for video_path in videos:
        video_name = video_path.name
        video_out_dir = out_dir / video_path.stem
        print(f"Processing: {video_name}")

        all_detections = {}
        all_stats = {}

        for alias in args.models:
            print(f"  Running {alias}...")
            detections = run_model(str(video_path), alias)
            if detections is None:
                print(f"  Skipped {alias}")
                continue
            all_detections[alias] = detections
            all_stats[alias] = compute_stats(detections)

        # Write individual overlay videos
        print(f"\n  Writing overlay videos...")
        for alias, detections in all_detections.items():
            path = write_overlay(str(video_path), alias, detections, video_out_dir)
            print(f"    -> {path}")

        # Side-by-side
        if args.side_by_side and len(all_detections) >= 2:
            print(f"  Writing side-by-side comparison...")
            path = write_side_by_side(str(video_path), all_detections, video_out_dir)
            print(f"    -> {path}")

        # Print table
        print_table(video_name, all_stats)

        # Save JSON stats
        json_path = video_out_dir / f"{video_path.stem}_stats.json"
        video_out_dir.mkdir(parents=True, exist_ok=True)
        with open(json_path, "w") as f:
            json.dump(all_stats, f, indent=2)
        print(f"  Stats: {json_path}")

        full_report[video_name] = all_stats

    # Final summary across all videos
    if len(videos) > 1:
        print(f"\n{'='*75}")
        print(f"  OVERALL SUMMARY")
        print(f"{'='*75}")
        for alias in args.models:
            rates = [full_report[v.name][alias]["detection_rate"]
                     for v in videos if v.name in full_report and alias in full_report[v.name]]
            ms_avg = [full_report[v.name][alias]["avg_inference_ms"]
                      for v in videos if v.name in full_report and alias in full_report[v.name]]
            if rates:
                print(f"  {alias:<16} avg_det={np.mean(rates):.1%}  avg_ms={np.mean(ms_avg):.1f}")
        print(f"{'='*75}")

    print("\nDone!")


if __name__ == "__main__":
    main()
