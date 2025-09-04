// src/ui/Button.tsx
import React, { memo, useMemo, useRef, useCallback } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
  GestureResponderEvent,
} from "react-native";

// Local design tokens (light only)
const palette = {
  text: "#2c3e50",
  primary: "#3498db",
  danger: "#e74c3c",
  border: "#e9ecef",
  secondaryBg: "#EEF6FF",
  secondaryBorder: "#D6E9FF",
} as const;

const spacing = { xs: 6, sm: 8, md: 12, lg: 16, xl: 24 } as const;
const radii = { sm: 8, md: 12, lg: 20, pill: 999 } as const;
const typography = { title: 28, h1: 24, h2: 20, body: 16, small: 14 } as const;

type Variant = "primary" | "secondary" | "danger" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

export type ButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  textColor?: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  debounceMs?: number;
  /** 텍스트 폰트 스케일 허용 여부 (TextProps에서 끌어옴) */
  allowFontScaling?: boolean;
};

const SIZE_MAP: Record<
  Size,
  { padV: number; padH: number; font: number; minH: number; gap: number }
> = {
  sm: {
    padV: spacing.sm,
    padH: spacing.md,
    font: typography.small,
    minH: 40,
    gap: 6,
  },
  md: {
    padV: spacing.md,
    padH: spacing.lg,
    font: typography.body,
    minH: 48,
    gap: 8,
  },
  lg: {
    padV: spacing.lg,
    padH: spacing.xl,
    font: typography.h2,
    minH: 56,
    gap: 10,
  },
};

const ELEVATED = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
}) as object;

const ButtonComponent: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  style,
  containerStyle,
  textStyle,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth,
  textColor,
  accessibilityLabel,
  allowFontScaling = true,
  debounceMs = 300,
  hitSlop = { top: 8, bottom: 8, left: 8, right: 8 },
  activeOpacity = 0.8,
  ...rest
}) => {
  const sz = SIZE_MAP[size];

  const { bg, border, fg, spinner } = useMemo(() => {
    const isOutline = variant === "outline";
    const isSecondary = variant === "secondary";
    const isGhost = variant === "ghost";

    const bg = isGhost
      ? "transparent"
      : isOutline
        ? "transparent"
        : isSecondary
          ? palette.secondaryBg
          : variant === "danger"
            ? palette.danger
            : palette.primary;

    const border = isOutline
      ? palette.border
      : isSecondary
        ? palette.secondaryBorder
        : "transparent";

    const fg =
      textColor ??
      (isOutline || isGhost
        ? palette.text
        : isSecondary
          ? palette.primary
          : "#fff");

    const spinner = isOutline || isGhost ? palette.primary : "#fff";

    return { bg, border, fg, spinner };
  }, [variant, textColor]);

  const isDisabled = !!disabled || !!loading;

  // 더블탭 방지 + RN 타입 맞춤 (이벤트 인자 받기)
  const lastPressRef = useRef<number>(0);
  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (!onPress || isDisabled) return;
      const now = Date.now();
      if (now - lastPressRef.current < debounceMs) return;
      lastPressRef.current = now;
      onPress(e);
    },
    [onPress, isDisabled, debounceMs],
  );

  const containerStyles: StyleProp<ViewStyle> = useMemo(
    () => [
      styles.button,
      {
        backgroundColor: bg,
        borderColor: border,
        paddingVertical: sz.padV,
        paddingHorizontal: sz.padH,
        minHeight: sz.minH,
        alignSelf: fullWidth ? "stretch" : "auto",
        opacity: isDisabled ? 0.6 : 1,
      },
      variant === "primary" || variant === "danger" ? styles.elevated : null,
      style,
      containerStyle,
    ],
    [
      bg,
      border,
      sz.padV,
      sz.padH,
      sz.minH,
      fullWidth,
      isDisabled,
      variant,
      style,
      containerStyle,
    ],
  );

  const textStyles: StyleProp<TextStyle> = useMemo(
    () => [styles.title, { color: fg, fontSize: sz.font }, textStyle],
    [fg, sz.font, textStyle],
  );

  return (
    <TouchableOpacity
      {...rest}
      activeOpacity={activeOpacity}
      hitSlop={hitSlop}
      style={containerStyles}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
    >
      {loading ? (
        <ActivityIndicator color={spinner} />
      ) : (
        <View style={[styles.row, { columnGap: sz.gap }]}>
          {leftIcon ? <View style={styles.iconBox}>{leftIcon}</View> : null}
          <Text
            style={textStyles}
            numberOfLines={1}
            allowFontScaling={allowFontScaling}
          >
            {title}
          </Text>
          {rightIcon ? <View style={styles.iconBox}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  elevated: {
    ...ELEVATED,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "700",
    includeFontPadding: false, // Android baseline 정렬
  },
  iconBox: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default memo(ButtonComponent);
