/**
 * CoachingCaption — glassmorphic overlay showing the current coaching cue.
 *
 * Features:
 *  - Category-specific gradient accent bar + icon
 *  - Pulsing icon while audio plays
 *  - Fade-in + slide-up entrance, fade-out exit
 *  - pointerEvents="none" so it doesn't block video tap-to-pause
 *  - 3-dot speaking indicator
 */

import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { CoachingCue, CueCategory } from '../../data/coachingCueBank';
import { colors, fontFamily, fontSize, spacing, borderRadius } from '../../theme';

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<CueCategory, {
  gradient: readonly [string, string];
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  form: {
    gradient: colors.gradients.tealCyan,
    icon: 'body-outline',
  },
  breathing: {
    gradient: colors.gradients.bluePurple,
    icon: 'leaf-outline',
  },
  'mind-muscle': {
    gradient: colors.gradients.warmSunset,
    icon: 'flash-outline',
  },
  encouragement: {
    gradient: colors.gradients.coralPink,
    icon: 'heart-outline',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface CoachingCaptionProps {
  cue: CoachingCue | null;
  isSpeaking: boolean;
  style?: ViewStyle;
}

export function CoachingCaption({ cue, isSpeaking, style }: CoachingCaptionProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevCueRef = useRef<string | null>(null);

  // Fade in/out on cue change
  useEffect(() => {
    if (cue) {
      prevCueRef.current = cue.id;
      fadeAnim.setValue(0);
      slideAnim.setValue(12);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (prevCueRef.current) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [cue, fadeAnim, slideAnim]);

  // Pulse icon while speaking
  useEffect(() => {
    if (isSpeaking) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSpeaking, pulseAnim]);

  if (!cue) return null;

  const config = CATEGORY_CONFIG[cue.category];

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none"
    >
      {/* Glassmorphic background */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={40} tint="dark" style={styles.blurBg} />
      ) : (
        <View style={styles.androidBg} />
      )}

      {/* Left accent bar */}
      <LinearGradient
        colors={[...config.gradient]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.accentBar}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <Animated.View style={[styles.iconWrap, { opacity: pulseAnim }]}>
          <Ionicons
            name={config.icon}
            size={16}
            color={config.gradient[0]}
          />
        </Animated.View>

        {/* Text + speaking dots */}
        <View style={styles.textWrap}>
          <Text style={styles.cueText} numberOfLines={2}>
            {cue.text}
          </Text>
          {isSpeaking && (
            <View style={styles.dotsRow}>
              <View style={[styles.dot, { backgroundColor: config.gradient[0] }]} />
              <View style={[styles.dot, { backgroundColor: config.gradient[0], opacity: 0.6 }]} />
              <View style={[styles.dot, { backgroundColor: config.gradient[0], opacity: 0.3 }]} />
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    // zIndex set by parent
  },
  blurBg: {
    ...StyleSheet.absoluteFillObject,
  },
  androidBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 15, 18, 0.85)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.base,
    paddingLeft: spacing.base + 4, // extra for accent bar
    gap: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  cueText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: 'rgba(230, 232, 236, 0.9)',
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
