import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { resetDemoData } from '../services/mockData';
import { colors, textStyles, spacing, fontFamily, fontSize } from '../theme';
import type { RootStackParamList } from '../navigation/types';

function SettingToggle({ icon, label, value, onToggle }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Ionicons name={icon} size={20} color={colors.text.secondary} />
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.background.tertiary, true: colors.accent.primaryMuted }}
        thumbColor={value ? colors.accent.primary : colors.text.tertiary}
      />
    </View>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state, updateSettings, setAppMode } = useApp();
  const { isAuthenticated, user, signOut } = useAuth();
  const { settings } = state;
  const isDemo = state.appMode === 'demo';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'You will be signed out and switched to demo mode. Your cloud data will still be available when you sign back in.',
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

  const handleReset = () => {
    Alert.alert(
      'Reset Demo Data',
      'This will clear all data and re-seed with fresh demo content. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetDemoData();
            Alert.alert('Done', 'Demo data has been reset. Please restart the app.');
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <GlassCard variant="default" padding="sm" style={styles.card}>
        <SettingToggle
          icon="notifications-outline"
          label="Notifications"
          value={settings.notifications}
          onToggle={(v) => updateSettings({ notifications: v })}
        />
        <View style={styles.divider} />
        <SettingToggle
          icon="phone-portrait-outline"
          label="Haptic Feedback"
          value={settings.haptics}
          onToggle={(v) => updateSettings({ haptics: v })}
        />
        <View style={styles.divider} />
        <SettingToggle
          icon="body-outline"
          label="Skeleton Overlay"
          value={settings.skeletonOverlay}
          onToggle={(v) => updateSettings({ skeletonOverlay: v })}
        />
        <View style={styles.divider} />
        <SettingToggle
          icon="volume-high-outline"
          label="Voice Feedback"
          value={settings.voiceFeedback}
          onToggle={(v) => updateSettings({ voiceFeedback: v })}
        />
      </GlassCard>

      <GlassCard variant="default" padding="sm" style={styles.card}>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => updateSettings({ units: settings.units === 'metric' ? 'imperial' : 'metric' })}
        >
          <Ionicons name="resize-outline" size={20} color={colors.text.secondary} />
          <Text style={styles.settingLabel}>Units</Text>
          <Text style={styles.unitValue}>{settings.units === 'metric' ? 'Metric (kg)' : 'Imperial (lbs)'}</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Account Section */}
      <GlassCard variant="default" padding="sm" style={styles.card}>
        {isAuthenticated ? (
          <>
            <View style={styles.settingRow}>
              <Ionicons name="person-circle-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.settingLabel}>{user?.email ?? 'Signed In'}</Text>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color={colors.semantic.error} />
              <Text style={[styles.settingLabel, { color: colors.semantic.error }]}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('Auth')}>
            <Ionicons name="log-in-outline" size={20} color={colors.accent.primary} />
            <Text style={[styles.settingLabel, { color: colors.accent.primary }]}>Sign In to Sync Data</Text>
          </TouchableOpacity>
        )}
      </GlassCard>

      {isDemo && (
        <GlassButton
          title="Reset Demo Data"
          onPress={handleReset}
          variant="outline"
          size="md"
          icon="refresh-outline"
          style={styles.resetBtn}
        />
      )}

      <GlassCard variant="subtle" padding="lg" style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>About BodyOS</Text>
        <Text style={styles.aboutText}>
          AI-powered body intelligence platform. Posture analysis, workout planning, and real-time form coaching.
        </Text>
        <Text style={styles.version}>v1.0.0</Text>
      </GlassCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm, marginBottom: spacing.xl },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background.tertiary, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h2, color: colors.text.primary },
  card: { marginBottom: spacing.lg },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  settingLabel: { ...textStyles.body, color: colors.text.primary, flex: 1 },
  unitValue: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.accent.primary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.background.tertiary, marginHorizontal: spacing.md },
  resetBtn: { marginBottom: spacing.xl },
  aboutCard: { alignItems: 'center', marginBottom: spacing.xl },
  aboutTitle: { fontFamily: fontFamily.semiBold, fontSize: fontSize.md, color: colors.text.primary },
  aboutText: { ...textStyles.caption, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm },
  version: { ...textStyles.small, color: colors.text.tertiary, marginTop: spacing.md },
});
