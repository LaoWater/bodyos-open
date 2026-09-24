import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, spacing } from '../../theme';

interface StreakIndicatorProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

function getGradient(streak: number): readonly [string, string] {
  if (streak >= 30) return ['#FF3B30', '#FF6B35'] as const;
  if (streak >= 14) return ['#FF6B35', '#F5A623'] as const;
  if (streak >= 7) return ['#F5A623', '#FFCC00'] as const;
  return ['#F5A623', '#F5A62380'] as const;
}

const SIZES = {
  sm: { icon: 14, text: fontSize.sm, container: 28 },
  md: { icon: 18, text: fontSize.base, container: 36 },
  lg: { icon: 24, text: fontSize.lg, container: 44 },
};

export function StreakIndicator({ streak, size = 'md' }: StreakIndicatorProps) {
  if (streak <= 0) return null;

  const s = SIZES[size];
  const gradient = getGradient(streak);

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { width: s.container, height: s.container, borderRadius: s.container / 2 }]}>
        <LinearGradient
          colors={[...gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: s.container / 2 }]}
        />
        <Ionicons name="flame" size={s.icon} color="#FFF" />
      </View>
      <Text style={[styles.count, { fontSize: s.text }]}>{streak}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconWrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  count: { fontFamily: fontFamily.bold, color: colors.text.primary },
});
