# Data Specification

## Phase 1 Scope

**Exercises:** Push-up (primary), Lunge (secondary)
**Training data:** Correct form only (no error videos yet)
**Source videos:** `pushup.mov`, `lunge.mov` in `research/data/portrait/`
**Orientation:** Portrait (works well for both exercises per research findings)

## Video Requirements

```yaml
Format: .mov or .mp4 (H.264 codec)
Resolution: 1080x1920 portrait (min 720x1280)
Frame Rate: 30 FPS (24-60 acceptable)
Duration: 10-60 seconds per clip
Subject: Full body visible, athletic wear, side view preferred
Lighting: Well-lit, even, minimal shadows
Background: Uncluttered, good contrast with subject
```

## Data Directory Structure

```
ml/
├── data/
│   ├── raw_videos/              # Source videos organized by exercise
│   │   ├── pushup/
│   │   │   ├── pushup.mov       # Correct form video(s)
│   │   │   └── pushup.mp4       # (auto-converted from .mov if needed)
│   │   └── lunge/
│   │       ├── lunge.mov
│   │       └── lunge.mp4
│   │
│   ├── extracted/               # Output from notebook 01
│   │   ├── pushup.npz           # (N, 33, 3) landmarks + (N, 33) visibility
│   │   └── pushup.json          # metadata (exercise, fps, quality)
│   │
│   └── labeled/                 # Output from notebook 03
│       ├── pushup_labeled.npz   # landmarks + phases + rep_numbers
│       └── pushup_labeled.json  # metadata
│
├── research/data/portrait/      # Original source videos
│   ├── pushup.mov
│   └── lunge.mov
```

## Extracted Data Format

### NPZ from Landmark Extraction (Notebook 01)
```python
data = np.load('pushup.npz')
data['landmarks']   # (num_frames, 33, 3) — x, y, z per landmark
data['visibility']  # (num_frames, 33)    — confidence per landmark
```

### NPZ from Phase Labeling (Notebook 03)
```python
data = np.load('pushup_labeled.npz')
data['landmarks']      # (num_frames, 33, 3)
data['phases']         # (num_frames,) — 0.0 to 1.0
data['rep_numbers']    # (num_frames,) — 0, 1, 2, ...
data['primary_angles'] # (num_frames,) — key joint angle in degrees
```

## Model Input/Output

### Input (101 floats)
```
Index 0-98:    Normalized landmarks (33 joints x 3 coords)
Index 99-100:  Exercise one-hot [pushup, lunge]  (expandable)
```

Normalization: hip-centered, torso-scaled (see normalization.py)

### Output (dual-head)
```
Phase head:      1 float (0.0 - 1.0)
Correction head: 99 floats (correct-form landmarks, normalized)
```

## Quality Criteria

**Good frame:**
- All major joints visible (shoulders, elbows, wrists, hips, knees, ankles)
- Joint confidence > 0.6 for at least 60% of major joints
- Body bounding box covers 30-85% of frame area

## Data Split

- Split by VIDEO, not by frame (prevents data leakage)
- 80% train / 10% val / 10% test
- With few videos, augmentation is critical (6x per sample)

## Augmentation

Applied automatically during training (see `augmentation.py`):
- Horizontal mirror (L/R swap)
- Gaussian noise (sigma=0.008)
- 2D rotation (+/-5 degrees)
- Limb proportion scaling (+/-10%)
- Combined augmentations

Each sample generates ~6 augmented variants.

## Phase 2+ Expansion

When ready to add error correction (A/B training):
1. Record intentional error videos with labels (elbows_flared, hips_sagging, etc.)
2. Pair error input with correct-form output as targets
3. Model learns: "given this wrong pose at phase X, here's the corrected version"
