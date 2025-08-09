import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import backendKakaoAuthService from '../services/kakao_api';

interface User {
  id: string;
  nickname: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// 상수 정의
const STORAGE_KEYS = Object.freeze({
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
} as const);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = useCallback(async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_INFO),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.warn('인증 정보 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (newToken: string, newUser: User) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(newUser))
      ]);
      
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.warn('로그인 정보 저장 실패:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const [kakaoLogoutResult] = await Promise.allSettled([
        backendKakaoAuthService.logout(),
        AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO),
      ]);
      
      if (kakaoLogoutResult.status === 'rejected') {
        console.warn('로그아웃 중 일부 오류:', kakaoLogoutResult.reason);
      }
      
      setToken(null);
      setUser(null);
      
    } catch (error) {
      console.error('로그아웃 실패:', error);
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
  }), [user, token, isLoading, login, logout, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
