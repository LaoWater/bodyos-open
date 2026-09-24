# ML Research Playground

This folder is dedicated to research and experimentation for improving BodyOS pose detection and correction accuracy.

## Research Priorities

### Priority 1: Orientation Robustness
Test and improve MediaPipe/MoveNet performance across portrait and landscape orientations.

### Priority 2: Exercise-Specific Accuracy
Ensure reliable landmark detection for each exercise type, especially:
- **Lateral views** (lunge, side squat) - historically challenging
- **Floor exercises** (push-up, plank) - horizontal body position

### Priority 3: Model Architecture Exploration
Determine optimal approach:
- Single orientation-aware model
- Per-orientation models
- Per-exercise models

## Directory Structure

```
research/
├── README.md                          # This file
├── requirements.txt                   # Additional research dependencies
│
├── 01_orientation_analysis/           # Portrait vs Landscape testing
│   ├── analyze_orientation_accuracy.py
│   └── results/
│
├── 02_mediapipe_tuning/              # MediaPipe parameter exploration
│   ├── test_model_complexity.py
│   ├── test_confidence_thresholds.py
│   └── results/
│
├── 03_movenet_vs_mediapipe/          # Compare detection models
│   ├── compare_detectors.py
│   └── results/
│
├── 04_alternative_models/            # Test other pose models
│   ├── test_blazepose.py
│   ├── test_yolo_pose.py
│   └── results/
│
├── 05_fine_tuning/                   # Model fine-tuning experiments
│   ├── finetune_mediapipe.py
│   └── results/
│
└── notebooks/                        # Exploratory notebooks
    ├── orientation_deep_dive.ipynb
    └── landmark_confidence_analysis.ipynb
```

## Getting Started

1. Set up environment:
```bash
cd ml
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r research/requirements.txt
```

2. Collect test data:
   - Record videos in both orientations
   - Include variety of body types and environments
   - See `docs/DATA_SPECIFICATION.md` for requirements

3. Run baseline analysis:
```bash
python research/01_orientation_analysis/analyze_orientation_accuracy.py
```

## Key Questions to Answer

### Orientation
- [ ] Does MoveNet perform equally on portrait vs landscape?
- [ ] Does MediaPipe Heavy handle horizontal body poses well?
- [ ] Should we rotate landscape frames to portrait before inference?
- [ ] How does aspect ratio affect normalized coordinate distributions?

### Confidence & Accuracy
- [ ] What visibility thresholds work best per exercise?
- [ ] Which joints are most problematic in each orientation?
- [ ] How does lighting affect each model?
- [ ] What's the minimum resolution for reliable detection?

### Architecture
- [ ] Can one model handle all orientations effectively?
- [ ] Is there significant accuracy gain from per-exercise models?
- [ ] What's the accuracy/size trade-off for model complexity?

### Alternative Models
- [ ] How does BlazePose compare to MoveNet for our use cases?
- [ ] Is YOLO-Pose viable for real-time mobile inference?
- [ ] Can we use ensemble approaches?

## Reporting Results

For each experiment:
1. Document hypothesis and methodology
2. Record quantitative metrics (accuracy, confidence, FPS)
3. Note qualitative observations
4. Save visualizations in `results/` subfolder
5. Update this README with findings

## Metrics to Track

### Detection Quality
- **Joint visibility score** - Average confidence per joint
- **Frame success rate** - % frames with valid pose detected
- **Outlier rate** - % frames with obviously wrong detections

### Accuracy (vs ground truth)
- **PCK@0.1** - Percentage of Correct Keypoints within 10% of torso size
- **MPJPE** - Mean Per Joint Position Error (in pixels)
- **OKS** - Object Keypoint Similarity (COCO metric)

### Performance
- **Inference time** - ms per frame
- **Memory usage** - Peak memory during inference
- **Battery impact** - Power consumption over extended use
