export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
} as const;

export const lineHeight = {
  xs: 14,
  sm: 18,
  base: 22,
  md: 24,
  lg: 28,
  xl: 32,
  '2xl': 38,
  '3xl': 44,
} as const;

export const textStyles = {
  h1: { fontFamily: fontFamily.bold, fontSize: fontSize['3xl'], lineHeight: lineHeight['3xl'] },
  h2: { fontFamily: fontFamily.bold, fontSize: fontSize['2xl'], lineHeight: lineHeight['2xl'] },
  h3: { fontFamily: fontFamily.semiBold, fontSize: fontSize.xl, lineHeight: lineHeight.xl },
  subtitle: { fontFamily: fontFamily.medium, fontSize: fontSize.md, lineHeight: lineHeight.md },
  body: { fontFamily: fontFamily.regular, fontSize: fontSize.base, lineHeight: lineHeight.base },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: fontSize.base, lineHeight: lineHeight.base },
  caption: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, lineHeight: lineHeight.sm },
  small: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, lineHeight: lineHeight.xs },
} as const;
