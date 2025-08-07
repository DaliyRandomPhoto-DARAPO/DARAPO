import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// 환경변수에서 API URL 가져오기 (보안 개선)
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 
                     process.env.EXPO_PUBLIC_API_URL || 
                     'http://localhost:3000';

console.log('🔗 API Base URL:', API_BASE_URL);

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL, // 환경변수에 이미 /api가 포함되어 있음
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - JWT 토큰 자동 추가
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('토큰 가져오기 실패:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리 및 자동 갱신
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 토큰 갱신 시도
        const response = await apiClient.post('/auth/refresh');
        const newToken = response.data.accessToken;
        
        // 새 토큰을 AsyncStorage에 저장
        await AsyncStorage.setItem('auth_token', newToken);
        
        // 헤더 업데이트
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        // 원래 요청 재시도
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃 처리
        await AsyncStorage.multiRemove(['auth_token', 'user_info']);
        console.log('토큰 갱신 실패, 로그아웃 처리됨');
        // TODO: 로그인 화면으로 리다이렉트
      }
    }
    
    return Promise.reject(error);
  }
);

// API 서비스 함수들
export const authAPI = {
  // 카카오 OAuth 인증 URL 획득
  getKakaoAuthUrl: async () => {
    console.log('🔗 요청 URL:', `${API_BASE_URL}/auth/kakao`);
    const response = await apiClient.get('/auth/kakao');
    return response.data;
  },

  // 카카오 OAuth 콜백 처리 (인증 코드 -> JWT 토큰)
  kakaoCallback: async (code: string, state?: string) => {
    const response = await apiClient.post('/auth/kakao/callback', {
      code,
      state,
    });
    return response.data;
  },

  // 로그아웃 (서버에서 토큰 무효화)
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // 토큰 갱신
  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // 계정 삭제 (카카오 연결 해제 포함)
  deleteAccount: async () => {
    const response = await apiClient.delete('/auth/account');
    return response.data;
  },

  // 레거시 카카오 로그인 (제거 예정)
  kakaoLogin: async (kakaoToken: string) => {
    const response = await apiClient.post('/auth/kakao-login', {
      kakaoToken,
    });
    return response.data;
  },
};

export const missionAPI = {
  // 오늘의 미션 조회
  getTodayMission: async () => {
    const response = await apiClient.get('/mission/today');
    return response.data;
  },
};

export const photoAPI = {
  // 사진 업로드
  uploadPhoto: async (formData: FormData) => {
    const response = await apiClient.post('/photo/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 내 사진 목록 조회
  getMyPhotos: async () => {
    const response = await apiClient.get('/photo/mine');
    return response.data;
  },
};

export default apiClient;
