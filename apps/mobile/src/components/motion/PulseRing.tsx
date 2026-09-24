import { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  Path as SkiaPath,
  Skia,
  BlurMask,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import { colors } from '../../theme';

interface PulseRingProps {
  /** Progress from 0-1 */
  progress: number;
  /** Ring diameter */
  size?: number;
  /** Ring stroke thickness */
  strokeWidth?: number;
  /** Base color - auto-transitions based on quality thresholds */
  color?: string;
  /** Glow blur radius */
  glowRadius?: number;
  /** Whether to pulse the glow on score improvements */
  pulseEnabled?: boolean;
  /** React node to render in center */
  children?: React.ReactNode;
}

const QUALITY_COLORS = {
  good: colors.semantic.success,    // #4ECDC4
  warning: colors.semantic.warning, // #F5A623
  bad: colors.semantic.error,       // #E74C3C
};

function getQualityColor(progress: number): string {
  if (progress >= 0.85) return QUALITY_COLORS.good;
  if (progress >= 0.70) return QUALITY_COLORS.warning;
  return QUALITY_COLORS.bad;
}

/**
 * Skia circular progress ring with animated glow.
 * Color auto-transitions based on quality thresholds (85%+ teal, 70%+ amber, <70% red).
 * Glow uses MaskFilter.MakeBlur for proper GPU-accelerated blur.
 */
export function PulseRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color,
  glowRadius = 4,
  pulseEnabled = true,
  children,
}: PulseRingProps) {
  const animatedProgress = useSharedValue(progress);
  const pulseOpacity = useSharedValue(0.6);

  const resolvedColor = color ?? getQualityColor(progress);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animatedProgress]);

  // Subtle continuous pulse on the glow layer
  useEffect(() => {
    if (pulseEnabled) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    } else {
      pulseOpacity.value = 0.6;
    }
  }, [pulseEnabled, pulseOpacity]);

  const center = size / 2;
  const radius = (size - strokeWidth * 2) / 2;

  // Background track arc (full circle)
  const trackPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addCircle(center, center, radius);
    return path;
  }, [center, radius]);

  // Progress arc path
  const progressPath = useMemo(() => {
    const path = Skia.Path.Make();
    const startAngle = -90; // Start from top
    const sweepAngle = 360 * Math.min(Math.max(progress, 0), 1);
    const rect = Skia.XYWHRect(
      center - radius,
      center - radius,
      radius * 2,
      radius * 2,
    );
    path.addArc(rect, startAngle, sweepAngle);
    return path;
  }, [center, radius, progress]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas style={{ width: size, height: size }}>
        {/* Background track */}
        <SkiaPath
          path={trackPath}
          color={colors.background.tertiary}
          strokeWidth={strokeWidth}
          style="stroke"
          strokeCap="round"
        />

        {/* Glow layer */}
        <SkiaPath
          path={progressPath}
          color={resolvedColor}
          strokeWidth={strokeWidth + glowRadius}
          style="stroke"
          strokeCap="round"
          opacity={0.3}
        >
          <BlurMask blur={glowRadius} style="normal" />
        </SkiaPath>

        {/* Progress arc */}
        <SkiaPath
          path={progressPath}
          color={resolvedColor}
          strokeWidth={strokeWidth}
          style="stroke"
          strokeCap="round"
        />
      </Canvas>

      {children && (
        <View style={[StyleSheet.absoluteFill, styles.childContainer]}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  childContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
