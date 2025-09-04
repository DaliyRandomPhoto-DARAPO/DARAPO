import axios, { AxiosRequestConfig, AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
// SecureStore는 선택적 사용(설치 안 된 환경 대비)
// 동적 require로 타입 에러 및 번들 이슈 회피
import Constants from "expo-constants";
import type { Mission } from "../types/mission";

// 환경에서 받은 값의 트레일링 슬래시 제거 + 안전한 기본값 적용
const configuredApi =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) || "";
const DEFAULT_API = "https://api.darapo.site";
export const RAW_API_BASE_URL = (
  configuredApi && !/localhost|127\.0\.0\.1/i.test(configuredApi)
    ? configuredApi
    : DEFAULT_API
).replace(/\/+$/, "");

// Nest 전역 prefix('api')가 백엔드에 설정되어 있으므로 프론트에서는 /api/를 추가해야 함
const API_BASE_URL = RAW_API_BASE_URL;

// 호스트 베이스 URL (필요 시 사용)
export const BASE_URL = RAW_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 런타임 로그로 실제 API 엔드포인트 확인(문제 상황 진단 용이)
try {
  if (!configuredApi || /localhost|127\.0\.0\.1/i.test(configuredApi)) {
    // EXPO_PUBLIC_API_URL 미설정 또는 localhost 감지 → 기본값으로 대체됨
  }
} catch {}

// 인증 실패(리프레시 불가) 시 앱에 알리기 위한 핸들러 훅
let onAuthFailure: (() => void) | null = null;
export const setAuthFailureHandler = (fn: (() => void) | null) => {
  onAuthFailure = fn;
};

// 리프레시 단일화(single-flight) 상태
let refreshInFlight: Promise<string> | null = null;
let lastRefreshAt = 0;

const doRefresh = async (): Promise<string> => {
  // 쿠키를 쓰지 않는 환경이므로 반드시 바디로 refreshToken을 전달
  let refreshToken: string | null = null;
  try {
    refreshToken = await AsyncStorage.getItem("refresh_token");
  } catch {}
  const resp = await apiClient.post(
    "/api/auth/refresh",
    refreshToken ? { refreshToken } : undefined,
    {
      // refresh 자체가 401이면 재귀 방지를 위해 별도 플래그
      headers: { "x-refresh-request": "1" },
    },
  );
  const newToken = resp.data.accessToken as string;
  await AsyncStorage.setItem("auth_token", newToken);
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  lastRefreshAt = Date.now();
  return newToken;
};

const getFreshAccessToken = async (): Promise<string> => {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh()
      .catch(async (err) => {
        // 실패 시 세션 정리 및 전파
        try {
          onAuthFailure?.();
        } catch {}
        try {
          await AsyncStorage.multiRemove([
            "auth_token",
            "user_info",
            "refresh_token",
          ]);
        } catch {}
        throw err;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

// 공통 에러 처리
const logError = (operation: string, error: any) => {
  // 에러 로깅
};

// 요청 인터셉터 - JWT 토큰 자동 추가
apiClient.interceptors.request.use(
  async (config: any) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // 토큰 로드 실패
    }
    return config;
  },
  (error: unknown) => {
    throw error;
  },
);

// 응답 인터셉터 - 성공 래핑 언래핑 및 토큰 만료 처리
apiClient.interceptors.response.use(
  (response: any) => {
    // 백엔드 TransformInterceptor가 { success, data } 형태로 래핑함
    if (
      response &&
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data
    ) {
      // 성공 시 payload 언래핑
      if (response.data.success === true && "data" in response.data) {
        response.data = response.data.data;
      }
    }
    return response;
  },
  async (error: AxiosError | any) => {
    const originalRequest = (error as any)?.config || {};

    // 리프레시 요청 자체에서 401 발생 시 재귀 진입 방지
    const url: string = originalRequest?.url || "";
    const isRefreshCall =
      url.includes("/api/auth/refresh") ||
      originalRequest?.headers?.["x-refresh-request"] === "1";

    if (
      !isRefreshCall &&
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await getFreshAccessToken();
        // 새 토큰으로 재요청
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newToken}`,
        };
        return apiClient(originalRequest);
      } catch (refreshError) {
        // 상단 getFreshAccessToken에서 세션 정리 및 콜백 호출 처리
        // 여기서는 에러만 전파
      }
    }

    // 리프레시 직후 전파 지연 등으로 드문 401이 섞일 수 있음 → 1회 즉시 재시도
    if (!isRefreshCall && error.response?.status === 401) {
      if (Date.now() - lastRefreshAt < 1500 && !originalRequest._secondTry) {
        originalRequest._secondTry = true;
        return apiClient(originalRequest);
      }
    }
    // 에러 메시지 포맷 표준화
    try {
      const data = (error as any)?.response?.data;
      if (data && typeof data === "object") {
        // 전역 HttpExceptionFilter 포맷: { success:false, statusCode, error }
        const message =
          data.error?.message || data.message || (error as any).message;
        throw { ...error, message };
      }
    } catch (err) {
      // ignore formatting errors
    }
    throw error;
  },
);

// API 서비스 함수들
export const authAPI = {
  // returnUrl을 state로 전달하기 위한 변형 API (Expo Go/Dev Client 복귀 보장)
  getKakaoAuthUrlWithReturn: async (returnUrl: string) => {
    const response = await apiClient.get("/api/auth/kakao", {
      params: { returnUrl },
    });
    return response.data;
  },

  logout: async () => {
    try {
      const response = await apiClient.post("/api/auth/logout");
      return response.data;
    } catch (err: any) {
      // 서버에서 이미 토큰이 만료되어 401을 반환할 수 있음. 이 경우 로그아웃은 성공한 것으로 간주.
      if (err?.response?.status === 401) {
        return { ok: true };
      }
      throw err;
    }
  },

  refreshToken: async () => {
    // 쿠키를 쓰지 않는 환경이므로 반드시 바디로 refreshToken을 전달
    let refreshToken: string | null = null;
    try {
      refreshToken = await AsyncStorage.getItem("refresh_token");
    } catch {}
    const response = await apiClient.post(
      "/api/auth/refresh",
      refreshToken ? { refreshToken } : undefined,
    );
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get("/api/auth/me");
    return response.data;
  },
};

export const missionAPI = {
  getTodayMission: async (): Promise<Mission | undefined> => {
    const response = await apiClient.get("/api/mission/today", {
      headers: {
        // 캐시 이슈로 304가 빈 데이터처럼 보이는 것을 방지
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    return response.data as Mission | undefined;
  },
};

export const photoAPI = {
  uploadPhoto: async (
    formData: FormData,
    opts?: {
      onProgress?: (progress: {
        loaded: number;
        total?: number;
        percent?: number;
      }) => void;
      signal?: AbortSignal;
    },
  ) => {
    const controller = new AbortController();
    if (opts?.signal) {
      opts.signal.addEventListener("abort", () => controller.abort());
    }
    const response = await apiClient.post("/api/photo/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      signal: controller.signal,
      onUploadProgress: (e: any) => {
        if (!opts?.onProgress) return;
        const total =
          e.total ||
          e.currentTarget?.getResponseHeader?.("Content-Length") ||
          undefined;
        const loaded = e.loaded ?? 0;
        const percent = total
          ? Math.min(100, Math.round((loaded / total) * 100))
          : undefined;
        opts.onProgress({
          loaded,
          total: typeof total === "number" ? total : undefined,
          percent,
        });
      },
    });
    return response.data;
  },

  getMyPhotos: async () => {
    const response = await apiClient.get("/api/photo/mine");
    return response.data;
  },

  getMyRecentPhotos: async (limit = 3) => {
    try {
      const response = await apiClient.get("/api/photo/mine/recent", {
        params: { limit },
      });
      return response.data || []; // null/undefined 방어
    } catch (error: any) {
      console.error(
        "getMyRecentPhotos failed:",
        error?.response?.data || error?.message,
      );
      // 500 에러 시 빈 배열 반환하여 앱 크래시 방지
      if (error?.response?.status === 500) {
        return [];
      }
      throw error;
    }
  },

  deletePhoto: async (id: string) => {
    const response = await apiClient.delete(`/api/photo/${id}`);
    return response.data;
  },

  updatePhoto: async (id: string, data: any) => {
    const response = await apiClient.put(`/api/photo/${id}`, data);
    return response.data;
  },

  markAsShared: async (id: string) => {
    const response = await apiClient.put(`/api/photo/${id}/share`);
    return response.data;
  },

  getPublicPhotos: async (limit = 20, skip = 0) => {
    const response = await apiClient.get(`/api/photo/public`, {
      params: { limit, skip },
    });
    return response.data;
  },

  getPhotosByMission: async (missionId: string) => {
    const response = await apiClient.get(`/api/photo/mission/${missionId}`);
    return response.data;
  },
};

export const userAPI = {
  updateMe: async (data: {
    name?: string;
    nickname?: string;
    profileImage?: string;
    email?: string;
  }) => {
    const response = await apiClient.put("/api/user/me", data);
    return response.data;
  },
  uploadAvatar: async (file: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    // @ts-ignore - React Native FormData
    form.append("file", file);
    // 헤더는 axios가 boundary 포함하여 자동 설정하도록 둡니다.
    const response = await apiClient.post("/api/user/me/avatar", form);
    return response.data as { imageUrl: string; user: any };
  },
  resetAvatar: async () => {
    const response = await apiClient.delete("/api/user/me/avatar");
    return response.data as { imageUrl: string | null; user: any };
  },
};

export default apiClient;
