import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import backendKakaoAuthService from '../services/kakao_api';
import apiClient, { authAPI, setAuthFailureHandler } from '../services/api';

interface User {
  id: string;
  name?: string;
  nickname: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateProfile: (partial: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// 상수 정의
const STORAGE_KEYS = Object.freeze({
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  REFRESH_TOKEN: 'refresh_token',
} as const);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
    // 토큰 갱신 실패 등 전역 인증 오류 시 자동 로그아웃 처리
    setAuthFailureHandler(() => {
      // 안전하게 비동기로 처리
      (async () => {
        try {
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.USER_INFO,
            STORAGE_KEYS.REFRESH_TOKEN,
          ]);
        } catch (err) {
          console.warn('failed to clear storage on auth failure', err);
        }
        setToken(null);
        setUser(null);
      })();
    });
    return () => setAuthFailureHandler(null);
  }, []);

  const loadStoredAuth = useCallback(async () => {
    try {
      const [storedToken, storedUser, storedRefresh] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_INFO),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      // 1) 토큰 + 유저 정보가 모두 있으면 즉시 복원
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        return;
      }

      // 2) 토큰만 있거나 유저 정보가 없으면 /auth/me로 유저 조회 시도
      if (storedToken && !storedUser) {
        try {
          const me = await authAPI.getCurrentUser();
          setToken(storedToken);
          setUser(me);
          try { await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(me)); } catch (err) { console.warn('failed to persist user info', err); }
          return;
        } catch (e) {
          // accessToken 만료 가능성 → 아래 refresh 흐름으로 폴백
          console.warn('failed to get current user with stored token', e);
        }
      }

      // 3) accessToken이 없고 refreshToken이 있으면 재발급 시도
      if (!storedToken && storedRefresh) {
        try {
          const resp = await apiClient.post('/auth/refresh', { refreshToken: storedRefresh });
          const newToken: string = resp.data.accessToken;

          // 토큰 저장 및 유저 정보 조회
          try { await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken); } catch (err) { console.warn('failed to persist new token', err); }
          setToken(newToken);

          const me = await authAPI.getCurrentUser();
          setUser(me);
          try { await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(me)); } catch (err) { console.warn('failed to persist user info', err); }
          return;
        } catch (e) {
          // 재발급 실패 → 스토리지 정리
          try { await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_INFO]); } catch (remErr) { console.warn('failed to clear storage after refresh failure', remErr); }
        }
      }
    } catch (error) {
      console.warn('인증 정보 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (newToken: string, newUser: User, refreshToken?: string) => {
    try {
      const promises = [
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(newUser))
      ];
      
      if (refreshToken) {
        promises.push(AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken));
      }
      
      await Promise.all(promises).catch((e) => console.warn('partial persistence failure on login', e));
      
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.warn('로그인 처리 중 오류:', error);
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (partial: Partial<User>) => {
    setUser((prev) => {
      const next = { ...prev, ...partial } as User;
      AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(next)).catch((e) => console.warn('failed to persist updated profile', e));
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      const [kakaoLogoutResult] = await Promise.allSettled([
        backendKakaoAuthService.logout(),
        AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);
      
      if (kakaoLogoutResult.status === 'rejected') {
        console.warn('로그아웃 중 일부 오류:', kakaoLogoutResult.reason);
      }
      
      setToken(null);
      setUser(null);
      
    } catch (error) {
      console.error('로그아웃 처리 오류:', error);
      setToken(null);
      setUser(null);
    }
  }, []);

  // 성능 최적화: isAuthenticated 메모이제이션
  const isAuthenticated = useMemo(() => !!(user && token), [user, token]);

  // 성능 최적화: value 객체 메모이제이션
  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated,
    updateProfile,
  }), [user, token, isLoading, login, logout, isAuthenticated, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
