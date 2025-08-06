import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// iOS 시뮬레이터에서 localhost 접근을 위해 IP 주소 사용
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.45.191:3000/api'  // 개발 환경 - 실제 IP 주소 사용
  : 'https://your-production-api.com/api';  // 프로덕션 환경

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
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

// 응답 인터셉터 - 토큰 만료 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 또는 인증 실패
      await AsyncStorage.removeItem('auth_token');
      // TODO: 로그인 화면으로 리다이렉트
    }
    return Promise.reject(error);
  }
);

// API 서비스 함수들
export const authAPI = {
  // 카카오 로그인
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
