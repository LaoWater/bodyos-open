import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, Animated,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useApp } from '../../context/AppContext';
import { ExerciseId, EXERCISE_NAMES } from '../../utils/poseNormalization';
import { colors, spacing, borderRadius, fontFamily, fontSize } from '../../theme';

type SubMode = 'upload' | 'record';
type RecordingState = 'idle' | 'selecting' | 'ready' | 'recording' | 'recorded';

const EXERCISES: { id: ExerciseId; label: string }[] = [
  { id: 0, label: 'Plank' },
  { id: 1, label: 'Push-up' },
  { id: 2, label: 'Lunge' },
];

interface UploadModeViewProps {
  isActive?: boolean;
}

export function UploadModeView({ isActive = true }: UploadModeViewProps) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { state: { settings } } = useApp();
  const [subMode, setSubMode] = useState<SubMode>('upload');

  const haptic = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (settings.haptics) Haptics.impactAsync(style);
  }, [settings.haptics]);

  const handleSubModeChange = useCallback((mode: SubMode) => {
    if (mode !== subMode) {
      haptic(Haptics.ImpactFeedbackStyle.Light);
      setSubMode(mode);
    }
  }, [subMode, haptic]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Sub-mode toggle */}
      <View style={[styles.subToggleContainer, { top: insets.top + 60 }]} pointerEvents="box-none">
        <View style={styles.subToggle}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
          )}
          {(['upload', 'record'] as SubMode[]).map((m) => (
            <Pressable
              key={m}
              style={({ pressed }) => [styles.subToggleOption, pressed && { opacity: 0.7 }]}
              onPress={() => handleSubModeChange(m)}
            >
              {subMode === m && (
                <LinearGradient
                  colors={[...colors.gradients.coralPink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFill, styles.subToggleActive]}
                />
              )}
              <Ionicons
                name={m === 'upload' ? 'cloud-upload-outline' : 'videocam-outline'}
                size={14}
                color={subMode === m ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
                style={{ marginRight: spacing.xs }}
              />
              <Text style={[styles.subToggleLabel, subMode === m && styles.subToggleLabelActive]}>
                {m === 'upload' ? 'Upload' : 'Record & Send'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {subMode === 'upload' ? (
        <UploadSubView insets={insets} haptic={haptic} />
      ) : (
        <RecordSubView isActive={isActive && isFocused} insets={insets} haptic={haptic} />
      )}
    </View>
  );
}

/* ─────────────── Upload Sub-View (Gallery Pick) ─────────────── */

function UploadSubView({ insets, haptic }: {
  insets: ReturnType<typeof useSafeAreaInsets>;
  haptic: (style?: Haptics.ImpactFeedbackStyle) => void;
}) {
  const handleUploadPress = () => {
    haptic();
    // TODO: Implement video picker from gallery
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 120, paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Cloud icon */}
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={[...colors.gradients.coralPink]}
          style={styles.iconGradient}
        >
          <Ionicons name="cloud-upload-outline" size={48} color="#FFFFFF" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Cloud Analysis</Text>
      <Text style={styles.subtitle}>
        Upload a workout video for deeper, more accurate AI analysis powered by cloud compute
      </Text>

      {/* Upload button */}
      <Pressable
        style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.8 }]}
        onPress={handleUploadPress}
      >
        <LinearGradient
          colors={[...colors.gradients.coralPink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, styles.actionButtonGradient]}
        />
        <Ionicons name="folder-open-outline" size={22} color="#FFFFFF" style={styles.actionButtonIcon} />
        <Text style={styles.actionButtonText}>Select Video from Gallery</Text>
      </Pressable>

      {/* Feature cards */}
      <View style={styles.featuresContainer}>
        <FeatureItem
          icon="analytics-outline"
          title="Advanced Pose Analysis"
          description="Heavier ML models run on our servers for more precise form detection"
        />
        <FeatureItem
          icon="time-outline"
          title="Full Workout Review"
          description="Analyze entire workout sessions with rep counting and form tracking"
        />
        <FeatureItem
          icon="trending-up-outline"
          title="Detailed Reports"
          description="Get comprehensive breakdown of your form with improvement suggestions"
        />
      </View>

      {/* Coming soon badge */}
      <View style={styles.comingSoonContainer}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
        )}
        <Ionicons name="rocket-outline" size={16} color={colors.secondary.primary} />
        <Text style={styles.comingSoonText}>Coming Soon — Cloud compute in development</Text>
      </View>
    </ScrollView>
  );
}

/* ─────────────── Record Sub-View (Live Record & Send) ─────────────── */

function RecordSubView({ isActive, insets, haptic }: {
  isActive: boolean;
  insets: ReturnType<typeof useSafeAreaInsets>;
  haptic: (style?: Haptics.ImpactFeedbackStyle) => void;
}) {
  const [recordingState, setRecordingState] = useState<RecordingState>('selecting');
  const [exerciseId, setExerciseId] = useState<ExerciseId | null>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [seconds, setSeconds] = useState(0);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const device = useCameraDevice(facing);
  const cameraRef = useRef<Camera>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordPulse = useRef(new Animated.Value(1)).current;

  // Recording pulse animation
  useEffect(() => {
    if (recordingState === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordPulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(recordPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      recordPulse.stopAnimation();
      recordPulse.setValue(1);
    }
  }, [recordingState, recordPulse]);

  // Duration timer
  useEffect(() => {
    if (recordingState === 'recording') {
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recordingState]);

  const handleExerciseSelect = useCallback((id: ExerciseId) => {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    setExerciseId(id);
    setRecordingState('ready');
  }, [haptic]);

  const toggleFacing = useCallback(() => {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    setFacing(f => f === 'back' ? 'front' : 'back');
  }, [haptic]);

  const handleRecord = useCallback(async () => {
    if (!cameraRef.current) return;

    if (recordingState === 'recording') {
      // Stop recording
      haptic();
      await cameraRef.current.stopRecording();
      // onRecordingFinished callback handles the rest
    } else {
      // Start recording
      haptic(Haptics.ImpactFeedbackStyle.Heavy);
      setRecordingState('recording');
      cameraRef.current.startRecording({
        onRecordingFinished: (video) => {
          setVideoUri(video.path);
          setRecordingState('recorded');
        },
        onRecordingError: (error) => {
          console.warn('Recording error:', error);
          Alert.alert('Recording Error', 'Failed to record video. Please try again.');
          setRecordingState('ready');
        },
      });
    }
  }, [recordingState, haptic]);

  const handleSendForAnalysis = useCallback(() => {
    haptic();
    setSending(true);

    // TODO: Implement actual cloud upload
    // 1. Upload videoUri to cloud storage
    // 2. Create analysis job with exerciseId
    // 3. Listen for results via webhook/polling
    // 4. Store results in app data

    // Simulate for now
    setTimeout(() => {
      setSending(false);
      Alert.alert(
        'Sent for Analysis',
        `Your ${exerciseId !== null ? EXERCISE_NAMES[exerciseId] : 'exercise'} video has been queued for cloud analysis. You'll be notified when results are ready.`,
        [{ text: 'OK', onPress: handleReset }],
      );
    }, 1500);
  }, [exerciseId, haptic]);

  const handleReset = useCallback(() => {
    setRecordingState('selecting');
    setExerciseId(null);
    setVideoUri(null);
    setSeconds(0);
    setSending(false);
  }, []);

  const handleRetake = useCallback(() => {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    setVideoUri(null);
    setRecordingState('ready');
    setSeconds(0);
  }, [haptic]);

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ── Recorded state: confirmation screen ──
  if (recordingState === 'recorded' && videoUri) {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 120, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[...colors.gradients.tealCyan]}
            style={styles.iconGradient}
          >
            <Ionicons name="checkmark-circle-outline" size={48} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Video Ready</Text>
        <Text style={styles.subtitle}>
          {exerciseId !== null ? EXERCISE_NAMES[exerciseId].charAt(0).toUpperCase() + EXERCISE_NAMES[exerciseId].slice(1) : 'Exercise'} recording
          {' '}({formatDuration(seconds)}) ready for cloud analysis
        </Text>

        {/* Info card */}
        <View style={styles.recordedInfoCard}>
          <View style={styles.recordedInfoRow}>
            <Ionicons name="barbell-outline" size={18} color={colors.accent.primaryLight} />
            <Text style={styles.recordedInfoLabel}>Exercise</Text>
            <Text style={styles.recordedInfoValue}>
              {exerciseId !== null ? EXERCISE_NAMES[exerciseId].charAt(0).toUpperCase() + EXERCISE_NAMES[exerciseId].slice(1) : '—'}
            </Text>
          </View>
          <View style={styles.recordedInfoDivider} />
          <View style={styles.recordedInfoRow}>
            <Ionicons name="time-outline" size={18} color={colors.accent.primaryLight} />
            <Text style={styles.recordedInfoLabel}>Duration</Text>
            <Text style={styles.recordedInfoValue}>{formatDuration(seconds)}</Text>
          </View>
          <View style={styles.recordedInfoDivider} />
          <View style={styles.recordedInfoRow}>
            <Ionicons name="cloud-outline" size={18} color={colors.accent.primaryLight} />
            <Text style={styles.recordedInfoLabel}>Analysis</Text>
            <Text style={styles.recordedInfoValue}>Full ML pipeline</Text>
          </View>
        </View>

        {/* Send button */}
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.8 }, sending && { opacity: 0.6 }]}
          onPress={handleSendForAnalysis}
          disabled={sending}
        >
          <LinearGradient
            colors={[...colors.gradients.tealCyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, styles.actionButtonGradient]}
          />
          {sending ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Uploading...</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={22} color="#FFFFFF" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Send for Analysis</Text>
            </>
          )}
        </Pressable>

        {/* Retake / Cancel row */}
        <View style={styles.recordedActions}>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.7 }]}
            onPress={handleRetake}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.secondaryButtonText}>Retake</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.7 }]}
            onPress={handleReset}
          >
            <Ionicons name="close-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ── Exercise selector state ──
  if (recordingState === 'selecting') {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 120, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[...colors.gradients.coralPink]}
            style={styles.iconGradient}
          >
            <Ionicons name="videocam-outline" size={48} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Record & Send</Text>
        <Text style={styles.subtitle}>
          Record your exercise and send it for in-depth cloud analysis with our most powerful models
        </Text>

        <Text style={styles.selectorLabel}>Select Exercise</Text>
        <View style={styles.exercisePills}>
          {EXERCISES.map((ex) => (
            <Pressable
              key={ex.id}
              style={({ pressed }) => [styles.exercisePill, pressed && { opacity: 0.7 }]}
              onPress={() => handleExerciseSelect(ex.id)}
            >
              <Ionicons name="barbell-outline" size={16} color={colors.accent.primaryLight} style={{ marginRight: spacing.sm }} />
              <Text style={styles.exercisePillText}>{ex.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* What you'll get */}
        <View style={[styles.featuresContainer, { marginTop: spacing.xl }]}>
          <FeatureItem
            icon="videocam-outline"
            title="Record Your Set"
            description="Position your phone, select exercise, and record your set live"
          />
          <FeatureItem
            icon="cloud-upload-outline"
            title="Cloud Processing"
            description="Video is sent to our servers for analysis with our most powerful ML models"
          />
          <FeatureItem
            icon="notifications-outline"
            title="Detailed Feedback"
            description="Receive comprehensive form analysis, rep counting, and coaching tips"
          />
        </View>
      </ScrollView>
    );
  }

  // ── Camera preview: ready / recording states ──
  if (!device) {
    return (
      <View style={[styles.scrollContent, { paddingTop: insets.top + 120, flex: 1 }]}>
        <Text style={styles.subtitle}>No camera available</Text>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && recordingState !== 'recorded'}
        video={true}
        audio={true}
      />

      {/* Top bar: exercise label + flip */}
      <View style={[styles.cameraTopBar, { top: insets.top + 60 }]}>
        <Pressable
          style={({ pressed }) => [styles.cameraExerciseTag, pressed && { opacity: 0.7 }]}
          onPress={handleReset}
        >
          <Ionicons name="chevron-back" size={16} color={colors.accent.primaryLight} />
          <Text style={styles.cameraExerciseTagText}>
            {exerciseId !== null ? EXERCISE_NAMES[exerciseId].charAt(0).toUpperCase() + EXERCISE_NAMES[exerciseId].slice(1) : ''}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.cameraFlipButton, pressed && { opacity: 0.7 }]}
          onPress={toggleFacing}
          disabled={recordingState === 'recording'}
        >
          <Ionicons name="camera-reverse-outline" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Recording indicator */}
      {recordingState === 'recording' && (
        <View style={[styles.recordingIndicator, { top: insets.top + 110 }]}>
          <Animated.View style={[styles.recordingDot, { transform: [{ scale: recordPulse }] }]} />
          <Text style={styles.recordingTime}>{formatDuration(seconds)}</Text>
        </View>
      )}

      {/* Ready state hint */}
      {recordingState === 'ready' && (
        <View style={styles.readyHint}>
          <Text style={styles.readyHintText}>Position your phone, then tap record</Text>
        </View>
      )}

      {/* Bottom bar: record button */}
      <View style={[styles.cameraBottomBar, { paddingBottom: insets.bottom + 30 }]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
        )}

        {/* Cloud analysis badge */}
        <View style={styles.cloudBadge}>
          <Ionicons name="cloud-outline" size={12} color={colors.secondary.primaryLight} />
          <Text style={styles.cloudBadgeText}>Recording for cloud analysis</Text>
        </View>

        {/* Record button */}
        <Pressable
          style={({ pressed }) => [styles.recordButtonOuter, pressed && { opacity: 0.85 }]}
          onPress={handleRecord}
        >
          <Animated.View
            style={[
              styles.recordButtonInner,
              recordingState === 'recording' && styles.recordButtonInnerRecording,
              { transform: [{ scale: recordPulse }] },
            ]}
          />
        </Pressable>

        <Text style={styles.recordHint}>
          {recordingState === 'recording' ? 'Tap to stop' : 'Tap to record'}
        </Text>
      </View>
    </View>
  );
}

/* ─────────────── Feature Item ─────────────── */

function FeatureItem({ icon, title, description }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconWrap}>
        <Ionicons name={icon} size={20} color={colors.secondary.primaryLight} />
      </View>
      <View style={styles.featureTextWrap}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

/* ─────────────── Styles ─────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  androidBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  // Sub-mode toggle
  subToggleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 25,
  },
  subToggle: {
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
  },
  subToggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    overflow: 'hidden',
    borderRadius: 20,
  },
  subToggleActive: {
    borderRadius: 20,
  },
  subToggleLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  subToggleLabelActive: {
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },

  // Scrollable content
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    width: '100%',
    marginBottom: spacing.xl,
  },
  actionButtonGradient: {
    borderRadius: borderRadius.xl,
  },
  actionButtonIcon: {
    marginRight: spacing.sm,
  },
  actionButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
  featuresContainer: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderSubtle,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.primary,
    marginBottom: 2,
  },
  featureDescription: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  comingSoonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    gap: spacing.sm,
  },
  comingSoonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.secondary.primaryLight,
  },

  // Record sub-view — exercise selector
  selectorLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  exercisePills: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  exercisePill: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // Record sub-view — camera
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraTopBar: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 15,
  },
  cameraExerciseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  cameraExerciseTagText: {
    color: colors.accent.primaryLight,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
  },
  cameraFlipButton: {
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.full,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Recording indicator
  recordingIndicator: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
    zIndex: 15,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  recordingTime: {
    color: '#FF3B30',
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    fontVariant: ['tabular-nums'],
  },

  // Ready hint
  readyHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '45%',
    alignItems: 'center',
    zIndex: 5,
  },
  readyHintText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: fontFamily.medium,
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // Bottom bar
  cameraBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: spacing.base,
    overflow: 'hidden',
  },
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    zIndex: 1,
  },
  cloudBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.secondary.primaryLight,
  },
  recordButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  recordButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF3B30',
  },
  recordButtonInnerRecording: {
    borderRadius: 8,
    width: 36,
    height: 36,
  },
  recordHint: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: fontFamily.regular,
    fontSize: 13,
    marginTop: spacing.md,
    zIndex: 1,
  },

  // Recorded state — confirmation
  recordedInfoCard: {
    width: '100%',
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderSubtle,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  recordedInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recordedInfoLabel: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  recordedInfoValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  recordedInfoDivider: {
    height: 1,
    backgroundColor: colors.glass.borderSubtle,
    marginVertical: spacing.md,
  },
  recordedActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  secondaryButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
});
