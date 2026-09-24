import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Circle, Line, vec, BlurMask } from '@shopify/react-native-skia';
import { PoseResult, POSE_CONNECTIONS, LandmarkIndex, FormQuality } from '../../types/pose';

interface SkeletonOverlayProps {
  pose: PoseResult | null;
  width: number;
  height: number;
  mirrored?: boolean;
  jointQualities?: Map<LandmarkIndex, FormQuality>;
}

const VISIBILITY_THRESHOLD = 0.05;
const SKIP_FACE_MAX = 10; // Skip landmarks 0-10 (face)

const QUALITY_COLORS: Record<FormQuality, string> = {
  good: '#4ECDC4',
  warning: '#F5A623',
  bad: '#E74C3C',
};

// Joint glow colors at reduced opacity
const QUALITY_GLOW_COLORS: Record<FormQuality, string> = {
  good: 'rgba(78, 205, 196, 0.35)',
  warning: 'rgba(245, 166, 35, 0.35)',
  bad: 'rgba(231, 76, 60, 0.35)',
};

const BONE_COLOR = '#5B7CFA';
const GLOW_COLOR = 'rgba(91, 124, 250, 0.25)';
const GLOW_BLUR_RADIUS = 3;

function SkeletonOverlayInner({
  pose,
  width,
  height,
  mirrored = false,
  jointQualities,
}: SkeletonOverlayProps) {
  if (!pose || pose.landmarks.length < 33) return null;

  const toX = (nx: number) => (mirrored ? 1 - nx : nx) * width;
  const toY = (ny: number) => ny * height;

  const landmarks = pose.landmarks;

  const isVisible = (idx: number) =>
    idx > SKIP_FACE_MAX && landmarks[idx].visibility >= VISIBILITY_THRESHOLD;

  const getQuality = (idx: number): FormQuality =>
    jointQualities?.get(idx as LandmarkIndex) ?? 'good';

  return (
    <Canvas style={[StyleSheet.absoluteFill, { width, height }]}>
      {/* Glow layer — proper MaskFilter.MakeBlur for GPU-accelerated glow */}
      {POSE_CONNECTIONS.map(([a, b], i) => {
        if (!isVisible(a) || !isVisible(b)) return null;
        const la = landmarks[a];
        const lb = landmarks[b];
        return (
          <Line
            key={`g${i}`}
            p1={vec(toX(la.x), toY(la.y))}
            p2={vec(toX(lb.x), toY(lb.y))}
            color={GLOW_COLOR}
            strokeWidth={5}
            style="stroke"
            strokeCap="round"
          >
            <BlurMask blur={GLOW_BLUR_RADIUS} style="normal" />
          </Line>
        );
      })}

      {/* Bone layer — thin solid lines */}
      {POSE_CONNECTIONS.map(([a, b], i) => {
        if (!isVisible(a) || !isVisible(b)) return null;
        const la = landmarks[a];
        const lb = landmarks[b];
        return (
          <Line
            key={`b${i}`}
            p1={vec(toX(la.x), toY(la.y))}
            p2={vec(toX(lb.x), toY(lb.y))}
            color={BONE_COLOR}
            strokeWidth={2.5}
            style="stroke"
            strokeCap="round"
          />
        );
      })}

      {/* Joint glow layer — soft glow behind each joint */}
      {landmarks.map((lm, idx) => {
        if (!isVisible(idx)) return null;
        const quality = getQuality(idx);
        const glowColor = QUALITY_GLOW_COLORS[quality];
        return (
          <Circle
            key={`jg${idx}`}
            cx={toX(lm.x)}
            cy={toY(lm.y)}
            r={quality === 'bad' ? 9 : quality === 'warning' ? 8 : 7}
            color={glowColor}
          >
            <BlurMask blur={4} style="normal" />
          </Circle>
        );
      })}

      {/* Joint layer — colored circles */}
      {landmarks.map((lm, idx) => {
        if (!isVisible(idx)) return null;
        const quality = getQuality(idx);
        const color = QUALITY_COLORS[quality];
        return (
          <Circle
            key={`j${idx}`}
            cx={toX(lm.x)}
            cy={toY(lm.y)}
            r={quality === 'bad' ? 6 : quality === 'warning' ? 5 : 4}
            color={color}
          />
        );
      })}
    </Canvas>
  );
}

// Memoize: only re-render when pose timestamp changes or dimensions change
export const SkeletonOverlay = memo(SkeletonOverlayInner, (prev, next) => {
  if (prev.width !== next.width || prev.height !== next.height) return false;
  if (prev.mirrored !== next.mirrored) return false;
  if (prev.pose?.timestamp !== next.pose?.timestamp) return false;
  return true;
});
