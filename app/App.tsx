import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  BackHandler,
  Platform,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Types
import { RootStackParamList } from "./src/types/navigation";

// Context
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";

// Components
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { UpdateChecker } from "./src/components/UpdateChecker";

// Services (none used here)

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import CameraScreen from "./src/screens/CameraScreen";
import PhotoUploadScreen from "./src/screens/PhotoUploadScreen";
import TabNavigator from "./src/navigation/TabNavigator";
import TermsScreen from "./src/screens/TermsScreen";
import PrivacyScreen from "./src/screens/PrivacyScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import MyPhotosScreen from "./src/screens/MyPhotosScreen";
import ProfileEditScreen from "./src/screens/ProfileEditScreen";
import PhotoSettingsScreen from "./src/screens/PhotoSettingsScreen";

const AuthStack = createNativeStackNavigator<RootStackParamList>();
const AppStack = createNativeStackNavigator<RootStackParamList>();

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator initialRouteName="Login">
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{ headerShown: false }}
      />
    </AuthStack.Navigator>
  );
}

function MainAppNavigator() {
  return (
    <AppStack.Navigator initialRouteName="MainTabs">
      <AppStack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ title: "사진 촬영" }}
      />
      <AppStack.Screen
        name="PhotoUpload"
        component={PhotoUploadScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="MyPhotos"
        component={MyPhotosScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="PhotoSettings"
        component={PhotoSettingsScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{ headerShown: false }}
      />
    </AppStack.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const navRef = useNavigationContainerRef();
  const lastBackPressRef = useRef<number>(0);
  const exitingRef = useRef<boolean>(false);
  const resetGuardRef = useRef<boolean>(false);

  const handleHardwareBackPress = useCallback(() => {
    if (!navRef.isReady()) return false;
    const state = navRef.getRootState();
    if (!state) return false;
    const current = state.routes[state.index];
    // 인증 상태인데 현재 루트가 Login이면 메인으로 리셋
    if (isAuthenticated && current?.name === "Login") {
      // @ts-ignore
      navRef.resetRoot({ index: 0, routes: [{ name: "MainTabs" }] });
      return true;
    }
    if (current?.name === "MainTabs") {
      // 탭 내 현재 활성 탭 확인
      const tabState: any = (current as any).state;
      const currentTab = tabState?.routes?.[tabState.index]?.name ?? "Home";
      if (currentTab === "Home") {
        // 두 번 누르면 종료
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          exitingRef.current = true;
          BackHandler.exitApp();
          // 개발/Expo 환경에서 종료가 지연될 수 있어 타임아웃으로 플래그 해제
          setTimeout(() => {
            exitingRef.current = false;
          }, 3000);
        } else {
          lastBackPressRef.current = now;
          Toast.show({ type: "info", text1: "한 번 더 누르면 종료됩니다" });
        }
        return true;
      }
      // 다른 탭이면 홈으로 이동
      // @ts-ignore - nested navigate
      navRef.navigate("MainTabs", { screen: "Home" });
      return true;
    }
    // 기본 뒤로가기
    return false;
  }, [navRef, isAuthenticated]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      handleHardwareBackPress,
    );
    return () => sub.remove();
  }, [handleHardwareBackPress]);

  // 인증 상태 변화 시 루트 네비게이션을 리셋해 히스토리를 제거
  // 이전 네비게이션 상태가 남지 않도록 인증 상태가 바뀌면 내비게이터를 재마운트합니다.

  // 딥링크 처리는 backendKakaoAuthService에서 중앙 집중 처리

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navRef}
      key={isAuthenticated ? "app" : "auth"}
      onStateChange={() => {
        if (!navRef.isReady()) return;
        if (!isAuthenticated) return;
        const state = navRef.getRootState();
        const current = state?.routes?.[state.index];
        if (current?.name === "Login" && !resetGuardRef.current) {
          resetGuardRef.current = true;
          // @ts-ignore
          navRef.resetRoot({ index: 0, routes: [{ name: "MainTabs" }] });
          setTimeout(() => {
            resetGuardRef.current = false;
          }, 250);
        }
      }}
    >
      {isAuthenticated || exitingRef.current ? (
        <MainAppNavigator />
      ) : (
        <AuthStackNavigator />
      )}
    </NavigationContainer>
  );
}

SplashScreen.preventAutoHideAsync();

export default function App() {
  // 강제 업데이트 로직 제거됨 (백엔드 app-version 엔드포인트 삭제)

  // React Query 클라이언트 생성 - 최적화된 설정
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5분
        gcTime: 10 * 60 * 1000, // 10분 (이전 cacheTime)
        retry: (failureCount, error: any) => {
          // 401 에러는 재시도하지 않음
          if (error?.response?.status === 401) return false;
          // 네트워크 에러는 2번까지 재시도
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
        // 네트워크가 느릴 때 로딩 상태 유지
        networkMode: "online",
      },
      mutations: {
        retry: 1,
        networkMode: "online",
      },
    },
  });
  useEffect(() => {
    // 3초간 스플래시 유지
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <UpdateChecker />
            <AppNavigator />
            <Toast />
            <StatusBar style="auto" />
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});
