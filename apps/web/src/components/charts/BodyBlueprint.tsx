import { cn } from '@/lib/utils';
import type { FocusArea } from '@/types/models';

interface BodyBlueprintProps {
  score?: number;
  focusAreas?: FocusArea[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Simplified skeleton landmark positions (normalized 0-1)
const landmarks: Record<string, { x: number; y: number }> = {
  head: { x: 0.5, y: 0.08 },
  neck: { x: 0.5, y: 0.15 },
  leftShoulder: { x: 0.32, y: 0.2 },
  rightShoulder: { x: 0.68, y: 0.2 },
  leftElbow: { x: 0.22, y: 0.35 },
  rightElbow: { x: 0.78, y: 0.35 },
  leftWrist: { x: 0.18, y: 0.48 },
  rightWrist: { x: 0.82, y: 0.48 },
  leftHip: { x: 0.38, y: 0.5 },
  rightHip: { x: 0.62, y: 0.5 },
  leftKnee: { x: 0.36, y: 0.7 },
  rightKnee: { x: 0.64, y: 0.7 },
  leftAnkle: { x: 0.35, y: 0.9 },
  rightAnkle: { x: 0.65, y: 0.9 },
};

const connections: [string, string][] = [
  ['head', 'neck'],
  ['neck', 'leftShoulder'],
  ['neck', 'rightShoulder'],
  ['leftShoulder', 'leftElbow'],
  ['rightShoulder', 'rightElbow'],
  ['leftElbow', 'leftWrist'],
  ['rightElbow', 'rightWrist'],
  ['leftShoulder', 'leftHip'],
  ['rightShoulder', 'rightHip'],
  ['leftHip', 'rightHip'],
  ['leftHip', 'leftKnee'],
  ['rightHip', 'rightKnee'],
  ['leftKnee', 'leftAnkle'],
  ['rightKnee', 'rightAnkle'],
];

// Map landmark indices to our named landmarks for focus area highlighting
const indexToLandmark: Record<number, string> = {
  0: 'head', 7: 'leftShoulder', 8: 'rightShoulder',
  11: 'leftShoulder', 12: 'rightShoulder',
  13: 'leftElbow', 14: 'rightElbow',
  15: 'leftWrist', 16: 'rightWrist',
  23: 'leftHip', 24: 'rightHip',
  25: 'leftKnee', 26: 'rightKnee',
  27: 'leftAnkle', 28: 'rightAnkle',
};

const sizeMap = { sm: 100, md: 180, lg: 280 };

export function BodyBlueprint({ focusAreas = [], size = 'md', className }: BodyBlueprintProps) {
  const dim = sizeMap[size];
  const dotSize = size === 'lg' ? 6 : size === 'md' ? 5 : 4;

  // Collect highlighted landmark names
  const highlightedLandmarks = new Set<string>();
  const severityMap = new Map<string, 'low' | 'medium' | 'high'>();

  for (const fa of focusAreas) {
    for (const idx of fa.landmarkIndices) {
      const name = indexToLandmark[idx];
      if (name) {
        highlightedLandmarks.add(name);
        const prev = severityMap.get(name);
        if (!prev || fa.severity === 'high' || (fa.severity === 'medium' && prev === 'low')) {
          severityMap.set(name, fa.severity);
        }
      }
    }
  }

  const getSeverityColor = (name: string) => {
    const severity = severityMap.get(name);
    if (severity === 'high') return '#E74C3C';
    if (severity === 'medium') return '#F5A623';
    return '#4ECDC4';
  };

  return (
    <div className={cn('relative', className)} style={{ width: dim, height: dim }}>
      {/* Background circles */}
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        {/* Concentric circles */}
        {[0.4, 0.6, 0.8].map((r) => (
          <circle
            key={r}
            cx={dim / 2}
            cy={dim / 2}
            r={(dim / 2) * r}
            fill="none"
            stroke="rgba(91, 124, 250, 0.06)"
            strokeWidth={1}
          />
        ))}

        {/* Connections */}
        {connections.map(([a, b]) => {
          const p1 = landmarks[a];
          const p2 = landmarks[b];
          const isHighlighted = highlightedLandmarks.has(a) || highlightedLandmarks.has(b);
          return (
            <line
              key={`${a}-${b}`}
              x1={p1.x * dim}
              y1={p1.y * dim}
              x2={p2.x * dim}
              y2={p2.y * dim}
              stroke={isHighlighted ? getSeverityColor(a) : '#5B7CFA'}
              strokeWidth={2}
              strokeOpacity={isHighlighted ? 0.8 : 0.4}
            />
          );
        })}

        {/* Landmark dots */}
        {Object.entries(landmarks).map(([name, pos]) => {
          const isHighlighted = highlightedLandmarks.has(name);
          const color = isHighlighted ? getSeverityColor(name) : '#5B7CFA';
          return (
            <g key={name}>
              {isHighlighted && (
                <circle
                  cx={pos.x * dim}
                  cy={pos.y * dim}
                  r={dotSize + 4}
                  fill={color}
                  opacity={0.2}
                >
                  <animate
                    attributeName="r"
                    values={`${dotSize + 4};${dotSize + 8};${dotSize + 4}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.2;0.05;0.2"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                cx={pos.x * dim}
                cy={pos.y * dim}
                r={dotSize}
                fill={color}
                opacity={isHighlighted ? 1 : 0.6}
                style={isHighlighted ? { filter: `drop-shadow(0 0 4px ${color})` } : undefined}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
