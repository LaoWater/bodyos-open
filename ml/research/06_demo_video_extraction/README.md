# Demo Video Landmark Extraction & Model Comparison

Extract accurate pose landmarks from demo videos and compare multiple pose estimation models.

## Models Compared

| Model | API | Joints | Size | Notes |
|-------|-----|--------|------|-------|
| **MediaPipe Lite** | Solutions | 33 | ~3MB | Fastest, lowest accuracy |
| **MediaPipe Full** | Solutions | 33 | ~6MB | Balanced |
| **MediaPipe Heavy** | Solutions | 33 | ~10MB | Best accuracy (legacy) |
| **BlazePose Pro Full** | Tasks | 33 | ~6MB | Google's professional API |
| **BlazePose Pro Heavy** | Tasks | 33 | ~10MB | Google's professional API (recommended) |
| **MoveNet Lightning** | TF Hub | 17 | 4.75MB | Very fast, mobile-optimized |
| **MoveNet Thunder** | TF Hub | 17 | 12MB | More accurate MoveNet |

### MediaPipe Solutions vs Tasks API

- **Solutions API** (legacy): `mediapipe.solutions.pose` - Works well but older
- **Tasks API** (professional): `mediapipe.tasks.vision.PoseLandmarker` - Google's newer, production-ready API with better accuracy and model management

## Goals

1. **Extract landmarks** from `lunge.MOV` and `pushup.mov` demo videos
2. **Compare all models** on the same videos
3. **Generate keyframes** for `demoExercises.ts` that perfectly match the videos
4. **Identify best model** for each exercise type

## Files

```
06_demo_video_extraction/
├── README.md                    # This file
├── extract_demo_landmarks.py    # Main extraction (all models)
├── generate_keyframes.py        # Convert to TypeScript keyframes
├── visualize_overlay.py         # Preview skeleton on video
└── results/
    ├── lunge/
    │   ├── lunge_mediapipe_heavy.npz
    │   ├── lunge_blazepose_pro_heavy.npz
    │   └── ...
    └── pushup/
        └── ...
```

## Setup

```bash
# Navigate to ML directory
cd /Users/neo/Neo/gymcam/GymCam/ml

# Create/activate virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -r research/requirements.txt

# Optional: Install TensorFlow for MoveNet
pip install tensorflow tensorflow-hub

# Optional: Install YOLO-Pose
pip install ultralytics
```

## Usage

### 1. Extract Landmarks (All Models)

```bash
cd /Users/neo/Neo/gymcam/GymCam/ml

# Process all demo videos with all models
python research/06_demo_video_extraction/extract_demo_landmarks.py

# Process specific video
python research/06_demo_video_extraction/extract_demo_landmarks.py --video lunge
```

### 2. View Model Comparison

```bash
# Compare all models on a single frame
python research/06_demo_video_extraction/visualize_overlay.py --video lunge --compare

# View specific model overlay
python research/06_demo_video_extraction/visualize_overlay.py --video pushup --model blazepose_pro_heavy

# Save overlay video
python research/06_demo_video_extraction/visualize_overlay.py --video lunge --model mediapipe_heavy --save
```

### 3. Generate TypeScript Keyframes

```bash
# List available extractions
python research/06_demo_video_extraction/generate_keyframes.py --list

# Generate keyframes using best model
python research/06_demo_video_extraction/generate_keyframes.py --model blazepose_pro_heavy

# Save to file
python research/06_demo_video_extraction/generate_keyframes.py --model blazepose_pro_heavy --output keyframes.ts
```

### 4. Update demoExercises.ts

Copy the generated TypeScript code into `src/data/demoExercises.ts`, replacing the placeholder keyframes.

## Output Format

### NPZ Files
```python
# Load extracted landmarks
data = np.load("results/lunge/lunge_mediapipe_heavy.npz")
landmarks = data["landmarks"]      # (N_frames, 33, 3) - x, y, z normalized
visibility = data["visibility"]    # (N_frames, 33) - confidence 0-1
```

### JSON Metadata
```json
{
  "model_name": "blazepose_pro_heavy",
  "video_name": "lunge",
  "fps": 30.0,
  "frame_count": 450,
  "avg_inference_ms": 45.2,
  "avg_visibility": 0.89,
  "detection_rate": 0.98,
  "landmark_names": ["nose", "left_eye_inner", ...]
}
```

## Metrics to Compare

| Metric | Description |
|--------|-------------|
| **Detection Rate** | % of frames with valid pose detected |
| **Avg Visibility** | Mean landmark confidence across frames |
| **Inference Time** | ms per frame (on this machine) |
| **Jitter** | Frame-to-frame landmark stability |

## Expected Results

For gym exercise videos:
- **BlazePose Pro Heavy** typically gives best accuracy for full-body exercises
- **MoveNet Thunder** is a good alternative with faster inference
- **MediaPipe Heavy (Solutions)** is reliable fallback

For floor exercises (pushup):
- Models may struggle with horizontal body orientation
- Check visibility of hip/knee/ankle landmarks

## Troubleshooting

### MediaPipe Tasks not available
```bash
pip install --upgrade mediapipe>=0.10.9
```

### TensorFlow errors
```bash
# On Apple Silicon
pip install tensorflow-macos tensorflow-metal
```

### Video codec issues
```bash
# Install ffmpeg
brew install ffmpeg
```
