import { useEffect } from 'react';
import {
  Canvas,
  Line,
  vec,
  DashPathEffect,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';

interface BlueprintLineProps {
  /** Start point {x, y} in pixel coordinates */
  x1: number;
  y1: number;
  /** End point {x, y} in pixel coordinates */
  x2: number;
  y2: number;
  /** Canvas dimensions */
  width: number;
  height: number;
  /** Line color */
  color?: string;
  /** Dash segment length */
  dashLength?: number;
  /** Gap between dashes */
  dashGap?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Enable flowing animation */
  animated?: boolean;
  /** Animation duration (ms) per full cycle */
  animationDuration?: number;
  /** Line opacity */
  opacity?: number;
}

/**
 * Animated dashed line with "energy flowing" effect.
 * Uses Skia DashPathEffect with animated phase offset.
 * Used for: alignment guides on checkpoint views, body measurement lines.
 */
export function BlueprintLine({
  x1,
  y1,
  x2,
  y2,
  width,
  height,
  color = colors.accent.primary,
  dashLength = 6,
  dashGap = 4,
  strokeWidth = 1.5,
  animated = true,
  animationDuration = 2000,
  opacity = 0.4,
}: BlueprintLineProps) {
  const dashPhase = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      dashPhase.value = withRepeat(
        withTiming(dashLength + dashGap, {
          duration: animationDuration,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    }
  }, [animated, dashLength, dashGap, animationDuration, dashPhase]);

  return (
    <Canvas style={[StyleSheet.absoluteFill, { width, height }]} pointerEvents="none">
      <Line
        p1={vec(x1, y1)}
        p2={vec(x2, y2)}
        color={color}
        strokeWidth={strokeWidth}
        style="stroke"
        strokeCap="round"
        opacity={opacity}
      >
        <DashPathEffect intervals={[dashLength, dashGap]} phase={animated ? dashPhase.value : 0} />
      </Line>
    </Canvas>
  );
}

interface BlueprintLinesCanvasProps {
  /** Array of line segments: [x1, y1, x2, y2] */
  lines: [number, number, number, number][];
  width: number;
  height: number;
  color?: string;
  dashLength?: number;
  dashGap?: number;
  strokeWidth?: number;
  animated?: boolean;
  opacity?: number;
}

/**
 * Batch multiple blueprint lines in a single Canvas for better performance.
 */
export function BlueprintLinesCanvas({
  lines,
  width,
  height,
  color = colors.accent.primary,
  dashLength = 6,
  dashGap = 4,
  strokeWidth = 1.5,
  animated = true,
  opacity = 0.4,
}: BlueprintLinesCanvasProps) {
  const dashPhase = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      dashPhase.value = withRepeat(
        withTiming(dashLength + dashGap, {
          duration: 2000,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    }
  }, [animated, dashLength, dashGap, dashPhase]);

  return (
    <Canvas style={[StyleSheet.absoluteFill, { width, height }]} pointerEvents="none">
      {lines.map(([x1, y1, x2, y2], i) => (
        <Line
          key={i}
          p1={vec(x1, y1)}
          p2={vec(x2, y2)}
          color={color}
          strokeWidth={strokeWidth}
          style="stroke"
          strokeCap="round"
          opacity={opacity}
        >
          <DashPathEffect intervals={[dashLength, dashGap]} phase={animated ? dashPhase.value : 0} />
        </Line>
      ))}
    </Canvas>
  );
}
