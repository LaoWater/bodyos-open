import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, spacing } from '../../theme';

interface FeedbackPanelProps {
  tips: string[];
}

export function FeedbackPanel({ tips }: FeedbackPanelProps) {
  if (tips.length === 0) return null;

  const isGood = tips.length === 1 && tips[0].startsWith('Great');

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
      )}
      {tips.slice(0, 3).map((tip, i) => (
        <View key={i} style={styles.tipRow}>
          <Ionicons
            name={isGood ? 'checkmark-circle' : 'alert-circle'}
            size={16}
            color={isGood ? colors.accent.primary : colors.semantic.warning}
          />
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: spacing.md,
    gap: spacing.sm,
    marginHorizontal: spacing.base,
  },
  androidBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.85)',
    flex: 1,
  },
});
