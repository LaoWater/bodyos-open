import { Platform } from 'react-native';

export const shadows = {
  glass: Platform.select({
    ios: {
      shadowColor: 'rgba(0, 0, 0, 0.30)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
  }),

  glassSubtle: Platform.select({
    ios: {
      shadowColor: 'rgba(0, 0, 0, 0.20)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
  }),

  glassElevated: Platform.select({
    ios: {
      shadowColor: 'rgba(0, 0, 0, 0.40)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 24,
    },
    android: {
      elevation: 8,
    },
  }),

  glowTeal: Platform.select({
    ios: {
      shadowColor: 'rgba(91, 124, 250, 0.40)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
  }),

  glowCoral: Platform.select({
    ios: {
      shadowColor: 'rgba(232, 101, 122, 0.40)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
  }),
} as const;
