import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../glass/GlassCard';
import { colors, textStyles, spacing, fontFamily, fontSize } from '../../theme';

interface PhotoCompareProps {
  date1: string;
  date2: string;
}

export function PhotoCompare({ date1, date2 }: PhotoCompareProps) {
  // Since we don't have actual photos in the demo, render a placeholder comparison view
  return (
    <View style={styles.container}>
      <View style={styles.photoWrap}>
        <GlassCard variant="elevated" padding="lg" style={styles.photoPlaceholder}>
          <Ionicons name="person-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.dateLabel}>{new Date(date1).toLocaleDateString()}</Text>
        </GlassCard>
      </View>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <View style={styles.dividerHandle}>
          <Ionicons name="swap-horizontal" size={16} color={colors.text.inverse} />
        </View>
        <View style={styles.dividerLine} />
      </View>
      <View style={styles.photoWrap}>
        <GlassCard variant="elevated" padding="lg" style={styles.photoPlaceholder}>
          <Ionicons name="person-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.dateLabel}>{new Date(date2).toLocaleDateString()}</Text>
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  photoWrap: { flex: 1 },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center', aspectRatio: 0.75, minHeight: 200 },
  dateLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.text.secondary, marginTop: spacing.sm },
  divider: { alignItems: 'center', gap: spacing.xs },
  dividerLine: { width: 2, height: 40, backgroundColor: colors.accent.primary, borderRadius: 1 },
  dividerHandle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
