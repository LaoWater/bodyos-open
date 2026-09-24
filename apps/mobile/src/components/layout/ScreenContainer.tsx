import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { ConstellationBackground } from './ConstellationBackground';

interface ScreenContainerProps {
  children: React.ReactNode;
  showConstellation?: boolean;
  scrollable?: boolean;
}

export function ScreenContainer({
  children,
  showConstellation = true,
  scrollable = true,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.content, { paddingTop: insets.top + spacing.base }]}>
      {children}
    </View>
  );

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={styles.container}
    >
      {showConstellation && <ConstellationBackground />}
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
});
