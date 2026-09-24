import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppPermissions } from '../utils/permissions';
import { colors, textStyles, spacing, borderRadius, fontFamily, fontSize } from '../theme';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { ConstellationBackground } from '../components/layout/ConstellationBackground';

function PermissionRow({ label, granted, icon }: { label: string; granted: boolean; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.permissionRow}>
      <Ionicons
        name={granted ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={granted ? colors.semantic.success : colors.text.tertiary}
      />
      <Text style={[styles.permissionLabel, granted && styles.permissionGranted]}>
        {label}
      </Text>
      <Ionicons
        name={icon}
        size={18}
        color={colors.text.tertiary}
        style={styles.permissionIcon}
      />
    </View>
  );
}

export function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const permissions = useAppPermissions();

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={styles.container}
    >
      <ConstellationBackground />
      <View style={[styles.content, { paddingTop: insets.top + spacing['3xl'] }]}>
        <View style={styles.heroSection}>
          <OptimizedImage
            name="grey-logo-vertical"
            variant="medium"
            style={styles.heroImage}
            contentFit="contain"
          />
        </View>

        <Text style={styles.title}>BodyOS</Text>
        <Text style={styles.subtitle}>
          AI-powered body intelligence for posture analysis and performance coaching
        </Text>

        <GlassCard variant="elevated" padding="lg" style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>To get started, we need access to:</Text>
          <View style={styles.permissionList}>
            <PermissionRow label="Camera" granted={permissions.cameraGranted} icon="camera-outline" />
            <PermissionRow label="Microphone" granted={permissions.micGranted} icon="mic-outline" />
            <PermissionRow label="Photo Library" granted={permissions.mediaGranted} icon="images-outline" />
          </View>
        </GlassCard>

        <GlassButton
          title="Grant Permissions"
          onPress={permissions.requestAll}
          variant="accent"
          size="lg"
          style={styles.grantButton}
        />

        <Text style={styles.disclaimer}>
          BodyOS needs these permissions to analyze your form and save workout recordings.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  heroSection: {
    marginBottom: spacing['2xl'],
    opacity: 0.8,
  },
  heroImage: {
    width: 150,
    height: 222,
  },
  title: {
    ...textStyles.h1,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.base,
  },
  permissionCard: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  permissionTitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  permissionList: {
    gap: spacing.md,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  permissionLabel: {
    ...textStyles.body,
    color: colors.text.secondary,
    flex: 1,
  },
  permissionGranted: {
    color: colors.text.primary,
  },
  permissionIcon: {
    marginLeft: spacing.sm,
  },
  grantButton: {
    width: '100%',
  },
  disclaimer: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.base,
    paddingHorizontal: spacing.base,
  },
});
