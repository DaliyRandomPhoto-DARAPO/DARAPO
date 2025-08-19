import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  type ViewStyle,
  type GestureResponderEvent,
} from 'react-native';
import KakaoLogin, { getProfile as kakaoGetProfile, type KakaoOAuthToken } from '@react-native-seoul/kakao-login';

type Props = {
  title?: string;
  style?: ViewStyle | ViewStyle[];
  fullWidth?: boolean;
  disabled?: boolean;
  /** 외부에서 로딩 제어하고 싶으면 넣고, 안 넣으면 내부에서 관리 */
  loading?: boolean;
  /** 로그인 성공 시 콜백 (토큰/프로필 반환) */
  onSuccess?: (payload: { token: KakaoOAuthToken; profile?: any }) => void;
  /** 실패/취소 콜백 */
  onError?: (err: unknown) => void;
  /** 누르면 뭐 하냐고? 로그인한다 */
  onPress?: (e: GestureResponderEvent) => void; // 필요하면 가로채서 로깅 같은 거 하라고 열어둠
  accessibilityLabel?: string;
  testID?: string;
  /** 아이콘 커스텀(공식 심볼 png 추천) */
  iconSource?: any; // require(...) | { uri }
};

const KAKAO_YELLOW = '#FEE500';
const KAKAO_BLACK = '#000000';

// 기본 아이콘 경로 (없으면 말풍선 대신 'K' 글자로 fallback)
const DEFAULT_ICON = require('../../assets/kakao_symbol.png');

const KakaoLoginButton: React.FC<Props> = ({
  title = '카카오로 로그인',
  style,
  fullWidth = true,
  disabled,
  loading,
  onSuccess,
  onError,
  onPress,
  accessibilityLabel,
  testID,
  iconSource = DEFAULT_ICON,
}) => {
  const [innerLoading, setInnerLoading] = useState(false);
  const isBusy = loading ?? innerLoading;

  const handleLogin = useCallback(
    async (e: GestureResponderEvent) => {
      onPress?.(e);
      if (disabled || isBusy) return;

      try {
        setInnerLoading(true);
        // 1) 카카오 로그인 (앱 -> 웹 자동 폴백)
        const token = await KakaoLogin.login(); // KakaoOAuthToken
        // 2) 프로필(선택) — 필요 없으면 이 줄 지워
        let profile: any | undefined;
        try {
          profile = await kakaoGetProfile();
        } catch {
          // 개인정보 권한/정책에 따라 실패 가능. 무시해도 됨.
        }
        onSuccess?.({ token, profile });
      } catch (err) {
        // 사용자가 취소했거나 설정 누락 등
        onError?.(err);
      } finally {
        setInnerLoading(false);
      }
    },
    [disabled, isBusy, onPress, onSuccess, onError]
  );

  const containerStyle = useMemo<ViewStyle[]>(
    () => [
      styles.button,
      { alignSelf: fullWidth ? 'stretch' : 'auto', opacity: disabled ? 0.65 : 1 },
      style as any,
    ],
    [fullWidth, disabled, style]
  );

  return (
    <TouchableOpacity
      onPress={handleLogin}
      disabled={disabled || isBusy}
      activeOpacity={0.9}
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !!disabled, busy: !!isBusy }}
      testID={testID}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {isBusy ? (
        <ActivityIndicator color={KAKAO_BLACK} />
      ) : (
        <View style={styles.row}>
          {iconSource ? (
            <Image source={iconSource} style={styles.symbolImg} resizeMode="contain" />
          ) : (
            <View style={styles.symbolFallback}><Text style={styles.symbolText}>K</Text></View>
          )}
          <Text style={styles.title} numberOfLines={1} allowFontScaling>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: KAKAO_YELLOW,
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  symbolImg: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  symbolFallback: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  symbolText: { color: KAKAO_BLACK, fontWeight: '800' },
  title: { color: KAKAO_BLACK, fontSize: 17, fontWeight: '700' },
});

export default memo(KakaoLoginButton);
