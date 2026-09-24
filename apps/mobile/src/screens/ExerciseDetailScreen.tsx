import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { GlassCard } from '../components/glass/GlassCard';
import { GradientAccent } from '../components/glass/GradientAccent';
import { colors, textStyles, spacing, fontFamily, fontSize } from '../theme';
import * as workoutService from '../services/workoutService';
import type { Exercise } from '../types/models';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseDetail'>;

export function ExerciseDetailScreen() {
  const route = useRoute<Props['route']>();
  const navigation = useNavigation<Props['navigation']>();
  const [exercise, setExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    workoutService.getExerciseById(route.params.exerciseId).then(setExercise);
  }, [route.params.exerciseId]);

  if (!exercise) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{exercise.name}</Text>
      </View>

      {/* Meta */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Category</Text>
          <Text style={styles.metaValue}>{exercise.category}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Difficulty</Text>
          <Text style={styles.metaValue}>{exercise.difficulty}</Text>
        </View>
      </View>

      {/* Muscle Groups */}
      <View style={styles.muscleRow}>
        {exercise.muscleGroups.map((mg) => (
          <View key={mg} style={styles.muscleTag}>
            <Text style={styles.muscleText}>{mg.replace('_', ' ')}</Text>
          </View>
        ))}
      </View>

      {/* Setup */}
      <SectionHeader title="Setup" />
      <GlassCard variant="default" padding="lg" style={styles.cueCard}>
        {exercise.coachingCues.setup.map((cue, i) => (
          <View key={i} style={styles.cueRow}>
            <GradientAccent preset="teal" size={24}>
              <Text style={styles.cueNum}>{i + 1}</Text>
            </GradientAccent>
            <Text style={styles.cueText}>{cue}</Text>
          </View>
        ))}
      </GlassCard>

      {/* Execution */}
      <SectionHeader title="Execution" />
      <GlassCard variant="default" padding="lg" innerGlow="teal" style={styles.cueCard}>
        {exercise.coachingCues.execution.map((cue, i) => (
          <View key={i} style={styles.cueRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.semantic.success} />
            <Text style={styles.cueText}>{cue}</Text>
          </View>
        ))}
      </GlassCard>

      {/* Common Mistakes */}
      <SectionHeader title="Common Mistakes" />
      <GlassCard variant="default" padding="lg" innerGlow="coral" style={styles.cueCard}>
        {exercise.coachingCues.commonMistakes.map((cue, i) => (
          <View key={i} style={styles.cueRow}>
            <Ionicons name="alert-circle" size={20} color={colors.semantic.warning} />
            <Text style={styles.cueText}>{cue}</Text>
          </View>
        ))}
      </GlassCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm, marginBottom: spacing.lg },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background.tertiary, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h2, color: colors.text.primary, flex: 1 },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  metaItem: {},
  metaLabel: { ...textStyles.caption, color: colors.text.tertiary },
  metaValue: { fontFamily: fontFamily.semiBold, fontSize: fontSize.base, color: colors.text.primary, textTransform: 'capitalize', marginTop: 2 },
  muscleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  muscleTag: { backgroundColor: colors.accent.primaryMuted, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8 },
  muscleText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.accent.primary, textTransform: 'capitalize' },
  cueCard: { marginBottom: spacing.xl, gap: spacing.md },
  cueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cueNum: { fontFamily: fontFamily.bold, fontSize: fontSize.xs, color: colors.text.inverse },
  cueText: { ...textStyles.body, color: colors.text.secondary, flex: 1 },
});
