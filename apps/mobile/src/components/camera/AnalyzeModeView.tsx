import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, AppState,
  ActivityIndicator,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useApp } from '../../context/AppContext';
import { usePoseDetection } from '../../hooks/usePoseDetection';
import { usePoseFrameProcessor } from '../../utils/poseFrameProcessor';
import { usePoseCorrection, CorrectionResult } from '../../hooks/usePoseCorrection';
import { SkeletonOverlay } from '../pose/SkeletonOverlay';
import { CorrectionArrows } from '../pose/CorrectionArrows';
import { FormScoreHUD } from './FormScoreHUD';
import { FeedbackPanel } from './FeedbackPanel';
import { checkFraming, FramingResult } from '../../utils/framingCheck';
import { CueGenerator, RepCounter, CoachingCue } from '../../utils/cueGenerator';
import { ExerciseId, EXERCISE_NAMES } from '../../utils/poseNormalization';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';

type AnalysisState = 'selecting' | 'framing' | 'analyzing';

const EXERCISES: { id: ExerciseId; label: string }[] = [
  { id: 0, label: 'Plank' },
  { id: 1, label: 'Push-up' },
  { id: 2, label: 'Lunge' },
];

interface AnalyzeModeViewProps {
  isActive?: boolean;
}

export function AnalyzeModeView({ isActive: isActiveFromParent = true }: AnalyzeModeViewProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isFocused = useIsFocused();
  const { state: { settings } } = useApp();
  const [appActive, setAppActive] = useState(true);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [cameraReady, setCameraReady] = useState(false);
  const [switchingCamera, setSwitchingCamera] = useState(false);
  const device = useCameraDevice(facing);

  // Track app foreground/background state
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  // Camera should only be active when screen is focused, app is foregrounded, and parent says so
  const isCameraActive = isFocused && appActive && isActiveFromParent && !switchingCamera;

  // Handle camera flip with brief deactivation to force proper re-init
  const toggleFacing = useCallback(() => {
    if (settings.haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSwitchingCamera(true);
    setCameraReady(false);

    // Brief delay to let the camera fully deactivate before switching device
    setTimeout(() => {
      setFacing(f => f === 'back' ? 'front' : 'back');
      // Allow camera to reactivate after device switch
      setTimeout(() => {
        setSwitchingCamera(false);
      }, 100);
    }, 50);
  }, [settings.haptics]);

  // Mark camera as ready when it starts
  const handleCameraStarted = useCallback(() => {
    setCameraReady(true);
    if (__DEV__) {
      console.log('[AnalyzeModeView] onStarted');
    }
  }, []);

  const handleCameraInitialized = useCallback(() => {
    setCameraReady(true);
    if (__DEV__) {
      console.log('[AnalyzeModeView] onInitialized');
    }
  }, []);

  // State
  const [analysisState, setAnalysisState] = useState<AnalysisState>('selecting');
  const [exerciseId, setExerciseId] = useState<ExerciseId>(1);
  const [framingResult, setFramingResult] = useState<FramingResult | null>(null);
  const [correctionCues, setCorrectionCues] = useState<CoachingCue[]>([]);
  const [repCount, setRepCount] = useState(0);
  const [phase, setPhase] = useState(0);
  const [correctionResult, setCorrectionResult] = useState<CorrectionResult | null>(null);

  // Pose detection
  const {
    pose,
    formScore,
    jointQualities,
    feedback,
    fps,
    onPoseDetected,
  } = usePoseDetection({ useMockData: false, enabled: analysisState !== 'selecting' });

  const {
    frameProcessor,
    isModelReady,
    lastFrameProcessorTickMs,
    lastPoseResultMs,
  } = usePoseFrameProcessor(onPoseDetected);

  // ML correction model
  const { correctPose, isModelReady: isCorrectionReady } = usePoseCorrection(exerciseId);

  // Cue generator and rep counter (stable refs)
  const cueGeneratorRef = useRef(new CueGenerator());
  const repCounterRef = useRef(new RepCounter());

  // Framing check animation
  const framingPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (analysisState === 'framing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(framingPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(framingPulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      framingPulse.setValue(0);
    }
  }, [analysisState, framingPulse]);

  // Auto-transition from framing → analyzing after timeout (max 4s of framing)
  const framingStartRef = useRef<number>(0);

  useEffect(() => {
    if (analysisState === 'framing') {
      framingStartRef.current = Date.now();
    }
  }, [analysisState]);

  // Run framing check — auto-pass after 4s if pose is detected at all
  useEffect(() => {
    if (analysisState !== 'framing') return;
    const result = checkFraming(pose);
    setFramingResult(result);

    if (result.status === 'good') {
      setAnalysisState('analyzing');
      return;
    }

    // Auto-pass: if we have any pose data and have been framing > 4s, just go
    if (pose && Date.now() - framingStartRef.current > 4000) {
      setAnalysisState('analyzing');
    }
  }, [pose, analysisState]);

  // Run ML correction when analyzing
  useEffect(() => {
    if (analysisState !== 'analyzing' || !pose) return;

    const result = correctPose(pose);
    if (!result) return;

    setCorrectionResult(result);
    setPhase(result.phase);

    const reps = repCounterRef.current.update(result.phase);
    setRepCount(reps);

    const cues = cueGeneratorRef.current.generateCues(result, exerciseId);
    setCorrectionCues(cues);
  }, [pose, analysisState, correctPose, exerciseId]);

  // Reset when switching exercises
  const handleExerciseSelect = useCallback((id: ExerciseId) => {
    if (settings.haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setExerciseId(id);
    cueGeneratorRef.current.reset();
    repCounterRef.current.reset();
    setRepCount(0);
    setPhase(0);
    setCorrectionCues([]);
    setCorrectionResult(null);
    setAnalysisState('framing');
  }, [settings.haptics]);

  const handleBackToSelect = useCallback(() => {
    if (settings.haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAnalysisState('selecting');
    cueGeneratorRef.current.reset();
    repCounterRef.current.reset();
    setRepCount(0);
    setCorrectionCues([]);
    setCorrectionResult(null);
  }, [settings.haptics]);

  // Convert ML cues to feedback panel tips — only show when we have real data
  const activeTips = useMemo(() => {
    if (correctionCues.length > 0) {
      return correctionCues.map(c => c.message);
    }
    if (analysisState === 'analyzing' && feedback.length > 0) {
      return feedback;
    }
    // No placeholder — the FeedbackPanel handles empty state gracefully
    return [];
  }, [correctionCues, feedback, analysisState]);

  // Show loading skeleton when camera not ready
  const showLoadingOverlay = !device || !cameraReady || switchingCamera;
  const frameProcessorAgeMs =
    lastFrameProcessorTickMs > 0 ? Date.now() - lastFrameProcessorTickMs : Number.POSITIVE_INFINITY;
  const frameProcessorHealthy =
    isModelReady &&
    isCameraActive &&
    cameraReady &&
    frameProcessorAgeMs < 2500;
  const poseResultAgeMs =
    lastPoseResultMs > 0 ? Date.now() - lastPoseResultMs : Number.POSITIVE_INFINITY;
  const receivingPoseResults = frameProcessorHealthy && poseResultAgeMs < 3000;

  const handleCameraError = useCallback((error: unknown) => {
    console.error('[AnalyzeModeView] camera error', error);
  }, []);

  const topActionOffset = insets.top + spacing.sm;

  useEffect(() => {
    if (!__DEV__) return;
    if (analysisState === 'selecting') return;
    console.log(
      `[AnalyzeModeView] pipeline active=${isCameraActive} modelReady=${isModelReady} cameraReady=${cameraReady} fpHealthy=${frameProcessorHealthy} poseStream=${receivingPoseResults}`,
    );
  }, [analysisState, isCameraActive, isModelReady, cameraReady, frameProcessorHealthy, receivingPoseResults]);

  return (
    <View style={styles.container}>
      {/* Camera — always mount if device exists (even while "switching") */}
      {device && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isCameraActive}
          frameProcessor={isCameraActive ? frameProcessor : undefined}
          // MediaPipe PoseLandmarker on iOS expects BGRA for sample/pixel buffers.
          pixelFormat="rgb"
          onInitialized={handleCameraInitialized}
          onStarted={handleCameraStarted}
          onError={handleCameraError}
        />
      )}

      {/* Loading overlay — shows while camera initializes */}
      {showLoadingOverlay && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.accent.primary} size="small" />
          <Text style={styles.loadingText}>
            {switchingCamera
              ? 'Switching camera...'
              : !device
                ? 'Connecting to camera...'
                : 'Initializing...'}
          </Text>
        </View>
      )}

      {/* Skeleton overlay */}
      <SkeletonOverlay
        pose={pose}
        width={width}
        height={height}
        mirrored={false}
        jointQualities={jointQualities}
      />

      {/* Correction arrows overlay */}
      {analysisState === 'analyzing' && correctionResult && pose && (
        <CorrectionArrows
          rawLandmarks={pose.landmarks}
          correctedLandmarks={correctionResult.correctedLandmarks}
          jointDisplacements={correctionResult.jointDisplacements}
          width={width}
          height={height}
          mirrored={false}
        />
      )}

      {/* Exercise selector */}
      {analysisState === 'selecting' && (
        <View style={[styles.selectorContainer, { top: height * 0.35 }]}>
          <Text style={styles.selectorTitle}>Select Exercise</Text>
          <View style={styles.exercisePills}>
            {EXERCISES.map((ex) => (
              <Pressable
                key={ex.id}
                style={({ pressed }) => [styles.exercisePill, pressed && { opacity: 0.7 }]}
                onPress={() => handleExerciseSelect(ex.id)}
              >
                <Text style={styles.exercisePillText}>{ex.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Framing check overlay */}
      {analysisState === 'framing' && (
        <View style={styles.framingOverlay}>
          <Animated.View
            style={[
              styles.framingBorder,
              { opacity: Animated.add(0.4, Animated.multiply(framingPulse, 0.6)) },
            ]}
          />
          <View style={styles.framingMessageContainer}>
            <Text style={styles.framingMessage}>
              {framingResult?.message ?? 'Positioning...'}
            </Text>
            <Text style={styles.framingSubtext}>
              {EXERCISE_NAMES[exerciseId]} — get into position
            </Text>
          </View>
        </View>
      )}

      {/* Frame processor warmup / stalled-state prompt */}
      {isModelReady && cameraReady && analysisState !== 'selecting' && !frameProcessorHealthy && (
        <View style={styles.promptContainer}>
          <Text style={styles.promptText}>Starting pose pipeline...</Text>
        </View>
      )}

      {/* Pipeline is alive but plugin is not yielding pose packets */}
      {isModelReady && cameraReady && frameProcessorHealthy && analysisState !== 'selecting' && !receivingPoseResults && (
        <View style={styles.promptContainer}>
          <Text style={styles.promptText}>Detecting body...</Text>
        </View>
      )}

      {/* "Step into frame" prompt when no body detected */}
      {isModelReady && cameraReady && frameProcessorHealthy && receivingPoseResults && analysisState !== 'selecting' && pose == null && (
        <View style={styles.promptContainer}>
          <Text style={styles.promptText}>Step into frame</Text>
        </View>
      )}

      {/* Model loading indicator */}
      {!isModelReady && cameraReady && analysisState !== 'selecting' && (
        <View style={styles.promptContainer}>
          <Text style={styles.promptText}>Loading pose model...</Text>
        </View>
      )}

      {/* Form score HUD + phase/rep info */}
      {analysisState === 'analyzing' && (
        <View style={[styles.hudContainer, { top: insets.top + spacing.lg }]}>
          <FormScoreHUD score={formScore} fps={fps} />
          <View style={styles.phaseRepContainer}>
            <View style={styles.phaseIndicator}>
              <Text style={styles.phaseLabel}>Phase</Text>
              <View style={styles.phaseBarBg}>
                <View style={[styles.phaseBarFill, { width: `${phase * 100}%` }]} />
              </View>
            </View>
            {exerciseId !== 0 && (
              <View style={styles.repCounter}>
                <Text style={styles.repCount}>{repCount}</Text>
                <Text style={styles.repLabel}>reps</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Exercise label + back button when analyzing */}
      {analysisState !== 'selecting' && (
        <Pressable
          style={({ pressed }) => [styles.exerciseTag, { top: topActionOffset }, pressed && { opacity: 0.7 }]}
          onPress={handleBackToSelect}
        >
          <Ionicons name="chevron-back" size={14} color={colors.accent.primaryLight} />
          <Text style={styles.exerciseTagText}>
            {EXERCISE_NAMES[exerciseId]}
          </Text>
        </Pressable>
      )}

      {/* Camera flip button — always rendered, high z-index */}
      <Pressable
        style={({ pressed }) => [
          styles.flipButton,
          { top: topActionOffset },
          pressed && { opacity: 0.7 },
          switchingCamera && { opacity: 0.4 },
        ]}
        onPress={toggleFacing}
        disabled={switchingCamera}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
      </Pressable>

      {/* Feedback panel with ML-driven cues — only when we have real tips */}
      {analysisState === 'analyzing' && activeTips.length > 0 && (
        <View style={[styles.feedbackContainer, { bottom: insets.bottom + spacing.xl }]}>
          <FeedbackPanel tips={activeTips} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    letterSpacing: 0.3,
  },

  hudContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  feedbackContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  promptContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '45%',
    alignItems: 'center',
    zIndex: 5,
  },
  promptText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: fontFamily.medium,
    fontSize: 18,
    letterSpacing: 0.5,
  },

  // Exercise selector
  selectorContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 15,
  },
  selectorTitle: {
    color: colors.text.primary,
    fontFamily: fontFamily.semiBold,
    fontSize: 20,
    marginBottom: spacing.lg,
    letterSpacing: 0.3,
  },
  exercisePills: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  exercisePill: {
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  exercisePillText: {
    color: colors.accent.primaryLight,
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
  },

  // Framing overlay
  framingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  framingBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderColor: colors.accent.primary,
    borderRadius: borderRadius.lg,
    margin: spacing.xl,
  },
  framingMessageContainer: {
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  framingMessage: {
    color: colors.text.primary,
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    textAlign: 'center',
  },
  framingSubtext: {
    color: colors.text.secondary,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Phase & rep display
  phaseRepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginTop: spacing.sm,
    gap: spacing.base,
  },
  phaseIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  phaseLabel: {
    color: colors.text.secondary,
    fontFamily: fontFamily.medium,
    fontSize: 12,
  },
  phaseBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: colors.glass.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  phaseBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
  },
  repCounter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  repCount: {
    color: colors.semantic.success,
    fontFamily: fontFamily.bold,
    fontSize: 22,
  },
  repLabel: {
    color: colors.text.secondary,
    fontFamily: fontFamily.medium,
    fontSize: 12,
  },

  // Exercise tag
  exerciseTag: {
    position: 'absolute',
    left: spacing.base,
    zIndex: 24,
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  exerciseTagText: {
    color: colors.accent.primaryLight,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    textTransform: 'capitalize',
  },

  // Camera flip
  flipButton: {
    position: 'absolute',
    right: spacing.base,
    zIndex: 24,
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.full,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
