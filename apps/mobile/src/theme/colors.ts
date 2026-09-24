export const colors = {
  background: {
    primary: '#0E0F12',
    secondary: '#15171C',
    tertiary: '#2A2D34',
    camera: '#000000',
  },

  glass: {
    background: 'rgba(21, 23, 28, 0.80)',
    backgroundDark: 'rgba(21, 23, 28, 0.60)',
    border: 'rgba(42, 45, 52, 0.60)',
    borderSubtle: 'rgba(42, 45, 52, 0.30)',
  },

  accent: {
    primary: '#5B7CFA',
    primaryLight: '#7B96FB',
    primaryMuted: 'rgba(91, 124, 250, 0.15)',
    primaryDark: '#4A68D4',
  },

  secondary: {
    primary: '#E8657A',
    primaryLight: '#F0889A',
    primaryMuted: 'rgba(232, 101, 122, 0.12)',
  },

  semantic: {
    success: '#4ECDC4',
    warning: '#F5A623',
    error: '#E74C3C',
    info: '#5AC8FA',
  },

  text: {
    primary: '#E6E8EC',
    secondary: '#9CA3AF',
    tertiary: '#6B7280',
    inverse: '#FFFFFF',
  },

  nodes: {
    dot: 'rgba(91, 124, 250, 0.35)',
    dotActive: '#5B7CFA',
    line: 'rgba(91, 124, 250, 0.12)',
    lineActive: 'rgba(91, 124, 250, 0.30)',
  },

  gradients: {
    tealCyan: ['#5B7CFA', '#4ECDC4'] as const,
    coralPink: ['#E8657A', '#F0889A'] as const,
    warmSunset: ['#F5A623', '#FF8C42'] as const,
    heroTeal: ['rgba(91, 124, 250, 0.12)', 'rgba(91, 124, 250, 0.02)'] as const,
    bluePurple: ['#5AC8FA', '#7B61FF'] as const,
    tealTransparent: ['rgba(91, 124, 250, 0.20)', 'rgba(91, 124, 250, 0.05)'] as const,
    coralTransparent: ['rgba(232, 101, 122, 0.20)', 'rgba(232, 101, 122, 0.05)'] as const,
    amberTransparent: ['rgba(245, 166, 35, 0.20)', 'rgba(245, 166, 35, 0.05)'] as const,
  },

  glows: {
    teal: 'rgba(91, 124, 250, 0.25)',
    coral: 'rgba(232, 101, 122, 0.25)',
    amber: 'rgba(245, 166, 35, 0.25)',
  },
} as const;
