import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GradientAccent } from '../glass/GradientAccent';
import { useApp } from '../../context/AppContext';
import { colors, textStyles, spacing, borderRadius } from '../../theme';

type GradientPreset = 'teal' | 'coral' | 'sunset' | 'blue';

const GRADIENT_COLORS: Record<GradientPreset, readonly [string, string]> = {
  teal: colors.gradients.tealCyan,
  coral: colors.gradients.coralPink,
  sunset: colors.gradients.warmSunset,
  blue: colors.gradients.bluePurple,
};

const GLOW_COLORS: Record<GradientPreset, string> = {
  teal: 'rgba(91, 124, 250, 0.08)',
  coral: 'rgba(232, 101, 122, 0.08)',
  sunset: 'rgba(245, 166, 35, 0.08)',
  blue: 'rgba(90, 200, 250, 0.08)',
};

interface FeatureCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  gradient?: GradientPreset;
  onPress?: () => void;
}

export function FeatureCard({ icon, title, subtitle, gradient = 'teal', onPress }: FeatureCardProps) {
  const { state } = useApp();

  const handlePress = () => {
    if (state.settings.haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const gradientColors = GRADIENT_COLORS[gradient];
  const glowBg = GLOW_COLORS[gradient];

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => pressed && { opacity: 0.8 }}>
      <View style={styles.gradientBorderWrap}>
        <LinearGradient
          colors={[`${gradientColors[0]}40`, `${gradientColors[1]}20`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.cardInner}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidFallback]} />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: glowBg }]} />
          <View style={styles.cardContent}>
            <GradientAccent preset={gradient} size={48} style={styles.iconWrap}>
              <Ionicons name={icon} size={24} color={colors.text.inverse} />
            </GradientAccent>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradientBorderWrap: {
    width: 140,
    borderRadius: borderRadius.lg,
    padding: 1,
    overflow: 'hidden',
  },
  cardInner: {
    borderRadius: borderRadius.lg - 1,
    overflow: 'hidden',
  },
  androidFallback: {
    backgroundColor: 'rgba(21, 23, 28, 0.90)',
  },
  cardContent: {
    padding: spacing.base,
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: spacing.sm,
  },
  title: {
    ...textStyles.bodyMedium,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
