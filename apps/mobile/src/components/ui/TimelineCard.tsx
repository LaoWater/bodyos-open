import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../glass/GlassCard';
import { colors, textStyles, spacing, fontFamily, fontSize } from '../../theme';
import type { ActivityType } from '../../types/models';

const ICONS: Record<ActivityType, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  assessment: { name: 'scan-outline', color: colors.semantic.info },
  workout: { name: 'barbell-outline', color: colors.semantic.success },
  achievement: { name: 'trophy-outline', color: colors.semantic.warning },
  photo: { name: 'camera-outline', color: colors.secondary.primary },
  streak: { name: 'flame-outline', color: '#FF6B35' },
  plan: { name: 'calendar-outline', color: colors.accent.primary },
};

interface TimelineCardProps {
  type: ActivityType;
  title: string;
  description: string;
  time: string;
  metric?: string;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export function TimelineCard({ type, title, description, time, metric }: TimelineCardProps) {
  const iconConfig = ICONS[type] ?? ICONS.workout;

  return (
    <GlassCard variant="subtle" padding="md" style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: iconConfig.color + '20' }]}>
          <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{description}</Text>
        </View>
        <View style={styles.right}>
          {metric && <Text style={styles.metric}>{metric}</Text>}
          <Text style={styles.time}>{formatTimeAgo(time)}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontFamily: fontFamily.medium, fontSize: fontSize.base, color: colors.text.primary },
  desc: { ...textStyles.caption, color: colors.text.secondary, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  metric: { fontFamily: fontFamily.semiBold, fontSize: fontSize.base, color: colors.accent.primary },
  time: { ...textStyles.small, color: colors.text.tertiary, marginTop: 2 },
});
