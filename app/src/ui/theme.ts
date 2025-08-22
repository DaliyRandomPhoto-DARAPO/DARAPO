// theme.ts
import { Platform, Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// clamp 유틸 (타입 안전)
const clamp = (val: number, min: number, max?: number): number => {
  const v = Math.max(val, min);
  return typeof max === 'number' ? Math.min(v, max) : v;
};

// 픽셀 스냅
const px = (n: number) => PixelRatio.roundToNearestPixel(n);

// 팔레트 (라이트 고정)
export const colors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#2c3e50',
  subText: '#7f8c8d',
  primary: '#3498db',
  danger: '#e74c3c',
  border: '#e9ecef',
} as const;

// 반응형 간격 (너비 기반, 하한 보장 + 픽셀 스냅)
export const spacing = {
  xs: px(clamp(SCREEN_WIDTH * 0.012, 4)),
  sm: px(clamp(SCREEN_WIDTH * 0.03, 8)),
  md: px(clamp(SCREEN_WIDTH * 0.05, 16)),
  lg: px(clamp(SCREEN_WIDTH * 0.075, 24)),
  xl: px(clamp(SCREEN_WIDTH * 0.1, 32)),
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  title: 28,
  h1: 24,
  h2: 20,
  body: 16,
  small: 14,
} as const;

// 플랫폼별 그림자/고도
const iosShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
} as const;

export const elevation = {
  card:
    Platform.OS === 'ios'
      ? iosShadow
      : Platform.OS === 'android'
      ? ({ elevation: 6 } as const)
      : ({} as const),
} as const;

export const theme = { colors, spacing, radii, typography, elevation } as const;
export type Theme = typeof theme;
