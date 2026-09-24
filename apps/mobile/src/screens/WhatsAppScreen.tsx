import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GradientAccent } from '../components/glass/GradientAccent';
import { colors, textStyles, spacing, fontFamily, fontSize } from '../theme';

function FeatureExplain({ icon, title, desc }: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }) {
  return (
    <View style={styles.featureRow}>
      <GradientAccent preset="teal" size={36}>
        <Ionicons name={icon} size={18} color={colors.text.inverse} />
      </GradientAccent>
      <View style={styles.featureInfo}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

export function WhatsAppScreen() {
  const navigation = useNavigation();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>WhatsApp Connect</Text>
      </View>

      <GlassCard variant="elevated" padding="xl" innerGlow="teal" style={styles.mainCard}>
        <Ionicons name="logo-whatsapp" size={48} color="#25D366" />
        <Text style={styles.mainTitle}>Connect WhatsApp</Text>
        <Text style={styles.mainDesc}>
          Get daily workout reminders, posture tips, and AI coaching directly in your WhatsApp.
        </Text>

        <TextInput
          style={styles.phoneInput}
          placeholder="+40 xxx xxx xxxx"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="phone-pad"
        />

        <GlassButton
          title="Connect WhatsApp"
          onPress={() => Alert.alert('Coming Soon', 'WhatsApp integration will be available in a future update.')}
          variant="accent"
          size="lg"
          style={styles.connectBtn}
        />
      </GlassCard>

      {/* Mock conversation preview */}
      <GlassCard variant="subtle" padding="lg" style={styles.previewCard}>
        <Text style={styles.previewTitle}>Preview</Text>
        <View style={styles.mockMsg}>
          <View style={styles.mockBubble}>
            <Text style={styles.mockText}>Good morning! Today's plan: Upper Push day. Bench Press 4x6-8, OHP 3x8-10. Ready to crush it?</Text>
          </View>
        </View>
        <View style={[styles.mockMsg, styles.mockMsgUser]}>
          <View style={[styles.mockBubble, styles.mockBubbleUser]}>
            <Text style={styles.mockText}>Let's go!</Text>
          </View>
        </View>
      </GlassCard>

      {/* Feature cards */}
      <GlassCard variant="default" padding="xl" style={styles.featuresCard}>
        <FeatureExplain icon="alarm-outline" title="Daily Reminder" desc="Workout reminders at your preferred time" />
        <FeatureExplain icon="fitness-outline" title="Quick Logging" desc="Log sets and reps by text message" />
        <FeatureExplain icon="sparkles-outline" title="AI Tips" desc="Personalized coaching based on your data" />
        <FeatureExplain icon="trending-up-outline" title="Weekly Reports" desc="Progress summaries every Sunday" />
      </GlassCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm, marginBottom: spacing.xl },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background.tertiary, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h2, color: colors.text.primary },
  mainCard: { alignItems: 'center', marginBottom: spacing.xl },
  mainTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.xl, color: colors.text.primary, marginTop: spacing.md },
  mainDesc: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm },
  phoneInput: {
    width: '100%',
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    color: colors.text.primary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  connectBtn: { width: '100%', marginTop: spacing.lg },
  previewCard: { marginBottom: spacing.xl },
  previewTitle: { fontFamily: fontFamily.semiBold, fontSize: fontSize.sm, color: colors.text.tertiary, marginBottom: spacing.md },
  mockMsg: { marginBottom: spacing.sm },
  mockMsgUser: { alignItems: 'flex-end' },
  mockBubble: { backgroundColor: colors.background.tertiary, borderRadius: 12, borderTopLeftRadius: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxWidth: '85%' },
  mockBubbleUser: { backgroundColor: '#075E54', borderTopLeftRadius: 12, borderTopRightRadius: 4 },
  mockText: { ...textStyles.caption, color: colors.text.primary },
  featuresCard: { marginBottom: spacing['2xl'], gap: spacing.xl },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  featureInfo: { flex: 1 },
  featureTitle: { fontFamily: fontFamily.semiBold, fontSize: fontSize.base, color: colors.text.primary },
  featureDesc: { ...textStyles.caption, color: colors.text.secondary, marginTop: 2 },
});
