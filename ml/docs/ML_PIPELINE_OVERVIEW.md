# ML Pipeline Overview

## Goal

Train a model that takes **MediaPipe pose landmarks as input** and predicts:

1. **Correct-form landmarks** — what the body *should* look like at this point in the exercise
2. **Exercise phase %** (optional) — how deep into the rep the user is (0.0=start, 0.5=deepest, 1.0=back)

The outputs get overlaid on the user's live camera feed: their actual pose + the "ideal" pose skeleton.

## Phase 1 Strategy: Correct-Form Only

We train on **correct exercise videos only** (no wrong-form examples). The model learns:
> "Given these landmarks at phase X of exercise Y, here's what correct form looks like."

This is simpler than paired A/B (wrong input -> correct output) training, and gives us a working baseline fast.

**Starting exercise: Push-up** (`pushup.mov`), then expand to lunge.

### Why This Works

- Correct-form training teaches the model the **ideal pose manifold** per exercise
- At inference, the user's actual landmarks go in, and the model outputs the nearest "correct" configuration
- The delta between input and output = the form correction signal
- Phase awareness means the model knows elbows should be bent at phase 0.5 but straight at phase 0.0

## Architecture

```
Raw Videos (.mov/.mp4)
    |
    v
[01] Landmark Extraction  (MediaPipe Pose Heavy, 33 landmarks)
    |                       -> data/extracted/*.npz
    v
[02] Visualize & Validate  (skeleton overlays, confidence heatmaps)
    |                       -> visual QA, no output files
    v
[03] Phase Labeling        (auto-detect reps, label 0.0-1.0)
    |                       -> data/labeled/*_labeled.npz
    v
[04] Train Model           (dual-output: phase + correct landmarks)
    |                       -> models/pose_correction.keras
    v
[05] Export to TFLite       (float16 quantization, ~60KB)
                            -> models/exported/pose_correction.tflite
```

## Model Architecture

```
Input (101 floats) -> Shared Encoder -> Two Heads

Input:  33 landmarks x 3 coords = 99  +  2 exercise one-hot = 101
        (hip-centered, torso-scaled normalization)

Shared: Dense(128) -> Dropout -> Dense(64) -> Dropout -> Dense(32)
              |
     +--------+--------+
     v                  v
Phase Head         Correction Head
Dense(16)          Concat(shared, phase)
Dense(1, sigmoid)  Dense(64) -> Dense(128) -> Dense(99)
     |                  |
     v                  v
Phase (0-1)        Corrected Landmarks (99 floats)

Loss = 0.3 * phase_MSE + 1.0 * landmark_MSE
~30K parameters -> ~60KB in float16 TFLite
```

## Key Design Decisions

### MediaPipe 33 Landmarks (Not MoveNet 17)

Research showed MediaPipe Lite/Full/Heavy all achieve 100% detection at high quality.
We use all 33 landmarks throughout — no MoveNet subset extraction needed:
- More data = better form analysis (hands, feet, face orientation)
- Simpler pipeline (no index mapping between 33 and 17)
- MediaPipe is the detector on both device (Lite) and cloud (Heavy)

### Normalization (Must Match App-Side)

1. Compute hip center: (L_HIP + R_HIP) / 2
2. Compute torso scale: distance(hip_center, shoulder_center)
3. Normalize: (landmark - hip_center) / torso_scale
4. Flatten to 99 floats (33 x 3)

**Critical:** The TypeScript normalization in the app must be identical.

### Exercise Encoding

```python
EXERCISE_IDS = {"pushup": 0, "lunge": 1}  # Expand as exercises are added
```

### Portrait Orientation

All current exercises work in portrait. No orientation encoding needed.
If landscape exercises are added later, we revisit.

## Notebook Workflow

Run in order. Each notebook is self-contained with clear inputs/outputs.

| # | Notebook | Input | Output |
|---|----------|-------|--------|
| 01 | Extract Landmarks | `data/raw_videos/{exercise}/*.mov,*.mp4` | `data/extracted/*.npz + *.json` |
| 02 | Visualize & Validate | `data/extracted/*.npz` | Visual QA (no files) |
| 03 | Label Phases | `data/extracted/*.npz` | `data/labeled/*_labeled.npz` |
| 04 | Train Model | `data/labeled/*_labeled.npz` | `models/pose_correction.keras` |
| 05 | Export TFLite | `models/pose_correction.keras` | `models/exported/pose_correction.tflite` |

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Phase MAE | < 0.05 | On 0-1 scale |
| Landmark MSE | < 0.001 | Normalized coordinate space |
| Model Size | < 100KB | TFLite float16 |
| Inference | < 10ms | Mid-range mobile device |

## On-Device Inference Flow

```
Camera Frame (RGB)
    |
    v
MediaPipe Lite (on-device, 11ms)  -->  33 landmarks
    |
    v
Normalize (hip-center, torso-scale)
    |
    v
pose_correction.tflite
    |
    +---> Phase (0.0 - 1.0)
    +---> Correct Landmarks (99 floats -> reshape to 33x3)
              |
              v
    Denormalize with user's hip_center + torso_scale
              |
              v
    Overlay on camera: user skeleton (actual) + ideal skeleton (corrected)
```

## Adding New Exercises

1. Record correct-form videos, place in `data/raw_videos/{exercise}/`
2. Add exercise angle config to `src/phase_labeler.py` (EXERCISE_ANGLES)
3. Add exercise ID to `src/normalization.py` (EXERCISE_IDS)
4. Re-run notebooks 01-05
5. Update TypeScript exercise map to match
