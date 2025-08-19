import React, { memo, forwardRef } from 'react';
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

export type HeaderProps = ViewProps & {
  /** 앱 로고 이미지 소스 (require(...) or { uri }) */
  logoSource?: ImageSourcePropType;
  /** 로고 눌렀을 때 */
  onLogoPress?: () => void;

  /** 메인 타이틀(중앙 정렬 가능) */
  title?: string;
  /** 서브타이틀(작게, 타이틀 아래) */
  subtitle?: string;

  /** 오른쪽 액션(아이콘 버튼들 등) */
  right?: React.ReactNode;

  /** 레이아웃 커스텀 */
  style?: StyleProp<ViewStyle>;           // 바깥 컨테이너(배경/보더)
  contentStyle?: StyleProp<ViewStyle>;    // 내부 행 레이아웃
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;

  /** 옵션들 */
  centerTitle?: boolean;   // 타이틀 중앙정렬
  showDivider?: boolean;   // 하단 보더
  elevated?: boolean;      // 그림자
  safeTop?: boolean;       // SafeArea top 패딩 적용
};

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
  const topPad = safeTop ? Math.max(tokens.spacing.md, (insets.top || 0) + tokens.spacing.xs) : tokens.spacing.lg;

  return (
    <View
      ref={ref}
      style={[
        styles.container,
        elevated && styles.elevated,
        showDivider && styles.divider,
        { paddingTop: topPad },
        style,
      ]}
      {...rest}
    >
      {/* Android 상태바 아이콘 컬러를 위해 배경 지정 */}
      <StatusBar barStyle="dark-content" backgroundColor={tokens.colors.bg} />

      <View style={[styles.row, contentStyle]}>
        {/* Left: Logo */}
        {logoSource ? (
          <Pressable
            onPress={onLogoPress}
            android_ripple={{ color: tokens.colors.ripple, borderless: true }}
            hitSlop={10}
            style={styles.logoBtn}
            accessibilityRole="button"
            accessibilityLabel="앱 로고"
          >
            <Image source={logoSource} style={styles.logo} resizeMode="contain" />
          </Pressable>
        ) : (
          <View style={styles.logoPlaceholder} />
        )}

        {/* Center: Title */}
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

        {/* Right: Actions */}
        <View style={styles.right}>
          {right}
        </View>
      </View>
    </View>
  );
});

BaseHeader.displayName = 'Header';
export const Header = memo(BaseHeader);

export function HeaderAction({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.actionBtn}
      hitSlop={10}
      android_ripple={{ color: tokens.colors.ripple, borderless: true }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.actionInner}>{children}</View>
    </Pressable>
  );
}

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
    gap: tokens.spacing.sm as unknown as number, // RN 구버전 대응
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
