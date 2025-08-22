import React, { forwardRef, memo } from 'react';
import { View, StyleSheet, Platform, type ViewProps, type StyleProp, type ViewStyle } from 'react-native';

const tokens = {
  surface: '#ffffff',
  padding: 16,
  radius: 20,
} as const;

const elevation = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  android: { elevation: 6 },
  default: {},
}) as object;

export type CardProps = ViewProps & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const BaseCard = forwardRef<View, CardProps>(({ style, children, ...rest }, ref) => {
  return (
    <View ref={ref} style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
});

BaseCard.displayName = 'Card';

export const Card = memo(BaseCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.surface,
    padding: tokens.padding,
    borderRadius: tokens.radius,
    ...elevation,
  },
});

export default Card;
