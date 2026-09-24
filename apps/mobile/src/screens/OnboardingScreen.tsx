import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Dimensions, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { OnboardingStep } from '../components/ui/OnboardingStep';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { useApp } from '../context/AppContext';
import { colors, textStyles, spacing, fontFamily, fontSize, borderRadius } from '../theme';
import type {
  FitnessGoal, DayOfWeek, Equipment, TimePreference, SessionDuration,
  UserProfile, Gender, ExperienceLevel, MovementPhilosophy, BodyArea, PainPoint, PainSeverity,
} from '../types/models';

const { width } = Dimensions.get('window');

const GOALS: { id: FitnessGoal; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'body_performance', label: 'Body Performance', icon: 'rocket-outline' },
  { id: 'build_strength', label: 'Build Strength', icon: 'barbell-outline' },
  { id: 'improve_posture', label: 'Improve Posture', icon: 'body-outline' },
  { id: 'increase_mobility', label: 'Increase Mobility', icon: 'walk-outline' },
  { id: 'recovery', label: 'Recovery', icon: 'heart-outline' },
  { id: 'pain_management', label: 'Pain Management', icon: 'medkit-outline' },
  { id: 'lose_weight', label: 'Lose Weight', icon: 'flame-outline' },
  { id: 'general_wellness', label: 'General Wellness', icon: 'leaf-outline' },
  { id: 'general_fitness', label: 'General Fitness', icon: 'fitness-outline' },
];

const DAYS: { id: DayOfWeek; label: string }[] = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
];

const EQUIPMENT: { id: Equipment; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'full_gym', label: 'Full Gym', icon: 'business-outline' },
  { id: 'dumbbells', label: 'Dumbbells', icon: 'barbell-outline' },
  { id: 'bodyweight', label: 'Bodyweight', icon: 'body-outline' },
  { id: 'resistance_bands', label: 'Bands', icon: 'link-outline' },
  { id: 'kettlebells', label: 'Kettlebells', icon: 'disc-outline' },
  { id: 'pull_up_bar', label: 'Pull-up Bar', icon: 'resize-outline' },
];

const BODY_AREAS: { id: BodyArea; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'neck', label: 'Neck', icon: 'body-outline' },
  { id: 'shoulders', label: 'Shoulders', icon: 'body-outline' },
  { id: 'upper_back', label: 'Upper Back', icon: 'body-outline' },
  { id: 'lower_back', label: 'Lower Back', icon: 'body-outline' },
  { id: 'hips', label: 'Hips', icon: 'body-outline' },
  { id: 'knees', label: 'Knees', icon: 'walk-outline' },
  { id: 'ankles', label: 'Ankles', icon: 'footsteps-outline' },
  { id: 'wrists', label: 'Wrists', icon: 'hand-left-outline' },
  { id: 'elbows', label: 'Elbows', icon: 'body-outline' },
  { id: 'feet', label: 'Feet', icon: 'footsteps-outline' },
];

const PHILOSOPHIES: { id: MovementPhilosophy; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'calisthenics', label: 'Calisthenics', icon: 'body-outline' },
  { id: 'strength_training', label: 'Strength Training', icon: 'barbell-outline' },
  { id: 'powerlifting', label: 'Powerlifting', icon: 'barbell-outline' },
  { id: 'olympic_lifting', label: 'Olympic Lifting', icon: 'trophy-outline' },
  { id: 'yoga_flexibility', label: 'Yoga / Flexibility', icon: 'leaf-outline' },
  { id: 'martial_arts', label: 'Martial Arts', icon: 'flash-outline' },
  { id: 'sprint_agility', label: 'Sprint / Agility', icon: 'speedometer-outline' },
  { id: 'functional_fitness', label: 'Functional Fitness', icon: 'fitness-outline' },
  { id: 'rehabilitation', label: 'Rehabilitation', icon: 'medkit-outline' },
  { id: 'hybrid_mixed', label: 'Hybrid / Mixed', icon: 'shuffle-outline' },
];

const GENDERS: { id: Gender; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string; desc: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'New to structured training', icon: 'leaf-outline' },
  { id: 'intermediate', label: 'Intermediate', desc: '1-3 years of experience', icon: 'trending-up-outline' },
  { id: 'advanced', label: 'Advanced', desc: '3+ years, strong foundation', icon: 'diamond-outline' },
];

const SEVERITY_COLORS: Record<PainSeverity, string> = {
  mild: colors.semantic.warning,
  moderate: '#FF8C42',
  severe: colors.semantic.error,
};

const SEVERITY_CYCLE: PainSeverity[] = ['mild', 'moderate', 'severe'];

const TOTAL_STEPS = 7;
const CARD_WIDTH = (width - (spacing.lg * 2) - spacing.md) / 2 - 20;

export function OnboardingScreen() {
  const { updateUser } = useApp();
  const [step, setStep] = useState(0);

  // Step 1: Goals
  const [goals, setGoals] = useState<FitnessGoal[]>([]);
  // Step 2: Biometric
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [gender, setGender] = useState<Gender | undefined>();
  // Step 3: Pain Points
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  // Step 4: Experience & Philosophy
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | undefined>();
  const [philosophies, setPhilosophies] = useState<MovementPhilosophy[]>([]);
  // Step 5: Schedule
  const [days, setDays] = useState<DayOfWeek[]>([]);
  const [timePref, setTimePref] = useState<TimePreference>('morning');
  const [duration, setDuration] = useState<SessionDuration>(60);
  // Step 6: Equipment
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const toggleGoal = (g: FitnessGoal) => setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  const toggleDay = (d: DayOfWeek) => setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  const toggleEquip = (e: Equipment) => setEquipment((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);
  const togglePhilosophy = (p: MovementPhilosophy) => setPhilosophies((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const togglePainPoint = (area: BodyArea) => {
    setPainPoints((prev) => {
      const existing = prev.find((p) => p.area === area);
      if (!existing) {
        return [...prev, { area, severity: 'mild' as PainSeverity }];
      }
      const currentIdx = SEVERITY_CYCLE.indexOf(existing.severity);
      if (currentIdx >= SEVERITY_CYCLE.length - 1) {
        // Cycle past severe -> remove
        return prev.filter((p) => p.area !== area);
      }
      // Cycle to next severity
      return prev.map((p) => p.area === area ? { ...p, severity: SEVERITY_CYCLE[currentIdx + 1] } : p);
    });
  };

  const handleComplete = async () => {
    const ageNum = parseInt(age, 10);
    const dateOfBirth = ageNum > 0
      ? new Date(Date.now() - ageNum * 365.25 * 86400000).toISOString().split('T')[0]
      : undefined;

    const profile: UserProfile = {
      id: 'user_1',
      name: name || 'Athlete',
      goals: goals.length ? goals : ['general_fitness'],
      scheduleDays: days.length ? days : ['monday', 'wednesday', 'friday'],
      timePreference: timePref,
      sessionDuration: duration,
      equipment: equipment.length ? equipment : ['bodyweight'],
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(dateOfBirth && { dateOfBirth }),
      ...(parseFloat(heightCm) > 0 && { heightCm: parseFloat(heightCm) }),
      ...(parseFloat(weightKg) > 0 && { weightKg: parseFloat(weightKg) }),
      ...(gender && { gender }),
      ...(painPoints.length > 0 && { painPoints }),
      ...(experienceLevel && { experienceLevel }),
      ...(philosophies.length > 0 && { movementPhilosophies: philosophies }),
    };
    await updateUser(profile);
  };

  // ─── Step 0: Welcome ───────────────────────────
  if (step === 0) {
    return (
      <View style={styles.welcomeRoot}>
        <LinearGradient colors={[colors.background.primary, colors.background.secondary]} style={StyleSheet.absoluteFill} />
        <View style={styles.bgImageWrap}>
          <OptimizedImage name="bodyos-blueprints-vertical" variant="full" style={styles.bgImage} contentFit="cover" />
          <LinearGradient colors={[colors.background.primary, 'transparent']} style={styles.fadeTop} />
          <LinearGradient colors={['transparent', colors.background.primary]} style={styles.fadeBottom} />
          <LinearGradient colors={[colors.background.primary, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.fadeSide} />
          <LinearGradient colors={['transparent', colors.background.primary]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.fadeSide, { right: 0, left: undefined }]} />
        </View>

        <View style={styles.welcomeContainer}>
          <View style={styles.systemTag}><View style={styles.pulseDot} /><Text style={styles.systemTagText}>SYSTEM READY</Text></View>
          <Text style={styles.welcomeTitle}>BodyOS</Text>
          <Text style={styles.welcomeSubtitle}>Kinetic Intelligence Protocol</Text>
          <Text style={styles.welcomeDesc}>Transcend traditional training. We bridge the gap between human potential and data-driven precision.</Text>
          <View style={styles.featureHighlightRow}>
            <FeatureIcon label="Posture AI" icon="scan-outline" />
            <FeatureIcon label="Live Feedback" icon="pulse-outline" />
            <FeatureIcon label="Form Sync" icon="sync-outline" />
          </View>
          <GlassButton title="Get Started" onPress={() => setStep(1)} variant="accent" size="lg" style={styles.welcomeBtn} />
        </View>
      </View>
    );
  }

  // ─── Step 1: Goals ──────────────────────────────
  if (step === 1) {
    return (
      <ScreenContainer scrollable={false}>
        <OnboardingStep
          title="Define Objectives"
          subtitle="Select your primary kinetic focus"
          currentStep={0}
          totalSteps={TOTAL_STEPS}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
          onSkip={() => setStep(2)}
        >
          <Text style={styles.contextText}>Our AI engine uses these objectives to prioritize specific corrective exercises in your daily blueprint.</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            <View style={styles.optionGrid}>
              {GOALS.map((g) => (
                <Pressable key={g.id} onPress={() => toggleGoal(g.id)}>
                  <GlassCard
                    variant={goals.includes(g.id) ? 'elevated' : 'subtle'}
                    padding="lg"
                    innerGlow={goals.includes(g.id) ? 'teal' : undefined}
                    style={styles.optionCard}
                  >
                    <Ionicons name={g.icon} size={28} color={goals.includes(g.id) ? colors.accent.primary : colors.text.secondary} />
                    <Text style={[styles.optionLabel, goals.includes(g.id) && styles.optionActive]}>{g.label}</Text>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </OnboardingStep>
      </ScreenContainer>
    );
  }

  // ─── Step 2: Biometric Baseline ─────────────────
  if (step === 2) {
    return (
      <ScreenContainer scrollable={false}>
        <OnboardingStep
          title="Biometric Baseline"
          subtitle="Help BodyOS calibrate to your physiology"
          currentStep={1}
          totalSteps={TOTAL_STEPS}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
          onSkip={() => setStep(3)}
        >
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea} keyboardShouldPersistTaps="handled">
            {/* Name */}
            <Text style={styles.sectionLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="What should we call you?"
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="words"
            />

            {/* Age */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
              placeholder="Years"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
              maxLength={3}
            />

            {/* Height & Weight side by side */}
            <View style={styles.metricRow}>
              <View style={styles.metricField}>
                <Text style={styles.sectionLabel}>Height</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={heightCm}
                    onChangeText={(t) => setHeightCm(t.replace(/[^0-9.]/g, ''))}
                    placeholder="170"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                  <Text style={styles.unitLabel}>cm</Text>
                </View>
              </View>
              <View style={styles.metricField}>
                <Text style={styles.sectionLabel}>Weight</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={weightKg}
                    onChangeText={(t) => setWeightKg(t.replace(/[^0-9.]/g, ''))}
                    placeholder="70"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                  <Text style={styles.unitLabel}>kg</Text>
                </View>
              </View>
            </View>

            {/* Gender */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => (
                <Pressable key={g.id} onPress={() => setGender(gender === g.id ? undefined : g.id)} style={{ flex: 1 }}>
                  <GlassCard
                    variant={gender === g.id ? 'elevated' : 'subtle'}
                    padding="md"
                    innerGlow={gender === g.id ? 'teal' : undefined}
                    style={styles.genderCard}
                  >
                    <Text style={[styles.genderText, gender === g.id && styles.optionActive]}>{g.label}</Text>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </OnboardingStep>
      </ScreenContainer>
    );
  }

  // ─── Step 3: Pain Points ────────────────────────
  if (step === 3) {
    return (
      <ScreenContainer scrollable={false}>
        <OnboardingStep
          title="Structural Diagnostics"
          subtitle="Identify vulnerable zones"
          currentStep={2}
          totalSteps={TOTAL_STEPS}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
          onSkip={() => setStep(4)}
        >
          <Text style={styles.contextText}>
            Tap an area to mark it. Tap again to increase severity. Helps us tailor corrective protocols.
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            <View style={styles.optionGrid}>
              {BODY_AREAS.map((area) => {
                const point = painPoints.find((p) => p.area === area.id);
                const isActive = !!point;
                const severityColor = point ? SEVERITY_COLORS[point.severity] : undefined;
                return (
                  <Pressable key={area.id} onPress={() => togglePainPoint(area.id)}>
                    <GlassCard
                      variant={isActive ? 'elevated' : 'subtle'}
                      padding="lg"
                      style={{
                        ...styles.optionCard,
                        ...(isActive ? { borderColor: severityColor, borderWidth: 2 } : {}),
                      }}
                    >
                      <Ionicons name={area.icon} size={28} color={isActive ? severityColor : colors.text.secondary} />
                      <Text style={[styles.optionLabel, isActive && { color: severityColor }]}>{area.label}</Text>
                      {isActive && (
                        <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
                          <Text style={styles.severityText}>{point!.severity}</Text>
                        </View>
                      )}
                    </GlassCard>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </OnboardingStep>
      </ScreenContainer>
    );
  }

  // ─── Step 4: Movement DNA ───────────────────────
  if (step === 4) {
    return (
      <ScreenContainer scrollable={false}>
        <OnboardingStep
          title="Movement DNA"
          subtitle="Define your kinetic identity"
          currentStep={3}
          totalSteps={TOTAL_STEPS}
          onNext={() => setStep(5)}
          onBack={() => setStep(3)}
          onSkip={() => setStep(5)}
        >
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Experience Level */}
            <Text style={styles.sectionLabel}>Experience Level</Text>
            <View style={styles.experienceRow}>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <Pressable key={lvl.id} onPress={() => setExperienceLevel(experienceLevel === lvl.id ? undefined : lvl.id)} style={{ flex: 1 }}>
                  <GlassCard
                    variant={experienceLevel === lvl.id ? 'elevated' : 'subtle'}
                    padding="md"
                    innerGlow={experienceLevel === lvl.id ? 'teal' : undefined}
                    style={styles.experienceCard}
                  >
                    <Ionicons name={lvl.icon} size={24} color={experienceLevel === lvl.id ? colors.accent.primary : colors.text.secondary} />
                    <Text style={[styles.experienceLabel, experienceLevel === lvl.id && styles.optionActive]}>{lvl.label}</Text>
                    <Text style={styles.experienceDesc}>{lvl.desc}</Text>
                  </GlassCard>
                </Pressable>
              ))}
            </View>

            {/* Movement Philosophy */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Movement Philosophy</Text>
            <Text style={styles.contextText}>Select all that resonate with your approach</Text>
            <View style={styles.optionGrid}>
              {PHILOSOPHIES.map((p) => (
                <Pressable key={p.id} onPress={() => togglePhilosophy(p.id)}>
                  <GlassCard
                    variant={philosophies.includes(p.id) ? 'elevated' : 'subtle'}
                    padding="lg"
                    innerGlow={philosophies.includes(p.id) ? 'teal' : undefined}
                    style={styles.optionCard}
                  >
                    <Ionicons name={p.icon} size={28} color={philosophies.includes(p.id) ? colors.accent.primary : colors.text.secondary} />
                    <Text style={[styles.optionLabel, philosophies.includes(p.id) && styles.optionActive]}>{p.label}</Text>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </OnboardingStep>
      </ScreenContainer>
    );
  }

  // ─── Step 5: Schedule ───────────────────────────
  if (step === 5) {
    return (
      <ScreenContainer scrollable={false}>
        <OnboardingStep
          title="Deployment Window"
          subtitle="Sync BodyOS with your lifestyle"
          currentStep={4}
          totalSteps={TOTAL_STEPS}
          onNext={() => setStep(6)}
          onBack={() => setStep(4)}
          onSkip={() => setStep(6)}
        >
          <Text style={styles.contextText}>Consistency is the foundation of structural change. Select the windows where focus is sharpest.</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            <Text style={styles.sectionLabel}>Active Training Days</Text>
            <View style={styles.daysRow}>
              {DAYS.map((d) => (
                <Pressable key={d.id} onPress={() => toggleDay(d.id)}>
                  <View style={[styles.dayChip, days.includes(d.id) && styles.dayChipActive]}>
                    {days.includes(d.id) && <LinearGradient colors={[...colors.gradients.tealCyan]} style={StyleSheet.absoluteFill} />}
                    <Text style={[styles.dayText, days.includes(d.id) && styles.dayTextActive]}>{d.label}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Daily Peak Performance</Text>
            <View style={styles.timeRow}>
              {(['morning', 'afternoon', 'evening'] as TimePreference[]).map((t) => (
                <Pressable key={t} onPress={() => setTimePref(t)} style={{ flex: 1 }}>
                  <GlassCard variant={timePref === t ? 'elevated' : 'subtle'} padding="md" innerGlow={timePref === t ? 'teal' : undefined} style={styles.timeCard}>
                    <Text style={[styles.timeLabel, timePref === t && styles.optionActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                  </GlassCard>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Session Duration</Text>
            <View style={styles.timeRow}>
              {([30, 45, 60, 90] as SessionDuration[]).map((d) => (
                <Pressable key={d} onPress={() => setDuration(d)} style={{ flex: 1 }}>
                  <GlassCard variant={duration === d ? 'elevated' : 'subtle'} padding="md" innerGlow={duration === d ? 'teal' : undefined} style={styles.timeCard}>
                    <Text style={[styles.timeLabel, duration === d && styles.optionActive]}>{d}m</Text>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </OnboardingStep>
      </ScreenContainer>
    );
  }

  // ─── Step 6: Equipment ──────────────────────────
  if (step === 6) {
    return (
      <ScreenContainer scrollable={false}>
        <OnboardingStep
          title="Hardware Environment"
          subtitle="What tools are in your arsenal?"
          currentStep={5}
          totalSteps={TOTAL_STEPS}
          onNext={() => setStep(7)}
          onBack={() => setStep(5)}
          onSkip={() => setStep(7)}
        >
          <Text style={styles.contextText}>The system adapts your protocol to the available hardware in your current location.</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            <View style={styles.optionGrid}>
              {EQUIPMENT.map((e) => (
                <Pressable key={e.id} onPress={() => toggleEquip(e.id)}>
                  <GlassCard
                    variant={equipment.includes(e.id) ? 'elevated' : 'subtle'}
                    padding="lg"
                    innerGlow={equipment.includes(e.id) ? 'teal' : undefined}
                    style={styles.optionCard}
                  >
                    <Ionicons name={e.icon} size={28} color={equipment.includes(e.id) ? colors.accent.primary : colors.text.secondary} />
                    <Text style={[styles.optionLabel, equipment.includes(e.id) && styles.optionActive]}>{e.label}</Text>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </OnboardingStep>
      </ScreenContainer>
    );
  }

  // ─── Step 7: Summary / Launch ───────────────────
  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.completeContainer}>
        <View style={styles.completeBadge}>
          <LinearGradient colors={[...colors.gradients.tealCyan]} style={StyleSheet.absoluteFill} />
          <Ionicons name="shield-checkmark" size={48} color={colors.text.inverse} />
        </View>
        <Text style={styles.completeTitle}>Calibration Optimal</Text>
        <Text style={styles.completeSubtitle}>Your personalized OS is ready for deployment.</Text>
        <GlassCard variant="default" padding="lg" innerGlow="teal" style={styles.summaryCard}>
          {goals.length > 0 && (
            <SummaryRow icon="analytics-outline" text={`${goals.length} objective${goals.length > 1 ? 's' : ''} targeted`} />
          )}
          {(name.length > 0) && (
            <SummaryRow icon="person-outline" text={name} />
          )}
          {age.length > 0 && (
            <SummaryRow icon="calendar-outline" text={`${age} years old`} />
          )}
          {parseFloat(heightCm) > 0 && parseFloat(weightKg) > 0 && (
            <SummaryRow icon="resize-outline" text={`${heightCm} cm / ${weightKg} kg`} />
          )}
          {painPoints.length > 0 && (
            <SummaryRow icon="medkit-outline" text={`${painPoints.length} area${painPoints.length > 1 ? 's' : ''} flagged for attention`} />
          )}
          {experienceLevel && (
            <SummaryRow icon="trending-up-outline" text={`${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)} level`} />
          )}
          {philosophies.length > 0 && (
            <SummaryRow icon="shuffle-outline" text={`${philosophies.length} movement philosoph${philosophies.length > 1 ? 'ies' : 'y'}`} />
          )}
          <SummaryRow icon="flash-outline" text={`${duration}min high-focus sessions`} />
          {equipment.length > 0 && (
            <SummaryRow icon="layers-outline" text={`Adaptive to ${equipment.length} tool${equipment.length > 1 ? 's' : ''}`} />
          )}
        </GlassCard>
        <Text style={styles.footerNote}>By entering, you agree to follow the corrective guidance to ensure safe kinetic progression.</Text>
        <GlassButton title="Launch Interface" onPress={handleComplete} variant="accent" size="lg" style={styles.completeBtn} />
      </View>
    </ScreenContainer>
  );
}

// ─── Helpers ──────────────────────────────────────

function FeatureIcon({ label, icon }: { label: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconCircle}><Ionicons name={icon} size={20} color={colors.accent.primary} /></View>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

function SummaryRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.summaryRow}>
      <Ionicons name={icon} size={18} color={colors.accent.primary} />
      <Text style={styles.summaryText}>{text}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────

const styles = StyleSheet.create({
  // Welcome
  welcomeRoot: { flex: 1 },
  bgImageWrap: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  bgImage: { width: '100%', height: '100%', opacity: 0.20 },
  fadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '30%' },
  fadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%' },
  fadeSide: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '25%' },
  welcomeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing['2xl'] },
  systemTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 255, 242, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: spacing.lg, borderColor: 'rgba(0, 255, 242, 0.2)', borderWidth: 1 },
  systemTagText: { color: colors.accent.primary, fontFamily: fontFamily.bold, fontSize: 10, letterSpacing: 1.5 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent.primary, marginRight: 8 },
  welcomeTitle: { ...textStyles.h1, color: colors.text.primary, textAlign: 'center', fontSize: 42, letterSpacing: -1 },
  welcomeSubtitle: { ...textStyles.h3, color: colors.accent.primary, marginTop: spacing.xs, textAlign: 'center', opacity: 0.9 },
  welcomeDesc: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xl, lineHeight: 24, fontSize: 16 },
  featureHighlightRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: spacing['2xl'], paddingHorizontal: spacing.md },
  featureItem: { alignItems: 'center', gap: 8 },
  featureIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  featureLabel: { color: colors.text.secondary, fontSize: 11, fontFamily: fontFamily.medium },
  welcomeBtn: { marginTop: spacing['2xl'], width: '100%' },

  // Shared
  contextText: { ...textStyles.body, color: colors.text.secondary, marginBottom: spacing.md, lineHeight: 20, fontSize: 14 },
  scrollArea: { flex: 1, width: '100%' },
  scrollContent: { paddingBottom: spacing.xl },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  optionCard: { alignItems: 'center', width: CARD_WIDTH, gap: spacing.sm },
  optionLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.text.secondary, textAlign: 'center' },
  optionActive: { color: colors.accent.primary },
  sectionLabel: { fontFamily: fontFamily.semiBold, fontSize: fontSize.base, color: colors.text.primary, marginBottom: spacing.md, letterSpacing: 0.5 },

  // Biometric
  input: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  metricRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  metricField: { flex: 1 },
  inputWithUnit: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unitLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.text.secondary, width: 24 },
  genderRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  genderCard: { alignItems: 'center' },
  genderText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.text.secondary, textAlign: 'center' },

  // Pain Points
  severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4 },
  severityText: { fontFamily: fontFamily.semiBold, fontSize: 10, color: colors.text.inverse, textTransform: 'capitalize', letterSpacing: 0.5 },

  // Experience
  experienceRow: { flexDirection: 'row', gap: spacing.sm },
  experienceCard: { alignItems: 'center', gap: spacing.xs },
  experienceLabel: { fontFamily: fontFamily.semiBold, fontSize: fontSize.sm, color: colors.text.secondary, textAlign: 'center' },
  experienceDesc: { fontFamily: fontFamily.regular, fontSize: 10, color: colors.text.tertiary, textAlign: 'center' },

  // Schedule
  daysRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  dayChip: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.background.tertiary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  dayChipActive: { borderColor: 'transparent' },
  dayText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.text.secondary },
  dayTextActive: { color: colors.text.inverse },
  timeRow: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  timeCard: { alignItems: 'center' },
  timeLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.text.secondary },

  // Complete
  completeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  completeBadge: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: spacing.xl },
  completeTitle: { ...textStyles.h1, color: colors.text.primary, textAlign: 'center' },
  completeSubtitle: { ...textStyles.body, color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center' },
  summaryCard: { marginTop: spacing['2xl'], width: '100%', gap: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryText: { ...textStyles.body, color: colors.text.secondary, flex: 1, fontSize: 14 },
  footerNote: { ...textStyles.caption, color: colors.text.tertiary, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  completeBtn: { marginTop: spacing.xl, width: '100%' },
});
