import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../glass/GlassCard';
import { colors, textStyles, spacing, shadows } from '../../theme';

interface MetricCardProps {
  value: string;
  label: string;
}

export function MetricCard({ value, label }: MetricCardProps) {
  return (
    <GlassCard variant="subtle" padding="md" style={styles.card}>
      <View style={styles.content}>
        <LinearGradient
          colors={[...colors.gradients.tealTransparent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.value, shadows.glowTeal]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 12,
  },
  value: {
    ...textStyles.h3,
    color: colors.accent.primary,
  },
  label: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});
