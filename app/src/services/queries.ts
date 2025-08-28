// React Query 훅을 사용한 API 호출
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './api';

// 미션 조회
export const useMissions = () => {
  return useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const response = await apiClient.get('/mission');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// 오늘의 미션 조회
export const useTodayMission = () => {
  return useQuery({
    queryKey: ['missions', 'today'],
    queryFn: async () => {
      const response = await apiClient.get('/mission/today');
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1시간
  });
};

// 공개 사진 조회
export const usePublicPhotos = (limit = 20, skip = 0) => {
  return useQuery({
    queryKey: ['photos', 'public', limit, skip],
    queryFn: async () => {
      const response = await apiClient.get('/photo/public', {
        params: { limit, skip },
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2분
  });
};

// 내 사진 조회
export const useMyPhotos = () => {
  return useQuery({
    queryKey: ['photos', 'mine'],
    queryFn: async () => {
      const response = await apiClient.get('/photo/mine');
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1분
  });
};

// 유저 프로필 조회
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await apiClient.get('/user/me');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// 사진 업로드 뮤테이션
export const useUploadPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiClient.post('/photo/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      // 업로드 성공 시 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
};

// 프로필 업데이트 뮤테이션
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.put('/user/me', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
};
