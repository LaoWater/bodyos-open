import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, fontFamily, fontSize, spacing } from '../../theme';

interface FormScoreHUDProps {
  score: number;
  fps: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return colors.accent.primary;
  if (score >= 60) return colors.semantic.warning;
  return colors.semantic.error;
}

export function FormScoreHUD({ score, fps }: FormScoreHUDProps) {
  const scoreColor = getScoreColor(score);

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
      )}
      <Text style={[styles.score, { color: scoreColor }]}>{score}</Text>
      <Text style={styles.label}>Form</Text>
      <View style={styles.divider} />
      <Text style={styles.fps}>{fps} FPS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  androidBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  score: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fps: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
