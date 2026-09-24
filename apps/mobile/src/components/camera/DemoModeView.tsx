import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent, useEventListener } from 'expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  DEMO_EXERCISES,
  DemoExercise,
} from '../../data/demoExercises';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';
import { useApp } from '../../context/AppContext';
import { useAudioSession } from '../../hooks/useAudioSession';
import { useCoachingAudio } from '../../hooks/useCoachingAudio';
import { CoachingCaption } from './CoachingCaption';
import { FormScoreRing } from '../motion/FormScoreRing';

// ─── Analysis metrics ─────────────────────────────────────────────────────────
interface AnalysisMetric {
  label: string;
  value: string;
  unit: string;
  formula?: string;
}

// Base metric values per exercise
const EXERCISE_METRICS: Record<string, AnalysisMetric[]> = {
  squat: [
    { label: 'Knee Valgus', value: '2.3', unit: '\u00B0', formula: '\u03B8_k = atan2(\u0394y, \u0394x)' },
    { label: 'Hip Depth', value: '94', unit: '%', formula: 'h/h\u2080 ratio' },
    { label: 'Trunk Lean', value: '12.8', unit: '\u00B0', formula: '\u03B1 = acos(v\u2092 \u00B7 v\u1D65)' },
    { label: 'Balance', value: '0.91', unit: '', formula: '\u03C3(CoP_x)' },
    { label: 'Dorsiflexion', value: '34.2', unit: '\u00B0' },
  ],
  lunge: [
    { label: 'Shoulder \u0394', value: '1.4', unit: '\u00B0', formula: '\u0394y(L_sh, R_sh)' },
    { label: 'Pelvic Tilt', value: '8.2', unit: '\u00B0', formula: '\u03C6 = atan(z/x)' },
    { label: 'Stride', value: '0.82', unit: 'm', formula: 'd(a_L, a_R)' },
    { label: 'Knee Track', value: '96', unit: '%', formula: 'proj(k, toe)' },
    { label: 'Lat. Sway', value: '0.03', unit: 'm' },
  ],
  pushup: [
    { label: 'Elbow \u03B8', value: '87.4', unit: '\u00B0', formula: '\u2220(sh, el, wr)' },
    { label: 'Spine', value: '0.96', unit: '', formula: '1 - |sag|/L' },
    { label: 'Sh. Width', value: '1.12', unit: '\u00D7bw', formula: 'w_sh/w_hip' },
    { label: 'Cadence', value: '2.1', unit: 's', formula: 'T/2' },
    { label: 'Depth', value: '0.88', unit: '' },
  ],
  plank: [
    { label: 'Hip Sag', value: '3.1', unit: '\u00B0', formula: '\u0394(spine, hz)' },
    { label: 'Sh. Stack', value: '92', unit: '%', formula: 'align(sh,el,wr)' },
    { label: 'Core', value: '0.94', unit: '', formula: '\u03C3(hip_y)/T' },
    { label: 'Hold', value: '00:00', unit: '', formula: 't_elapsed' },
    { label: 'Symmetry', value: '0.97', unit: '' },
  ],
};

// Metric variation ranges per exercise
const METRIC_RANGES: Record<string, number[]> = {
  squat:  [1.5, 12,  5.0, 0.06, 4.0],
  lunge:  [0.8, 3.0, 0.08, 5.0, 0.02],
  pushup: [15,  0.04, 0.08, 0.4, 0.10],
  plank:  [1.5, 4.0, 0.03, 0,   0.02],
};

// ─── Timing constants ─────────────────────────────────────────────────────────
const METRICS_DELAY_MS = 1200;        // Show metrics fast (was 3000)
const METRICS_UPDATE_MS = 800;        // Update metrics frequently for responsiveness
const STAGGER_DELAY_MS = 80;          // Stagger each metric item's fade-in
const TRANSITION_DURATION_MS = 350;   // Exercise switch crossfade

/** Compute metrics synced to video progress via smooth sine wave */
function computeTimelineMetrics(
  exerciseId: string,
  progress: number,
): AnalysisMetric[] {
  const base = EXERCISE_METRICS[exerciseId] ?? [];
  const ranges = METRIC_RANGES[exerciseId] ?? [];
  const wave = Math.sin(progress * Math.PI * 2);

  return base.map((m, i) => {
    const numVal = parseFloat(m.value);
    if (isNaN(numVal) || m.value.includes(':')) {
      if (m.label === 'Hold') {
        const elapsed = Math.floor(progress * 60);
        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const secs = (elapsed % 60).toString().padStart(2, '0');
        return { ...m, value: `${mins}:${secs}` };
      }
      return m;
    }
    const range = ranges[i] ?? 0;
    const offset = wave * range * 0.5;
    const val = numVal + offset;
    return { ...m, value: val.toFixed(m.value.includes('.') ? 1 : 0) };
  });
}

/** Form score oscillates with exercise phase — no random noise */
function computeFormScore(progress: number): number {
  const wave = Math.sin(progress * Math.PI * 4);
  return Math.round(88 + wave * 4);
}

// ─── Animated metric item ─────────────────────────────────────────────────────

interface AnimatedMetricProps {
  metric: AnalysisMetric;
  index: number;
  align: 'left' | 'right';
  metricsVisible: boolean;
}

function AnimatedMetricItem({ metric, index, align, metricsVisible }: AnimatedMetricProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(align === 'left' ? -20 : 20)).current;
  const valueGlow = useRef(new Animated.Value(0)).current;
  const prevValueRef = useRef(metric.value);

  // Staggered entrance
  useEffect(() => {
    if (metricsVisible) {
      const delay = index * STAGGER_DELAY_MS;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(align === 'left' ? -20 : 20);
    }
  }, [metricsVisible, index, align, fadeAnim, slideAnim]);

  // Subtle glow pulse when value changes
  useEffect(() => {
    if (metric.value !== prevValueRef.current) {
      prevValueRef.current = metric.value;
      valueGlow.setValue(1);
      Animated.timing(valueGlow, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [metric.value, valueGlow]);

  const valueColor = valueGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(230, 232, 236, 0.85)', 'rgba(91, 124, 250, 1)'],
  });

  const isRight = align === 'right';

  return (
    <Animated.View
      style={[
        styles.metricItem,
        isRight && styles.metricItemRight,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <Text style={[styles.mLabel, isRight && { textAlign: 'right' }]}>
        {metric.label}
      </Text>
      <View style={[styles.mValueRow, isRight && { justifyContent: 'flex-end' }]}>
        <Animated.Text style={[styles.mValue, { color: valueColor }]}>
          {metric.value}
        </Animated.Text>
        {metric.unit !== '' && <Text style={styles.mUnit}>{metric.unit}</Text>}
      </View>
      {metric.formula && (
        <Text style={[styles.mFormula, isRight && { textAlign: 'right' }]}>
          {metric.formula}
        </Text>
      )}
    </Animated.View>
  );
}

// ─── Pulsing LIVE dot ─────────────────────────────────────────────────────────

function LiveTag() {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <View style={styles.metricsTag}>
      <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
      <Text style={styles.tagText}>LIVE</Text>
    </View>
  );
}

// ─── Animated form score ──────────────────────────────────────────────────────

function AnimatedFormScore({ score, visible }: { score: number; visible: boolean }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const prevScoreRef = useRef(score);

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  // Pulse on score change
  useEffect(() => {
    if (score !== prevScoreRef.current) {
      prevScoreRef.current = score;
      glowAnim.setValue(1);
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [score, glowAnim]);

  const scoreColor = score >= 85
    ? 'rgba(78, 205, 196, 0.9)'
    : score >= 70
      ? 'rgba(245, 166, 35, 0.9)'
      : 'rgba(231, 76, 60, 0.9)';

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(78, 205, 196, 0.15)', 'rgba(78, 205, 196, 0.6)'],
  });

  return (
    <Animated.View
      style={[
        styles.scoreWrap,
        {
          transform: [{ scale: scaleAnim }],
          borderColor,
        },
      ]}
    >
      <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}</Text>
      <Text style={styles.scoreSub}>form</Text>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════════

export function DemoModeView() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { state: { settings } } = useApp();

  // Audio session — plays in silent mode
  useAudioSession();

  const [selectedExercise, setSelectedExercise] = useState<DemoExercise>(DEMO_EXERCISES[0]);
  const [metricsVisible, setMetricsVisible] = useState(false);
  const [displayMetrics, setDisplayMetrics] = useState<AnalysisMetric[]>(
    EXERCISE_METRICS[DEMO_EXERCISES[0].id] ?? [],
  );
  const [formScore, setFormScore] = useState(88);

  // Animated.Value for progress bar (no re-renders)
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressRef = useRef(0);
  const metricsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metricsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Crossfade transition
  const viewFade = useRef(new Animated.Value(1)).current;
  const isTransitioning = useRef(false);

  const hasVideo = selectedExercise.video != null;

  // expo-video player — MUTED
  const player = useVideoPlayer(selectedExercise.video ?? null, (p) => {
    p.loop = selectedExercise.looping;
    p.muted = true;
    p.timeUpdateEventInterval = 0.25;
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  // Coaching audio
  const { currentCue, isSpeaking } = useCoachingAudio({
    exerciseId: selectedExercise.id,
    enabled: isPlaying && settings.voiceFeedback,
    mode: 'random',
  });

  // Track video progress — Animated.Value only (NO setState)
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (player.duration > 0) {
      const t = currentTime / player.duration;
      progressRef.current = t;
      progressAnim.setValue(t);
    }
  });

  // Show metrics quickly when playing + sync to video timeline
  useEffect(() => {
    if (isPlaying) {
      // Fast metrics fade-in
      metricsTimerRef.current = setTimeout(() => {
        setMetricsVisible(true);
      }, METRICS_DELAY_MS);

      // Frequent metric updates for responsive feel
      metricsIntervalRef.current = setInterval(() => {
        const p = progressRef.current;
        setDisplayMetrics(computeTimelineMetrics(selectedExercise.id, p));
        setFormScore(computeFormScore(p));
      }, METRICS_UPDATE_MS);

      return () => {
        if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
        if (metricsTimerRef.current) {
          clearTimeout(metricsTimerRef.current);
          metricsTimerRef.current = null;
        }
      };
    } else {
      if (metricsTimerRef.current) {
        clearTimeout(metricsTimerRef.current);
        metricsTimerRef.current = null;
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
        metricsIntervalRef.current = null;
      }
      setMetricsVisible(false);
    }
  }, [isPlaying, selectedExercise]);

  // Self-driven progress for exercises without video
  useEffect(() => {
    if (isPlaying && !hasVideo) {
      const duration = 4000;
      const startTime = Date.now() - progressRef.current * duration;
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const t = (elapsed % duration) / duration;
        progressRef.current = t;
        progressAnim.setValue(t);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, hasVideo, progressAnim]);

  // Reset + autoplay on exercise change (with crossfade)
  useEffect(() => {
    progressRef.current = 0;
    progressAnim.setValue(0);
    setMetricsVisible(false);
    setFormScore(88);
    setDisplayMetrics(EXERCISE_METRICS[selectedExercise.id] ?? []);

    player.currentTime = 0;

    // Fade in after a brief moment
    Animated.timing(viewFade, {
      toValue: 1,
      duration: TRANSITION_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      isTransitioning.current = false;
      player.play();
    });
  }, [selectedExercise]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlayPause = useCallback(() => {
    if (settings.haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPlaying, player, settings.haptics]);

  const handleSelectExercise = useCallback((exercise: DemoExercise) => {
    if (exercise.id === selectedExercise.id || isTransitioning.current) return;

    if (settings.haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Crossfade: fade out current, then switch
    isTransitioning.current = true;
    player.pause();

    Animated.timing(viewFade, {
      toValue: 0,
      duration: TRANSITION_DURATION_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSelectedExercise(exercise);
      // fade-in happens in the useEffect above
    });
  }, [settings.haptics, selectedExercise.id, player, viewFade]);

  // Animated progress bar width
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: viewFade }]}>
        {/* Video layer */}
        {hasVideo ? (
          <View style={styles.videoContainer}>
            <VideoView
              player={player}
              style={styles.videoView}
              contentFit="contain"
              nativeControls={false}
            />
            {/* Edge fades */}
            <LinearGradient colors={['#000000', 'transparent']} style={styles.fadeTop} />
            <LinearGradient colors={['transparent', '#000000']} style={styles.fadeBottom} />
            <LinearGradient
              colors={['#000000', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.fadeSide}
            />
            <LinearGradient
              colors={['transparent', '#000000']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.fadeSide, { left: undefined, right: 0 }]}
            />
          </View>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholderBg]}>
            <View style={styles.placeholderContent}>
              <View style={styles.placeholderIconWrap}>
                <Ionicons name="videocam-outline" size={40} color="rgba(91, 124, 250, 0.35)" />
              </View>
              <Text style={styles.placeholderTitle}>{selectedExercise.label}</Text>
              <Text style={styles.placeholderSubtitle}>Video coming soon</Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Metrics overlay — staggered animated items */}
      <View style={styles.metricsOverlay} pointerEvents="none">
        {/* Left column */}
        <View style={[styles.metricsCol, styles.metricsLeft, { top: insets.top + 64 }]}>
          <LiveTag />
          {displayMetrics.slice(0, 3).map((m, i) => (
            <AnimatedMetricItem
              key={m.label}
              metric={m}
              index={i}
              align="left"
              metricsVisible={metricsVisible}
            />
          ))}
        </View>

        {/* Right column */}
        <View style={[styles.metricsCol, styles.metricsRight, { bottom: insets.bottom + 155 }]}>
          {displayMetrics.slice(3).map((m, i) => (
            <AnimatedMetricItem
              key={m.label}
              metric={m}
              index={i + 3}
              align="right"
              metricsVisible={metricsVisible}
            />
          ))}
        </View>

        {/* Form score ring */}
        <View style={{ position: 'absolute', right: spacing.md, top: insets.top + 64 }}>
          <FormScoreRing score={formScore} visible={metricsVisible} size={72} />
        </View>
      </View>

      {/* Tap-to-toggle play/pause */}
      <Pressable
        style={styles.touchArea}
        onPress={handlePlayPause}
      >
        {!isPlaying && !isTransitioning.current && (
          <View style={styles.playIcon}>
            <Ionicons name="play" size={32} color="rgba(255,255,255,0.7)" />
          </View>
        )}
      </Pressable>

      {/* Coaching caption */}
      <CoachingCaption
        cue={currentCue}
        isSpeaking={isSpeaking}
        style={{ bottom: insets.bottom + 155, zIndex: 11 }}
      />

      {/* Progress bar */}
      <View style={[styles.progressWrap, { bottom: insets.bottom + 130 }]}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFillWrap, { width: progressWidth }]}>
            <LinearGradient
              colors={[...colors.gradients.tealCyan]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressFill}
            />
          </Animated.View>
          {/* Glow dot at progress head */}
          <Animated.View
            style={[
              styles.progressDot,
              {
                left: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['-1%', '99%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Exercise selector pills */}
      <View style={[styles.pillRow, { bottom: insets.bottom + 75 }]}>
        {DEMO_EXERCISES.map((exercise) => {
          const isActive = exercise.id === selectedExercise.id;
          return (
            <Pressable
              key={exercise.id}
              style={({ pressed }) => [
                styles.pill,
                isActive && styles.pillActive,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => handleSelectExercise(exercise)}
            >
              {isActive && (
                <LinearGradient
                  colors={[...colors.gradients.tealCyan]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                />
              )}
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {exercise.label}
              </Text>
              {!exercise.video && (
                <View style={styles.soonBadge}>
                  <Text style={styles.soonText}>soon</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Bottom label */}
      <View style={[styles.bottomLabel, { bottom: insets.bottom + spacing.xl }]}>
        <Text style={styles.bottomLabelTitle}>
          {selectedExercise.label} Analysis
        </Text>
        <Text style={styles.bottomLabelSub}>
          {hasVideo ? 'Pose estimation overlay' : 'Preview mode'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Video
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '18%',
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '22%',
  },
  fadeSide: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '10%',
  },

  // Placeholder
  placeholderBg: {
    backgroundColor: '#0A0B0E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
  },
  placeholderIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(91, 124, 250, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(91, 124, 250, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  placeholderTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.text.primary,
  },
  placeholderSubtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },

  // Metrics overlay
  metricsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  metricsCol: {
    position: 'absolute',
    gap: spacing.xs,
  },
  metricsLeft: {
    left: spacing.md,
  },
  metricsRight: {
    right: spacing.md,
    alignItems: 'flex-end',
  },
  metricsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.semantic.success,
  },
  tagText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 9,
    color: colors.semantic.success,
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  metricItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(91, 124, 250, 0.5)',
    minWidth: 90,
  },
  metricItemRight: {
    borderLeftWidth: 0,
    borderRightWidth: 2,
    borderRightColor: 'rgba(91, 124, 250, 0.5)',
  },
  mLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 9,
    color: 'rgba(156, 163, 175, 0.75)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  mValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 2,
  },
  mValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: 'rgba(230, 232, 236, 0.85)',
  },
  mUnit: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: 'rgba(123, 150, 251, 0.65)',
  },
  mFormula: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 8,
    color: 'rgba(91, 124, 250, 0.35)',
    marginTop: 2,
  },

  // Score
  scoreWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.15)',
  },
  scoreNum: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: 'rgba(78, 205, 196, 0.9)',
  },
  scoreSub: {
    fontFamily: fontFamily.medium,
    fontSize: 9,
    color: 'rgba(156, 163, 175, 0.55)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: -2,
  },

  // Play/Pause
  touchArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Progress
  progressWrap: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    zIndex: 14,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'visible',
  },
  progressFillWrap: {
    height: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    flex: 1,
    borderRadius: 1.5,
  },
  progressDot: {
    position: 'absolute',
    top: -3,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.semantic.success,
    shadowColor: colors.semantic.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },

  // Pills
  pillRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    zIndex: 14,
    flexWrap: 'wrap',
  },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pillActive: {
    backgroundColor: 'transparent',
  },
  pillText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  pillTextActive: {
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  soonBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  soonText: {
    fontFamily: fontFamily.medium,
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.4)',
  },

  // Bottom label
  bottomLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 14,
  },
  bottomLabelTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: 'rgba(230, 232, 236, 0.7)',
  },
  bottomLabelSub: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: 'rgba(107, 114, 128, 0.6)',
    marginTop: 1,
  },
});
