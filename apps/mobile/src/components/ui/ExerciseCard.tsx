import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../glass/GlassCard';
import { colors, textStyles, spacing, fontFamily, fontSize } from '../../theme';
import type { MuscleGroup } from '../../types/models';

interface ExerciseCardProps {
  name: string;
  muscleGroups: MuscleGroup[];
  sets: number;
  repsMin: number;
  repsMax: number;
  notes?: string;
  onPress?: () => void;
}

const MUSCLE_COLORS: Partial<Record<MuscleGroup, string>> = {
  chest: '#E8657A',
  back: '#5B7CFA',
  shoulders: '#F5A623',
  quads: '#4ECDC4',
  hamstrings: '#7B61FF',
  glutes: '#FF6B35',
  core: '#5AC8FA',
  biceps: '#E8657A',
  triceps: '#F0889A',
};

export function ExerciseCard({ name, muscleGroups, sets, repsMin, repsMax, notes, onPress }: ExerciseCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <GlassCard variant="subtle" padding="md" style={styles.card}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.tags}>
              {muscleGroups.slice(0, 3).map((mg) => (
                <View key={mg} style={[styles.tag, { backgroundColor: (MUSCLE_COLORS[mg] ?? colors.accent.primary) + '20' }]}>
                  <Text style={[styles.tagText, { color: MUSCLE_COLORS[mg] ?? colors.accent.primary }]}>
                    {mg.replace('_', ' ')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.right}>
            <Text style={styles.setsReps}>{sets}x{repsMin}{repsMax !== repsMin ? `-${repsMax}` : ''}</Text>
            {notes && <Text style={styles.notes}>{notes}</Text>}
          </View>
          {onPress && <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1 },
  name: { fontFamily: fontFamily.medium, fontSize: fontSize.base, color: colors.text.primary },
  tags: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap' },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  right: { alignItems: 'flex-end' },
  setsReps: { fontFamily: fontFamily.semiBold, fontSize: fontSize.base, color: colors.accent.primary },
  notes: { ...textStyles.small, color: colors.text.tertiary, marginTop: 2 },
});
