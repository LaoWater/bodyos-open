# ML Deployment iOS Guide

## What Was Added and Why

### `ios/BodyOS/MediaPipePosePlugin.swift`
- Purpose: Implements a native VisionCamera frame-processor plugin in Swift that runs MediaPipe PoseLandmarker on each camera frame.
- Key responsibilities:
  - Load the MediaPipe `.task` model from the app bundle.
  - Run inference in `.video` mode with timestamps.
  - Throttle to ~11 FPS on the native thread.
  - Return a flat array of 33 landmarks (x, y, z, visibility) + timestamp to JS.
- Why: Moves all pixel processing and ML inference to native iOS, keeping React/JS out of the hot camera loop.

### `ios/BodyOS/MediaPipePosePlugin.m`
- Purpose: Registers the Swift plugin with VisionCamera.
- Key responsibilities:
  - Exposes the Swift class as a VisionCamera `FrameProcessorPlugin` under the name `detectPose`.
- Why: VisionCamera’s plugin registry is Objective-C based; this file bridges the Swift plugin into the registry.

### `ios/BodyOS.xcodeproj/project.pbxproj`
- Purpose: Xcode project file that tracks sources, resources, and build phases.
- Key responsibilities (for this change):
  - Adds `MediaPipePosePlugin.swift` and `MediaPipePosePlugin.m` to the Sources build phase.
  - Adds `pose_landmarker_lite.task` to Copy Bundle Resources.
- Why: Without these entries, the plugin won’t compile into the app and the model won’t be shipped in the bundle.

## Changing or Adding a Model

### 1) Place the model in the app bundle
- Copy the new model file into `ios/BodyOS/`.
- Add it to Xcode’s **Copy Bundle Resources** for the `BodyOS` target.
  - Xcode will update `ios/BodyOS.xcodeproj/project.pbxproj` automatically if you add it via the UI.

### 2) Update the Swift plugin to load the new model
In `ios/BodyOS/MediaPipePosePlugin.swift`, update:
- `Bundle.main.path(forResource: "pose_landmarker_lite", ofType: "task")`
  - Change the name and/or extension if your model differs.

Example:
```
Bundle.main.path(forResource: "my_custom_model", ofType: "task")
```

### 3) Update output parsing (if output shape changes)
If the model output differs:
- Update the native post-processing in `MediaPipePosePlugin.swift`.
- Update JS unpacking in `src/utils/poseFrameProcessor.ts`.

For PoseLandmarker Lite, output is always 33 landmarks × 4 floats.
For custom models, define the output contract explicitly and keep JS in sync.

### 4) Run pods and rebuild
```
cd ios && pod install
```
Then build/run in Xcode.

## Notes on `expo prebuild --clean`
- `prebuild --clean` regenerates the `ios/` folder and can remove:
  - Custom files in `ios/BodyOS/`
  - Manual changes inside `ios/BodyOS.xcodeproj/project.pbxproj`
- To avoid losing ML files:
  - Re-copy models after prebuild, or
  - Keep a small script to restore them, or
  - Use a config/plugin to automate adding resources.

## Quick Checklist
- Model file present in `ios/BodyOS/`.
- Model listed in **Copy Bundle Resources**.
- `MediaPipePosePlugin.swift` loads correct model name.
- JS unpacking matches native output shape.
- `pod install` completed, then build in Xcode.
