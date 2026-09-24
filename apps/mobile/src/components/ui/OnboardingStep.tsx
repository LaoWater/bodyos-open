import { View, Text, Pressable, StyleSheet } from 'react-native';
import { GlassButton } from '../glass/GlassButton';
import { colors, textStyles, spacing, fontFamily, fontSize } from '../../theme';

interface OnboardingStepProps {
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export function OnboardingStep({
  title, subtitle, currentStep, totalSteps, children,
  onNext, onBack, onSkip, nextLabel = 'Continue', nextDisabled = false,
}: OnboardingStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.dots}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentStep && styles.dotActive, i < currentStep && styles.dotDone]}
            />
          ))}
        </View>
        {onSkip && (
          <Pressable onPress={onSkip} style={styles.skipBtn} hitSlop={12}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      <View style={styles.content}>{children}</View>

      <View style={styles.nav}>
        {onBack ? (
          <GlassButton title="Back" onPress={onBack} variant="outline" size="md" style={styles.backBtn} />
        ) : <View style={styles.backBtn} />}
        <GlassButton
          title={nextLabel}
          onPress={onNext}
          variant="accent"
          size="md"
          disabled={nextDisabled}
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing['2xl'], position: 'relative' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.background.tertiary },
  dotActive: { backgroundColor: colors.accent.primary, width: 24 },
  dotDone: { backgroundColor: colors.accent.primaryLight },
  skipBtn: { position: 'absolute', right: 0, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  skipText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.text.secondary, letterSpacing: 0.5 },
  title: { ...textStyles.h2, color: colors.text.primary, textAlign: 'center' },
  subtitle: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm },
  content: { flex: 1, marginTop: spacing['2xl'] },
  nav: { flexDirection: 'row', gap: spacing.md, paddingBottom: spacing['2xl'] },
  backBtn: { flex: 1 },
  nextBtn: { flex: 2 },
});
