import { Platform } from 'react-native';

export const colors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#2c3e50',
  subText: '#7f8c8d',
  primary: '#3498db',
  danger: '#e74c3c',
  border: '#e9ecef',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  title: 28,
  h1: 24,
  h2: 20,
  body: 16,
  small: 14,
};

export const elevation = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),
};

export const theme = { colors, spacing, radii, typography, elevation };

export type Theme = typeof theme;
