import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';

// Types
import { RootStackParamList } from './src/types/navigation';

// Context
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Services
import { authAPI } from './src/services/api';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import CameraScreen from './src/screens/CameraScreen';
import PhotoUploadScreen from './src/screens/PhotoUploadScreen';
import TabNavigator from './src/navigation/TabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { isAuthenticated, isLoading, login } = useAuth();

    // 딥링크 처리
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('📱 딥링크 수신:', url);
      
      if (url.includes('auth/callback')) {
        try {
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          const error = urlObj.searchParams.get('error');

          if (error) {
            console.error('❌ 카카오 인증 에러:', error);
            // TODO: 에러 알림 표시
            return;
          }

          if (code) {
            console.log('✅ 카카오 인증 코드 수신:', code.substring(0, 10) + '...');
            
            // 백엔드에 인증 코드 전송하여 JWT 토큰 받기
            const response = await authAPI.kakaoCallback(code);
            
            // AuthContext를 통해 로그인 처리
            await login(response.accessToken, response.user);
            
            console.log('🎉 로그인 완료, 홈 화면으로 이동');
          }
        } catch (error: any) {
          console.error('❌ 딥링크 처리 실패:', error);
        }
      }
    };

    // 앱이 시작될 때 URL 확인
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // 앱이 실행 중일 때 딥링크 처리
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => subscription?.remove();
  }, [login]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isAuthenticated ? "MainTabs" : "Login"}>
        {!isAuthenticated ? (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={TabNavigator} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Camera" 
              component={CameraScreen} 
              options={{ title: '사진 촬영' }}
            />
            <Stack.Screen 
              name="PhotoUpload" 
              component={PhotoUploadScreen} 
              options={{ title: '사진 업로드' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <Toast />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});
