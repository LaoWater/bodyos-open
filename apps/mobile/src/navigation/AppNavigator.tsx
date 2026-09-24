import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppPermissions } from '../utils/permissions';
import { useApp } from '../context/AppContext';
import { PermissionsScreen } from '../screens/PermissionsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ModeSelectScreen } from '../screens/ModeSelectScreen';
import { TabNavigator } from './TabNavigator';
import { BodyScanResultScreen } from '../screens/BodyScanResultScreen';
import { WorkoutSessionScreen } from '../screens/WorkoutSessionScreen';
import { ExerciseDetailScreen } from '../screens/ExerciseDetailScreen';
import { ProgressPhotoCompareScreen } from '../screens/ProgressPhotoCompareScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { PulseRing } from '../components/motion/PulseRing';
import { colors, fontFamily, fontSize } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppLoadingScreen() {
  // Letter-by-letter fade-in for "Body" + "OS"
  const letters = ['B', 'o', 'd', 'y'];
  const osLetters = ['O', 'S'];
  const allLetters = [...letters, ...osLetters];
  const letterAnims = useRef(allLetters.map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  const ringProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered letter entrance
    const letterAnimations = letterAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: 200 + i * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    Animated.parallel(letterAnimations).start();

    // Subtle pulse on "OS" accent after all letters visible
    const pulseDelay = 200 + allLetters.length * 100 + 200;
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }, pulseDelay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={loadingStyles.container}
    >
      <View style={loadingStyles.logoRow}>
        {letters.map((letter, i) => (
          <Animated.Text
            key={`body-${i}`}
            style={[
              loadingStyles.logo,
              {
                opacity: letterAnims[i],
                transform: [{
                  translateY: letterAnims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                }],
              },
            ]}
          >
            {letter}
          </Animated.Text>
        ))}
        {osLetters.map((letter, i) => (
          <Animated.Text
            key={`os-${i}`}
            style={[
              loadingStyles.logo,
              loadingStyles.logoAccent,
              {
                opacity: Animated.multiply(letterAnims[letters.length + i], pulseAnim),
                transform: [{
                  translateY: letterAnims[letters.length + i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                }],
              },
            ]}
          >
            {letter}
          </Animated.Text>
        ))}
      </View>
      <View style={loadingStyles.ringWrap}>
        <PulseRing
          progress={0.7}
          size={40}
          strokeWidth={3}
          color={colors.accent.primary}
          glowRadius={2}
          pulseEnabled
        />
      </View>
    </LinearGradient>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    color: colors.text.secondary,
    letterSpacing: 2,
  },
  logoAccent: {
    color: colors.accent.primary,
  },
  ringWrap: {
    marginTop: 28,
  },
});

export function AppNavigator() {
  const permissions = useAppPermissions();
  const { state } = useApp();

  if (state.isLoading) return <AppLoadingScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!permissions.allGranted ? (
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
      ) : !state.onboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : !state.appMode ? (
        <>
          <Stack.Screen name="ModeSelect" component={ModeSelectScreen} />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="BodyScanResult"
            component={BodyScanResultScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="WorkoutSession"
            component={WorkoutSessionScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="ExerciseDetail"
            component={ExerciseDetailScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="ProgressPhotoCompare"
            component={ProgressPhotoCompareScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
