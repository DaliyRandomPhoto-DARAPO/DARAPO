import React, { useState } from 'react';
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

type LoginScreenNavigationProp = any;

const LoginScreen = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleKakaoLogin = async () => {
    try {
      setLoading(true);
      
      console.log('카카오 로그인 프로세스 시작');
      
      // 실제 카카오 SDK를 통한 로그인
      const { tokens, profile } = await kakaoService.login();
      
      console.log('카카오 로그인 성공, 백엔드 API 호출 시작');
      
      // 백엔드에 카카오 토큰 전송하여 JWT 토큰 받기
      const response = await authAPI.kakaoLogin(tokens.accessToken);
      
      // AuthContext를 통해 로그인 처리
      await login(response.accessToken, response.user);
      
      Alert.alert('로그인 성공', `환영합니다, ${response.user.nickname}님!`);
      
    } catch (error: any) {
      console.error('로그인 실패:', error);
      
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      
      if (error.message) {
        if (error.message.includes('사용자가 취소')) {
          errorMessage = '로그인이 취소되었습니다.';
        } else if (error.message.includes('네트워크')) {
          errorMessage = '네트워크 연결을 확인해주세요.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('로그인 실패', errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 로고 영역 */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>📸</Text>
          </View>
          <Text style={styles.appName}>DARAPO</Text>
          <Text style={styles.appSubtitle}>Daily Random Photo</Text>
          <Text style={styles.description}>
            매일 새로운 미션으로{'\n'}특별한 순간을 기록해보세요
          </Text>
        </View>

        {/* 로그인 버튼 영역 */}
        <View style={styles.loginSection}>
          <TouchableOpacity
            style={[styles.kakaoButton, loading && styles.disabledButton]}
            onPress={handleKakaoLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#3C1E1E" />
            ) : (
              <>
                <View style={styles.kakaoIcon}>
                  <Text style={styles.kakaoIconText}>K</Text>
                </View>
                <Text style={styles.kakaoButtonText}>카카오톡으로 로그인</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            로그인 시 <Text style={styles.linkText}>개인정보처리방침</Text> 및{'\n'}
            <Text style={styles.linkText}>서비스 이용약관</Text>에 동의하게 됩니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 50,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  description: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    lineHeight: 26,
  },
  loginSection: {
    paddingBottom: 20,
  },
  kakaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE500',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  kakaoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3C1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  kakaoIconText: {
    color: '#FEE500',
    fontSize: 14,
    fontWeight: 'bold',
  },
  kakaoButtonText: {
    color: '#3C1E1E',
    fontSize: 16,
    fontWeight: '600',
  },
  guestButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginBottom: 20,
  },
  guestButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
