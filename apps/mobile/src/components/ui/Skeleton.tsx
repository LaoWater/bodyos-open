import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, DimensionValue, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius as br, spacing } from '../../theme';

/* ────────────────────────────────────────────────────────
   Skeleton – glass-themed shimmer placeholder

   Usage:
     <Skeleton width={120} height={16} />              // text line
     <Skeleton width={48} height={48} rounded />        // avatar
     <Skeleton width="100%" height={180} radius={16} /> // card
     <Skeleton.Card />                                   // full card placeholder
   ──────────────────────────────────────────────────────── */

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  rounded?: boolean;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%' as DimensionValue, height = 16, rounded, radius, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const borderRad = rounded ? (typeof height === 'number' ? height / 2 : 24) : (radius ?? br.md);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.bone,
        { width, height, borderRadius: borderRad },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(91, 124, 250, 0.06)',
            'rgba(91, 124, 250, 0.10)',
            'rgba(91, 124, 250, 0.06)',
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ width: 200, height: '100%' }}
        />
      </Animated.View>
    </View>
  );
}

/* Pre-built skeleton layouts for common sections */

function CardSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardRow}>
        <Skeleton width={44} height={44} rounded />
        <View style={styles.cardLines}>
          <Skeleton width={140} height={14} />
          <Skeleton width={90} height={11} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton width="100%" height={36} radius={br.md} style={{ marginTop: spacing.md }} />
    </View>
  );
}

function HeroSkeleton() {
  return (
    <View style={styles.hero}>
      <Skeleton width={80} height={14} />
      <Skeleton width={200} height={24} style={{ marginTop: spacing.sm }} />
      <Skeleton width={140} height={12} style={{ marginTop: spacing.xs }} />
    </View>
  );
}

function ActionRowSkeleton() {
  return (
    <View style={styles.actionRow}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} width={140} height={130} radius={br.lg} />
      ))}
    </View>
  );
}

function BodyCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.bodyRow}>
        <Skeleton width={120} height={192} radius={12} />
        <View style={styles.cardLines}>
          <Skeleton width={60} height={36} />
          <Skeleton width={100} height={12} style={{ marginTop: 8 }} />
          <Skeleton width={80} height={12} style={{ marginTop: 6 }} />
          <Skeleton width={100} height={32} radius={br.md} style={{ marginTop: spacing.md }} />
        </View>
      </View>
    </View>
  );
}

function TimelineSkeleton() {
  return (
    <View style={{ gap: spacing.sm }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.timelineItem}>
          <Skeleton width={36} height={36} rounded />
          <View style={styles.cardLines}>
            <Skeleton width={160} height={13} />
            <Skeleton width={100} height={10} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Full Home screen skeleton - shown instantly on mount */
function HomeSkeleton() {
  return (
    <View style={styles.homeWrap}>
      <HeroSkeleton />
      <Skeleton width={100} height={12} style={{ marginBottom: spacing.md }} />
      <ActionRowSkeleton />
      <Skeleton width={120} height={12} style={{ marginTop: spacing['2xl'], marginBottom: spacing.md }} />
      <CardSkeleton />
      <Skeleton width={90} height={12} style={{ marginTop: spacing.md, marginBottom: spacing.md }} />
      <BodyCardSkeleton />
      <Skeleton width={110} height={12} style={{ marginTop: spacing.md, marginBottom: spacing.md }} />
      <TimelineSkeleton />
    </View>
  );
}

// Attach sub-components
Skeleton.Card = CardSkeleton;
Skeleton.Hero = HeroSkeleton;
Skeleton.ActionRow = ActionRowSkeleton;
Skeleton.BodyCard = BodyCardSkeleton;
Skeleton.Timeline = TimelineSkeleton;
Skeleton.Home = HomeSkeleton;

const styles = StyleSheet.create({
  bone: {
    backgroundColor: 'rgba(42, 45, 52, 0.40)',
    overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.glass.background,
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: colors.glass.borderSubtle,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardLines: {
    flex: 1,
  },
  hero: {
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.glass.background,
    borderRadius: br.md,
    borderWidth: 1,
    borderColor: colors.glass.borderSubtle,
    padding: spacing.md,
  },
  homeWrap: {
    flex: 1,
  },
});
