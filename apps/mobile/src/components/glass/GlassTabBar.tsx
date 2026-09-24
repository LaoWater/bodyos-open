import { useCallback } from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useApp } from '../../context/AppContext';
import { colors, fontFamily, fontSize, spacing, shadows } from '../../theme';

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Posture: { active: 'body', inactive: 'body-outline' },
  Camera: { active: 'radio-button-on', inactive: 'radio-button-on' },
  Coach: { active: 'chatbubble-ellipses', inactive: 'chatbubble-ellipses-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { state: appState } = useApp();
  const hapticsEnabled = appState.settings.haptics;
  const isCameraRouteActive = state.routes[state.index]?.name === 'Camera';
  const dropDistance = isCameraRouteActive ? 6 : 3;
  const bottomPadding = Math.max((insets.bottom || spacing.sm) - dropDistance, spacing.xs);

  const fireHaptic = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticsEnabled]);

  return (
    <View style={[styles.container, { bottom: -dropDistance, paddingBottom: bottomPadding }]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
      )}
      <View style={styles.topBorder} />
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isCamera = route.name === 'Camera';
          const icons = TAB_ICONS[route.name];
          const iconName = isFocused ? icons.active : icons.inactive;

          const onPress = () => {
            // Instant feedback first - haptic fires before navigation
            fireHaptic();
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCamera) {
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed }) => [styles.cameraButtonOuter, pressed && styles.pressed]}
              >
                <View style={[styles.cameraButton, shadows.glassElevated]}>
                  <Ionicons name="videocam" size={26} color={colors.text.inverse} />
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? colors.accent.primary : colors.text.tertiary}
              />
              <Text
                style={[
                  styles.label,
                  isFocused && styles.labelActive,
                ]}
              >
                {options.title ?? route.name}
              </Text>
              {isFocused && (
                <LinearGradient
                  colors={[...colors.gradients.tealCyan]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeIndicator}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'visible',
  },
androidBg: {
    backgroundColor: 'rgba(14, 15, 18, 0.92)',
  },
  topBorder: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glass.borderSubtle,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  labelActive: {
    color: colors.accent.primary,
  },
  activeIndicator: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    marginTop: 3,
  },
  pressed: {
    opacity: 0.7,
  },
  cameraButtonOuter: {
    flex: 1,
    alignItems: 'center',
    marginTop: -20,
  },
  cameraButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background.primary,
  },
});
