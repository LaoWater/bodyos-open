import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { AchievementBadge } from '../components/ui/AchievementBadge';
import { useAchievements } from '../hooks/useAchievements';
import { colors, textStyles, spacing, fontFamily, fontSize } from '../theme';
import type { AchievementCategory } from '../types/models';

const CATEGORIES: { id: AchievementCategory; label: string }[] = [
  { id: 'consistency', label: 'Consistency' },
  { id: 'strength', label: 'Strength' },
  { id: 'posture', label: 'Posture' },
  { id: 'milestones', label: 'Milestones' },
];

export function AchievementsScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { definitions, isUnlocked, unlocked } = useAchievements();

  const handleBackToProfile = () => {
    const tabNavigation = navigation.getParent();
    if (tabNavigation) {
      tabNavigation.navigate('Profile', { screen: 'ProfileMain' });
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToProfile} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Achievements</Text>
          <Text style={styles.subtitle}>{unlocked.length} of {definitions.length} unlocked</Text>
        </View>
      </View>

      {CATEGORIES.map((cat) => {
        const catAchievements = definitions.filter((d) => d.category === cat.id);
        if (catAchievements.length === 0) return null;

        return (
          <View key={cat.id} style={styles.categorySection}>
            <SectionHeader title={cat.label} />
            <View style={styles.badgeGrid}>
              {catAchievements.map((a) => (
                <AchievementBadge
                  key={a.id}
                  name={a.name}
                  icon={a.icon}
                  unlocked={isUnlocked(a.id)}
                  category={a.category}
                />
              ))}
            </View>
          </View>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm, marginBottom: spacing.xl },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { ...textStyles.h2, color: colors.text.primary },
  subtitle: { ...textStyles.body, color: colors.text.secondary, marginTop: spacing.xs },
  categorySection: { marginBottom: spacing.lg },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, justifyContent: 'flex-start' },
});
