import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, spacing } from '../../theme';

interface AchievementBadgeProps {
  name: string;
  icon: string;
  unlocked: boolean;
  category: string;
}

const CATEGORY_GRADIENTS: Record<string, readonly [string, string]> = {
  consistency: ['#FF6B35', '#F5A623'] as const,
  strength: ['#E8657A', '#F0889A'] as const,
  posture: ['#5B7CFA', '#4ECDC4'] as const,
  milestones: ['#7B61FF', '#5AC8FA'] as const,
};

export function AchievementBadge({ name, icon, unlocked, category }: AchievementBadgeProps) {
  const gradient = CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.milestones;

  return (
    <View style={styles.container}>
      <View style={[styles.ring, !unlocked && styles.ringLocked]}>
        {unlocked && (
          <LinearGradient
            colors={[...gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={[styles.inner, !unlocked && styles.innerLocked]}>
          <Ionicons
            name={(icon as keyof typeof Ionicons.glyphMap) ?? 'trophy-outline'}
            size={24}
            color={unlocked ? colors.text.primary : colors.text.tertiary}
          />
        </View>
      </View>
      <Text style={[styles.name, !unlocked && styles.nameLocked]} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 80 },
  ring: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ringLocked: { backgroundColor: colors.background.tertiary },
  inner: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.background.secondary, alignItems: 'center', justifyContent: 'center' },
  innerLocked: { backgroundColor: colors.background.primary, opacity: 0.5 },
  name: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: colors.text.primary, textAlign: 'center', marginTop: spacing.sm },
  nameLocked: { color: colors.text.tertiary },
});
