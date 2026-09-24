import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { GlassCard } from '../components/glass/GlassCard';
import { MetricCard } from '../components/ui/MetricCard';
import { StreakIndicator } from '../components/ui/StreakIndicator';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useAssessments } from '../hooks/useAssessments';
import { useWorkouts } from '../hooks/useWorkouts';
import { colors, textStyles, spacing, fontFamily, fontSize, borderRadius } from '../theme';
import type { ProfileStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

function SettingsRow({ icon, label, onPress, disabled = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      style={styles.settingsRow}
      disabled={disabled || !onPress}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Ionicons name={icon} size={20} color={disabled ? colors.text.tertiary : colors.text.secondary} />
      <Text style={[styles.settingsLabel, disabled && styles.settingsDisabled]}>{label}</Text>
      <LinearGradient
        colors={disabled ? ['transparent', 'transparent'] : [...colors.gradients.tealCyan]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.chevronWrap}
      >
        <Ionicons name="chevron-forward" size={14} color={disabled ? colors.text.tertiary : colors.text.inverse} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { state, setAppMode, clearAppMode } = useApp();
  const { isAuthenticated, user: authUser, signOut } = useAuth();
  const { assessments } = useAssessments();
  const { sessions } = useWorkouts();
  const isDemo = state.appMode === 'demo';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'You will be signed out. Your cloud data will still be available when you sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            await setAppMode('demo');
          },
        },
      ],
    );
  };

  const handleExitDemo = () => {
    Alert.alert(
      'Exit Demo',
      'You will return to the mode selection screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          onPress: async () => {
            await clearAppMode();
          },
        },
      ],
    );
  };

  const user = state.user;
  const streak = state.streak;
  const userName = user?.name ?? 'BodyOS User';
  const initial = userName.charAt(0).toUpperCase();

  const bestFormScore = sessions.reduce((best, s) => {
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (set.formScore && set.formScore > best) return set.formScore;
      }
    }
    return best;
  }, 0);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {streak.current > 0 && <StreakIndicator streak={streak.current} size="sm" />}
      </View>

      {/* Profile Card */}
      <GlassCard variant="elevated" padding="lg" style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatarOuter}>
            <LinearGradient
              colors={[...colors.gradients.tealCyan]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{userName}</Text>
              {isDemo && !isAuthenticated && (
                <View style={styles.demoBadge}>
                  <Text style={styles.demoBadgeText}>DEMO</Text>
                </View>
              )}
            </View>
            {isAuthenticated && authUser?.email && (
              <Text style={styles.profileEmail}>{authUser.email}</Text>
            )}
            <Text style={styles.profileMember}>
              Member since {user ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            {user?.goals && user.goals.length > 0 && (
              <Text style={styles.profileGoals}>
                {user.goals.map((g) => g.replace('_', ' ')).join(', ')}
              </Text>
            )}
          </View>
        </View>
      </GlassCard>

      {/* Stats */}
      <SectionHeader title="Your Stats" />
      <View style={styles.statsRow}>
        <MetricCard value={String(assessments.length)} label="Assessments" />
        <MetricCard value={String(sessions.length)} label="Sessions" />
        <MetricCard value={bestFormScore > 0 ? String(bestFormScore) : '--'} label="Form Score" />
      </View>

      {/* Navigation */}
      <SectionHeader title="Quick Links" />
      <GlassCard variant="default" padding="sm" style={styles.settingsCard}>
        <SettingsRow icon="trending-up-outline" label="Progress" onPress={() => navigation.navigate('Progress')} />
        <View style={styles.settingsDivider} />
        <SettingsRow icon="trophy-outline" label="Achievements" onPress={() => navigation.navigate('Achievements')} />
        <View style={styles.settingsDivider} />
        <SettingsRow icon="settings-outline" label="Settings" onPress={() => navigation.navigate('Settings')} />
        <View style={styles.settingsDivider} />
        <SettingsRow icon="logo-whatsapp" label="WhatsApp Connect" onPress={() => navigation.navigate('WhatsApp')} />
      </GlassCard>

      {/* Sign Out / Exit Demo */}
      <GlassCard variant="default" padding="sm" style={styles.settingsCard}>
        {isAuthenticated ? (
          <TouchableOpacity style={styles.settingsRow} onPress={handleSignOut} activeOpacity={0.6}>
            <Ionicons name="log-out-outline" size={20} color={colors.semantic.error} />
            <Text style={[styles.settingsLabel, { color: colors.semantic.error }]}>Sign Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.settingsRow} onPress={handleExitDemo} activeOpacity={0.6}>
            <Ionicons name="exit-outline" size={20} color={colors.semantic.warning} />
            <Text style={[styles.settingsLabel, { color: colors.semantic.warning }]}>Exit Demo Mode</Text>
          </TouchableOpacity>
        )}
      </GlassCard>

      <Text style={styles.version}>BodyOS v1.0.0</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  title: {
    ...textStyles.h2,
    color: colors.text.primary,
  },
  profileCard: {
    marginBottom: spacing['2xl'],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  avatarOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accent.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.accent.primary,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  demoBadge: {
    backgroundColor: colors.accent.primaryMuted,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  demoBadgeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    color: colors.accent.primary,
    letterSpacing: 1,
  },
  profileEmail: {
    ...textStyles.caption,
    color: colors.accent.primary,
    marginTop: 2,
  },
  profileMember: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  profileGoals: {
    ...textStyles.small,
    color: colors.accent.primary,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  settingsCard: {
    marginBottom: spacing.lg,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  settingsLabel: {
    ...textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  settingsDisabled: {
    color: colors.text.secondary,
  },
  chevronWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.background.tertiary,
    marginHorizontal: spacing.md,
  },
  version: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
