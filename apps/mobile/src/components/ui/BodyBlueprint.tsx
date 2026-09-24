import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { colors } from '../../theme';

interface BodyBlueprintProps {
  width?: number;
  height?: number;
  highlightNodes?: number[];
  color?: string;
  showConnections?: boolean;
}

// Normalized body landmark positions (0-1 range)
// Simplified human body: 17 key points
const LANDMARKS = [
  { x: 0.5, y: 0.06 },   // 0: head
  { x: 0.5, y: 0.15 },   // 1: neck
  { x: 0.35, y: 0.2 },   // 2: left shoulder
  { x: 0.65, y: 0.2 },   // 3: right shoulder
  { x: 0.25, y: 0.35 },  // 4: left elbow
  { x: 0.75, y: 0.35 },  // 5: right elbow
  { x: 0.2, y: 0.48 },   // 6: left wrist
  { x: 0.8, y: 0.48 },   // 7: right wrist
  { x: 0.5, y: 0.32 },   // 8: mid spine
  { x: 0.5, y: 0.45 },   // 9: lower spine
  { x: 0.38, y: 0.5 },   // 10: left hip
  { x: 0.62, y: 0.5 },   // 11: right hip
  { x: 0.36, y: 0.68 },  // 12: left knee
  { x: 0.64, y: 0.68 },  // 13: right knee
  { x: 0.34, y: 0.86 },  // 14: left ankle
  { x: 0.66, y: 0.86 },  // 15: right ankle
  { x: 0.34, y: 0.92 },  // 16: left foot
  { x: 0.66, y: 0.92 },  // 17: right foot
];

// Connections between landmarks (bone structure)
const CONNECTIONS: [number, number][] = [
  [0, 1],    // head to neck
  [1, 2],    // neck to left shoulder
  [1, 3],    // neck to right shoulder
  [2, 4],    // left shoulder to elbow
  [3, 5],    // right shoulder to elbow
  [4, 6],    // left elbow to wrist
  [5, 7],    // right elbow to wrist
  [2, 3],    // across shoulders
  [1, 8],    // neck to mid spine
  [8, 9],    // mid spine to lower spine
  [9, 10],   // lower spine to left hip
  [9, 11],   // lower spine to right hip
  [10, 11],  // across hips
  [10, 12],  // left hip to knee
  [11, 13],  // right hip to knee
  [12, 14],  // left knee to ankle
  [13, 15],  // right knee to ankle
  [14, 16],  // left ankle to foot
  [15, 17],  // right ankle to foot
];

export function BodyBlueprint({
  width = 200,
  height = 320,
  highlightNodes = [],
  color = colors.accent.primary,
  showConnections = true,
}: BodyBlueprintProps) {
  const nodeColor = colors.nodes.dot;
  const highlightColor = color;
  const lineColor = colors.nodes.lineActive;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <G>
          {showConnections && CONNECTIONS.map(([from, to], i) => {
            const isHighlighted = highlightNodes.includes(from) || highlightNodes.includes(to);
            return (
              <Line
                key={`bone-${i}`}
                x1={LANDMARKS[from].x * width}
                y1={LANDMARKS[from].y * height}
                x2={LANDMARKS[to].x * width}
                y2={LANDMARKS[to].y * height}
                stroke={isHighlighted ? highlightColor : lineColor}
                strokeWidth={isHighlighted ? 2 : 1.2}
                opacity={isHighlighted ? 0.8 : 0.4}
              />
            );
          })}
          {LANDMARKS.map((point, i) => {
            const isHighlighted = highlightNodes.includes(i);
            return (
              <Circle
                key={`node-${i}`}
                cx={point.x * width}
                cy={point.y * height}
                r={isHighlighted ? 5 : 3.5}
                fill={isHighlighted ? highlightColor : nodeColor}
                opacity={isHighlighted ? 1 : 0.7}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
