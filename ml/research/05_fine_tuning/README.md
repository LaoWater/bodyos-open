# Fine-Tuning Pose Detection Models

This folder contains experiments for fine-tuning pose detection models on our specific exercise dataset.

## Why Fine-Tune?

Pre-trained models (MoveNet, MediaPipe) are trained on general pose datasets that may not include:
- Horizontal body positions (push-ups, planks)
- Exercise-specific poses at various phases
- Lateral views (side-on lunges)

Fine-tuning on our data could improve:
- Detection reliability for challenging poses
- Joint visibility confidence
- Frame-to-frame stability

## Approaches

### 1. MediaPipe Fine-Tuning
MediaPipe doesn't officially support fine-tuning, but workarounds exist:
- Export to TFLite and retrain final layers
- Use MediaPipe Model Maker (limited support)

### 2. MoveNet Fine-Tuning
TensorFlow provides guides for fine-tuning MoveNet:
- [MoveNet TF Hub](https://tfhub.dev/google/movenet/singlepose/lightning/4)
- Requires COCO-format annotations

### 3. Train Custom Model
If fine-tuning fails, train a lightweight model from scratch:
- Use MediaPipe Heavy as "teacher" model
- Train student model on our data
- Distillation approach

## Data Requirements for Fine-Tuning

### Annotation Format (COCO-style)
```json
{
  "images": [
    {"id": 1, "file_name": "frame_001.jpg", "width": 1920, "height": 1080}
  ],
  "annotations": [
    {
      "id": 1,
      "image_id": 1,
      "keypoints": [x1, y1, v1, x2, y2, v2, ...],  // 17 keypoints × 3
      "num_keypoints": 17,
      "bbox": [x, y, width, height]
    }
  ],
  "categories": [
    {"id": 1, "name": "person", "keypoints": ["nose", ...], "skeleton": [[0,1], ...]}
  ]
}
```

### Creating Annotations
1. Use MediaPipe Heavy to extract pseudo-ground-truth
2. Manually correct obvious errors
3. Export in COCO format

Script: `create_annotations.py` (to be created)

## Experiments Log

### Experiment 1: [Date]
- **Model**: TBD
- **Data**: TBD
- **Result**: TBD

## Resources

- [MoveNet Fine-tuning Guide](https://www.tensorflow.org/hub/tutorials/movenet)
- [COCO Keypoint Format](https://cocodataset.org/#format-data)
- [TFLite Model Maker](https://www.tensorflow.org/lite/models/modify/model_maker)
