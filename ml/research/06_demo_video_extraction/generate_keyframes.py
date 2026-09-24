"""
Generate TypeScript Keyframes from Extracted Landmarks
======================================================
Converts extracted landmarks into the keyframe format used by demoExercises.ts.

Selects representative frames (standing/down positions) and outputs TypeScript code.

Usage:
    python generate_keyframes.py --model mediapipe_heavy
    python generate_keyframes.py --model mediapipe_heavy --video pushup
"""

import argparse
import json
from pathlib import Path

import numpy as np

RESULTS_DIR = Path(__file__).parent / "results"


def load_extraction(video_name: str, model_name: str) -> dict:
    """Load extraction results for a video/model combination."""
    video_dir = RESULTS_DIR / video_name
    npz_path = video_dir / f"{video_name}_{model_name}.npz"
    json_path = video_dir / f"{video_name}_{model_name}.json"

    if not npz_path.exists():
        raise FileNotFoundError(f"No extraction found: {npz_path}")

    data = np.load(npz_path)
    with open(json_path) as f:
        meta = json.load(f)

    return {
        "landmarks": data["landmarks"],      # (N, 33, 3) or (N, 17, 3)
        "visibility": data["visibility"],    # (N, 33) or (N, 17)
        "meta": meta,
    }


def find_best_frames(
    landmarks: np.ndarray,
    visibility: np.ndarray,
    num_keyframes: int = 5,
) -> list[int]:
    """
    Find the best representative frames for keyframes.

    For looping exercises (lunge, pushup), we want:
    - Frame at t=0.0: Starting position
    - Frame at t=0.25: Bottom/mid position
    - Frame at t=0.5: Back to start
    - Frame at t=0.75: Bottom/mid again
    - Frame at t=1.0: End (same as start for looping)
    """
    n_frames = len(landmarks)

    # Calculate average visibility per frame (higher = better detection)
    frame_quality = np.mean(visibility, axis=1)

    # Target frame indices based on progress through video
    target_progress = [0.0, 0.25, 0.5, 0.75, 1.0]
    target_indices = [int(p * (n_frames - 1)) for p in target_progress]

    # For each target, find the best frame in a window around it
    window_size = max(1, n_frames // 20)  # 5% window
    selected = []

    for target_idx in target_indices:
        start = max(0, target_idx - window_size)
        end = min(n_frames, target_idx + window_size + 1)

        # Find frame with best visibility in window
        window_quality = frame_quality[start:end]
        best_local = np.argmax(window_quality)
        best_idx = start + best_local

        selected.append(best_idx)

    return selected


def detect_exercise_phases(
    landmarks: np.ndarray,
    exercise: str,
) -> dict[str, list[int]]:
    """
    Detect exercise phases (standing/down) based on landmark positions.

    For lunge: Track hip height (y-coordinate of hip landmarks)
    For pushup: Track shoulder height (y-coordinate)
    """
    n_frames = len(landmarks)

    if exercise == "lunge":
        # Hip landmarks: 23 (left_hip), 24 (right_hip)
        hip_y = (landmarks[:, 23, 1] + landmarks[:, 24, 1]) / 2

        # Normalize
        hip_y_norm = (hip_y - hip_y.min()) / (hip_y.max() - hip_y.min() + 1e-6)

        # Standing = low y value (higher in frame), Down = high y value
        threshold = 0.5
        standing_frames = np.where(hip_y_norm < threshold)[0]
        down_frames = np.where(hip_y_norm >= threshold)[0]

    elif exercise == "pushup":
        # Shoulder landmarks: 11 (left_shoulder), 12 (right_shoulder)
        shoulder_y = (landmarks[:, 11, 1] + landmarks[:, 12, 1]) / 2

        shoulder_y_norm = (shoulder_y - shoulder_y.min()) / (shoulder_y.max() - shoulder_y.min() + 1e-6)

        # Up = low y value, Down = high y value
        threshold = 0.5
        standing_frames = np.where(shoulder_y_norm < threshold)[0]  # "up" position
        down_frames = np.where(shoulder_y_norm >= threshold)[0]

    else:
        # Default: split by frame index
        mid = n_frames // 2
        standing_frames = np.arange(0, mid)
        down_frames = np.arange(mid, n_frames)

    return {
        "standing": standing_frames.tolist(),
        "down": down_frames.tolist(),
    }


def select_phase_representatives(
    landmarks: np.ndarray,
    visibility: np.ndarray,
    phases: dict[str, list[int]],
) -> dict[str, int]:
    """Select the best frame from each phase."""
    result = {}

    for phase_name, frame_indices in phases.items():
        if not frame_indices:
            continue

        # Find frame with highest average visibility
        phase_vis = visibility[frame_indices]
        avg_vis = np.mean(phase_vis, axis=1)
        best_local_idx = np.argmax(avg_vis)
        result[phase_name] = frame_indices[best_local_idx]

    return result


def format_landmarks_typescript(
    landmarks: np.ndarray,
    visibility: np.ndarray,
    indent: int = 2,
) -> str:
    """Format a single frame's landmarks as TypeScript array."""
    lines = []
    indent_str = "  " * indent

    for i, (lm, vis) in enumerate(zip(landmarks, visibility)):
        x, y, z = lm
        # Format as [x, y, z] with 2 decimal places
        line = f"{indent_str}[{x:.2f}, {y:.2f}, {z:.2f}],"

        # Add comment for low visibility landmarks
        if vis < 0.5:
            line += f"  // low vis: {vis:.2f}"

        lines.append(line)

    return "\n".join(lines)


def generate_typescript_keyframes(
    video_name: str,
    model_name: str,
    num_reps: int = 2,
) -> str:
    """Generate TypeScript keyframe definition for an exercise."""
    data = load_extraction(video_name, model_name)
    landmarks = data["landmarks"]
    visibility = data["visibility"]
    meta = data["meta"]

    exercise = video_name.lower()
    n_joints = landmarks.shape[1]

    print(f"\n{'='*60}")
    print(f"Generating keyframes for: {exercise}")
    print(f"Model: {model_name} ({n_joints} joints)")
    print(f"Frames: {len(landmarks)}")
    print(f"{'='*60}")

    # Detect phases and select representatives
    phases = detect_exercise_phases(landmarks, exercise)
    print(f"Detected phases: standing={len(phases['standing'])} frames, down={len(phases['down'])} frames")

    reps = select_phase_representatives(landmarks, visibility, phases)
    print(f"Selected representatives: {reps}")

    standing_idx = reps.get("standing", 0)
    down_idx = reps.get("down", len(landmarks) // 2)

    standing_lm = landmarks[standing_idx]
    standing_vis = visibility[standing_idx]
    down_lm = landmarks[down_idx]
    down_vis = visibility[down_idx]

    # Generate TypeScript
    exercise_upper = exercise.upper()
    ts_lines = [
        f"// ─── {exercise_upper} (extracted from {video_name} via {model_name}) ───",
        f"// Standing frame: {standing_idx}, Down frame: {down_idx}",
        f"",
        f"const {exercise_upper}_STANDING: [number, number, number][] = [",
    ]

    # Add standing landmarks
    for i, (lm, vis) in enumerate(zip(standing_lm, standing_vis)):
        x, y, z = lm
        comment = f"  // {i}: {meta['landmark_names'][i]}" if i < len(meta['landmark_names']) else ""
        ts_lines.append(f"  [{x:.3f}, {y:.3f}, {z:.3f}],{comment}")

    ts_lines.extend([
        "];",
        "",
        f"const {exercise_upper}_DOWN: [number, number, number][] = [",
    ])

    # Add down landmarks
    for i, (lm, vis) in enumerate(zip(down_lm, down_vis)):
        x, y, z = lm
        comment = f"  // {i}: {meta['landmark_names'][i]}" if i < len(meta['landmark_names']) else ""
        ts_lines.append(f"  [{x:.3f}, {y:.3f}, {z:.3f}],{comment}")

    ts_lines.extend([
        "];",
        "",
        "// Keyframes for looping animation",
        f"// Exercise registry entry:",
        "{",
        f"  id: '{exercise}',",
        f"  label: '{exercise.title()}',",
        f"  video: {exercise}Video,",
        "  keyframes: [",
        f"    {{ t: 0.0, landmarks: fullPose({exercise_upper}_STANDING) }},",
        f"    {{ t: 0.25, landmarks: fullPose({exercise_upper}_DOWN) }},",
        f"    {{ t: 0.5, landmarks: fullPose({exercise_upper}_STANDING) }},",
        f"    {{ t: 0.75, landmarks: fullPose({exercise_upper}_DOWN) }},",
        f"    {{ t: 1.0, landmarks: fullPose({exercise_upper}_STANDING) }},",
        "  ],",
        "  looping: true,",
        "},",
    ])

    return "\n".join(ts_lines)


def generate_raw_keyframes_json(
    video_name: str,
    model_name: str,
) -> dict:
    """Generate raw keyframe data as JSON (for further processing)."""
    data = load_extraction(video_name, model_name)
    landmarks = data["landmarks"]
    visibility = data["visibility"]

    phases = detect_exercise_phases(landmarks, video_name.lower())
    reps = select_phase_representatives(landmarks, visibility, phases)

    standing_idx = reps.get("standing", 0)
    down_idx = reps.get("down", len(landmarks) // 2)

    return {
        "exercise": video_name.lower(),
        "model": model_name,
        "standing_frame": standing_idx,
        "down_frame": down_idx,
        "standing_landmarks": landmarks[standing_idx].tolist(),
        "standing_visibility": visibility[standing_idx].tolist(),
        "down_landmarks": landmarks[down_idx].tolist(),
        "down_visibility": visibility[down_idx].tolist(),
    }


def list_available_extractions() -> list[tuple[str, str]]:
    """List all available video/model combinations."""
    available = []

    for video_dir in RESULTS_DIR.iterdir():
        if not video_dir.is_dir():
            continue
        video_name = video_dir.name

        for npz_file in video_dir.glob("*.npz"):
            # Extract model name from filename: {video}_{model}.npz
            model_name = npz_file.stem.replace(f"{video_name}_", "")
            available.append((video_name, model_name))

    return available


def main():
    parser = argparse.ArgumentParser(description="Generate TypeScript keyframes")
    parser.add_argument(
        "--model", type=str, default="mediapipe_heavy",
        help="Model to use for keyframe extraction"
    )
    parser.add_argument(
        "--video", type=str, default=None,
        help="Specific video (default: all available)"
    )
    parser.add_argument(
        "--list", action="store_true",
        help="List available extractions"
    )
    parser.add_argument(
        "--output", type=str, default=None,
        help="Output file (default: print to stdout)"
    )
    args = parser.parse_args()

    if args.list:
        available = list_available_extractions()
        if not available:
            print("No extractions found. Run extract_demo_landmarks.py first.")
            return

        print("Available extractions:")
        for video, model in sorted(available):
            print(f"  {video} / {model}")
        return

    available = list_available_extractions()
    if not available:
        print("No extractions found. Run extract_demo_landmarks.py first.")
        return

    # Filter by video if specified
    if args.video:
        available = [(v, m) for v, m in available if v == args.video.lower()]

    # Filter by model
    available = [(v, m) for v, m in available if m == args.model]

    if not available:
        print(f"No extractions found for model '{args.model}'")
        print("Available models:", set(m for _, m in list_available_extractions()))
        return

    # Generate keyframes
    all_output = []
    all_json = []

    for video_name, model_name in available:
        try:
            ts_code = generate_typescript_keyframes(video_name, model_name)
            all_output.append(ts_code)

            json_data = generate_raw_keyframes_json(video_name, model_name)
            all_json.append(json_data)

        except Exception as e:
            print(f"❌ Error processing {video_name}/{model_name}: {e}")

    # Output
    combined = "\n\n".join(all_output)

    if args.output:
        output_path = Path(args.output)
        output_path.write_text(combined)
        print(f"\n✅ Saved TypeScript to {output_path}")

        json_path = output_path.with_suffix(".json")
        with open(json_path, "w") as f:
            json.dump(all_json, f, indent=2)
        print(f"✅ Saved JSON to {json_path}")
    else:
        print("\n" + "="*70)
        print("GENERATED TYPESCRIPT KEYFRAMES")
        print("="*70)
        print(combined)
        print("\n" + "="*70)
        print("Copy the above into src/data/demoExercises.ts")
        print("="*70)


if __name__ == "__main__":
    main()
