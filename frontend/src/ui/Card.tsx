import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radii, elevation } from './theme';

type Props = {
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
};

export const Card: React.FC<Props> = ({ style, children }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.lg,
    ...(elevation.card as object),
  },
});

export default Card;
