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

  // 딥링크 처리 (백엔드 완전 처리 방식)
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (url.includes('auth/callback')) {
        try {
          const urlObj = new URL(url);
          const success = urlObj.searchParams.get('success');
          const error = urlObj.searchParams.get('error');
          const token = urlObj.searchParams.get('token');
          const userString = urlObj.searchParams.get('user');

          if (error) {
            console.error('OAuth 처리 실패:', error);
            return;
          }

          if (success === 'true' && token && userString) {
            try {
              const user = JSON.parse(decodeURIComponent(userString));
              await login(decodeURIComponent(token), user);
            } catch (parseError) {
              console.error('사용자 정보 파싱 실패:', parseError);
            }
          }
        } catch (error: any) {
          console.error('딥링크 처리 실패:', error);
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
