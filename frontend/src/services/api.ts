import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// SecureStore는 선택적 사용(설치 안 된 환경 대비)
// 동적 require로 타입 에러 및 번들 이슈 회피
import Constants from 'expo-constants';

export const RAW_API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3000';

// Nest 전역 prefix('api')와 일치하도록 baseURL을 보정
const API_BASE_URL = `${RAW_API_BASE_URL.replace(/\/+$/, '')}/api`;
export const BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 공통 에러 처리
const logError = (operation: string, error: any) => {
  console.error(`❌ ${operation}:`, {
    status: error.response?.status,
    message: error.response?.data?.message || error.message,
  });
};

// 요청 인터셉터 - JWT 토큰 자동 추가
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('토큰 로드 실패:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 - 토큰 만료 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // body로 refreshToken을 전달(쿠키 미사용 환경 대응)
        let refreshToken: string | null = null;
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const SecureStore: any = require('expo-secure-store');
          refreshToken = (await SecureStore.getItemAsync('refresh_token')) || null;
        } catch {
          // 폴백: AsyncStorage 사용
          refreshToken = (await AsyncStorage.getItem('refresh_token')) || null;
        }
  const response = await apiClient.post('/auth/refresh', refreshToken ? { refreshToken } : undefined);
        const newToken = response.data.accessToken;
        
        await AsyncStorage.setItem('auth_token', newToken);
        
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['auth_token', 'user_info']);
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const SecureStore: any = require('expo-secure-store');
          await SecureStore.deleteItemAsync('refresh_token');
        } catch {
          await AsyncStorage.removeItem('refresh_token');
        }
        console.info('토큰 갱신 실패로 로그아웃');
      }
    }
    
    return Promise.reject(error);
  }
);

// API 서비스 함수들
export const authAPI = {
  getKakaoAuthUrl: async () => {
    const response = await apiClient.get('/auth/kakao');
    return response.data;
  },


  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

};

export const missionAPI = {
  getTodayMission: async () => {
    const response = await apiClient.get('/mission/today');
    return response.data;
  },
};

export const photoAPI = {
  uploadPhoto: async (formData: FormData) => {
    const response = await apiClient.post('/photo/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getMyPhotos: async () => {
    const response = await apiClient.get('/photo/mine');
    return response.data;
  },

  deletePhoto: async (id: string) => {
    const response = await apiClient.delete(`/photo/${id}`);
    return response.data;
  },

  updatePhoto: async (id: string, data: any) => {
    const response = await apiClient.put(`/photo/${id}`, data);
    return response.data;
  },

  markAsShared: async (id: string) => {
    const response = await apiClient.put(`/photo/${id}/share`);
    return response.data;
  },

  getPublicPhotos: async (limit = 20, skip = 0) => {
    const response = await apiClient.get(`/photo/public`, { params: { limit, skip } });
    return response.data;
  },
};

export default apiClient;
