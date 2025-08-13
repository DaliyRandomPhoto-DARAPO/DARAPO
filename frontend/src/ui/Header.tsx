import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Local tokens
const colors = { surface: '#ffffff', border: '#e9ecef', text: '#2c3e50' } as const;
const spacing = { xs: 6, md: 12, lg: 16 } as const;
const typography = { title: 28 } as const;

type Props = {
  title: string;
  right?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export const Header: React.FC<Props> = ({ title, right, style }) => {
  const insets = useSafeAreaInsets();
  // 상단 여백: 기기 상태바 높이(insets.top) + 소폭 기본 여백
  const dynamicStyle = {
    paddingTop: Math.max(spacing.md, insets.top + spacing.xs),
  } as const;
  return (
    <View style={[styles.header, dynamicStyle, style]}>
      <Text style={styles.title}>{title}</Text>
      {right}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
  // paddingTop은 동적으로 적용
  paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
  fontSize: typography.title,
    fontWeight: 'bold',
    color: colors.text,
  },
});

export default Header;
