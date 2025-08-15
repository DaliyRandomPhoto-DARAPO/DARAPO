import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';

// Local design tokens (simple)
const colors = {
  text: '#2c3e50',
  primary: '#3498db',
  danger: '#e74c3c',
  border: '#e9ecef',
};
const spacing = { xs: 6, sm: 8, md: 12, lg: 16, xl: 24 } as const;
const radii = { sm: 8, md: 12, lg: 20, pill: 999 } as const;
const typography = { title: 28, h1: 24, h2: 20, body: 16, small: 14 } as const;

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  textColor?: string;
  accessibilityLabel?: string;
  testID?: string;
};

const sizeMap = {
  sm: { padV: spacing.sm, padH: spacing.md, font: typography.small, minH: 40 },
  md: { padV: spacing.md, padH: spacing.lg, font: typography.body, minH: 48 },
  lg: { padV: spacing.lg, padH: spacing.xl, font: typography.h2, minH: 56 },
} as const;

export const Button: React.FC<Props> = React.memo(({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  style,
  loading,
  leftIcon,
  rightIcon,
  fullWidth,
  textColor,
  accessibilityLabel,
  testID,
}) => {
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';
  const backgroundColor = isOutline
    ? 'transparent'
    : isSecondary
      ? '#EEF6FF'
      : variant === 'danger'
        ? colors.danger
        : colors.primary;
  const computedTextColor = textColor ?? (isOutline ? colors.text : isSecondary ? colors.primary : '#fff');
  const borderColor = isOutline ? colors.border : isSecondary ? '#D6E9FF' : 'transparent';
  const dims = sizeMap[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
          opacity: disabled ? 0.6 : 1,
          paddingVertical: dims.padV,
          paddingHorizontal: dims.padH,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          minHeight: dims.minH,
        },
  (variant === 'primary' || variant === 'danger') ? styles.elevated : null,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={computedTextColor} />
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={[styles.iconBox, { marginRight: spacing.sm }]}>{leftIcon}</View> : null}
          <Text style={[styles.title, { color: computedTextColor, fontSize: dims.font }]}>{title}</Text>
          {rightIcon ? <View style={[styles.iconBox, { marginLeft: spacing.sm }]}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elevated: {
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // Android elevation
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  iconBox: { alignItems: 'center', justifyContent: 'center' },
});

export default Button;
