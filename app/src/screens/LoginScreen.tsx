// src/screens/LoginScreen.tsx
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Alert, StatusBar, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import backendKakaoAuthService from '../services/kakao_api';
import { authAPI } from '../services/api';
import { RootStackParamList } from '../types/navigation';
import KakaoLoginButton from '../ui/KakaoLoginButton';

// ===== 토큰(라이트 고정)
const colors = { background: '#f8f9fa', surface: '#ffffff', text: '#2c3e50', subText: '#7f8c8d' } as const;
const spacing = { xs: 6, sm: 8, md: 12, lg: 16, xl: 24 } as const;
const radii = { lg: 20, pill: 999 } as const;
const typography = { title: 28, h2: 20, body: 16, small: 14 } as const;

// 레이아웃 간격
const LAYOUT = {
  sectionGap: spacing.lg,
  logoBottom: spacing.sm,
  subtitleTop: spacing.xs,
  descTop: spacing.sm,
  termsTop: spacing.md,
} as const;

// 텍스트/메시지
const STRINGS = {
  APP_NAME: 'DARAPO',
  APP_SUBTITLE: '매일 하나, 랜덤 사진 미션',
  DESCRIPTION: '카카오로 로그인하고 오늘의 미션을 받아보세요.\n촬영부터 업로드까지 간편하게 즐길 수 있어요.',
  TERMS_TEXT: '계속 진행하면 ',
  PRIVACY_POLICY: '개인정보처리방침',
  SERVICE_TERMS: '서비스 이용약관',
  TERMS_AGREE: '에 동의한 것으로 간주됩니다.',
} as const;

const LOGIN_MESSAGES = {
  LOGIN_SUCCESS_TITLE: '로그인 완료',
  LOGIN_FAILED_TITLE: '로그인 실패',
  DEFAULT_ERROR: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  CANCEL_KEYWORD: 'cancel',
} as const;

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LoginScreen: React.FC = React.memo(() => {
  const { login } = useAuth();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);

  // 언마운트 후 setState 방지
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // 혹시 남아있을 딥링크 핸들링 정리
      try { backendKakaoAuthService.stopDeepLinkHandling?.(); } catch {}
  try { backendKakaoAuthService.stopDeepLinkHandling?.(); } catch (err) { console.warn('stopDeepLinkHandling error', err); }
    };
  }, []);

  // 더블탭 방지 (추가로 KakaoLoginButton 자체 debounce 있어도 한 번 더 안전망)
  const lastPressRef = useRef(0);
  const canPress = () => {
    const now = Date.now();
    if (now - lastPressRef.current < 450) return false;
    lastPressRef.current = now;
    return true;
  };

  const containerInsetsStyle = useMemo(
    () => ({
      paddingTop: Math.max(spacing.lg, insets.top + spacing.xs),
      paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.xs),
    }),
    [insets.top, insets.bottom]
  );

  const logoSource = useMemo(() => require('../../assets/icon.png'), []);

  const openPrivacy = useCallback(() => navigation.navigate('Privacy'), [navigation]);
  const openTerms = useCallback(() => navigation.navigate('Terms'), [navigation]);

  const safeSetLoading = (v: boolean) => {
    if (isMountedRef.current) setLoading(v);
  };

  const handleKakaoLogin = useCallback(async () => {
    if (loading) return;
    if (!canPress()) return;

    try {
      safeSetLoading(true);

      // 백엔드 연동 포함한 카카오 로그인
      const result: any = await backendKakaoAuthService.login();

      if (result?.success && result?.accessToken) {
        let resolvedUser = result.user;
        if (!resolvedUser) {
          try {
            await AsyncStorage.setItem('auth_token', result.accessToken);
            resolvedUser = await authAPI.getCurrentUser();
          } catch (e) {
            // 유저 조회 실패 시도
          }
        }

        if (resolvedUser) {
          await login(result.accessToken, resolvedUser, result.refreshToken);
          // 루트 네비는 isAuthenticated에 따라 전환(App.tsx)
          Alert.alert(
            LOGIN_MESSAGES.LOGIN_SUCCESS_TITLE,
            `안녕하세요, ${resolvedUser.nickname ?? '회원'}님!`
          );
        } else {
          throw new Error('사용자 정보를 가져오지 못했습니다.');
        }
      } else {
        const errMsg = result?.error || LOGIN_MESSAGES.DEFAULT_ERROR;
        Alert.alert(LOGIN_MESSAGES.LOGIN_FAILED_TITLE, errMsg);
      }
    } catch (error: unknown) {
      const message =
        typeof error === 'string'
          ? error
          : (error && typeof error === 'object' && 'message' in error
              ? 
                (error.message as string)
              : LOGIN_MESSAGES.DEFAULT_ERROR);

      // 사용자가 취소한 케이스는 조용히 무시
      if (!String(message).toLowerCase().includes(LOGIN_MESSAGES.CANCEL_KEYWORD)) {
        Alert.alert(LOGIN_MESSAGES.LOGIN_FAILED_TITLE, message);
      }
    } finally {
      safeSetLoading(false);
    try { backendKakaoAuthService.stopDeepLinkHandling?.(); } catch (err) {  }
    }
  }, [loading, login, navigation]);

  return (
    <SafeAreaView style={[styles.container, containerInsetsStyle]} edges={['top', 'bottom']}>
      {/* 상태바 대비: 라이트 배경에 다크 아이콘 */}
      <StatusBar
        barStyle={Platform.OS === 'android' ? 'light-content' : 'dark-content'}
        backgroundColor={Platform.OS === 'android' ? '#00000000' : colors.background}
        translucent={Platform.OS === 'android'}
      />

      <View style={styles.content}>
        {/* 위쪽 스페이서: 로고 블록을 수직 중앙으로 밀기 */}
        <View style={styles.flexSpacer} />

        {/* 로고 & 헤드라인 */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.appName} accessibilityRole="header">
            {STRINGS.APP_NAME}
          </Text>
          <Text style={styles.appSubtitle}>{STRINGS.APP_SUBTITLE}</Text>
          <Text style={styles.description} maxFontSizeMultiplier={1.2}>
            {STRINGS.DESCRIPTION}
          </Text>
        </View>

        {/* 아래 섹션을 자연스럽게 밀어줌 */}
        <View style={styles.flexSpacer} />

        {/* 액션/약관 */}
        <View style={styles.loginSection}>
          <View style={styles.kakaoButtonWrapper}>
            <KakaoLoginButton
              title="카카오로 계속하기"
              onSuccess={({ token, profile }) => {
                // KakaoLoginButton을 직접 쓸 수도 있는데, 지금은 백엔드 통합 로직(handleKakaoLogin) 유지.
                // 여기선 참고용 로그만.
              }}
              onError={(e) => {}}
              onPress={handleKakaoLogin}
              disableNative={true}
              loading={loading}
              fullWidth
              accessibilityLabel="카카오톡으로 로그인"
              testID="kakao-login-button"
            />
          </View>

          <Text style={styles.termsText} maxFontSizeMultiplier={1.1}>
            {STRINGS.TERMS_TEXT}
            <Text
              style={styles.linkText}
              onPress={openPrivacy}
              accessibilityRole="link"
              accessibilityLabel="개인정보처리방침"
            >
              {STRINGS.PRIVACY_POLICY}
            </Text>
            {' '}및{' '}
            <Text
              style={styles.linkText}
              onPress={openTerms}
              accessibilityRole="link"
              accessibilityLabel="서비스 이용약관"
            >
              {STRINGS.SERVICE_TERMS}
            </Text>
            {` ${STRINGS.TERMS_AGREE}`}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
});


// ===== 스타일 =====
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  flexSpacer: { flexGrow: 1 },

  // 상단 로고/헤드라인
  logoSection: { width: '100%', alignItems: 'center', paddingHorizontal: spacing.lg },
  logoContainer: {
    width: 112, height: 112, borderRadius: radii.lg, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: LAYOUT.logoBottom,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  logoImage: { width: 84, height: 84 },
  appName: {
    fontSize: typography.title, fontWeight: '800', color: colors.text, letterSpacing: 0.3, textAlign: 'center',
  },
  appSubtitle: {
    marginTop: LAYOUT.subtitleTop, fontSize: typography.h2, color: colors.subText, fontWeight: '600', textAlign: 'center',
  },
  description: {
    marginTop: LAYOUT.descTop, fontSize: typography.body, color: colors.subText, textAlign: 'center', lineHeight: 22,
  },

  // 하단 액션/약관
  loginSection: {
    width: '100%', paddingHorizontal: spacing.lg, marginTop: LAYOUT.sectionGap,
  },
  kakaoButtonWrapper: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
    borderRadius: radii.pill,
  },
  termsText: {
    marginTop: LAYOUT.termsTop, color: colors.subText, fontSize: typography.small, textAlign: 'center',
  },
  linkText: {
    color: colors.text, textDecorationLine: 'underline', fontWeight: '600',
  },
});

export default LoginScreen;
