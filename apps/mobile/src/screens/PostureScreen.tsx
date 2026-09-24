import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions,
  Animated, ScrollView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { GlassCard } from '../components/glass/GlassCard';
import { GlassButton } from '../components/glass/GlassButton';
import { GradientAccent } from '../components/glass/GradientAccent';
import { PulseRing } from '../components/motion/PulseRing';
import { StaggeredReveal } from '../components/motion/StaggeredReveal';
import { BlueprintLinesCanvas } from '../components/motion/BlueprintLine';
import { AnimatedNumber } from '../components/motion/AnimatedNumber';
import { useCheckpoints } from '../hooks/useCheckpoints';
import { colors, textStyles, spacing, fontFamily, fontSize, borderRadius } from '../theme';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { IMAGE_REGISTRY, type ImageName } from '../constants/imageRegistry';
import type { BodyCheckpoint, CheckpointPhoto, CheckpointPhotoType, ProcessingStatus } from '../types/models';

const { width } = Dimensions.get('window');

type GradientPreset = 'teal' | 'coral' | 'sunset' | 'blue';

// ─── Reference Image Mapping ─────────────────────
const REFERENCE_IMAGE_NAMES: Record<CheckpointPhotoType, ImageName> = {
  anterior: 'anterior-view',
  posterior: 'posterior-view',
  lateral_left: 'left-side-view',
  lateral_right: 'right-side-view',
};

const PHOTO_SLOTS: { type: CheckpointPhotoType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'anterior', label: 'Front', icon: 'person-outline' },
  { type: 'posterior', label: 'Back', icon: 'person-outline' },
  { type: 'lateral_left', label: 'Left Side', icon: 'arrow-back-outline' },
  { type: 'lateral_right', label: 'Right Side', icon: 'arrow-forward-outline' },
];

const STATUS_CONFIG: Record<ProcessingStatus, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  pending: { color: colors.text.tertiary, icon: 'time-outline', label: 'Pending' },
  processing: { color: colors.semantic.warning, icon: 'sync-outline', label: 'Analyzing...' },
  completed: { color: colors.semantic.success, icon: 'checkmark-circle', label: 'Complete' },
  failed: { color: colors.semantic.error, icon: 'alert-circle-outline', label: 'Failed' },
};

// ─── Main Screen ──────────────────────────────────

export function PostureScreen() {
  const {
    checkpoints, activeCheckpoint, loading, analyzing,
    createCheckpoint, addPhoto, submitForAnalysis,
    setActiveCheckpoint, refresh,
  } = useCheckpoints();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleNewCheckpoint = async () => {
    await createCheckpoint();
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  // Active checkpoint in capture mode
  if (activeCheckpoint && (activeCheckpoint.status === 'pending' || activeCheckpoint.status === 'processing')) {
    return (
      <ScreenContainer>
        <View style={styles.headerTextBlock}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>Body Checkpoint</Text>
            <LinearGradient colors={[...colors.gradients.tealCyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerUnderline} />
          </View>
          <Text style={styles.headerSubtitle}>Capture your body from multiple angles</Text>
        </View>

        <CheckpointCaptureView
          checkpoint={activeCheckpoint}
          onAddPhoto={addPhoto}
          onSubmit={submitForAnalysis}
          onCancel={() => setActiveCheckpoint(null)}
          analyzing={analyzing}
        />
      </ScreenContainer>
    );
  }

  // Active completed checkpoint detail view
  if (activeCheckpoint && activeCheckpoint.status === 'completed') {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <Pressable onPress={() => setActiveCheckpoint(null)} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <View>
            <Text style={styles.title}>Checkpoint Detail</Text>
            <Text style={styles.detailSubtitle}>
              {new Date(activeCheckpoint.checkpointDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        </View>

        <CheckpointDetailView checkpoint={activeCheckpoint} />
      </ScreenContainer>
    );
  }

  // Main view: New Checkpoint + Timeline
  return (
    <ScreenContainer>
      <View style={styles.headerTextBlock}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Body Intelligence</Text>
          <LinearGradient colors={[...colors.gradients.tealCyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerUnderline} />
        </View>
        <Text style={styles.headerSubtitle}>AI-powered body assessment</Text>
      </View>

      {/* Hero Card with HQ Background */}
      <GlassCard variant="elevated" padding="xl" style={styles.heroCard}>
        <View style={StyleSheet.absoluteFill}>
          <OptimizedImage name="body-os-headquarters" variant="medium" style={styles.heroImage} contentFit="cover" />
          <LinearGradient
            colors={['rgba(15,17,21,0.88)', 'rgba(15,17,21,0.75)', 'rgba(15,17,21,0.88)']}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['transparent', 'rgba(15,17,21,0.95)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <GradientAccent preset="teal" size={56}>
          <Ionicons name="scan-outline" size={28} color={colors.text.inverse} />
        </GradientAccent>
        <Text style={styles.heroTitle}>Body Checkpoint</Text>
        <Text style={styles.heroDesc}>
          Take photos from 4 angles. Our AI analyzes your alignment, detects imbalances, and tracks changes over time.
        </Text>
        <GlassButton
          title="New Checkpoint"
          onPress={handleNewCheckpoint}
          variant="accent"
          size="lg"
          icon="add-circle-outline"
          style={styles.newCheckpointBtn}
        />
      </GlassCard>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <InfoCard icon="camera-outline" title="4 Angles" desc="Front, Back, Left, Right" gradient="teal" />
        <InfoCard icon="analytics-outline" title="33 Points" desc="Landmark detection" gradient="coral" />
        <InfoCard icon="trending-up-outline" title="Track" desc="Progress over time" gradient="blue" />
      </View>

      {/* Checkpoint Timeline */}
      {checkpoints.length > 0 && (
        <>
          <SectionHeader title="Checkpoint History" subtitle={`${checkpoints.length} total`} />
          <StaggeredReveal
            visible={true}
            staggerInterval={100}
            duration={500}
            direction="down"
            distance={12}
          >
            {checkpoints.map((cp) => (
              <CheckpointTimelineCard
                key={cp.id}
                checkpoint={cp}
                expanded={expandedId === cp.id}
                onPress={() => {
                  if (cp.status === 'completed') {
                    setActiveCheckpoint(cp);
                  } else {
                    setExpandedId(expandedId === cp.id ? null : cp.id);
                  }
                }}
              />
            ))}
          </StaggeredReveal>
        </>
      )}

      {checkpoints.length === 0 && (
        <GlassCard variant="subtle" padding="xl" style={styles.emptyCard}>
          <Ionicons name="body-outline" size={40} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>No checkpoints yet</Text>
          <Text style={styles.emptySubtext}>Create your first checkpoint to begin tracking your body alignment over time.</Text>
        </GlassCard>
      )}
    </ScreenContainer>
  );
}

// ─── Capture View ─────────────────────────────────

function CheckpointCaptureView({
  checkpoint,
  onAddPhoto,
  onSubmit,
  onCancel,
  analyzing,
}: {
  checkpoint: BodyCheckpoint;
  onAddPhoto: (checkpointId: string, type: CheckpointPhotoType, url: string) => Promise<CheckpointPhoto>;
  onSubmit: (checkpointId: string) => Promise<void>;
  onCancel: () => void;
  analyzing: boolean;
}) {
  const [guideExpanded, setGuideExpanded] = useState(false);

  const handleCapture = async (photoType: CheckpointPhotoType) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      await onAddPhoto(checkpoint.id, photoType, result.assets[0].uri);
    }
  };

  const hasPhotos = checkpoint.photos.length > 0;
  const isProcessing = checkpoint.status === 'processing' || analyzing;

  return (
    <>
      {/* Capture Grid */}
      <View style={styles.captureGrid}>
        {PHOTO_SLOTS.map((slot) => {
          const existing = checkpoint.photos.find((p) => p.photoType === slot.type);
          return (
            <CaptureSlot
              key={slot.type}
              slotType={slot.type}
              label={slot.label}
              icon={slot.icon}
              photo={existing}
              onPress={() => handleCapture(slot.type)}
              disabled={isProcessing}
            />
          );
        })}
      </View>

      {/* Processing State */}
      {isProcessing && (
        <GlassCard variant="elevated" padding="lg" innerGlow="teal" style={styles.processingCard}>
          <ActivityIndicator color={colors.accent.primary} size="small" />
          <Text style={styles.processingText}>Analyzing your body alignment...</Text>
          <Text style={styles.processingSubtext}>Processing {checkpoint.photos.length} photo{checkpoint.photos.length > 1 ? 's' : ''} with MediaPipe</Text>
        </GlassCard>
      )}

      {/* Actions */}
      <View style={styles.captureActions}>
        {hasPhotos && !isProcessing && (
          <GlassButton
            title="Submit for Analysis"
            onPress={() => onSubmit(checkpoint.id)}
            variant="accent"
            size="lg"
            icon="cloud-upload-outline"
            style={{ flex: 2 }}
          />
        )}
        {!isProcessing && (
          <GlassButton
            title="Cancel"
            onPress={onCancel}
            variant="outline"
            size="lg"
            style={{ flex: 1 }}
          />
        )}
      </View>

      {/* How to Scan Guide */}
      {!isProcessing && (
        <HowToScanGuide expanded={guideExpanded} onToggle={() => setGuideExpanded(!guideExpanded)} />
      )}
    </>
  );
}

// ─── How to Scan Guide ───────────────────────────

function HowToScanGuide({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle}>
      <GlassCard variant="subtle" padding="md" style={styles.guidanceCard}>
        <View style={styles.guideHeader}>
          <Ionicons name="information-circle-outline" size={18} color={colors.accent.primary} />
          <Text style={styles.guidePanelTitle}>How to Scan</Text>
          <View style={{ flex: 1 }} />
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.text.tertiary}
          />
        </View>
        <Text style={styles.guidePanelSubtext}>
          Stand naturally with arms relaxed. Good lighting and a plain background help our AI produce more accurate results.
        </Text>

        {expanded && (
          <View style={styles.guideExpandedContent}>
            {/* Reference image carousel */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.guideScroll}
              contentContainerStyle={styles.guideScrollContent}
            >
              {PHOTO_SLOTS.map((slot) => (
                <View key={slot.type} style={styles.guideImageCard}>
                  <OptimizedImage
                    name={REFERENCE_IMAGE_NAMES[slot.type]}
                    variant="medium"
                    style={styles.guideImage}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.guideImageFade}
                  />
                  <Text style={styles.guideImageLabel}>{slot.label}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Tips row */}
            <View style={styles.guideTips}>
              <View style={styles.guideTip}>
                <Ionicons name="sunny-outline" size={20} color={colors.accent.primary} />
                <Text style={styles.guideTipText}>Even lighting</Text>
              </View>
              <View style={styles.guideTip}>
                <Ionicons name="body-outline" size={20} color={colors.accent.primary} />
                <Text style={styles.guideTipText}>Full body visible</Text>
              </View>
              <View style={styles.guideTip}>
                <Ionicons name="grid-outline" size={20} color={colors.accent.primary} />
                <Text style={styles.guideTipText}>Plain background</Text>
              </View>
            </View>
          </View>
        )}
      </GlassCard>
    </Pressable>
  );
}

// ─── Capture Slot ─────────────────────────────────

function CaptureSlot({
  slotType,
  label,
  icon,
  photo,
  onPress,
  disabled,
}: {
  slotType: CheckpointPhotoType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  photo?: CheckpointPhoto;
  onPress: () => void;
  disabled?: boolean;
}) {
  const slotWidth = (width - spacing.lg * 2 - spacing.md) / 2;
  const fadeAnim = useRef(new Animated.Value(photo ? 1 : 0)).current;
  const refOpacity = useRef(new Animated.Value(photo ? 0 : 1)).current;

  useEffect(() => {
    if (photo) {
      // Crossfade: reference out, user photo in
      Animated.parallel([
        Animated.timing(refOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [photo]);

  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ opacity: disabled ? 0.6 : 1 }}>
      <GlassCard
        variant={photo ? 'elevated' : 'subtle'}
        padding="sm"
        innerGlow={photo ? 'teal' : undefined}
        style={{ ...styles.captureSlot, width: slotWidth }}
      >
        <View style={styles.thumbnailWrap}>
          {/* Reference image (empty state) */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: refOpacity }]}>
            <OptimizedImage
              name={REFERENCE_IMAGE_NAMES[slotType]}
              variant="medium"
              style={[styles.thumbnail, { opacity: 0.45 }]}
              contentFit="cover"
            />
            {/* Edge vignette fades */}
            <LinearGradient
              colors={['rgba(21,23,28,0.8)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.3 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['transparent', 'rgba(21,23,28,0.8)']}
              start={{ x: 0, y: 0.7 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['rgba(21,23,28,0.6)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.3, y: 0 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['transparent', 'rgba(21,23,28,0.6)']}
              start={{ x: 0.7, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* Example badge */}
            <View style={styles.refExampleBadge}>
              <Text style={styles.refExampleText}>Example</Text>
            </View>

            {/* Center camera icon */}
            <View style={styles.refOverlayCenter}>
              <View style={styles.refCameraCircle}>
                <Ionicons name="camera-outline" size={22} color="#fff" />
              </View>
            </View>
          </Animated.View>

          {/* User photo (fades in on capture) */}
          {photo && (
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
              <ExpoImage source={{ uri: photo.photoUrl }} style={styles.thumbnail} contentFit="cover" cachePolicy="memory-disk" />
              <View style={styles.thumbnailBadge}>
                <Ionicons
                  name={STATUS_CONFIG[photo.processingStatus].icon}
                  size={14}
                  color={STATUS_CONFIG[photo.processingStatus].color}
                />
              </View>
            </Animated.View>
          )}
        </View>

        <Text style={[styles.slotLabel, photo && styles.slotLabelActive]}>{label}</Text>
        {photo ? (
          <Text style={styles.slotStatus}>{photo.processingStatus === 'completed' ? 'Captured' : 'Tap to retake'}</Text>
        ) : (
          <Text style={styles.slotHint}>Tap to capture</Text>
        )}
      </GlassCard>
    </Pressable>
  );
}

// ─── Detail View (Completed Checkpoint) ───────────

function CheckpointDetailView({ checkpoint }: { checkpoint: BodyCheckpoint }) {
  const avgScore = checkpoint.photos.length > 0
    ? Math.round(
      checkpoint.photos.reduce((sum, p) => sum + (p.analysisResults?.score ?? 0), 0) / checkpoint.photos.length,
    )
    : 0;

  return (
    <StaggeredReveal
      visible={true}
      staggerInterval={120}
      duration={500}
      direction="down"
      distance={16}
    >
      {/* Overall Score */}
      <GlassCard variant="elevated" padding="lg" innerGlow="teal" style={styles.scoreCard}>
        <View style={styles.scoreRow}>
          <PulseRing
            progress={avgScore / 100}
            size={80}
            strokeWidth={6}
            glowRadius={4}
            pulseEnabled
          >
            <AnimatedNumber
              value={avgScore}
              duration={800}
              style={styles.scoreValue}
            />
          </PulseRing>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreTitle}>Overall Alignment</Text>
            <Text style={styles.scoreSubtitle}>{checkpoint.photos.length} angle{checkpoint.photos.length > 1 ? 's' : ''} analyzed</Text>
          </View>
        </View>
      </GlassCard>

      {/* Photo Results */}
      {checkpoint.photos.map((photo) => (
        <PhotoResultCard key={photo.id} photo={photo} />
      ))}
    </StaggeredReveal>
  );
}

// ─── Photo Result Card ────────────────────────────

function PhotoResultCard({ photo }: { photo: CheckpointPhoto }) {
  const slotMeta = PHOTO_SLOTS.find((s) => s.type === photo.photoType);
  const score = photo.analysisResults?.score ?? 0;
  const issues = photo.analysisResults?.issues ?? [];

  // Generate blueprint alignment lines based on photo type
  const blueprintLines = getBlueprintLines(photo.photoType);

  return (
    <GlassCard variant="subtle" padding="md" style={styles.photoResultCard}>
      <View style={styles.photoResultHeader}>
        <View style={styles.photoResultThumbWrap}>
          <ExpoImage source={{ uri: photo.photoUrl }} style={styles.photoResultThumb} contentFit="cover" cachePolicy="memory-disk" />
          {/* Blueprint alignment lines over thumbnail */}
          {blueprintLines.length > 0 && (
            <BlueprintLinesCanvas
              lines={blueprintLines}
              width={56}
              height={75}
              color={colors.accent.primary}
              dashLength={4}
              dashGap={3}
              strokeWidth={1}
              opacity={0.5}
              animated
            />
          )}
        </View>
        <View style={styles.photoResultInfo}>
          <Text style={styles.photoResultTitle}>{slotMeta?.label ?? photo.photoType}</Text>
          <View style={styles.photoResultScoreRow}>
            <PulseRing
              progress={score / 100}
              size={36}
              strokeWidth={3}
              glowRadius={2}
              pulseEnabled={false}
            >
              <Text style={styles.photoResultScoreSmall}>{score}</Text>
            </PulseRing>
            <Text style={styles.photoResultScoreLabel}>/100</Text>
          </View>
        </View>
        <Ionicons name={STATUS_CONFIG[photo.processingStatus].icon} size={20} color={STATUS_CONFIG[photo.processingStatus].color} />
      </View>

      {issues.length > 0 && (
        <View style={styles.issuesList}>
          {issues.map((issue, idx) => (
            <View key={idx} style={styles.issueRow}>
              <View style={[styles.issueDot, {
                backgroundColor: issue.severity === 'severe' ? colors.semantic.error
                  : issue.severity === 'moderate' ? '#FF8C42'
                  : colors.semantic.warning,
              }]} />
              <View style={styles.issueContent}>
                <Text style={styles.issueArea}>{issue.area.replace('_', ' ')}</Text>
                <Text style={styles.issueDesc}>{issue.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

/** Generate blueprint alignment lines for thumbnail overlay based on view angle */
function getBlueprintLines(photoType: CheckpointPhotoType): [number, number, number, number][] {
  const w = 56;
  const h = 75;
  const cx = w / 2;

  switch (photoType) {
    case 'anterior':
    case 'posterior':
      return [
        // Vertical midline
        [cx, 4, cx, h - 4],
        // Shoulder line
        [8, h * 0.28, w - 8, h * 0.28],
        // Hip line
        [12, h * 0.52, w - 12, h * 0.52],
      ];
    case 'lateral_left':
    case 'lateral_right':
      return [
        // Plumb line (ear to ankle)
        [cx, 4, cx, h - 4],
        // Shoulder marker
        [cx - 8, h * 0.28, cx + 8, h * 0.28],
        // Hip marker
        [cx - 8, h * 0.52, cx + 8, h * 0.52],
        // Knee marker
        [cx - 6, h * 0.72, cx + 6, h * 0.72],
      ];
    default:
      return [];
  }
}

// ─── Timeline Card ────────────────────────────────

function CheckpointTimelineCard({
  checkpoint,
  expanded,
  onPress,
}: {
  checkpoint: BodyCheckpoint;
  expanded: boolean;
  onPress: () => void;
}) {
  const statusCfg = STATUS_CONFIG[checkpoint.status];
  const avgScore = checkpoint.status === 'completed' && checkpoint.photos.length > 0
    ? Math.round(
      checkpoint.photos.reduce((sum, p) => sum + (p.analysisResults?.score ?? 0), 0) / checkpoint.photos.length,
    )
    : null;

  return (
    <Pressable onPress={onPress}>
      <GlassCard variant="subtle" padding="md" style={styles.timelineCard}>
        <View style={styles.timelineRow}>
          <GradientAccent preset={checkpoint.status === 'completed' ? 'teal' : 'sunset'} size={40}>
            <Ionicons name={statusCfg.icon} size={20} color={colors.text.inverse} />
          </GradientAccent>
          <View style={styles.timelineInfo}>
            <Text style={styles.timelineDate}>
              {new Date(checkpoint.checkpointDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
            <Text style={styles.timelineSubtext}>
              {checkpoint.photos.length} photo{checkpoint.photos.length !== 1 ? 's' : ''} {'\u00B7'} {statusCfg.label}
            </Text>
          </View>
          {avgScore !== null && (
            <View style={styles.timelineScore}>
              <Text style={styles.timelineScoreText}>{avgScore}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
        </View>
      </GlassCard>
    </Pressable>
  );
}

// ─── Info Card ────────────────────────────────────

function InfoCard({ icon, title, desc, gradient }: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string; gradient: GradientPreset }) {
  return (
    <GlassCard variant="subtle" padding="base" style={styles.infoCard}>
      <GradientAccent preset={gradient} size={40}>
        <Ionicons name={icon} size={20} color={colors.text.inverse} />
      </GradientAccent>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoDesc}>{desc}</Text>
    </GlassCard>
  );
}

// ─── Styles ───────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { marginBottom: spacing.xl, paddingTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerTextBlock: { marginBottom: spacing.lg, paddingTop: spacing.sm },
  titleWrap: { position: 'relative', paddingBottom: spacing.sm },
  backBtn: { padding: spacing.xs },
  title: { ...textStyles.h2, color: colors.text.primary },
  headerUnderline: { width: 60, height: 3, borderRadius: 1.5, position: 'absolute', bottom: 0, left: 0 },
  headerSubtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, fontStyle: 'italic', color: colors.text.secondary, marginTop: spacing.xs },
  detailSubtitle: { ...textStyles.body, color: colors.text.secondary, marginTop: spacing.sm },

  // Hero
  heroCard: { alignItems: 'center', marginBottom: spacing.xl, gap: spacing.md, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%', opacity: 0.12 },
  heroTitle: { fontFamily: fontFamily.semiBold, fontSize: fontSize.lg, color: colors.text.primary },
  heroDesc: { ...textStyles.caption, color: colors.text.secondary, textAlign: 'center', lineHeight: 20 },
  newCheckpointBtn: { width: '100%', marginTop: spacing.sm },

  // Info Row
  infoRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing['2xl'] },
  infoCard: { flex: 1, alignItems: 'center' },
  infoTitle: { fontFamily: fontFamily.semiBold, fontSize: fontSize.base, color: colors.text.primary, marginTop: spacing.sm },
  infoDesc: { ...textStyles.caption, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs },

  // Capture Grid
  captureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center', marginBottom: spacing.xl },
  captureSlot: { alignItems: 'center', gap: spacing.sm },
  thumbnailWrap: { width: '100%', aspectRatio: 3 / 4, borderRadius: borderRadius.md, overflow: 'hidden', position: 'relative' },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailBadge: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  slotLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.text.secondary },
  slotLabelActive: { color: colors.accent.primary },
  slotStatus: { fontFamily: fontFamily.regular, fontSize: 10, color: colors.text.tertiary },
  slotHint: { fontFamily: fontFamily.regular, fontSize: 10, color: colors.text.tertiary, fontStyle: 'italic' },

  // Reference image overlays
  refOverlayCenter: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  refCameraCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,210,190,0.35)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(0,210,190,0.6)',
  },
  refExampleBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  refExampleText: { fontFamily: fontFamily.medium, fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Processing
  processingCard: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  processingText: { fontFamily: fontFamily.semiBold, fontSize: fontSize.base, color: colors.accent.primary },
  processingSubtext: { ...textStyles.caption, color: colors.text.secondary },

  // Capture Actions
  captureActions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },

  // Guidance / How to Scan
  guidanceCard: { gap: spacing.sm, marginBottom: spacing.xl },
  guideHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  guidePanelTitle: { fontFamily: fontFamily.semiBold, fontSize: fontSize.sm, color: colors.text.primary },
  guidePanelSubtext: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.text.secondary, lineHeight: 18 },
  guideExpandedContent: { marginTop: spacing.md, gap: spacing.md },
  guideScroll: { marginHorizontal: -spacing.md },
  guideScrollContent: { paddingHorizontal: spacing.md, gap: spacing.sm },
  guideImageCard: {
    width: 160, height: 213, borderRadius: borderRadius.md,
    overflow: 'hidden', position: 'relative',
    borderWidth: 1, borderColor: colors.glass.border,
  },
  guideImage: { width: '100%', height: '100%' },
  guideImageFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  guideImageLabel: {
    position: 'absolute', bottom: 8, left: 0, right: 0,
    fontFamily: fontFamily.semiBold, fontSize: fontSize.sm, color: '#fff',
    textAlign: 'center',
  },
  guideTips: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: spacing.xs },
  guideTip: { alignItems: 'center', gap: 4 },
  guideTipText: { fontFamily: fontFamily.regular, fontSize: 11, color: colors.text.secondary },

  // Score
  scoreCard: { marginBottom: spacing.xl },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  scoreValue: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.text.primary },
  scoreInfo: { flex: 1 },
  scoreTitle: { fontFamily: fontFamily.semiBold, fontSize: fontSize.md, color: colors.text.primary },
  scoreSubtitle: { ...textStyles.caption, color: colors.text.secondary, marginTop: 2 },

  // Photo Result
  photoResultCard: { marginBottom: spacing.md },
  photoResultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  photoResultThumbWrap: { width: 56, height: 75, borderRadius: borderRadius.sm, overflow: 'hidden', position: 'relative' },
  photoResultThumb: { width: 56, height: 75, borderRadius: borderRadius.sm, backgroundColor: colors.background.tertiary },
  photoResultInfo: { flex: 1 },
  photoResultTitle: { fontFamily: fontFamily.semiBold, fontSize: fontSize.base, color: colors.text.primary },
  photoResultScoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  photoResultScore: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.accent.primary },
  photoResultScoreSmall: { fontFamily: fontFamily.bold, fontSize: 11, color: colors.text.primary },
  photoResultScoreLabel: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.text.tertiary },
  issuesList: { marginTop: spacing.md, gap: spacing.sm },
  issueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  issueDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  issueContent: { flex: 1 },
  issueArea: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.text.primary, textTransform: 'capitalize' },
  issueDesc: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.text.secondary, marginTop: 1 },

  // Timeline
  timelineCard: { marginBottom: spacing.sm },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  timelineInfo: { flex: 1 },
  timelineDate: { fontFamily: fontFamily.medium, fontSize: fontSize.base, color: colors.text.primary },
  timelineSubtext: { ...textStyles.caption, color: colors.text.secondary, marginTop: 2 },
  timelineScore: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  timelineScoreText: { fontFamily: fontFamily.bold, fontSize: fontSize.base, color: colors.accent.primary },

  // Empty
  emptyCard: { alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  emptyText: { fontFamily: fontFamily.semiBold, fontSize: fontSize.md, color: colors.text.secondary },
  emptySubtext: { ...textStyles.caption, color: colors.text.tertiary, textAlign: 'center', lineHeight: 18 },
});
