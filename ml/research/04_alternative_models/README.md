# Alternative Pose Detection Models

This folder is for evaluating alternative pose detection models.

## Models to Evaluate

### 1. BlazePose (MediaPipe variants)
MediaPipe offers different BlazePose variants:
- **Lite** - Fastest, lowest accuracy
- **Full** - Balanced
- **Heavy** - Best accuracy, slowest

Already tested in `02_mediapipe_tuning/`.

### 2. YOLO-Pose (Ultralytics)
YOLO v8 includes pose estimation:
```bash
pip install ultralytics
```

Pros:
- Very fast
- Good accuracy
- Active development

Cons:
- Larger model size
- May not work well on mobile without optimization

### 3. MoveNet Variants
- **Lightning** (current) - 4.75 MB, ~30 FPS on mobile
- **Thunder** - More accurate but slower

### 4. OpenPose (Research only)
Too heavy for mobile, but useful as accuracy reference.

## Evaluation Criteria

| Criterion | Weight | Notes |
|-----------|--------|-------|
| Accuracy | 30% | PCK@0.1, MPJPE |
| Speed | 25% | Inference time on target device |
| Model Size | 20% | TFLite export size |
| Mobile Compatibility | 15% | TFLite/CoreML support |
| Stability | 10% | Frame-to-frame jitter |

## Adding a New Model

1. Create a test script: `test_{model_name}.py`
2. Implement the same interface as other test scripts
3. Run on the same test videos
4. Document results in this README

## Current Results

*To be filled in after experiments*

| Model | Detection Rate | Avg Visibility | Inference (ms) | Size (MB) |
|-------|---------------|----------------|----------------|-----------|
| MediaPipe Heavy | TBD | TBD | TBD | ~10 |
| MoveNet Lightning | TBD | TBD | TBD | 4.75 |
| YOLO-Pose v8n | TBD | TBD | TBD | TBD |
