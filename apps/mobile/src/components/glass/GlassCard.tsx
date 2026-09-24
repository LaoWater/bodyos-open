import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, shadows, spacing } from '../../theme';

type InnerGlow = 'teal' | 'coral' | 'amber';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle';
  tint?: 'light' | 'accent';
  padding?: keyof typeof spacing;
  style?: ViewStyle;
  gradientBorder?: boolean;
  innerGlow?: InnerGlow;
}

const GLOW_COLORS: Record<InnerGlow, string> = {
  teal: colors.glows.teal,
  coral: colors.glows.coral,
  amber: colors.glows.amber,
};

export function GlassCard({
  children,
  variant = 'default',
  tint = 'light',
  padding = 'base',
  style,
  gradientBorder,
  innerGlow,
}: GlassCardProps) {
  const shadowStyle = variant === 'elevated'
    ? shadows.glassElevated
    : variant === 'subtle'
      ? shadows.glassSubtle
      : shadows.glass;

  const intensity = variant === 'elevated' ? 50 : variant === 'subtle' ? 25 : 40;

  const tintBg = tint === 'accent'
    ? colors.accent.primaryMuted
    : 'transparent';

  const glowBg = innerGlow ? GLOW_COLORS[innerGlow] : undefined;

  const card = (
    <View style={[styles.outer, shadowStyle, !gradientBorder && styles.defaultBorder, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint="dark" style={styles.blur}>
          <View style={[styles.inner, { padding: spacing[padding], backgroundColor: tintBg }]}>
            {glowBg && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: glowBg, opacity: 0.15 }]} />
            )}
            {children}
          </View>
        </BlurView>
      ) : (
        <View style={[styles.androidFallback, styles.inner, { padding: spacing[padding], backgroundColor: tintBg }]}>
          {glowBg && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: glowBg, opacity: 0.15 }]} />
          )}
          {children}
        </View>
      )}
    </View>
  );

  if (gradientBorder) {
    return (
      <View style={[styles.gradientBorderWrap, shadowStyle, style]}>
        <LinearGradient
          colors={[...colors.gradients.tealCyan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.gradientInner}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={intensity} tint="dark" style={styles.blur}>
              <View style={[styles.inner, { padding: spacing[padding], backgroundColor: tintBg }]}>
                {glowBg && (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: glowBg, opacity: 0.15 }]} />
                )}
                {children}
              </View>
            </BlurView>
          ) : (
            <View style={[styles.androidFallback, styles.inner, { padding: spacing[padding], backgroundColor: tintBg }]}>
              {glowBg && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: glowBg, opacity: 0.15 }]} />
              )}
              {children}
            </View>
          )}
        </View>
      </View>
    );
  }

  return card;
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  defaultBorder: {
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  blur: {
  },
  inner: {
  },
  androidFallback: {
    backgroundColor: 'rgba(21, 23, 28, 0.85)',
  },
  gradientBorderWrap: {
    borderRadius: borderRadius.lg,
    padding: 1.5,
    overflow: 'hidden',
  },
  gradientInner: {
    borderRadius: borderRadius.lg - 1,
    overflow: 'hidden',
    backgroundColor: colors.background.primary,
  },
});
