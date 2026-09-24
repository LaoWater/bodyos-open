import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, InteractionManager } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { FeatureCard } from '../components/ui/FeatureCard';
import { BodyBlueprint } from '../components/ui/BodyBlueprint';
import { GradientAccent } from '../components/glass/GradientAccent';
import { StreakIndicator } from '../components/ui/StreakIndicator';
import { TimelineCard } from '../components/ui/TimelineCard';
import { Skeleton } from '../components/ui/Skeleton';
import { StaggeredReveal } from '../components/motion/StaggeredReveal';
import { useApp } from '../context/AppContext';
import { useAssessments } from '../hooks/useAssessments';
import { useWorkouts } from '../hooks/useWorkouts';
import * as activityService from '../services/activityService';
import { colors, textStyles, spacing, fontFamily, fontSize, shadows } from '../theme';
import type { HomeStackParamList } from '../navigation/types';
import type { ActivityFeedItem } from '../types/models';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { state } = useApp();
  const { latest, loading: assessmentsLoading } = useAssessments();
  const { activePlan, loading: workoutsLoading } = useWorkouts();
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [activitiesReady, setActivitiesReady] = useState(false);
  const [interactionDone, setInteractionDone] = useState(false);

  // Wait for screen transition to complete before heavy data fetch
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setInteractionDone(true);
    });
    return () => task.cancel();
  }, []);

  // Fetch activity feed only after the screen transition is done
  useEffect(() => {
    if (!interactionDone) return;
    activityService.getFeed(5).then((feed) => {
      setActivities(feed);
      setActivitiesReady(true);
    });
  }, [interactionDone]);

  const userName = state.user?.name ?? 'Athlete';
  const streak = state.streak;

  // Determine today's workout from the active plan
  const todayDay = activePlan?.days?.[new Date().getDay() % (activePlan.days.length || 1)];

  return (
    <ScreenContainer>
      <StaggeredReveal
        visible={true}
        staggerInterval={120}
        duration={600}
        direction="down"
        distance={16}
      >
        {/* Hero Header - always renders instantly (no data dependency) */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={[...colors.gradients.heroTeal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.logoText}>Body<Text style={styles.logoAccent}>OS</Text></Text>
              {streak.current > 0 && <StreakIndicator streak={streak.current} size="md" />}
            </View>
            <Text style={styles.greeting}>{getGreeting()}, {userName}</Text>
            <Text style={styles.tagline}>Your body. Optimized.</Text>
          </View>
        </View>

        {/* Quick Actions - always renders instantly (static content) */}
        <View>
          <SectionHeader title="Quick Actions" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsRow}
            style={styles.actionsScroll}
          >
            <FeatureCard
              icon="body-outline"
              title="Body Scan"
              subtitle="AI intelligence"
              gradient="teal"
              onPress={() => navigation.getParent()?.navigate('Posture')}
            />
            <FeatureCard
              icon="videocam-outline"
              title="Record"
              subtitle="Film your set"
              gradient="coral"
              onPress={() => navigation.getParent()?.navigate('Camera')}
            />
            <FeatureCard
              icon="chatbubble-ellipses-outline"
              title="Ask Coach"
              subtitle="AI guidance"
              gradient="blue"
              onPress={() => navigation.getParent()?.navigate('Coach')}
            />
          </ScrollView>
        </View>

        {/* Today's Workout - progressive reveal */}
        <View>
          {workoutsLoading ? (
            <>
              <SectionHeader title="Today's Workout" />
              <Skeleton.Card />
            </>
          ) : activePlan && todayDay ? (
            <>
              <SectionHeader title="Today's Workout" />
              <TouchableOpacity
                onPress={() => navigation.navigate('WorkoutPlan', { planId: activePlan.id })}
                activeOpacity={0.7}
              >
                <GlassCard variant="elevated" padding="lg" innerGlow="teal" style={styles.workoutCard}>
                  <View style={styles.workoutRow}>
                    <GradientAccent preset="teal" size={44}>
                      <Ionicons name="barbell" size={22} color={colors.text.inverse} />
                    </GradientAccent>
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutName}>{todayDay.name}</Text>
                      <Text style={styles.workoutFocus}>{todayDay.focus}</Text>
                      <Text style={styles.workoutMeta}>{todayDay.exercises.length} exercises</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                  </View>
                  <GlassButton
                    title="Start Workout"
                    onPress={() => navigation.getParent()?.getParent()?.navigate('WorkoutSession', { planDayId: todayDay.id })}
                    variant="accent"
                    size="sm"
                    style={styles.startBtn}
                  />
                </GlassCard>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {/* Latest Posture Score - progressive reveal */}
        <View>
          {assessmentsLoading ? (
            <>
              <SectionHeader title="Body Status" subtitle="Loading..." />
              <Skeleton.BodyCard />
            </>
          ) : latest ? (
            <>
              <SectionHeader title="Body Status" subtitle="Latest posture score" />
              <TouchableOpacity
                onPress={() => navigation.getParent()?.getParent()?.navigate('BodyScanResult', { assessmentId: latest.id })}
                activeOpacity={0.7}
              >
                <GlassCard variant="elevated" padding="xl" style={styles.bodyCard}>
                  <View style={styles.bodyCardContent}>
                    <View style={[styles.blueprintWrap, shadows.glowTeal]}>
                      <BodyBlueprint width={120} height={192} highlightNodes={latest.issues.length > 0 ? [2, 3, 10, 11] : undefined} />
                    </View>
                    <View style={styles.bodyCardInfo}>
                      <Text style={styles.bodyScore}>{latest.score}</Text>
                      <Text style={styles.bodyScoreLabel}>/100 Posture Score</Text>
                      {latest.issues.length > 0 && (
                        <Text style={styles.bodyIssues}>{latest.issues.length} issue{latest.issues.length > 1 ? 's' : ''} detected</Text>
                      )}
                      <GlassButton
                        title="View Details"
                        onPress={() => navigation.getParent()?.getParent()?.navigate('BodyScanResult', { assessmentId: latest.id })}
                        variant="outline"
                        size="sm"
                        style={styles.bodyCardButton}
                      />
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <SectionHeader title="Body Status" subtitle="Your posture overview" />
              <GlassCard variant="elevated" padding="xl" style={styles.bodyCard}>
                <View style={styles.bodyCardContent}>
                  <View style={[styles.blueprintWrap, shadows.glowTeal]}>
                    <BodyBlueprint width={120} height={192} />
                  </View>
                  <View style={styles.bodyCardInfo}>
                    <Text style={styles.bodyCardTitle}>No Assessment Yet</Text>
                    <Text style={styles.bodyCardDesc}>
                      Take your first posture assessment to see your body's alignment map
                    </Text>
                    <GlassButton
                      title="Start Assessment"
                      onPress={() => navigation.getParent()?.navigate('Posture')}
                      variant="accent"
                      size="sm"
                      style={styles.bodyCardButton}
                    />
                  </View>
                </View>
              </GlassCard>
            </>
          )}
        </View>

        {/* Recent Activity - progressive reveal */}
        <View>
          <SectionHeader title="Recent Activity" />
          {!activitiesReady ? (
            <Skeleton.Timeline />
          ) : activities.length === 0 ? (
            <GlassCard variant="subtle" padding="xl" style={styles.emptyCard}>
              <Ionicons name="time-outline" size={36} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptyDesc}>
                Your workout history and form scores will appear here
              </Text>
            </GlassCard>
          ) : (
            <View>
              {activities.map((item) => (
                <TimelineCard
                  key={item.id}
                  type={item.type}
                  title={item.title}
                  description={item.description}
                  time={item.createdAt}
                  metric={item.metric}
                />
              ))}
              <GlassButton
                title="View All Progress"
                onPress={() => navigation.navigate('Progress')}
                variant="outline"
                size="sm"
                style={styles.viewAllBtn}
              />
            </View>
          )}
        </View>
      </StaggeredReveal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  header: {
    paddingTop: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logoText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text.secondary,
    letterSpacing: 1,
  },
  logoAccent: {
    color: colors.accent.primary,
  },
  greeting: {
    ...textStyles.h2,
    color: colors.text.primary,
  },
  tagline: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  actionsScroll: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing['2xl'],
  },
  actionsRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  workoutCard: {
    marginBottom: spacing['2xl'],
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  workoutFocus: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  workoutMeta: {
    ...textStyles.small,
    color: colors.accent.primary,
    marginTop: 2,
  },
  startBtn: {
    marginTop: spacing.md,
  },
  bodyCard: {
    marginBottom: spacing['2xl'],
  },
  bodyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  blueprintWrap: {
    borderRadius: 12,
  },
  bodyCardInfo: {
    flex: 1,
  },
  bodyScore: {
    fontFamily: fontFamily.bold,
    fontSize: 36,
    color: colors.accent.primary,
  },
  bodyScoreLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  bodyIssues: {
    ...textStyles.caption,
    color: colors.semantic.warning,
    marginTop: spacing.xs,
  },
  bodyCardTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  bodyCardDesc: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    marginBottom: spacing.base,
  },
  bodyCardButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  emptyTitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyDesc: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  viewAllBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
});
