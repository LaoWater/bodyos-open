import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { ExerciseCard } from '../components/ui/ExerciseCard';
import { GradientAccent } from '../components/glass/GradientAccent';
import { useWorkouts } from '../hooks/useWorkouts';
import { colors, textStyles, spacing, fontFamily, fontSize } from '../theme';
import type { HomeStackParamList } from '../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<HomeStackParamList, 'WorkoutPlan'>;

export function WorkoutPlanScreen() {
  const route = useRoute<Props['route']>();
  const navigation = useNavigation<Props['navigation']>();
  const { activePlan, exercises, getExerciseById } = useWorkouts();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const plan = activePlan;

  if (!plan) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Workout Plan</Text>
        </View>
        <GlassCard variant="subtle" padding="xl" style={styles.empty}>
          <Ionicons name="barbell-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>No active plan</Text>
          <Text style={styles.emptyDesc}>Create a workout plan to get started</Text>
        </GlassCard>
      </ScreenContainer>
    );
  }

  const todayIndex = new Date().getDay();
  const todayDayId = plan.days.length > 0 ? plan.days[todayIndex % plan.days.length]?.id : undefined;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{plan.name}</Text>
      </View>

      {/* Plan Header */}
      <GlassCard variant="elevated" padding="lg" innerGlow="teal" style={styles.planHeader}>
        <View style={styles.planInfo}>
          <GradientAccent preset="teal" size={40}>
            <Ionicons name="barbell" size={20} color={colors.text.inverse} />
          </GradientAccent>
          <View style={styles.planMeta}>
            <Text style={styles.planGoal}>{plan.goal.replace('_', ' ')}</Text>
            <Text style={styles.planSchedule}>{plan.daysPerWeek} days/week</Text>
          </View>
        </View>
      </GlassCard>

      {/* Day Cards */}
      {plan.days.map((day) => {
        const isExpanded = expandedDay === day.id;
        const isToday = day.id === todayDayId;

        return (
          <View key={day.id} style={styles.daySection}>
            <TouchableOpacity onPress={() => setExpandedDay(isExpanded ? null : day.id)} activeOpacity={0.7}>
              <GlassCard
                variant={isToday ? 'elevated' : 'default'}
                padding="lg"
                innerGlow={isToday ? 'teal' : undefined}
                style={styles.dayCard}
              >
                <View style={styles.dayHeader}>
                  <View>
                    <Text style={styles.dayName}>Day {day.dayIndex + 1}: {day.name}</Text>
                    <Text style={styles.dayFocus}>{day.focus}</Text>
                  </View>
                  <View style={styles.dayRight}>
                    <Text style={styles.exerciseCount}>{day.exercises.length} exercises</Text>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text.tertiary} />
                  </View>
                </View>
                {isToday && (
                  <View style={styles.todayBadge}>
                    <LinearGradient colors={[...colors.gradients.tealCyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                    <Text style={styles.todayText}>Today</Text>
                  </View>
                )}
              </GlassCard>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.exerciseList}>
                {day.exercises.map((ex, i) => {
                  const exercise = getExerciseById(ex.exerciseId);
                  if (!exercise) return null;
                  return (
                    <ExerciseCard
                      key={`${day.id}-${ex.exerciseId}`}
                      name={exercise.name}
                      muscleGroups={exercise.muscleGroups}
                      sets={ex.sets}
                      repsMin={ex.repsMin}
                      repsMax={ex.repsMax}
                      notes={ex.notes}
                      onPress={() => navigation.getParent()?.navigate('ExerciseDetail', { exerciseId: ex.exerciseId })}
                    />
                  );
                })}
                <GlassButton
                  title="Start This Workout"
                  onPress={() => navigation.getParent()?.navigate('WorkoutSession', { planDayId: day.id })}
                  variant="accent"
                  size="md"
                  style={styles.startBtn}
                />
              </View>
            )}
          </View>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm, marginBottom: spacing.lg },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background.tertiary, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h2, color: colors.text.primary, flex: 1 },
  planHeader: { marginBottom: spacing.xl },
  planInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  planMeta: { flex: 1 },
  planGoal: { fontFamily: fontFamily.semiBold, fontSize: fontSize.md, color: colors.text.primary, textTransform: 'capitalize' },
  planSchedule: { ...textStyles.caption, color: colors.text.secondary, marginTop: 2 },
  empty: { alignItems: 'center', gap: spacing.md },
  emptyText: { fontFamily: fontFamily.semiBold, fontSize: fontSize.lg, color: colors.text.secondary },
  emptyDesc: { ...textStyles.body, color: colors.text.tertiary },
  daySection: { marginBottom: spacing.md },
  dayCard: {},
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { fontFamily: fontFamily.semiBold, fontSize: fontSize.base, color: colors.text.primary },
  dayFocus: { ...textStyles.caption, color: colors.text.secondary, marginTop: 2 },
  dayRight: { alignItems: 'flex-end' },
  exerciseCount: { ...textStyles.caption, color: colors.text.tertiary },
  todayBadge: { position: 'absolute', top: -1, right: -1, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 2, overflow: 'hidden' },
  todayText: { fontFamily: fontFamily.semiBold, fontSize: fontSize.xs, color: colors.text.inverse },
  exerciseList: { paddingTop: spacing.sm },
  startBtn: { marginTop: spacing.sm },
});
