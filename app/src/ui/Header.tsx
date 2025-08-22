import React, { memo, forwardRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Platform,
  StatusBar,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
  type ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const tokens = {
  colors: {
    bg: '#ffffff',
    text: '#1f2937',
    subText: '#6b7280',
    border: '#e5e7eb',
    ripple: 'rgba(0,0,0,0.08)',
  },
  spacing: { xs: 6, sm: 8, md: 12, lg: 16, xl: 20 },
  radius: { lg: 20 },
  sizes: { logo: 28, action: 36 },
  fonts: { title: 20, subtitle: 12 },
} as const;

const elevation = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: { elevation: 6 },
  default: {},
}) as object;

// ===== 고정 객체(렌더마다 새로 안 만듦)
const RIPPLE = Object.freeze({ color: tokens.colors.ripple, borderless: true } as const);
const HIT_SLOP_10 = 10 as const;

// ===== Props
export type HeaderProps = ViewProps & {
  logoSource?: ImageSourcePropType;
  onLogoPress?: () => void;

  title?: string;
  subtitle?: string;

  right?: React.ReactNode;

  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;

  centerTitle?: boolean;
  showDivider?: boolean;
  elevated?: boolean;
  safeTop?: boolean;
};

// ====== Sub Components (memo)
const LogoArea = memo(function LogoArea({
  logoSource,
  onLogoPress,
}: {
  logoSource?: ImageSourcePropType;
  onLogoPress?: () => void;
}) {
  if (!logoSource) return <View style={styles.logoPlaceholder} />;
  return (
    <Pressable
      onPress={onLogoPress}
      android_ripple={RIPPLE}
      hitSlop={HIT_SLOP_10}
      style={styles.logoBtn}
      accessibilityRole="button"
      accessibilityLabel="앱 로고"
    >
      <Image source={logoSource} style={styles.logo} resizeMode="contain" />
    </Pressable>
  );
});

const TitleArea = memo(function TitleArea({
  title,
  subtitle,
  centerTitle,
  titleStyle,
  subtitleStyle,
}: {
  title?: string;
  subtitle?: string;
  centerTitle?: boolean;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={[styles.center, centerTitle && styles.centerTitle]}>
      {title ? (
        <Text style={[styles.title, titleStyle]} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
});

const RightArea = memo(function RightArea({ right }: { right?: React.ReactNode }) {
  // gap 호환 위해 children 사이 간격 수동 처리 권장하지만,
  // 여기서는 최신 RN 전제하에 유지. 필요한 경우 마진으로 바꿔.
  return <View style={styles.right}>{right}</View>;
});

// ====== Header
const BaseHeader = forwardRef<View, HeaderProps>((props, ref) => {
  const {
    logoSource,
    onLogoPress,
    title,
    subtitle,
    right,
    style,
    contentStyle,
    titleStyle,
    subtitleStyle,
    centerTitle = false,
    showDivider = true,
    elevated = true,
    safeTop = true,
    ...rest
  } = props;

  const insets = useSafeAreaInsets();

  // 재계산 줄이기
  const topPad = useMemo(() => {
    return safeTop ? Math.max(tokens.spacing.md, (insets.top || 0) + tokens.spacing.xs) : tokens.spacing.lg;
  }, [insets.top, safeTop]);

  const containerStyle = useMemo(
    () => [
      styles.container,
      elevated && styles.elevated,
      showDivider && styles.divider,
      { paddingTop: topPad },
      style,
    ],
    [elevated, showDivider, topPad, style]
  );

  const rowStyle = useMemo(() => [styles.row, contentStyle], [contentStyle]);

  return (
    <View ref={ref} style={containerStyle} {...rest}>
      {/* 상태바 설정(안드로이드 배경 포함) */}
      <StatusBar barStyle="dark-content" backgroundColor={tokens.colors.bg} />

      <View style={rowStyle}>
        <LogoArea logoSource={logoSource} onLogoPress={onLogoPress} />
        <TitleArea
          title={title}
          subtitle={subtitle}
          centerTitle={centerTitle}
          titleStyle={titleStyle}
          subtitleStyle={subtitleStyle}
        />
        <RightArea right={right} />
      </View>
    </View>
  );
});

BaseHeader.displayName = 'Header';

// props 얕은 비교(스타일/노드는 ref 동일성만 체크)
function areEqual(prev: HeaderProps, next: HeaderProps) {
  return (
    prev.logoSource === next.logoSource &&
    prev.onLogoPress === next.onLogoPress &&
    prev.title === next.title &&
    prev.subtitle === next.subtitle &&
    prev.right === next.right &&
    prev.style === next.style &&
    prev.contentStyle === next.contentStyle &&
    prev.titleStyle === next.titleStyle &&
    prev.subtitleStyle === next.subtitleStyle &&
    prev.centerTitle === next.centerTitle &&
    prev.showDivider === next.showDivider &&
    prev.elevated === next.elevated &&
    prev.safeTop === next.safeTop
  );
}

export const Header = memo(BaseHeader, areEqual);

// ===== HeaderAction (memo + 고정 객체 사용)
const _HeaderAction = ({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={styles.actionBtn}
      hitSlop={HIT_SLOP_10}
      android_ripple={RIPPLE}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.actionInner}>{children}</View>
    </Pressable>
  );
};
export const HeaderAction = memo(_HeaderAction);

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.bg,
  },
  elevated: {
    ...elevation,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
  },
  row: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBtn: {
    width: tokens.sizes.action,
    height: tokens.sizes.action,
    borderRadius: tokens.sizes.action / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
    overflow: 'hidden',
  },
  logoPlaceholder: {
    width: tokens.sizes.action,
    height: tokens.sizes.action,
    marginRight: tokens.spacing.md,
  },
  logo: {
    width: tokens.sizes.logo,
    height: tokens.sizes.logo,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  centerTitle: {
    alignItems: 'center',
  },
  title: {
    fontSize: tokens.fonts.title,
    fontWeight: '800',
    color: tokens.colors.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: tokens.fonts.subtitle,
    color: tokens.colors.subText,
  },
  right: {
    marginLeft: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm as unknown as number,
  },
  actionBtn: {
    width: tokens.sizes.action,
    height: tokens.sizes.action,
    borderRadius: tokens.sizes.action / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  actionInner: {
    padding: 6,
  },
});

export default Header;
