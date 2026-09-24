# Research Findings: On-Device Pose Model Selection

**Date:** February 2025
**Test videos:** `pushup.mov`, `lunge.mov` (portrait orientation, 9:16)

---

## What We Tested

Ran MediaPipe PoseLandmarker (Lite / Full / Heavy) on both videos with
skeleton overlays to visually compare tracking quality, plus collected
detection rate, average joint visibility, and inference time.

MoveNet (Lightning / Thunder) was not tested — TensorFlow does not ship
Windows wheels for Python 3.13. We evaluated whether it was worth pursuing
and concluded it is not needed at this stage (see rationale below).

---

## Results

### Lunge (portrait, 1161 frames)

| Model     | Detection | Avg Visibility | Avg Inference | On-device? |
|-----------|-----------|----------------|---------------|------------|
| **Lite**  | 100%      | 0.862          | 11 ms         | yes        |
| **Full**  | 100%      | 0.848          | 15 ms         | yes        |
| **Heavy** | 100%      | 0.840          | 47 ms         | cloud      |

### Push-up (portrait, ~similar length)

| Model     | Detection | Avg Visibility | Avg Inference | On-device? |
|-----------|-----------|----------------|---------------|------------|
| **Lite**  | 100%      | 0.837          | 11 ms         | yes        |
| **Full**  | 100%      | 0.823          | 15 ms         | yes        |
| **Heavy** | 100%      | 0.751          | 44 ms         | cloud      |

### Visual Overlay Observations

- **Lite:** Tracks well. Occasional micro-jitter on wrists during fast
  movements, but joints stay locked on the body. Perfectly usable for
  real-time rep counting and basic form feedback.
- **Full:** Slightly smoother than Lite. Marginal improvement — hard to
  tell apart in the overlay videos.
- **Heavy:** Smoothest tracking, best bone alignment. Noticeably more
  stable during the bottom of pushups where the body is compressed.
  But 4x slower than Lite.

---

## Decision: MediaPipe Across the Board

We're going with **MediaPipe PoseLandmarker** for all contexts:

### Live on-device (phone camera, real-time)
**Model: Lite**
- 11 ms inference = 90+ FPS headroom (we only need 30)
- 100% detection rate on our test videos
- Good enough visibility for rep counting + live form cues
- Native iOS SDK available via `MediaPipeTasksVision` CocoaPod
- Supports Swift, works with `CMSampleBuffer` from camera
- Runs on iPhone with A14+ easily at 30 FPS

### Video upload processing (Cloud Run server)
**Model: Heavy**
- Best accuracy and smoothest tracking
- ~45 ms inference is fine for offline processing
- Use this for detailed form analysis reports after a workout
- Runs in Python on our Cloud Run backend, same API we already have

### Fallback / balanced option
**Model: Full**
- Middle ground if Lite isn't accurate enough for a specific exercise
- 15 ms is still real-time capable on modern phones
- Could be a user setting: "High accuracy mode" vs default Lite

---

## Why Not MoveNet?

- **Same accuracy tier** as MediaPipe Lite — published benchmarks show
  comparable PCK scores, and both detect the same core body joints.
- **Different ecosystem** — MoveNet requires TensorFlow / TFLite runtime.
  MediaPipe has its own lighter runtime with a proper iOS SDK.
- **No Python 3.13 + Windows support** for TensorFlow, making local
  research harder.
- **Extra dependency** for no clear gain. MediaPipe Lite already gives us
  100% detection at 11 ms.
- **17 landmarks vs 33** — MoveNet only tracks 17 keypoints. MediaPipe
  gives us 33 including hands, feet, and face points. More data = better
  form analysis down the road.

### What about BlazePose?

BlazePose IS MediaPipe. It's the research paper name for the model
architecture that powers `pose_landmarker_lite/full/heavy.task`. Same
33 landmarks, same model. We're already using it.

---

## Architecture Fit

```
Phone (Swift under-the-hood + React UI)
  -> MediaPipe Lite (.task) via iOS SDK
  -> Real-time skeleton overlay + rep counting
  -> Basic form cues (knee angle, back straight, etc.)

Cloud Run (Python backend)
  -> MediaPipe Heavy (.task) via Tasks API
  -> User uploads video after workout
  -> Detailed form analysis report with per-rep scoring
```

---

## Doors Left Open

- **MoveNet comparison** — Script is ready in `03_movenet_vs_mediapipe/`.
  If we ever set up a Python 3.12 venv or move research to Linux/Mac,
  we can run `--models mn_lightning mn_thunder` and get overlay videos
  instantly.
- **ONNX / CoreML** — The same BlazePose weights exist in ONNX format
  (via ailia-models and others). If we ever need to bypass Google's
  MediaPipe runtime on iOS, we can convert to CoreML. Not needed now
  since the official iOS SDK works.
- **Threshold tuning** — `02_mediapipe_tuning/test_confidence_thresholds.py`
  is ready to sweep detection/tracking confidence values when we want
  to fine-tune for specific exercises.
- **More exercises** — Current tests are pushup + lunge. As we add squat,
  deadlift, plank etc., we re-run the same scripts to verify detection
  holds up.

---

## References

- [MediaPipe PoseLandmarker overview](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)
- [iOS SDK guide](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/ios)
- [iOS sample app (GitHub)](https://github.com/google-ai-edge/mediapipe-samples/tree/main/examples/pose_landmarker/ios)
- [BlazePose research blog](https://research.google/blog/on-device-real-time-body-pose-tracking-with-mediapipe-blazepose/)
- [Model accuracy benchmarks](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker#models)
