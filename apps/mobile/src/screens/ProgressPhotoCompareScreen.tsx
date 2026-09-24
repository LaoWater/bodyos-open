import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { PhotoCompare } from '../components/ui/PhotoCompare';
import { GlassCard } from '../components/glass/GlassCard';
import { colors, textStyles, spacing, fontFamily, fontSize } from '../theme';
import * as progressService from '../services/progressService';
import type { ProgressPhoto } from '../types/models';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'ProgressPhotoCompare'>;

export function ProgressPhotoCompareScreen() {
  const route = useRoute<Props['route']>();
  const navigation = useNavigation<Props['navigation']>();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);

  useEffect(() => {
    progressService.getPhotos().then(setPhotos);
  }, []);

  const photo1 = photos.find((p) => p.id === route.params.photoId1);
  const photo2 = photos.find((p) => p.id === route.params.photoId2);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Photo Compare</Text>
      </View>

      {photo1 && photo2 ? (
        <>
          <PhotoCompare date1={photo1.createdAt} date2={photo2.createdAt} />
          <GlassCard variant="subtle" padding="lg" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Before</Text>
                <Text style={styles.infoDate}>{new Date(photo1.createdAt).toLocaleDateString()}</Text>
                {photo1.weight && <Text style={styles.infoWeight}>{photo1.weight} kg</Text>}
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.text.tertiary} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>After</Text>
                <Text style={styles.infoDate}>{new Date(photo2.createdAt).toLocaleDateString()}</Text>
                {photo2.weight && <Text style={styles.infoWeight}>{photo2.weight} kg</Text>}
              </View>
            </View>
          </GlassCard>
        </>
      ) : (
        <GlassCard variant="subtle" padding="xl" style={styles.empty}>
          <Ionicons name="images-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>Photos not found</Text>
        </GlassCard>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm, marginBottom: spacing.xl },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background.tertiary, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h2, color: colors.text.primary, flex: 1 },
  infoCard: { marginTop: spacing.xl },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  infoCol: { alignItems: 'center' },
  infoLabel: { fontFamily: fontFamily.semiBold, fontSize: fontSize.base, color: colors.text.primary },
  infoDate: { ...textStyles.caption, color: colors.text.secondary, marginTop: 2 },
  infoWeight: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.accent.primary, marginTop: 2 },
  empty: { alignItems: 'center', gap: spacing.md },
  emptyText: { fontFamily: fontFamily.medium, fontSize: fontSize.base, color: colors.text.tertiary },
});
