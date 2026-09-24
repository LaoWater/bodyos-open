/**
 * CorrectionArrows — Skia overlay drawing arrows from current to corrected joint positions.
 *
 * Color by severity:
 *   - Yellow (#F5A623) = warning displacement
 *   - Red (#E74C3C) = critical displacement
 *
 * Only draws arrows for joints with significant displacement (> 0.02 normalized).
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Line, Circle, vec, Path as SkiaPath } from '@shopify/react-native-skia';
import { PoseLandmark } from '../../types/pose';
import { moveNetToMediaPipeIndex } from '../../utils/poseNormalization';

interface CorrectionArrowsProps {
  /** Current raw landmarks (33 MediaPipe format) */
  rawLandmarks: PoseLandmark[];
  /** Corrected landmarks (17 MoveNet keypoints) */
  correctedLandmarks: PoseLandmark[];
  /** Per-joint displacement magnitudes (17 values) */
  jointDisplacements: number[];
  width: number;
  height: number;
  mirrored?: boolean;
}

// Only show arrows above this threshold
const MIN_DISPLACEMENT = 0.02;
const CRITICAL_DISPLACEMENT = 0.05;

const WARNING_COLOR = '#F5A623';
const CRITICAL_COLOR = '#E74C3C';

// Skip face joints for arrow display (MoveNet indices 0-4)
const SKIP_JOINTS = new Set([0, 1, 2, 3, 4]);

// Arrow head size in pixels
const ARROW_HEAD_SIZE = 8;

export function CorrectionArrows({
  rawLandmarks,
  correctedLandmarks,
  jointDisplacements,
  width,
  height,
  mirrored = false,
}: CorrectionArrowsProps) {
  const toX = (nx: number) => (mirrored ? 1 - nx : nx) * width;
  const toY = (ny: number) => ny * height;

  // Build arrows for joints with significant displacement
  const arrows: {
    fromX: number; fromY: number;
    toX: number; toY: number;
    color: string;
    displacement: number;
  }[] = [];

  for (let moveNetIdx = 0; moveNetIdx < 17; moveNetIdx++) {
    if (SKIP_JOINTS.has(moveNetIdx)) continue;

    const displacement = jointDisplacements[moveNetIdx];
    if (displacement < MIN_DISPLACEMENT) continue;

    const mediaPipeIdx = moveNetToMediaPipeIndex(moveNetIdx);
    const rawLm = rawLandmarks[mediaPipeIdx];
    const corrLm = correctedLandmarks[moveNetIdx];

    if (!rawLm || !corrLm) continue;
    if (rawLm.visibility < 0.5) continue;

    arrows.push({
      fromX: toX(rawLm.x),
      fromY: toY(rawLm.y),
      toX: toX(corrLm.x),
      toY: toY(corrLm.y),
      color: displacement >= CRITICAL_DISPLACEMENT ? CRITICAL_COLOR : WARNING_COLOR,
      displacement,
    });
  }

  if (arrows.length === 0) return null;

  return (
    <Canvas style={[StyleSheet.absoluteFill, { width, height }]} pointerEvents="none">
      {arrows.map((arrow, i) => {
        // Calculate arrow direction for head
        const dx = arrow.toX - arrow.fromX;
        const dy = arrow.toY - arrow.fromY;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len < 3) return null; // Too small to draw

        // Normalized direction
        const nx = dx / len;
        const ny = dy / len;

        // Arrow head points
        const headBase = ARROW_HEAD_SIZE;
        const perpX = -ny * headBase * 0.5;
        const perpY = nx * headBase * 0.5;

        const tipX = arrow.toX;
        const tipY = arrow.toY;
        const baseX = tipX - nx * headBase;
        const baseY = tipY - ny * headBase;

        // Arrow head path
        const headPath = `M ${tipX} ${tipY} L ${baseX + perpX} ${baseY + perpY} L ${baseX - perpX} ${baseY - perpY} Z`;

        return (
          <React.Fragment key={`arrow-${i}`}>
            {/* Arrow shaft */}
            <Line
              p1={vec(arrow.fromX, arrow.fromY)}
              p2={vec(baseX, baseY)}
              color={arrow.color}
              strokeWidth={2.5}
              style="stroke"
              strokeCap="round"
            />
            {/* Arrow head */}
            <SkiaPath
              path={headPath}
              color={arrow.color}
              style="fill"
            />
            {/* Correction target dot */}
            <Circle
              cx={arrow.toX}
              cy={arrow.toY}
              r={3}
              color={arrow.color}
              opacity={0.6}
            />
          </React.Fragment>
        );
      })}
    </Canvas>
  );
}
