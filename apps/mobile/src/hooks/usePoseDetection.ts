import { useState, useEffect, useRef, useCallback } from 'react';
import { PoseResult, LandmarkIndex, FormQuality } from '../types/pose';
import { generateMockPoseFrame } from '../utils/mockPoseData';
import { getFormScore } from '../utils/formAnalysis';

interface UsePoseDetectionOptions {
  useMockData?: boolean;
  enabled?: boolean;
}

interface PoseState {
  pose: PoseResult | null;
  formScore: number;
  jointQualities: Map<LandmarkIndex, FormQuality>;
  feedback: string[];
  fps: number;
  isRunning: boolean;
}

const MOCK_FPS = 10;
const EMPTY_MAP = new Map<LandmarkIndex, FormQuality>();
const EMPTY_TIPS: string[] = [];

// Only recalculate form score every Nth pose update (saves ~2-3ms per skip)
const FORM_ANALYSIS_INTERVAL = 3;
// Keep the last valid pose briefly so occasional dropped frames don't blank the overlay.
const POSE_LOST_GRACE_MS = 250;
// Stabilization: require a short confidence ramp before first showing pose.
const ENTER_CONFIDENCE_THRESHOLD = 0.2;
const STAY_CONFIDENCE_THRESHOLD = 0.12;
const REQUIRED_STABLE_FRAMES = 3;
const LOW_CONFIDENCE_MAX_FRAMES = 6;
// Exponential smoothing to reduce landmark jitter.
const LANDMARK_EMA_ALPHA = 0.35;

const STABILITY_JOINTS: LandmarkIndex[] = [
  LandmarkIndex.LEFT_SHOULDER,
  LandmarkIndex.RIGHT_SHOULDER,
  LandmarkIndex.LEFT_HIP,
  LandmarkIndex.RIGHT_HIP,
  LandmarkIndex.LEFT_KNEE,
  LandmarkIndex.RIGHT_KNEE,
  LandmarkIndex.LEFT_ANKLE,
  LandmarkIndex.RIGHT_ANKLE,
];

export function usePoseDetection({
  useMockData = true,
  enabled = false,
}: UsePoseDetectionOptions = {}): PoseState & {
  start: () => void;
  stop: () => void;
  onPoseDetected: (result: PoseResult | null) => void;
} {
  const [state, setState] = useState<PoseState>({
    pose: null,
    formScore: 0,
    jointQualities: EMPTY_MAP,
    feedback: EMPTY_TIPS,
    fps: 0,
    isRunning: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameCountRef = useRef(0);
  const fpsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisCountRef = useRef(0);
  const lastPoseDetectedAtRef = useRef(0);
  const hasStablePoseRef = useRef(false);
  const stableFrameCountRef = useRef(0);
  const lowConfidenceCountRef = useRef(0);
  const smoothedPoseRef = useRef<PoseResult | null>(null);
  const lastAnalysisRef = useRef<{ score: number; qualities: Map<LandmarkIndex, FormQuality>; tips: string[] }>({
    score: 0,
    qualities: EMPTY_MAP,
    tips: EMPTY_TIPS,
  });

  const processPose = useCallback((poseResult: PoseResult) => {
    frameCountRef.current++;
    analysisCountRef.current++;
    lastPoseDetectedAtRef.current = Date.now();

    // Only run expensive form analysis every Nth frame
    if (analysisCountRef.current >= FORM_ANALYSIS_INTERVAL) {
      analysisCountRef.current = 0;
      const analysis = getFormScore(poseResult);
      lastAnalysisRef.current = {
        score: analysis.score,
        qualities: analysis.jointQualities,
        tips: analysis.tips,
      };
    }

    // Single batched state update (was 4 separate setState calls)
    const cached = lastAnalysisRef.current;
    setState(prev => ({
      ...prev,
      pose: poseResult,
      formScore: cached.score,
      jointQualities: cached.qualities,
      feedback: cached.tips,
    }));
  }, []);

  const getStabilityConfidence = useCallback((poseResult: PoseResult): number => {
    if (poseResult.landmarks.length < 33) return 0;
    let sum = 0;
    for (const joint of STABILITY_JOINTS) {
      const visibility = poseResult.landmarks[joint].visibility;
      sum += Number.isFinite(visibility) ? visibility : 0;
    }
    return sum / STABILITY_JOINTS.length;
  }, []);

  const smoothPose = useCallback((poseResult: PoseResult): PoseResult => {
    const previous = smoothedPoseRef.current;
    if (previous == null || previous.landmarks.length !== poseResult.landmarks.length) {
      smoothedPoseRef.current = poseResult;
      return poseResult;
    }

    const landmarks = poseResult.landmarks.map((current, idx) => {
      const prev = previous.landmarks[idx];
      return {
        x: prev.x + (current.x - prev.x) * LANDMARK_EMA_ALPHA,
        y: prev.y + (current.y - prev.y) * LANDMARK_EMA_ALPHA,
        z: prev.z + (current.z - prev.z) * LANDMARK_EMA_ALPHA,
        visibility: prev.visibility + (current.visibility - prev.visibility) * LANDMARK_EMA_ALPHA,
      };
    });

    const smoothed: PoseResult = {
      landmarks,
      timestamp: poseResult.timestamp,
    };
    smoothedPoseRef.current = smoothed;
    return smoothed;
  }, []);

  // Callback for real frame processor results
  const onPoseDetected = useCallback((result: PoseResult | null) => {
    if (result == null) {
      const now = Date.now();
      const recentlyDetected = now - lastPoseDetectedAtRef.current < POSE_LOST_GRACE_MS;
      if (recentlyDetected) {
        return;
      }

      hasStablePoseRef.current = false;
      stableFrameCountRef.current = 0;
      lowConfidenceCountRef.current = 0;
      smoothedPoseRef.current = null;

      setState(prev => {
        // Avoid needless re-renders when we already have no pose.
        if (prev.pose == null) return prev;
        return {
          ...prev,
          pose: null,
          formScore: 0,
          jointQualities: EMPTY_MAP,
          feedback: EMPTY_TIPS,
        };
      });
      return;
    }
    const confidence = getStabilityConfidence(result);

    if (!hasStablePoseRef.current) {
      if (confidence >= ENTER_CONFIDENCE_THRESHOLD) {
        stableFrameCountRef.current += 1;
      } else {
        stableFrameCountRef.current = 0;
      }

      if (stableFrameCountRef.current < REQUIRED_STABLE_FRAMES) {
        return;
      }

      hasStablePoseRef.current = true;
      lowConfidenceCountRef.current = 0;
      smoothedPoseRef.current = result;
      processPose(result);
      return;
    }

    // Pose is currently active; use hysteresis so brief confidence dips don't flicker the overlay.
    if (confidence < STAY_CONFIDENCE_THRESHOLD) {
      lowConfidenceCountRef.current += 1;
      if (lowConfidenceCountRef.current >= LOW_CONFIDENCE_MAX_FRAMES) {
        hasStablePoseRef.current = false;
        stableFrameCountRef.current = 0;
        lowConfidenceCountRef.current = 0;
        smoothedPoseRef.current = null;
        setState(prev => ({ ...prev, pose: null, formScore: 0, jointQualities: EMPTY_MAP, feedback: EMPTY_TIPS }));
        return;
      }
    } else {
      lowConfidenceCountRef.current = 0;
    }

    const smoothed = smoothPose(result);
    processPose(smoothed);
  }, [getStabilityConfidence, processPose, smoothPose]);

  const start = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: true }));

    if (useMockData) {
      intervalRef.current = setInterval(() => {
        const frame = generateMockPoseFrame();
        processPose(frame);
      }, 1000 / MOCK_FPS);
    }

    // FPS counter
    fpsTimerRef.current = setInterval(() => {
      setState(prev => ({ ...prev, fps: frameCountRef.current }));
      frameCountRef.current = 0;
    }, 1000);
  }, [useMockData, processPose]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (fpsTimerRef.current) {
      clearInterval(fpsTimerRef.current);
      fpsTimerRef.current = null;
    }
    lastPoseDetectedAtRef.current = 0;
    hasStablePoseRef.current = false;
    stableFrameCountRef.current = 0;
    lowConfidenceCountRef.current = 0;
    smoothedPoseRef.current = null;
    setState(prev => ({ ...prev, isRunning: false, fps: 0 }));
  }, []);

  // Auto-start/stop based on enabled prop
  useEffect(() => {
    if (enabled && !state.isRunning) {
      start();
    } else if (!enabled && state.isRunning) {
      stop();
    }
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (fpsTimerRef.current) clearInterval(fpsTimerRef.current);
    };
  }, []);

  return {
    ...state,
    start,
    stop,
    onPoseDetected,
  };
}
