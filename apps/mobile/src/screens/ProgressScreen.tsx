import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { GlassCard } from '../components/glass/GlassCard';
import { TimelineCard } from '../components/ui/TimelineCard';
import { StatChart } from '../components/ui/StatChart';
import { colors, textStyles, spacing, fontFamily, fontSize } from '../theme';
import { useAssessments } from '../hooks/useAssessments';
import { useProgress } from '../hooks/useProgress';
import * as activityService from '../services/activityService';
import type { ActivityFeedItem } from '../types/models';

type Segment = 'timeline' | 'photos' | 'charts';

export function ProgressScreen() {
  const [segment, setSegment] = useState<Segment>('timeline');
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const { assessments } = useAssessments();
  const { photos } = useProgress();

  useEffect(() => {
    activityService.getFeed().then(setActivities);
  }, []);

  const postureData = assessments
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((a) => ({
      label: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: a.score,
    }));

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
      </View>

      {/* Segment Control */}
      <View style={styles.segmentRow}>
        {(['timeline', 'photos', 'charts'] as Segment[]).map((s) => (
          <TouchableOpacity key={s} onPress={() => setSegment(s)} style={[styles.segmentBtn, segment === s && styles.segmentActive]}>
            <Text style={[styles.segmentText, segment === s && styles.segmentTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {segment === 'timeline' && (
        <View>
          {activities.length === 0 ? (
            <GlassCard variant="subtle" padding="xl" style={styles.empty}>
              <Ionicons name="time-outline" size={36} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No activity yet</Text>
            </GlassCard>
          ) : (
            activities.map((item) => (
              <TimelineCard
                key={item.id}
                type={item.type}
                title={item.title}
                description={item.description}
                time={item.createdAt}
                metric={item.metric}
              />
            ))
          )}
        </View>
      )}

      {segment === 'photos' && (
        <View>
          {photos.length === 0 ? (
            <GlassCard variant="subtle" padding="xl" style={styles.empty}>
              <Ionicons name="camera-outline" size={36} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No progress photos yet</Text>
            </GlassCard>
          ) : (
            <View style={styles.photoGrid}>
              {photos.map((photo) => (
                <GlassCard key={photo.id} variant="subtle" padding="md" style={styles.photoCard}>
                  <Ionicons name="person-outline" size={36} color={colors.text.tertiary} />
                  <Text style={styles.photoType}>{photo.type}</Text>
                  <Text style={styles.photoDate}>
                    {new Date(photo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  {photo.weight && <Text style={styles.photoWeight}>{photo.weight} kg</Text>}
                </GlassCard>
              ))}
            </View>
          )}
        </View>
      )}

      {segment === 'charts' && (
        <View>
          {postureData.length >= 2 ? (
            <GlassCard variant="elevated" padding="lg" style={styles.chartCard}>
              <StatChart data={postureData} title="Posture Score Trend" color={colors.semantic.success} />
            </GlassCard>
          ) : (
            <GlassCard variant="subtle" padding="xl" style={styles.empty}>
              <Ionicons name="analytics-outline" size={36} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>Need at least 2 assessments for charts</Text>
            </GlassCard>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.sm, marginBottom: spacing.lg },
  title: { ...textStyles.h2, color: colors.text.primary },
  segmentRow: { flexDirection: 'row', backgroundColor: colors.background.tertiary, borderRadius: 12, padding: 4, marginBottom: spacing.lg },
  segmentBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: 10 },
  segmentActive: { backgroundColor: colors.accent.primaryMuted },
  segmentText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.text.secondary },
  segmentTextActive: { color: colors.accent.primary },
  empty: { alignItems: 'center', marginBottom: spacing.lg },
  emptyText: { fontFamily: fontFamily.medium, fontSize: fontSize.base, color: colors.text.tertiary, marginTop: spacing.md },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  photoCard: { width: '47%', alignItems: 'center', aspectRatio: 0.75 },
  photoType: { fontFamily: fontFamily.semiBold, fontSize: fontSize.sm, color: colors.text.primary, marginTop: spacing.sm, textTransform: 'capitalize' },
  photoDate: { ...textStyles.small, color: colors.text.secondary, marginTop: 2 },
  photoWeight: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.accent.primary, marginTop: 2 },
  chartCard: { marginBottom: spacing.lg },
});
