import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { kakaoService } from '../services/kakaoService';

// 성능 최적화를 위한 상수 정의
const LOGIN_MESSAGES = Object.freeze({
  START: '카카오 로그인 프로세스 시작',
  SUCCESS_BACKEND: '카카오 로그인 성공, 백엔드 API 호출 시작',
  LOGIN_SUCCESS_TITLE: '로그인 성공',
  LOGIN_FAILED_TITLE: '로그인 실패',
  DEFAULT_ERROR: '로그인 중 오류가 발생했습니다.',
  CANCEL_KEYWORD: '취소',
});

const STRINGS = Object.freeze({
  APP_NAME: 'DARAPO',
  APP_SUBTITLE: 'Daily Random Photo',
  DESCRIPTION: '매일 새로운 미션으로\n특별한 순간을 기록해보세요',
  KAKAO_LOGIN: '카카오톡으로 로그인',
  TERMS_TEXT: '로그인 시 ',
  PRIVACY_POLICY: '개인정보처리방침',
  SERVICE_TERMS: '서비스 이용약관',
  TERMS_AGREE: '에 동의하게 됩니다.',
});

const LoginScreen = React.memo(() => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleKakaoLogin = useCallback(async () => {
    if (loading) return; // 중복 실행 방지
    
    try {
      setLoading(true);
      
      console.log(LOGIN_MESSAGES.START);
      
      // 실제 카카오 SDK를 통한 로그인
      const { tokens, profile } = await kakaoService.login();
      
      console.log(LOGIN_MESSAGES.SUCCESS_BACKEND);
      
      // 백엔드에 카카오 토큰 전송하여 JWT 토큰 받기
      const response = await authAPI.kakaoLogin(tokens.accessToken);
      
      // AuthContext를 통해 로그인 처리
      await login(response.accessToken, response.user);
      
      Alert.alert(
        LOGIN_MESSAGES.LOGIN_SUCCESS_TITLE, 
        `환영합니다, ${response.user.nickname}님!`
      );
      
    } catch (error: any) {
      console.error('로그인 실패:', error);
      
      const errorMessage = error.message || LOGIN_MESSAGES.DEFAULT_ERROR;
      
      // 취소된 경우는 알림을 표시하지 않음 (사용자 의도)
      if (!errorMessage.includes(LOGIN_MESSAGES.CANCEL_KEYWORD)) {
        Alert.alert(LOGIN_MESSAGES.LOGIN_FAILED_TITLE, errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, login]);

  // 성능 최적화: 버튼 스타일 메모이제이션
  const kakaoButtonStyle = useMemo(() => [
    styles.kakaoButton,
    loading && styles.disabledButton
  ], [loading]);

  // 성능 최적화: 로고 이미지 소스 메모이제이션
  const logoSource = useMemo(() => require('../../assets/icon.png'), []);

  // 성능 최적화: 로딩 컴포넌트 메모이제이션
  const renderLoadingContent = useCallback(() => (
    <ActivityIndicator size="small" color="#3C1E1E" />
  ), []);

  // 성능 최적화: 카카오 버튼 아이콘 메모이제이션
  const renderKakaoIcon = useCallback(() => (
    <>
      <View style={styles.kakaoIcon}>
        <Text style={styles.kakaoIconText}>K</Text>
      </View>
      <Text style={styles.kakaoButtonText}>{STRINGS.KAKAO_LOGIN}</Text>
    </>
  ), []);


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 로고 영역 */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={logoSource}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>{STRINGS.APP_NAME}</Text>
          <Text style={styles.appSubtitle}>{STRINGS.APP_SUBTITLE}</Text>
          <Text style={styles.description}>
            {STRINGS.DESCRIPTION}
          </Text>
        </View>

        {/* 로그인 버튼 영역 */}
        <View style={styles.loginSection}>
          <TouchableOpacity
            style={kakaoButtonStyle}
            onPress={handleKakaoLogin}
            disabled={loading}
          >
            {loading ? renderLoadingContent() : renderKakaoIcon()}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            {STRINGS.TERMS_TEXT}<Text style={styles.linkText}>{STRINGS.PRIVACY_POLICY}</Text> 및{'\n'}
            <Text style={styles.linkText}>{STRINGS.SERVICE_TERMS}</Text>{STRINGS.TERMS_AGREE}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
});

// 성능 최적화: StyleSheet 메모이제이션 및 상수화
const SHADOW_CONFIG = Object.freeze({
  color: '#000',
  offset: { width: 0, height: 4 },
  opacity: 0.1,
  radius: 12,
  elevation: 8,
});

const KAKAO_SHADOW_CONFIG = Object.freeze({
  color: '#FEE500',
  offset: { width: 0, height: 2 },
  opacity: 0.3,
  radius: 8,
  elevation: 4,
});

const COLORS = Object.freeze({
  background: '#f8f9fa',
  white: '#ffffff',
  primary: '#2c3e50',
  secondary: '#7f8c8d',
  text: '#34495e',
  kakaoMain: '#FEE500',
  kakaoText: '#3C1E1E',
  border: '#e0e6ed',
  muted: '#95a5a6',
  link: '#3498db',
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: SHADOW_CONFIG.color,
    shadowOffset: SHADOW_CONFIG.offset,
    shadowOpacity: SHADOW_CONFIG.opacity,
    shadowRadius: SHADOW_CONFIG.radius,
    elevation: SHADOW_CONFIG.elevation,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 18,
    color: COLORS.secondary,
    marginBottom: 40,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  loginSection: {
    paddingBottom: 30,
  },
  kakaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.kakaoMain,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: KAKAO_SHADOW_CONFIG.color,
    shadowOffset: KAKAO_SHADOW_CONFIG.offset,
    shadowOpacity: KAKAO_SHADOW_CONFIG.opacity,
    shadowRadius: KAKAO_SHADOW_CONFIG.radius,
    elevation: KAKAO_SHADOW_CONFIG.elevation,
  },
  disabledButton: {
    opacity: 0.6,
  },
  kakaoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.kakaoText,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kakaoIconText: {
    color: COLORS.kakaoMain,
    fontSize: 16,
    fontWeight: 'bold',
  },
  kakaoButtonText: {
    color: COLORS.kakaoText,
    fontSize: 18,
    fontWeight: '700',
  },
  guestButton: {
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: COLORS.white,
  },
  guestButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  linkText: {
    color: COLORS.link,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});

// 성능 최적화: displayName 설정
LoginScreen.displayName = 'LoginScreen';

export default LoginScreen;
