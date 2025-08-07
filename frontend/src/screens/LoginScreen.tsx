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
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
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
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 40,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#34495e',
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
    backgroundColor: '#FEE500',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#FEE500',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  kakaoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3C1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kakaoIconText: {
    color: '#FEE500',
    fontSize: 16,
    fontWeight: 'bold',
  },
  kakaoButtonText: {
    color: '#3C1E1E',
    fontSize: 18,
    fontWeight: '700',
  },
  guestButton: {
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e0e6ed',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#ffffff',
  },
  guestButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 13,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  linkText: {
    color: '#3498db',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});

export default LoginScreen;
