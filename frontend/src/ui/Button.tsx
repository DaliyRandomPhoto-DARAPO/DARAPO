import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { colors, spacing, radii, typography } from './theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'outline';
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  loading?: boolean;
};

export const Button: React.FC<Props> = ({ title, onPress, variant = 'primary', disabled, style, loading }) => {
  const isOutline = variant === 'outline';
  const backgroundColor = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : 'transparent';
  const textColor = isOutline ? colors.text : '#fff';
  const borderColor = isOutline ? colors.border : 'transparent';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor, borderColor, opacity: disabled ? 0.6 : 1 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.body,
    fontWeight: '700',
  },
});

export default Button;
