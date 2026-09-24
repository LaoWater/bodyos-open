import { useEffect, useRef, memo } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { colors } from '../../theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const DOT_COUNT = 25;
const CONNECTION_DISTANCE = 110;
const PULSE_DOT_COUNT = 5; // only a handful of dots pulse

/* ────────────────────────────────────────────────────────
   Static constellation dots + lines generated once at
   module load time (not per-render, not per-mount).
   Only PULSE_DOT_COUNT dots get a gentle opacity animation
   via native driver (GPU, zero JS thread cost).
   ──────────────────────────────────────────────────────── */

interface Dot {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

// Generate once at module level - never recalculated
const DOTS: Dot[] = [];
for (let i = 0; i < DOT_COUNT; i++) {
  DOTS.push({
    x: Math.random() * SCREEN_W,
    y: Math.random() * SCREEN_H,
    radius: 1.5 + Math.random() * 2,
    opacity: 0.25 + Math.random() * 0.35,
  });
}

const CONNECTIONS: [number, number][] = [];
for (let i = 0; i < DOTS.length; i++) {
  for (let j = i + 1; j < DOTS.length; j++) {
    const dx = DOTS[i].x - DOTS[j].x;
    const dy = DOTS[i].y - DOTS[j].y;
    if (dx * dx + dy * dy < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
      CONNECTIONS.push([i, j]);
    }
  }
}

// Select which dots will pulse (evenly spaced through the array)
const PULSE_INDICES = new Set<number>();
const step = Math.floor(DOT_COUNT / PULSE_DOT_COUNT);
for (let i = 0; i < PULSE_DOT_COUNT; i++) {
  PULSE_INDICES.add(i * step);
}

/** A dot that gently pulses opacity – uses native driver, zero JS cost */
function PulseDot({ dot, index }: { dot: Dot; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + index * 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 3000 + index * 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, index]);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [dot.opacity * 0.5, dot.opacity],
  });

  return (
    <Animated.View
      style={[
        styles.pulseDot,
        {
          left: dot.x - dot.radius,
          top: dot.y - dot.radius,
          width: dot.radius * 2,
          height: dot.radius * 2,
          borderRadius: dot.radius,
          opacity,
        },
      ]}
    />
  );
}

export const ConstellationBackground = memo(function ConstellationBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Static SVG layer - rendered once, no animations */}
      <Svg style={StyleSheet.absoluteFill} width={SCREEN_W} height={SCREEN_H}>
        {CONNECTIONS.map(([i, j], idx) => (
          <Line
            key={idx}
            x1={DOTS[i].x}
            y1={DOTS[i].y}
            x2={DOTS[j].x}
            y2={DOTS[j].y}
            stroke={colors.nodes.line}
            strokeWidth={0.8}
          />
        ))}
        {DOTS.map((dot, i) =>
          PULSE_INDICES.has(i) ? null : (
            <Circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r={dot.radius}
              fill={colors.nodes.dot}
              opacity={dot.opacity}
            />
          ),
        )}
      </Svg>

      {/* Pulsing dots layer - native-driver opacity only */}
      {DOTS.filter((_, i) => PULSE_INDICES.has(i)).map((dot, i) => (
        <PulseDot key={`pulse-${i}`} dot={dot} index={i} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  pulseDot: {
    position: 'absolute',
    backgroundColor: colors.nodes.dot,
  },
});
