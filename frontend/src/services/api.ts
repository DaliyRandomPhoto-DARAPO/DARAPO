import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// SecureStore는 선택적 사용(설치 안 된 환경 대비)
// 동적 require로 타입 에러 및 번들 이슈 회피
import Constants from 'expo-constants';

// 환경에서 받은 값의 트레일링 슬래시 제거 + 안전한 기본값 적용
const configuredApi = (Constants.expoConfig?.extra?.apiUrl as string | undefined) || '';
const DEFAULT_API = 'https://api.darapo.site';
export const RAW_API_BASE_URL = (
  configuredApi && !/localhost|127\.0\.0\.1/i.test(configuredApi)
    ? configuredApi
    : DEFAULT_API
).replace(/\/+$/, '');

// Nest 전역 prefix('api') 중복 방지: 이미 /api로 끝나면 그대로, 아니면 /api 추가
const API_BASE_URL = /\/api$/.test(RAW_API_BASE_URL)
  ? RAW_API_BASE_URL
  : `${RAW_API_BASE_URL}/api`;

// 호스트 베이스 URL (필요 시 사용) - 만약 /api가 붙어있다면 제거
export const BASE_URL = RAW_API_BASE_URL.replace(/\/api$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 런타임 로그로 실제 API 엔드포인트 확인(문제 상황 진단 용이)
try {
  // eslint-disable-next-line no-console
  console.info(`API base: ${API_BASE_URL}`);
  if (!configuredApi || /localhost|127\.0\.0\.1/i.test(configuredApi)) {
    // eslint-disable-next-line no-console
    console.warn('EXPO_PUBLIC_API_URL 미설정 또는 localhost 감지 → 기본값으로 대체됨:', DEFAULT_API);
  }
} catch {}

// 인증 실패(리프레시 불가) 시 앱에 알리기 위한 핸들러 훅
let onAuthFailure: (() => void) | null = null;
export const setAuthFailureHandler = (fn: (() => void) | null) => {
  onAuthFailure = fn;
};

// 공통 에러 처리
const logError = (operation: string, error: any) => {
  console.error(`❌ ${operation}:`, {
    status: error.response?.status,
    message: error.response?.data?.message || error.message,
  });
};

// 요청 인터셉터 - JWT 토큰 자동 추가
apiClient.interceptors.request.use(
  async (config: any) => {
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
  (error: any) => { throw error; }
);

// 응답 인터셉터 - 성공 래핑 언래핑 및 토큰 만료 처리
apiClient.interceptors.response.use(
  (response: any) => {
    // 백엔드 TransformInterceptor가 { success, data } 형태로 래핑함
    if (response && response.data && typeof response.data === 'object' && 'success' in response.data) {
      // 성공 시 payload 언래핑
      if (response.data.success === true && 'data' in response.data) {
        response.data = response.data.data;
      }
    }
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config || {};

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // body로 refreshToken을 전달(쿠키 미사용 환경 대응)
        const refreshToken: string | null = (await AsyncStorage.getItem('refresh_token')) || null;
  const response = await apiClient.post('/auth/refresh', refreshToken ? { refreshToken } : undefined);
  const newToken = response.data.accessToken; // 위에서 언래핑되었으므로 그대로 접근 가능
        
        await AsyncStorage.setItem('auth_token', newToken);
        
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['auth_token', 'user_info']);
        await AsyncStorage.removeItem('refresh_token');
        if (__DEV__) console.info('토큰 갱신 실패로 로그아웃');
        // 앱 전역에 인증 만료 알림 → AuthContext에서 자동 로그아웃 처리
        try { onAuthFailure?.(); } catch {}
      }
    }
    // 에러 메시지 포맷 표준화
    try {
      const data = error.response?.data;
      if (data && typeof data === 'object') {
        // 전역 HttpExceptionFilter 포맷: { success:false, statusCode, error }
        const message = data.error?.message || data.message || error.message;
        throw { ...error, message };
      }
    } catch {}
    throw error;
  }
);

// API 서비스 함수들
export const authAPI = {
  // returnUrl을 state로 전달하기 위한 변형 API (Expo Go/Dev Client 복귀 보장)
  getKakaoAuthUrlWithReturn: async (returnUrl: string) => {
    const response = await apiClient.get('/auth/kakao', { params: { returnUrl } });
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

  getMyRecentPhotos: async (limit = 3) => {
    const response = await apiClient.get('/photo/mine/recent', { params: { limit } });
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

  getPhotosByMission: async (missionId: string) => {
    const response = await apiClient.get(`/photo/mission/${missionId}`);
    return response.data;
  },
};

export const userAPI = {
  updateMe: async (data: { nickname?: string; profileImage?: string; email?: string }) => {
    const response = await apiClient.put('/user/me', data);
    return response.data;
  },
  uploadAvatar: async (file: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    // @ts-ignore - React Native FormData
    form.append('file', file);
    const response = await apiClient.post('/user/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data as { imageUrl: string; user: any };
  },
  resetAvatar: async () => {
    const response = await apiClient.delete('/user/me/avatar');
    return response.data as { imageUrl: string | null; user: any };
  },
};

export default apiClient;
