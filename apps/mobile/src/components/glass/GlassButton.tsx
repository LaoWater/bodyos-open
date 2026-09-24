import { Pressable, Text, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, borderRadius, shadows, spacing, fontFamily, fontSize } from '../../theme';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'default' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: React.ReactNode | string;
  style?: ViewStyle;
}

export function GlassButton({
  title,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  icon,
  style,
}: GlassButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isAccent = variant === 'accent';
  const isOutline = variant === 'outline';

  const paddingV = size === 'sm' ? spacing.sm : size === 'lg' ? spacing.base : spacing.md;
  const paddingH = size === 'sm' ? spacing.base : size === 'lg' ? spacing.xl : spacing.lg;
  const textSize = size === 'sm' ? fontSize.sm : size === 'lg' ? fontSize.md : fontSize.base;

  const resolvedIcon = typeof icon === 'string'
    ? <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={textSize} color={isAccent ? colors.text.inverse : isOutline ? colors.accent.primary : colors.text.primary} />
    : icon;

  const buttonContent = (
    <>
      {resolvedIcon}
      <Text
        style={[
          styles.text,
          { fontSize: textSize },
          isAccent && styles.textAccent,
          isOutline && styles.textOutline,
          disabled && styles.textDisabled,
        ]}
      >
        {title}
      </Text>
    </>
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.outer,
        isAccent && styles.outerAccent,
        isOutline && styles.outerOutline,
        disabled && styles.outerDisabled,
        pressed && !disabled && { opacity: 0.7 },
        { paddingVertical: paddingV, paddingHorizontal: paddingH },
        shadows.glass,
        style,
      ]}
    >
      {Platform.OS === 'ios' && !isAccent ? (
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      {buttonContent}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
    backgroundColor: Platform.OS === 'android' ? 'rgba(21,23,28,0.85)' : 'transparent',
  },
  outerAccent: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  outerOutline: {
    backgroundColor: 'transparent',
    borderColor: colors.accent.primary,
  },
  outerDisabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: fontFamily.semiBold,
    color: colors.text.primary,
  },
  textAccent: {
    color: colors.text.inverse,
  },
  textOutline: {
    color: colors.accent.primary,
  },
  textDisabled: {
    color: colors.text.tertiary,
  },
});
