import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useApp } from '../../context/AppContext';
import { colors, fontFamily, fontSize, spacing } from '../../theme';

export type CameraMode = 'upload' | 'analyze' | 'demo';

interface ModeToggleProps {
  mode: CameraMode;
  onModeChange: (mode: CameraMode) => void;
}

const MODE_GRADIENTS: Record<CameraMode, readonly [string, string]> = {
  upload: colors.gradients.coralPink,
  analyze: colors.gradients.tealCyan,
  demo: colors.gradients.bluePurple,
};

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  const { state: { settings } } = useApp();

  const handleToggle = (newMode: CameraMode) => {
    if (newMode !== mode) {
      if (settings.haptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onModeChange(newMode);
    }
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
      )}
      {(['upload', 'analyze', 'demo'] as CameraMode[]).map((m) => (
        <Pressable
          key={m}
          style={({ pressed }) => [styles.option, pressed && { opacity: 0.7 }]}
          onPress={() => handleToggle(m)}
        >
          {mode === m && (
            <LinearGradient
              colors={[...MODE_GRADIENTS[m]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, styles.activeBackground]}
            />
          )}
          <Text style={[styles.label, mode === m && styles.labelActive]}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  androidBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
    borderRadius: 24,
  },
  activeBackground: {
    borderRadius: 24,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  labelActive: {
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
});
