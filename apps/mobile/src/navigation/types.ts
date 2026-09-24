import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Permissions: undefined;
  Onboarding: undefined;
  ModeSelect: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  Auth: undefined;
  BodyScanResult: { assessmentId: string };
  ProgressPhotoCompare: { photoId1: string; photoId2: string };
  WorkoutSession: { planDayId?: string };
  ExerciseDetail: { exerciseId: string };
};

export type TabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Posture: undefined;
  Camera: undefined;
  Coach: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  Progress: undefined;
  Achievements: undefined;
  WorkoutPlan: { planId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Progress: undefined;
  Achievements: undefined;
  WhatsApp: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> =
  BottomTabScreenProps<TabParamList, T>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, T>,
    BottomTabScreenProps<TabParamList>
  >;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    BottomTabScreenProps<TabParamList>
  >;
