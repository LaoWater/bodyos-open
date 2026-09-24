# Mobile Pose Detection - Performance Reality Check

## Current Setup (iPhone 15 Pro)

You're running **MoveNet Lightning** via:
- `react-native-fast-tflite` with CoreML delegate
- 192×192 input, 17 keypoints output
- Running on every camera frame (~30fps)

**Issue**: Phone warms up even with the lightest model.

## Why the Heat?

### 1. Frame Rate is the Killer
Running inference on **every frame at 30fps** = 30 inferences/second

Even if each inference is fast (5-10ms), the sustained load causes:
- Neural Engine constantly active
- Memory bandwidth pressure
- No thermal throttling window

### 2. Camera + ML = Double Whammy
- Camera capture itself uses significant power
- Frame resizing (to 192×192) adds overhead
- Data transfer between GPU → Neural Engine → CPU

## Model Comparison (Mobile-Focused)

| Model | Input Size | Params | iPhone 15 Pro | Heat Risk |
|-------|------------|--------|---------------|-----------|
| **MoveNet Lightning** | 192×192 | 2.4M | ~5ms | Medium |
| **MoveNet Thunder** | 256×256 | 6.9M | ~15ms | High |
| **MediaPipe Lite** | 256×256 | ~3M | ~8ms | Medium |
| **MediaPipe Full** | 256×256 | ~6M | ~15ms | High |
| **MediaPipe Heavy** | 256×256 | ~10M | ~30ms | Very High |
| **BlazePose Pro** | 256×256 | ~10M | ~30ms | Very High |

**Reality**: For real-time mobile use, you're already at the limit with MoveNet Lightning.

## Solutions to Reduce Heat

### Option 1: Reduce Inference Rate (Recommended)
Instead of every frame, run inference every 2-3 frames:

```typescript
// In frame processor
const frameCount = useRef(0);

const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  frameCount.value++;

  // Only run inference every 3rd frame (~10 FPS inference)
  if (frameCount.value % 3 !== 0) return;

  // ... inference code
}, []);
```

**Trade-off**: Skeleton updates at 10fps instead of 30fps. Still smooth visually.

### Option 2: Adaptive Frame Skipping
Skip more frames when phone gets hot:

```typescript
// Detect thermal state (iOS provides this)
const thermalState = useThermalState(); // 'nominal' | 'fair' | 'serious' | 'critical'

const skipFrames = thermalState === 'nominal' ? 2 :
                   thermalState === 'fair' ? 3 :
                   thermalState === 'serious' ? 5 : 10;
```

### Option 3: Lower Camera Resolution
The camera might be capturing at 4K/1080p then downscaling:

```typescript
// Use lower resolution preset
<Camera
  preset="medium"  // Instead of "high" or "photo"
  // or explicit:
  format={device.formats.find(f => f.videoWidth <= 720)}
/>
```

### Option 4: Use GPU Delegate Instead of CoreML
Sometimes CoreML keeps the Neural Engine pinned. GPU delegate might distribute load better:

```typescript
const modelState = useTensorflowModel(
  require('../../assets/models/movenet_singlepose_lightning.tflite'),
  'gpu',  // Instead of 'core-ml'
);
```

### Option 5: Session-Based Inference
Only run continuous inference during "active" exercise:
- Show static preview otherwise
- Start inference when user taps "Start Exercise"
- Stop after rep is complete

## For Demo Video Keyframe Extraction

The good news: **For extracting keyframes from demo videos, you can use any model!**

This runs on your Mac, not the phone. Use the most accurate model:
- **BlazePose Pro Heavy** - Best accuracy for keyframe extraction
- **MediaPipe Heavy** - Second best

The keyframes are pre-computed and baked into the app. No inference needed at runtime for demo mode.

## Recommendation for Your App

### Runtime (On-Device)
Keep **MoveNet Lightning** but:
1. **Reduce to 10-15 FPS inference** (every 2-3 frames)
2. **Interpolate skeleton** between inferences for smooth display
3. **Add thermal monitoring** to back off when hot

### Demo Video Keyframes (This Script)
Use **BlazePose Pro Heavy** for best accuracy - it only runs once on your Mac.

### Future Options
- **MoveNet MultiPose Lightning** - Same speed, handles multiple people
- **Custom quantized model** - Train on your specific exercises
- **Apple Vision framework** - Native iOS pose detection (but 17 joints only)

## Apple Vision Framework Alternative

iOS 14+ has built-in pose detection:

```swift
// Native iOS - potentially more power efficient
import Vision

let request = VNDetectHumanBodyPoseRequest { request, error in
    guard let results = request.results as? [VNHumanBodyPoseObservation] else { return }
    // 17 keypoints, similar to MoveNet
}
```

Pros:
- Apple-optimized for their hardware
- Might have better thermal management
- No model bundling needed

Cons:
- Only 17 keypoints (no hands/face detail)
- Less control over model behavior
- Need native module for React Native

## TL;DR

1. **Heat is normal** with continuous ML inference
2. **Skip frames** (run at 10-15 FPS instead of 30)
3. **Use MoveNet Lightning** on device (already optimal)
4. **Use BlazePose Heavy** for demo keyframe extraction (runs on Mac)
5. Consider **Apple Vision** for potentially better thermal behavior
