"""
Visualize Skeleton Overlay on Demo Videos
==========================================
Preview how the extracted landmarks look overlaid on the original video frames.
Useful for validating extraction quality and comparing models.

Usage:
    python visualize_overlay.py --video lunge --model mediapipe_heavy
    python visualize_overlay.py --video pushup --model mediapipe_heavy --save
"""

import argparse
from pathlib import Path

import cv2
import numpy as np

RESULTS_DIR = Path(__file__).parent / "results"
DEMO_VIDEOS_DIR = Path(__file__).parent.parent / "data" / "portrait"

# MediaPipe skeleton connections (33 landmarks)
MEDIAPIPE_CONNECTIONS = [
    # Face
    (0, 1), (1, 2), (2, 3), (3, 7),  # Left eye
    (0, 4), (4, 5), (5, 6), (6, 8),  # Right eye
    (9, 10),  # Mouth
    # Torso
    (11, 12),  # Shoulders
    (11, 23), (12, 24),  # Shoulder to hip
    (23, 24),  # Hips
    # Left arm
    (11, 13), (13, 15), (15, 17), (15, 19), (15, 21), (17, 19),
    # Right arm
    (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20),
    # Left leg
    (23, 25), (25, 27), (27, 29), (27, 31), (29, 31),
    # Right leg
    (24, 26), (26, 28), (28, 30), (28, 32), (30, 32),
]

# MoveNet skeleton connections (17 landmarks)
MOVENET_CONNECTIONS = [
    (0, 1), (0, 2),  # Nose to eyes
    (1, 3), (2, 4),  # Eyes to ears
    (5, 6),  # Shoulders
    (5, 7), (7, 9),  # Left arm
    (6, 8), (8, 10),  # Right arm
    (5, 11), (6, 12),  # Shoulders to hips
    (11, 12),  # Hips
    (11, 13), (13, 15),  # Left leg
    (12, 14), (14, 16),  # Right leg
]

# Colors for different visibility levels
COLOR_HIGH_VIS = (0, 255, 0)    # Green
COLOR_MED_VIS = (0, 255, 255)   # Yellow
COLOR_LOW_VIS = (0, 0, 255)     # Red
COLOR_BONE = (255, 255, 255)    # White


def get_video_path(video_name: str) -> Path:
    """Find the video file."""
    for ext in [".mov", ".MOV", ".mp4", ".MP4"]:
        path = DEMO_VIDEOS_DIR / f"{video_name}{ext}"
        if path.exists():
            return path
    raise FileNotFoundError(f"No video found for: {video_name}")


def load_extraction(video_name: str, model_name: str) -> dict:
    """Load extraction results."""
    video_dir = RESULTS_DIR / video_name.lower()
    npz_path = video_dir / f"{video_name.lower()}_{model_name}.npz"

    if not npz_path.exists():
        raise FileNotFoundError(f"No extraction found: {npz_path}")

    data = np.load(npz_path)
    return {
        "landmarks": data["landmarks"],
        "visibility": data["visibility"],
    }


def draw_skeleton(
    frame: np.ndarray,
    landmarks: np.ndarray,
    visibility: np.ndarray,
    connections: list,
    scale: tuple = None,
) -> np.ndarray:
    """Draw skeleton overlay on a frame."""
    h, w = frame.shape[:2]
    if scale is None:
        scale = (w, h)

    output = frame.copy()

    # Draw connections (bones)
    for start_idx, end_idx in connections:
        if start_idx >= len(landmarks) or end_idx >= len(landmarks):
            continue

        vis_start = visibility[start_idx]
        vis_end = visibility[end_idx]

        if vis_start < 0.3 or vis_end < 0.3:
            continue

        x1, y1 = int(landmarks[start_idx, 0] * scale[0]), int(landmarks[start_idx, 1] * scale[1])
        x2, y2 = int(landmarks[end_idx, 0] * scale[0]), int(landmarks[end_idx, 1] * scale[1])

        # Color based on average visibility
        avg_vis = (vis_start + vis_end) / 2
        if avg_vis > 0.7:
            color = COLOR_BONE
        elif avg_vis > 0.5:
            color = COLOR_MED_VIS
        else:
            color = COLOR_LOW_VIS

        cv2.line(output, (x1, y1), (x2, y2), color, 2)

    # Draw landmarks (joints)
    for i, (lm, vis) in enumerate(zip(landmarks, visibility)):
        if vis < 0.3:
            continue

        x, y = int(lm[0] * scale[0]), int(lm[1] * scale[1])

        # Color based on visibility
        if vis > 0.7:
            color = COLOR_HIGH_VIS
        elif vis > 0.5:
            color = COLOR_MED_VIS
        else:
            color = COLOR_LOW_VIS

        cv2.circle(output, (x, y), 4, color, -1)
        cv2.circle(output, (x, y), 6, (0, 0, 0), 1)

    return output


def visualize_video(
    video_name: str,
    model_name: str,
    save_output: bool = False,
    max_frames: int = None,
):
    """Visualize skeleton overlay on video."""
    # Load video and extraction
    video_path = get_video_path(video_name)
    data = load_extraction(video_name, model_name)
    landmarks = data["landmarks"]
    visibility = data["visibility"]

    # Determine connections based on number of landmarks
    n_joints = landmarks.shape[1]
    connections = MEDIAPIPE_CONNECTIONS if n_joints == 33 else MOVENET_CONNECTIONS

    # Open video
    cap = cv2.VideoCapture(str(video_path))
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    print(f"Video: {video_path.name}")
    print(f"Model: {model_name} ({n_joints} joints)")
    print(f"Resolution: {width}x{height} @ {fps:.1f} FPS")
    print(f"Frames: {total_frames}")

    # Setup output video if saving
    writer = None
    if save_output:
        output_dir = RESULTS_DIR / video_name.lower()
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{video_name}_{model_name}_overlay.mp4"
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))
        print(f"Saving to: {output_path}")

    # Process frames
    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if max_frames and frame_idx >= max_frames:
            break

        if frame_idx < len(landmarks):
            frame_lm = landmarks[frame_idx]
            frame_vis = visibility[frame_idx]

            # Draw skeleton
            frame = draw_skeleton(
                frame, frame_lm, frame_vis,
                connections, scale=(width, height)
            )

            # Add info text
            avg_vis = np.mean(frame_vis[frame_vis > 0]) if np.any(frame_vis > 0) else 0
            text = f"Frame {frame_idx}/{total_frames} | Avg Vis: {avg_vis:.2f} | Model: {model_name}"
            cv2.putText(frame, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        if writer:
            writer.write(frame)
        else:
            # Display
            cv2.imshow(f"Skeleton Overlay - {video_name} - {model_name}", frame)

            key = cv2.waitKey(int(1000 / fps)) & 0xFF
            if key == ord("q"):
                break
            elif key == ord(" "):
                # Pause
                cv2.waitKey(0)

        frame_idx += 1

    cap.release()
    if writer:
        writer.release()
        print(f"✅ Saved overlay video to {output_path}")
    else:
        cv2.destroyAllWindows()


def create_comparison_image(
    video_name: str,
    models: list[str],
    frame_idx: int = None,
) -> np.ndarray:
    """Create side-by-side comparison of different models."""
    video_path = get_video_path(video_name)

    # Load video frame
    cap = cv2.VideoCapture(str(video_path))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if frame_idx is None:
        frame_idx = total_frames // 2  # Middle frame

    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
    ret, frame = cap.read()
    cap.release()

    if not ret:
        raise RuntimeError(f"Could not read frame {frame_idx}")

    h, w = frame.shape[:2]

    # Create comparison grid
    images = []
    for model_name in models:
        try:
            data = load_extraction(video_name, model_name)
            landmarks = data["landmarks"][frame_idx]
            visibility = data["visibility"][frame_idx]

            n_joints = data["landmarks"].shape[1]
            connections = MEDIAPIPE_CONNECTIONS if n_joints == 33 else MOVENET_CONNECTIONS

            overlay = draw_skeleton(
                frame.copy(), landmarks, visibility,
                connections, scale=(w, h)
            )

            # Add model name
            cv2.putText(overlay, model_name, (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

            images.append(overlay)
        except Exception as e:
            print(f"  Skipping {model_name}: {e}")
            # Create blank with error message
            blank = frame.copy()
            cv2.putText(blank, f"{model_name}: N/A", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
            images.append(blank)

    if not images:
        return frame

    # Arrange in grid
    n_cols = min(3, len(images))
    n_rows = (len(images) + n_cols - 1) // n_cols

    # Resize images for grid
    thumb_w, thumb_h = 640, 480
    resized = [cv2.resize(img, (thumb_w, thumb_h)) for img in images]

    # Pad to full grid
    while len(resized) < n_rows * n_cols:
        resized.append(np.zeros((thumb_h, thumb_w, 3), dtype=np.uint8))

    # Create grid
    rows = []
    for r in range(n_rows):
        row_imgs = resized[r * n_cols:(r + 1) * n_cols]
        rows.append(np.hstack(row_imgs))

    grid = np.vstack(rows)

    return grid


def main():
    parser = argparse.ArgumentParser(description="Visualize skeleton overlay")
    parser.add_argument("--video", type=str, required=True, help="Video name (lunge/pushup)")
    parser.add_argument("--model", type=str, default="mediapipe_heavy", help="Model name")
    parser.add_argument("--save", action="store_true", help="Save output video")
    parser.add_argument("--compare", action="store_true", help="Compare all models on one frame")
    parser.add_argument("--frame", type=int, default=None, help="Specific frame for comparison")
    args = parser.parse_args()

    if args.compare:
        # Compare all available models
        models = [
            "mediapipe_lite", "mediapipe_full", "mediapipe_heavy",
            "movenet_lightning", "movenet_thunder",
        ]

        print(f"Creating comparison for {args.video}...")
        grid = create_comparison_image(args.video, models, args.frame)

        output_path = RESULTS_DIR / args.video.lower() / f"{args.video}_model_comparison.png"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(output_path), grid)
        print(f"✅ Saved comparison to {output_path}")

        cv2.imshow("Model Comparison", grid)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

    else:
        visualize_video(args.video, args.model, save_output=args.save)


if __name__ == "__main__":
    main()
