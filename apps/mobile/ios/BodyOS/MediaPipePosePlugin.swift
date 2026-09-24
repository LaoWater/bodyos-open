import MediaPipeTasksVision
import VisionCamera
import AVFoundation
import QuartzCore
import UIKit

@objc(MediaPipePosePlugin)
class MediaPipePosePlugin: FrameProcessorPlugin {
  private var poseLandmarker: PoseLandmarker?
  private var lastProcessedTimestamp: Double = 0
  // ~11 FPS throttle (90ms between frames)
  private let minFrameIntervalMs: Double = 90
  private var frameCount: Int = 0
  private var noPoseCount: Int = 0

  private func normalizeToPortrait(x: Float, y: Float, orientation: UIImage.Orientation) -> (Float, Float) {
    // VisionCamera provides frame.orientation relative to upright display orientation.
    // Convert MediaPipe output into portrait-normalized coordinates for JS overlay.
    switch orientation {
    case .up, .upMirrored:
      return (x, y)
    case .down, .downMirrored:
      return (1.0 - x, 1.0 - y)
    case .left, .leftMirrored:
      // 90° counter-clockwise
      return (y, 1.0 - x)
    case .right, .rightMirrored:
      // 90° clockwise
      return (1.0 - y, x)
    @unknown default:
      return (x, y)
    }
  }

  private func applyPortraitFlip180(x: Float, y: Float) -> (Float, Float) {
    // Final coordinate alignment for current camera pipeline:
    // portrait output currently appears upside-down in JS overlay.
    return (1.0 - x, 1.0 - y)
  }

  private func orientationName(_ orientation: UIImage.Orientation) -> String {
    switch orientation {
    case .up: return "up"
    case .down: return "down"
    case .left: return "left"
    case .right: return "right"
    case .upMirrored: return "upMirrored"
    case .downMirrored: return "downMirrored"
    case .leftMirrored: return "leftMirrored"
    case .rightMirrored: return "rightMirrored"
    @unknown default: return "unknown"
    }
  }
  override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]? = nil) {
    super.init(proxy: proxy, options: options)

    guard let modelPath = Bundle.main.path(forResource: "pose_landmarker_lite", ofType: "task") else {
      print("MediaPipePosePlugin: ERROR - pose_landmarker_lite.task not found in bundle")
      return
    }
    NSLog("MediaPipePosePlugin: model path = %@", modelPath)

    do {
      let options = PoseLandmarkerOptions()
      options.baseOptions.modelAssetPath = modelPath
      options.runningMode = .video
      options.numPoses = 1
      // Slightly lower thresholds to avoid starving detections on mobile.
      options.minPoseDetectionConfidence = 0.35
      options.minPosePresenceConfidence = 0.35
      options.minTrackingConfidence = 0.35

      poseLandmarker = try PoseLandmarker(options: options)
      print("MediaPipePosePlugin: PoseLandmarker initialized successfully")
    } catch {
      print("MediaPipePosePlugin: ERROR initializing PoseLandmarker - \(error.localizedDescription)")
    }
  }

  override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
    guard let poseLandmarker = poseLandmarker else { return nil }
    guard frame.isValid else { return nil }

    frameCount += 1
    if frameCount % 120 == 0 {
      NSLog(
        "MediaPipePosePlugin: frame %d ts=%f orientation=%@",
        frameCount,
        frame.timestamp,
        orientationName(frame.orientation)
      )
    }

    // Native throttle: skip frames to maintain ~11 FPS
    let nowMs = CACurrentMediaTime() * 1000
    if nowMs - lastProcessedTimestamp < minFrameIntervalMs {
      return nil
    }
    lastProcessedTimestamp = nowMs

    // Create MPImage directly from the camera sample buffer (preserves orientation)
    let mpImage: MPImage
    do {
      mpImage = try MPImage(sampleBuffer: frame.buffer, orientation: frame.orientation)
    } catch {
      if frameCount % 60 == 0 {
        NSLog("MediaPipePosePlugin: MPImage creation failed - %@", error.localizedDescription)
      }
      return nil
    }

    // Run pose detection (video mode requires timestamp in ms)
    let timestampMs = Int(frame.timestamp * 1000)
    let result: PoseLandmarkerResult
    do {
      result = try poseLandmarker.detect(videoFrame: mpImage, timestampInMilliseconds: timestampMs)
    } catch {
      if frameCount % 120 == 0 {
        NSLog(
          "MediaPipePosePlugin: detect failed ts=%d error=%@",
          timestampMs,
          error.localizedDescription
        )
      }
      return nil
    }

    // Check we got at least one pose
    guard let firstPose = result.landmarks.first, !firstPose.isEmpty else {
      noPoseCount += 1
      if noPoseCount % 30 == 0 {
        NSLog("MediaPipePosePlugin: no pose detected (%d)", noPoseCount)
      }
      return nil
    }

    if frameCount % 120 == 0 {
      NSLog("MediaPipePosePlugin: pose detected, landmarks=%d", firstPose.count)
    }

    let landmarks = firstPose
    // 33 landmarks × 4 values (x, y, z, visibility) = 132 numbers
    var flatArray: [NSNumber] = []
    flatArray.reserveCapacity(132)

    var confidenceSum: Float = 0

    for landmark in landmarks {
      let portraitXY = normalizeToPortrait(x: landmark.x, y: landmark.y, orientation: frame.orientation)
      let flippedXY = applyPortraitFlip180(x: portraitXY.0, y: portraitXY.1)
      let x = max(0.0, min(1.0, flippedXY.0))
      let y = max(0.0, min(1.0, flippedXY.1))
      let z = landmark.z
      // MediaPipe may omit visibility on some models; fall back to presence.
      // If both are missing, use 1.0 so downstream overlay/framing logic does not hide all joints.
      let visibilityValue = landmark.visibility?.floatValue
      let presenceValue = landmark.presence?.floatValue
      let confidence = max(visibilityValue ?? -1, presenceValue ?? -1)
      let normalizedConfidence = confidence >= 0 ? confidence : 1.0

      flatArray.append(NSNumber(value: x))
      flatArray.append(NSNumber(value: y))
      flatArray.append(NSNumber(value: z))
      flatArray.append(NSNumber(value: normalizedConfidence))
      confidenceSum += normalizedConfidence
    }

    if frameCount % 120 == 0 {
      let avgConfidence = confidenceSum / Float(max(landmarks.count, 1))
      NSLog("MediaPipePosePlugin: avg confidence=%f", avgConfidence)
    }

    let epochMs = Int(Date().timeIntervalSince1970 * 1000)
    return [
      "landmarks": flatArray,
      "timestamp": NSNumber(value: epochMs)
    ] as NSDictionary
  }
}
