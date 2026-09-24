import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

type GradientPreset = 'teal' | 'coral' | 'sunset' | 'blue';

interface GradientAccentProps {
  children: React.ReactNode;
  preset?: GradientPreset;
  size?: number;
  style?: ViewStyle;
}

const GRADIENT_MAP: Record<GradientPreset, readonly [string, string]> = {
  teal: colors.gradients.tealCyan,
  coral: colors.gradients.coralPink,
  sunset: colors.gradients.warmSunset,
  blue: colors.gradients.bluePurple,
};

export function GradientAccent({
  children,
  preset = 'teal',
  size = 48,
  style,
}: GradientAccentProps) {
  const gradientColors = GRADIENT_MAP[preset];

  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2 }, styles.container, style]}>
      <LinearGradient
        colors={[...gradientColors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
