import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { StaggeredReveal } from '../components/motion/StaggeredReveal';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { seedDemoData } from '../services/mockData';
import { colors, textStyles, spacing, fontFamily, fontSize } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ModeSelect'>;

function FeatureRow({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name="checkmark-circle" size={16} color={colors.accent.primary} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

export function ModeSelectScreen() {
  const navigation = useNavigation<Nav>();
  const { setAppMode } = useApp();
  const { isAuthenticated } = useAuth();

  // Subtle parallax drift on background
  const driftX = useRef(new Animated.Value(0)).current;
  const driftY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow horizontal drift
    Animated.loop(
      Animated.sequence([
        Animated.timing(driftX, {
          toValue: 8,
          duration: 12000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(driftX, {
          toValue: -8,
          duration: 12000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Slow vertical drift (offset phase)
    Animated.loop(
      Animated.sequence([
        Animated.timing(driftY, {
          toValue: -5,
          duration: 15000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(driftY, {
          toValue: 5,
          duration: 15000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If user authenticates via Auth modal, auto-set real mode
  useEffect(() => {
    if (isAuthenticated) {
      setAppMode('real');
    }
  }, [isAuthenticated, setAppMode]);

  const handleDemo = async () => {
    await seedDemoData();
    await setAppMode('demo');
  };

  const handleGetStarted = () => {
    navigation.navigate('Auth');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Background blueprint image with parallax drift + edge fade */}
      <View style={styles.bgImageWrap}>
        <Animated.View
          style={[
            styles.bgImageAnimWrap,
            {
              transform: [
                { translateX: driftX },
                { translateY: driftY },
                { scale: 1.05 },
              ],
            },
          ]}
        >
          <OptimizedImage
            name="bodyos-blueprints-vertical"
            variant="full"
            style={styles.bgImage}
            contentFit="cover"
          />
        </Animated.View>
        <LinearGradient
          colors={[colors.background.primary, 'transparent']}
          style={styles.fadeTop}
        />
        <LinearGradient
          colors={['transparent', colors.background.primary]}
          style={styles.fadeBottom}
        />
        <LinearGradient
          colors={[colors.background.primary, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fadeSide}
        />
        <LinearGradient
          colors={['transparent', colors.background.primary]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fadeSide, { right: 0, left: undefined }]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StaggeredReveal
          visible={true}
          staggerInterval={150}
          duration={600}
          direction="up"
          distance={24}
          initialDelay={200}
        >
          <View>
            <Text style={styles.title}>Choose Your Path</Text>
            <Text style={styles.subtitle}>You can switch anytime</Text>
          </View>

          {/* Demo Card */}
          <GlassCard variant="default" padding="lg" style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="flask-outline" size={28} color={colors.accent.primary} />
              </View>
              <Text style={styles.cardTitle}>Explore Demo</Text>
            </View>
            <StaggeredReveal
              visible={true}
              staggerInterval={60}
              duration={400}
              direction="right"
              distance={12}
              initialDelay={500}
              style={styles.features}
            >
              <FeatureRow text="Browse all features" />
              <FeatureRow text="Sample workouts & data" />
              <FeatureRow text="Posture analysis preview" />
              <FeatureRow text="No account required" />
            </StaggeredReveal>
            <GlassButton
              title="Start Demo"
              onPress={handleDemo}
              variant="outline"
              size="lg"
              style={styles.cardBtn}
            />
          </GlassCard>

          {/* Real Card */}
          <GlassCard variant="elevated" padding="lg" innerGlow="teal" style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, styles.iconCircleAccent]}>
                <LinearGradient
                  colors={[...colors.gradients.tealCyan]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="rocket-outline" size={28} color={colors.text.inverse} />
              </View>
              <Text style={styles.cardTitle}>Sign In / Sign Up</Text>
            </View>
            <StaggeredReveal
              visible={true}
              staggerInterval={60}
              duration={400}
              direction="right"
              distance={12}
              initialDelay={800}
              style={styles.features}
            >
              <FeatureRow text="Live AI coaching" />
              <FeatureRow text="Cloud sync & backup" />
              <FeatureRow text="Progress tracking" />
              <FeatureRow text="Multi-device access" />
            </StaggeredReveal>
            <GlassButton
              title="Get Started"
              onPress={handleGetStarted}
              variant="accent"
              size="lg"
              style={styles.cardBtn}
            />
          </GlassCard>
        </StaggeredReveal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bgImageWrap: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  bgImageAnimWrap: { width: '100%', height: '100%' },
  bgImage: { width: '100%', height: '100%', opacity: 0.15 },
  fadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '30%' },
  fadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%' },
  fadeSide: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '25%' },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  title: {
    ...textStyles.h1,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconCircleAccent: {
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  features: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
  cardBtn: {
    width: '100%',
  },
});
