import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { PulseRing } from './PulseRing';
import { AnimatedNumber } from './AnimatedNumber';
import { colors, fontFamily, fontSize } from '../../theme';

interface FormScoreRingProps {
  /** Score 0-100 */
  score: number;
  /** Whether the ring is visible */
  visible: boolean;
  /** Ring size (diameter) */
  size?: number;
}

/**
 * Composite form score display: PulseRing + AnimatedNumber center.
 * Replaces the old AnimatedFormScore box with a proper ring visualization.
 * Spring entrance animation on visibility change.
 */
export function FormScoreRing({
  score,
  visible,
  size = 72,
}: FormScoreRingProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const prevScoreRef = useRef(score);

  // Spring entrance
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

  // Glow pulse on score change
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
    ? colors.semantic.success
    : score >= 70
      ? colors.semantic.warning
      : colors.semantic.error;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <PulseRing
        progress={score / 100}
        size={size}
        strokeWidth={5}
        color={scoreColor}
        glowRadius={3}
        pulseEnabled={visible}
      >
        <View style={styles.center}>
          <AnimatedNumber
            value={score}
            duration={400}
            decimalPlaces={0}
            style={[styles.scoreNum, { color: scoreColor }]}
          />
          <Text style={styles.scoreSub}>form</Text>
        </View>
      </PulseRing>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
  },
  scoreNum: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.semantic.success,
  },
  scoreSub: {
    fontFamily: fontFamily.medium,
    fontSize: 8,
    color: 'rgba(156, 163, 175, 0.55)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: -3,
  },
});
