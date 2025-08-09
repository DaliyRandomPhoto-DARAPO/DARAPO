import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from './theme';

type Props = {
  title: string;
  right?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export const Header: React.FC<Props> = ({ title, right, style }) => {
  return (
    <View style={[styles.header, style]}>
      <Text style={styles.title}>{title}</Text>
      {right}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
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
