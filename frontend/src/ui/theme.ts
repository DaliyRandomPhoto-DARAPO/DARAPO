import { Platform, Dimensions } from 'react-native';

// 화면 크기 기반 반응형 여백 계산
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const clamp = (val: number, min: number, max?: number) => {
  const v = Math.max(val, min);
  return typeof max === 'number' ? Math.min(v, max) : v;
};

export const colors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#2c3e50',
  subText: '#7f8c8d',
  primary: '#3498db',
  danger: '#e74c3c',
  border: '#e9ecef',
};

// 퍼센트 기반 스케일에 최소 픽셀을 보장
export const spacing = {
  // 약 1.2% ~ 10% of width (세로 여백이 타이트하지 않도록 소폭 상향)
  xs: clamp(Math.round(SCREEN_WIDTH * 0.012), 4),
  sm: clamp(Math.round(SCREEN_WIDTH * 0.03), 8),
  md: clamp(Math.round(SCREEN_WIDTH * 0.05), 16),
  lg: clamp(Math.round(SCREEN_WIDTH * 0.075), 24),
  xl: clamp(Math.round(SCREEN_WIDTH * 0.1), 32),
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
