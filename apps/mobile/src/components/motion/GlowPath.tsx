import { Path, Line, vec, SkPoint } from '@shopify/react-native-skia';

interface GlowLineProps {
  p1: SkPoint;
  p2: SkPoint;
  color: string;
  glowColor?: string;
  strokeWidth?: number;
  glowRadius?: number;
  opacity?: number;
}

/**
 * Dual-layer glow line: outer blur + inner solid.
 * Used by SkeletonOverlay, alignment lines, and connection paths.
 *
 * When `glowColor` is not provided, uses the same color with 20% opacity.
 */
export function GlowLine({
  p1,
  p2,
  color,
  glowColor,
  strokeWidth = 2.5,
  glowRadius = 3,
  opacity = 1,
}: GlowLineProps) {
  const outerColor = glowColor ?? color.replace(/[\d.]+\)$/, '0.20)');
  const outerWidth = strokeWidth + glowRadius * 2;

  return (
    <>
      {/* Outer glow layer */}
      <Line
        p1={p1}
        p2={p2}
        color={outerColor}
        strokeWidth={outerWidth}
        style="stroke"
        strokeCap="round"
        opacity={opacity}
      />
      {/* Inner solid layer */}
      <Line
        p1={p1}
        p2={p2}
        color={color}
        strokeWidth={strokeWidth}
        style="stroke"
        strokeCap="round"
        opacity={opacity}
      />
    </>
  );
}

interface GlowPathProps {
  path: string;
  color: string;
  glowColor?: string;
  strokeWidth?: number;
  glowRadius?: number;
  opacity?: number;
}

/**
 * Dual-layer glow path using SVG path string.
 */
export function GlowPath({
  path,
  color,
  glowColor,
  strokeWidth = 2.5,
  glowRadius = 3,
  opacity = 1,
}: GlowPathProps) {
  const outerColor = glowColor ?? color.replace(/[\d.]+\)$/, '0.20)');
  const outerWidth = strokeWidth + glowRadius * 2;

  return (
    <>
      <Path
        path={path}
        color={outerColor}
        strokeWidth={outerWidth}
        style="stroke"
        strokeCap="round"
        strokeJoin="round"
        opacity={opacity}
      />
      <Path
        path={path}
        color={color}
        strokeWidth={strokeWidth}
        style="stroke"
        strokeCap="round"
        strokeJoin="round"
        opacity={opacity}
      />
    </>
  );
}
