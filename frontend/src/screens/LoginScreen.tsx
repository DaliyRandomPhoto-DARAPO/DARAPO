import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import backendKakaoAuthService from '../services/kakao_api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
// Local tokens (screen-scoped)
const colors = { background: '#f8f9fa', surface: '#ffffff', text: '#2c3e50', subText: '#7f8c8d' } as const;
const spacing = { xs: 6, sm: 8, md: 12, lg: 16, xl: 24} as const;
const radii = { lg: 20, pill: 999 } as const;
const typography = { title: 28, h2: 20, body: 16, small: 14 } as const;
import KakaoLoginButton from '../ui/KakaoLoginButton';

// 화면 단위 여백 관리 (한 곳에서 조절)
const LAYOUT = {
  sectionGap: spacing.lg,      // 로고영역 ↔ 버튼/약관 섹션 간격(120)
  logoBottom: spacing.sm,      // 로고 카드 하단 여백(8)
  subtitleTop: spacing.xs,     // 앱 서브타이틀 상단 여백(6)
  descTop: spacing.sm,         // 설명문 상단 여백(8)
  termsTop: spacing.md,        // 약관 문구 상단 여백(12)
} as const;

const LoginScreen = React.memo(() => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const handleKakaoLogin = useCallback(async () => {
    if (loading) return; // 중복 실행 방지
    try {
      setLoading(true);
  if (__DEV__) console.log('🔄 백엔드 완전 처리 카카오 로그인 시작');

      const result = await backendKakaoAuthService.login();

      if (result.success && result.accessToken) {
  if (__DEV__) console.log('✅ 로그인 성공, 토큰 수신');
        let resolvedUser = result.user;
        // 콜백에 user가 없을 수 있으므로 /auth/me로 보완
        if (!resolvedUser) {
          try {
            await AsyncStorage.setItem('auth_token', result.accessToken);
            resolvedUser = await authAPI.getCurrentUser();
          } catch (e) {
            console.warn('유저 조회 실패:', e);
          }
        }

        if (resolvedUser) {
          await login(result.accessToken, resolvedUser);
          // 루트 네비게이터는 isAuthenticated에 따라 MainTabs로 교체됨(App.tsx)
          Alert.alert(LOGIN_MESSAGES.LOGIN_SUCCESS_TITLE, `안녕하세요, ${resolvedUser.nickname}님!`);
        } else {
          throw new Error('사용자 정보를 가져오지 못했습니다.');
        }
      } else {
        console.error('❌ 로그인 실패:', result.error);
        Alert.alert(
          LOGIN_MESSAGES.LOGIN_FAILED_TITLE,
          result.error || LOGIN_MESSAGES.DEFAULT_ERROR,
        );
      }
    } catch (error: unknown) {
      const message = ((): string => {
        if (typeof error === 'string') return error;
        if (error && typeof error === 'object' && 'message' in error) {
          // @ts-expect-error safe access
          return error.message || LOGIN_MESSAGES.DEFAULT_ERROR;
        }
        return LOGIN_MESSAGES.DEFAULT_ERROR;
      })();
      console.error('❌ 카카오 로그인 오류:', message);
      const lower = String(message).toLowerCase();
      if (!lower.includes(LOGIN_MESSAGES.CANCEL_KEYWORD)) {
        Alert.alert(LOGIN_MESSAGES.LOGIN_FAILED_TITLE, message);
      }
    } finally {
      setLoading(false);
      backendKakaoAuthService.stopDeepLinkHandling();
    }
  }, [loading, login]);

  const logoSource = require('../../assets/icon.png');
  const containerInsetsStyle = useMemo(
    () => ({
      paddingTop: Math.max(spacing.lg, insets.top + spacing.xs),
      paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.xs),
    }),
    [insets.top, insets.bottom],
  );
  const openPrivacy = useCallback(() => navigation.navigate('Privacy'), [navigation]);
  const openTerms = useCallback(() => navigation.navigate('Terms'), [navigation]);

  return (
  <SafeAreaView style={[styles.container, containerInsetsStyle]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* 로고 & 헤드라인 */}
  {/* 위쪽 스페이서: 로고 블록을 수직 중앙으로 밀기 위한 공간 */}
  <View style={styles.flexSpacer} />

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

  {/* 남는 공간을 차지하여 아래 섹션을 자연스럽게 밀어줌 */}
  <View style={styles.flexSpacer} />

        {/* 액션 영역 */}
        <View style={styles.loginSection}>
          {/* 카카오 공식 스타일 버튼 */}
          <View style={styles.kakaoButtonWrapper}>
            <KakaoLoginButton
              title="카카오로 계속하기"
              onPress={handleKakaoLogin}
              loading={loading}
              fullWidth
              accessibilityLabel="카카오톡으로 로그인"
              testID="kakao-login-button"
            />
          </View>

          {/* 약관 */}
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


// ===== 텍스트/메시지 상수 =====
const STRINGS = {
  APP_NAME: 'DARAPO',
  APP_SUBTITLE: '매일 하나, 랜덤 사진 미션',
  DESCRIPTION:
    '카카오로 로그인하고 오늘의 미션을 받아보세요.\n촬영부터 업로드까지 간편하게 즐길 수 있어요.',
  TERMS_TEXT: '계속 진행하면 ',
  PRIVACY_POLICY: '개인정보처리방침',
  SERVICE_TERMS: '서비스 이용약관',
  TERMS_AGREE: '에 동의한 것으로 간주됩니다.',
} as const;

const LOGIN_MESSAGES = {
  LOGIN_SUCCESS_TITLE: '로그인 완료',
  LOGIN_FAILED_TITLE: '로그인 실패',
  DEFAULT_ERROR: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  // 사용자 취소계열 메시지를 잡기 위한 키워드(영문이 더 자주 반환됨)
  CANCEL_KEYWORD: 'cancel',
} as const;


// ===== 스타일 =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  // 가운데 정렬 대신 상단부터 배치하고, 중간의 flexSpacer로 아래 섹션을 밀어냄
  justifyContent: 'flex-start',
    alignItems: 'center',
  },
  flexSpacer: {
    flexGrow: 1,
  },
  // 상단 로고/헤드라인
  logoSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoContainer: {
    width: 112,
    height: 112,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  marginBottom: LAYOUT.logoBottom,
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  logoImage: { width: 84, height: 84 },
  appName: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
  textAlign: 'center',
  },
  appSubtitle: {
  marginTop: LAYOUT.subtitleTop,
    fontSize: typography.h2,
    color: colors.subText,
    fontWeight: '600',
  textAlign: 'center',
  },
  description: {
  marginTop: LAYOUT.descTop,
    fontSize: typography.body,
    color: colors.subText,
    textAlign: 'center',
    lineHeight: 22,
  },

  // 하단 액션/약관
  loginSection: {
    width: '100%',
    paddingHorizontal: spacing.lg,
  // 섹션 간 간격은 marginTop으로만 제어
  marginTop: LAYOUT.sectionGap,
  },
  kakaoButtonWrapper: {
    // raised button feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderRadius: radii.pill,
  },
  termsText: {
  marginTop: LAYOUT.termsTop,
    color: colors.subText,
    fontSize: typography.small,
    textAlign: 'center',
  },
  linkText: {
    color: colors.text,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});

export default LoginScreen;

