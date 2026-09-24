import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { WorkoutSetRow } from '../components/ui/WorkoutSetRow';
import { useWorkouts } from '../hooks/useWorkouts';
import { useApp } from '../context/AppContext';
import * as userService from '../services/userService';
import * as activityService from '../services/activityService';
import { colors, textStyles, spacing, fontFamily, fontSize } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutSession, SessionSet, WorkoutPlanDay, Exercise } from '../types/models';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutSession'>;

interface SetInput {
  weight: string;
  reps: string;
  rpe: string;
}

export function WorkoutSessionScreen() {
  const route = useRoute<Props['route']>();
  const navigation = useNavigation<Props['navigation']>();
  const { activePlan, exercises: allExercises, startSession, logSet, completeSession } = useWorkouts();
  const { refreshStreak } = useApp();

  const [sessionId] = useState(() => `sess_${Date.now()}`);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [sets, setSets] = useState<Record<string, SetInput[]>>({});
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const planDay = activePlan?.days.find((d) => d.id === route.params?.planDayId) ?? activePlan?.days[0];
  const dayExercises = planDay?.exercises ?? [];
  const currentPlanEx = dayExercises[currentExIndex];
  const currentExercise = allExercises.find((e) => e.id === currentPlanEx?.exerciseId);

  useEffect(() => {
    // Initialize session
    const session: WorkoutSession = {
      id: sessionId,
      planId: activePlan?.id,
      planDayId: planDay?.id,
      exercises: [],
      startedAt: new Date().toISOString(),
    };
    startSession(session);
  }, []);

  useEffect(() => {
    if (isResting && restTimer > 0) {
      timerRef.current = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current!);
    }
  }, [isResting, restTimer]);

  const getExSets = (exId: string): SetInput[] => {
    if (!sets[exId]) {
      const planEx = dayExercises.find((e) => e.exerciseId === exId);
      const numSets = planEx?.sets ?? 3;
      const initial = Array.from({ length: numSets }, () => ({ weight: '', reps: '', rpe: '' }));
      setSets((prev) => ({ ...prev, [exId]: initial }));
      return initial;
    }
    return sets[exId];
  };

  const updateSet = (exId: string, setIndex: number, field: keyof SetInput, value: string) => {
    setSets((prev) => {
      const exSets = [...(prev[exId] ?? [])];
      exSets[setIndex] = { ...exSets[setIndex], [field]: value };
      return { ...prev, [exId]: exSets };
    });
  };

  const handleCompleteSet = (exId: string, setIndex: number) => {
    const exSets = getExSets(exId);
    const s = exSets[setIndex];
    if (!s.weight || !s.reps) return;

    const set: SessionSet = {
      setNumber: setIndex + 1,
      weight: parseFloat(s.weight),
      reps: parseInt(s.reps),
      rpe: s.rpe ? parseFloat(s.rpe) : undefined,
    };
    logSet(sessionId, exId, set);

    // Start rest timer
    setRestTimer(currentPlanEx?.restSeconds ?? 90);
    setIsResting(true);
  };

  const handleNextExercise = () => {
    if (currentExIndex < dayExercises.length - 1) {
      setCurrentExIndex(currentExIndex + 1);
      setIsResting(false);
      setRestTimer(0);
    }
  };

  const handleCompleteWorkout = () => {
    Alert.alert('How was your workout?', 'Select your mood', [
      { text: 'Great', onPress: () => finishWorkout('great') },
      { text: 'Good', onPress: () => finishWorkout('good') },
      { text: 'Okay', onPress: () => finishWorkout('okay') },
      { text: 'Tough', onPress: () => finishWorkout('tough') },
    ]);
  };

  const finishWorkout = async (mood: WorkoutSession['mood']) => {
    await completeSession(sessionId, mood);
    await userService.incrementStreak();
    await refreshStreak();
    await activityService.addActivity({
      id: `act_${Date.now()}`,
      type: 'workout',
      title: planDay?.name ?? 'Workout',
      description: `Completed with mood: ${mood}`,
      createdAt: new Date().toISOString(),
    });
    navigation.goBack();
  };

  if (!currentExercise || !currentPlanEx) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>No exercises</Text>
        </View>
      </ScreenContainer>
    );
  }

  const exSets = getExSets(currentExercise.id);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerDay}>{planDay?.name ?? 'Workout'}</Text>
          <Text style={styles.headerProgress}>{currentExIndex + 1} of {dayExercises.length}</Text>
        </View>
      </View>

      {/* Rest Timer */}
      {isResting && (
        <GlassCard variant="elevated" padding="lg" innerGlow="teal" style={styles.restCard}>
          <Text style={styles.restLabel}>Rest</Text>
          <Text style={styles.restTime}>{Math.floor(restTimer / 60)}:{String(restTimer % 60).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => { setIsResting(false); setRestTimer(0); }}>
            <Text style={styles.skipRest}>Skip</Text>
          </TouchableOpacity>
        </GlassCard>
      )}

      {/* Exercise Info */}
      <GlassCard variant="elevated" padding="lg" style={styles.exerciseCard}>
        <Text style={styles.exerciseName}>{currentExercise.name}</Text>
        <Text style={styles.exerciseTarget}>
          {currentPlanEx.sets} sets x {currentPlanEx.repsMin}-{currentPlanEx.repsMax} reps
        </Text>
        {currentExercise.coachingCues.execution.length > 0 && (
          <View style={styles.cuesWrap}>
            {currentExercise.coachingCues.execution.slice(0, 2).map((cue, i) => (
              <View key={i} style={styles.cueRow}>
                <Ionicons name="checkmark-circle" size={14} color={colors.semantic.success} />
                <Text style={styles.cueText}>{cue}</Text>
              </View>
            ))}
          </View>
        )}
      </GlassCard>

      {/* Set Rows */}
      <GlassCard variant="default" padding="md" style={styles.setsCard}>
        {exSets.map((s, i) => (
          <View key={i}>
            <WorkoutSetRow
              setNumber={i + 1}
              weight={s.weight}
              reps={s.reps}
              rpe={s.rpe}
              onWeightChange={(v) => updateSet(currentExercise.id, i, 'weight', v)}
              onRepsChange={(v) => updateSet(currentExercise.id, i, 'reps', v)}
              onRpeChange={(v) => updateSet(currentExercise.id, i, 'rpe', v)}
            />
            {s.weight !== '' && s.reps !== '' && (
              <TouchableOpacity onPress={() => handleCompleteSet(currentExercise.id, i)} style={styles.logBtn}>
                <Ionicons name="checkmark" size={16} color={colors.semantic.success} />
                <Text style={styles.logText}>Log set</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </GlassCard>

      {/* Navigation */}
      <View style={styles.navRow}>
        {currentExIndex < dayExercises.length - 1 ? (
          <GlassButton title="Next Exercise" onPress={handleNextExercise} variant="accent" size="lg" icon="arrow-forward" style={styles.navBtn} />
        ) : (
          <GlassButton title="Complete Workout" onPress={handleCompleteWorkout} variant="accent" size="lg" icon="checkmark-circle" style={styles.navBtn} />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm, marginBottom: spacing.lg },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background.tertiary, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerDay: { fontFamily: fontFamily.semiBold, fontSize: fontSize.lg, color: colors.text.primary },
  headerProgress: { ...textStyles.caption, color: colors.text.secondary },
  title: { ...textStyles.h2, color: colors.text.primary },
  restCard: { alignItems: 'center', marginBottom: spacing.lg },
  restLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.text.secondary },
  restTime: { fontFamily: fontFamily.bold, fontSize: 48, color: colors.accent.primary },
  skipRest: { fontFamily: fontFamily.medium, fontSize: fontSize.base, color: colors.semantic.success, marginTop: spacing.sm },
  exerciseCard: { marginBottom: spacing.lg },
  exerciseName: { fontFamily: fontFamily.bold, fontSize: fontSize.xl, color: colors.text.primary },
  exerciseTarget: { fontFamily: fontFamily.medium, fontSize: fontSize.md, color: colors.accent.primary, marginTop: spacing.xs },
  cuesWrap: { marginTop: spacing.md, gap: spacing.xs },
  cueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cueText: { ...textStyles.caption, color: colors.text.secondary, flex: 1 },
  setsCard: { marginBottom: spacing.lg },
  logBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, justifyContent: 'center', paddingVertical: spacing.xs },
  logText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.semantic.success },
  navRow: { paddingBottom: spacing.xl },
  navBtn: { flex: 1 },
});
