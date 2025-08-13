import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';

// Local tokens
const colors = { surface: '#ffffff' } as const;
const spacing = { lg: 16 } as const;
const radii = { lg: 20 } as const;
const elevation = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;

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
