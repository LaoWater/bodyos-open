import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, StyleSheet, ActivityIndicator, Text,
  InteractionManager, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ModeToggle, CameraMode } from '../components/camera/ModeToggle';
import { UploadModeView } from '../components/camera/UploadModeView';
import { AnalyzeModeView } from '../components/camera/AnalyzeModeView';
import { DemoModeView } from '../components/camera/DemoModeView';
import { colors, fontFamily, fontSize, spacing } from '../theme';

/**
 * CameraScreen — shows an immersive skeleton instantly:
 *   1. On first mount (tab navigation)
 *   2. When switching between modes (Analyze / Demo / Upload)
 *
 * The skeleton paints in <16ms, then the heavy view mounts on the next frame.
 * This gives the user instant visual feedback on every interaction.
 */
export function CameraScreen() {
  const [mode, setMode] = useState<CameraMode>('analyze');
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  // `viewReady` gates heavy content rendering on first mount only.
  // Once mounted, mode views stay mounted (hidden via display:'none') to avoid
  // re-loading the TFLite model on every mode switch.
  const [viewReady, setViewReady] = useState(false);

  // On first mount: defer until navigation animation completes
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setViewReady(true);
    });
    return () => task.cancel();
  }, []);

  // Mode switch: no unmount/remount — just change the active mode
  const handleModeChange = useCallback((newMode: CameraMode) => {
    setMode(newMode);
  }, []);

  return (
    <View style={styles.container}>
      {/* Show skeleton only on first mount before views are ready */}
      {!viewReady ? (
        <CameraLoadingSkeleton mode={mode} />
      ) : (
        <>
          {mode === 'analyze' && (
            <AnalyzeModeView isActive={isFocused} />
          )}
          {mode === 'upload' && (
            <UploadModeView isActive={mode === 'upload' && isFocused} />
          )}
          {mode === 'demo' && <DemoModeView />}
        </>
      )}

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0, 0, 0, 0.58)', 'rgba(0, 0, 0, 0.24)', 'rgba(0, 0, 0, 0)']}
        locations={[0, 0.45, 1]}
        style={styles.topScrim}
      />

      {/* Mode toggle overlay — always visible immediately */}
      <View
        style={[styles.toggleContainer, { top: insets.top + spacing['2xl'] }]}
        pointerEvents="box-none"
      >
        <ModeToggle mode={mode} onModeChange={handleModeChange} />
      </View>
    </View>
  );
}

// ─── Mode-aware labels ────────────────────────────────────────────────────────

const MODE_LABELS: Record<CameraMode, { icon: keyof typeof Ionicons.glyphMap; text: string }> = {
  analyze: { icon: 'scan-outline', text: 'Initializing camera...' },
  demo: { icon: 'play-circle-outline', text: 'Loading demo...' },
  upload: { icon: 'cloud-upload-outline', text: 'Loading...' },
};

/** Camera-themed loading skeleton with scanning animation */
function CameraLoadingSkeleton({ mode }: { mode: CameraMode }) {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const { icon, text } = MODE_LABELS[mode];

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [scanAnim]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 120, 0],
  });

  return (
    <View style={styles.skeleton}>
      {/* Scan line */}
      <Animated.View
        style={[styles.scanLine, { transform: [{ translateY }] }]}
      />
      {/* Center content */}
      <View style={styles.skeletonCenter}>
        <View style={styles.skeletonIconWrap}>
          <Ionicons name={icon} size={32} color={colors.accent.primary} />
        </View>
        <Text style={styles.skeletonText}>{text}</Text>
        <ActivityIndicator
          color={colors.accent.primary}
          size="small"
          style={{ marginTop: spacing.sm }}
        />
      </View>
      {/* Corner brackets */}
      <View style={[styles.cornerBracket, styles.cornerTL]} />
      <View style={[styles.cornerBracket, styles.cornerTR]} />
      <View style={[styles.cornerBracket, styles.cornerBL]} />
      <View style={[styles.cornerBracket, styles.cornerBR]} />
    </View>
  );
}

const BRACKET_SIZE = 40;
const BRACKET_MARGIN = 32;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  toggleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 16,
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 14,
  },

  // Skeleton
  skeleton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  skeletonCenter: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  skeletonIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(91, 124, 250, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(91, 124, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  skeletonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    letterSpacing: 0.3,
  },
  scanLine: {
    position: 'absolute',
    left: BRACKET_MARGIN,
    right: BRACKET_MARGIN,
    height: 1,
    backgroundColor: 'rgba(91, 124, 250, 0.25)',
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },

  // Corner brackets
  cornerBracket: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    borderColor: 'rgba(91, 124, 250, 0.25)',
  },
  cornerTL: {
    top: BRACKET_MARGIN + 60,
    left: BRACKET_MARGIN,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: BRACKET_MARGIN + 60,
    right: BRACKET_MARGIN,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: BRACKET_MARGIN + 60,
    left: BRACKET_MARGIN,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: BRACKET_MARGIN + 60,
    right: BRACKET_MARGIN,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 4,
  },
});
