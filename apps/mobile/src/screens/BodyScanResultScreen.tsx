import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GlassCard } from '../components/glass/GlassCard';
import { ProgressRing } from '../components/ui/ProgressRing';
import { BodyBlueprint } from '../components/ui/BodyBlueprint';
import { colors, textStyles, spacing, fontFamily, fontSize, shadows } from '../theme';
import * as assessmentService from '../services/assessmentService';
import type { PostureAssessment, PostureIssueSeverity } from '../types/models';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'BodyScanResult'>;

const SEVERITY_COLORS: Record<PostureIssueSeverity, string> = {
  mild: colors.semantic.success,
  moderate: colors.semantic.warning,
  severe: colors.semantic.error,
};

const SEVERITY_GLOWS: Record<PostureIssueSeverity, 'teal' | 'amber' | 'coral'> = {
  mild: 'teal',
  moderate: 'amber',
  severe: 'coral',
};

export function BodyScanResultScreen() {
  const route = useRoute<Props['route']>();
  const navigation = useNavigation<Props['navigation']>();
  const [assessment, setAssessment] = useState<PostureAssessment | null>(null);
  const [previous, setPrevious] = useState<PostureAssessment | null>(null);

  useEffect(() => {
    (async () => {
      const a = await assessmentService.getById(route.params.assessmentId);
      setAssessment(a);
      if (a) {
        const all = await assessmentService.getAll();
        const prevIndex = all.findIndex((x) => x.id === a.id) + 1;
        if (prevIndex < all.length) setPrevious(all[prevIndex]);
      }
    })();
  }, [route.params.assessmentId]);

  if (!assessment) {
    return (
      <ScreenContainer scrollable={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const scoreDiff = previous ? assessment.score - previous.score : null;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Assessment Result</Text>
      </View>

      {/* Score */}
      <View style={styles.scoreSection}>
        <ProgressRing progress={assessment.score / 100} size={140} strokeWidth={8} color={colors.accent.primary}>
          <Text style={styles.scoreValue}>{assessment.score}</Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
        </ProgressRing>
        {scoreDiff !== null && (
          <View style={styles.diffBadge}>
            <Ionicons
              name={scoreDiff >= 0 ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={scoreDiff >= 0 ? colors.semantic.success : colors.semantic.error}
            />
            <Text style={[styles.diffText, { color: scoreDiff >= 0 ? colors.semantic.success : colors.semantic.error }]}>
              {scoreDiff >= 0 ? '+' : ''}{scoreDiff} from last scan
            </Text>
          </View>
        )}
      </View>

      {/* Body Blueprint */}
      <GlassCard variant="elevated" padding="lg" style={styles.blueprintCard}>
        <View style={[styles.blueprintWrap, shadows.glowTeal]}>
          <BodyBlueprint
            width={120}
            height={192}
            highlightNodes={assessment.issues.length > 0 ? [2, 3, 10, 11] : undefined}
          />
        </View>
      </GlassCard>

      {/* Issues */}
      {assessment.issues.length > 0 && (
        <View style={styles.issuesSection}>
          <Text style={styles.sectionTitle}>Issues Found</Text>
          {assessment.issues.map((issue, i) => (
            <GlassCard
              key={i}
              variant="default"
              padding="md"
              innerGlow={SEVERITY_GLOWS[issue.severity]}
              style={styles.issueCard}
            >
              <View style={styles.issueRow}>
                <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLORS[issue.severity] }]} />
                <View style={styles.issueInfo}>
                  <Text style={styles.issueArea}>{issue.area}</Text>
                  <Text style={styles.issueDesc}>{issue.description}</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[issue.severity] + '20' }]}>
                  <Text style={[styles.severityText, { color: SEVERITY_COLORS[issue.severity] }]}>{issue.severity}</Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {/* AI Summary */}
      <GlassCard variant="default" padding="lg" innerGlow="teal" style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="sparkles" size={18} color={colors.accent.primary} />
          <Text style={styles.summaryTitle}>AI Analysis</Text>
        </View>
        <Text style={styles.summaryText}>{assessment.aiSummary}</Text>
      </GlassCard>

      <Text style={styles.dateText}>
        Scanned on {new Date(assessment.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm, marginBottom: spacing.lg },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background.tertiary, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h2, color: colors.text.primary, flex: 1 },
  scoreSection: { alignItems: 'center', marginBottom: spacing.xl },
  scoreValue: { fontFamily: fontFamily.bold, fontSize: 36, color: colors.text.primary },
  scoreLabel: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.text.secondary },
  diffBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  diffText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm },
  blueprintCard: { alignItems: 'center', marginBottom: spacing.xl },
  blueprintWrap: { borderRadius: 12 },
  issuesSection: { marginBottom: spacing.xl },
  sectionTitle: { fontFamily: fontFamily.semiBold, fontSize: fontSize.md, color: colors.text.primary, marginBottom: spacing.md },
  issueCard: { marginBottom: spacing.sm },
  issueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  issueInfo: { flex: 1 },
  issueArea: { fontFamily: fontFamily.semiBold, fontSize: fontSize.base, color: colors.text.primary },
  issueDesc: { ...textStyles.caption, color: colors.text.secondary, marginTop: 2 },
  severityBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
  severityText: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, textTransform: 'capitalize' },
  summaryCard: { marginBottom: spacing.lg },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  summaryTitle: { fontFamily: fontFamily.semiBold, fontSize: fontSize.base, color: colors.accent.primary },
  summaryText: { ...textStyles.body, color: colors.text.secondary, lineHeight: 22 },
  dateText: { ...textStyles.caption, color: colors.text.tertiary, textAlign: 'center', marginBottom: spacing.xl },
});
