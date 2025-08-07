import {
  login,
  getProfile,
  logout,
} from '@react-native-seoul/kakao-login';
import Constants from 'expo-constants';

// 디버깅을 위한 설정 정보 출력
console.log('🔧 카카오 SDK 설정 정보:');
console.log('- 앱 키:', process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY);
console.log('- Bundle ID:', Constants.expoConfig?.ios?.bundleIdentifier);
console.log('- URL Scheme:', `kakao${process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY}`);

export interface KakaoProfile {
  id: string;
  nickname: string;
  profileImageUrl?: string;
  email?: string;
}

export interface KakaoTokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  scopes?: string[];
}

class KakaoService {
  async login(): Promise<{ tokens: KakaoTokens; profile: KakaoProfile }> {
    try {
      console.log('카카오 로그인 시작...');
      
      // 카카오 로그인 시도
      const tokens = await login();
      console.log('카카오 토큰 획득 성공:', {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
      });

      // 사용자 프로필 정보 가져오기
      const profile = await getProfile();
      console.log('카카오 프로필 획득 성공:', {
        id: profile.id,
        nickname: profile.nickname,
        hasProfileImage: !!profile.profileImageUrl,
      });

      return {
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          idToken: tokens.idToken,
          accessTokenExpiresAt: tokens.accessTokenExpiresAt,
          refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
          scopes: tokens.scopes,
        },
        profile: {
          id: profile.id.toString(),
          nickname: profile.nickname || '사용자',
          profileImageUrl: profile.profileImageUrl,
          email: profile.email,
        },
      };
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
      throw new Error('카카오 로그인에 실패했습니다.');
    }
  }

  async logout(): Promise<void> {
    try {
      await logout();
      console.log('카카오 로그아웃 성공');
    } catch (error) {
      console.error('카카오 로그아웃 실패:', error);
      throw new Error('카카오 로그아웃에 실패했습니다.');
    }
  }

  async getProfile(): Promise<KakaoProfile> {
    try {
      const profile = await getProfile();
      return {
        id: profile.id.toString(),
        nickname: profile.nickname || '사용자',
        profileImageUrl: profile.profileImageUrl,
        email: profile.email,
      };
    } catch (error) {
      console.error('카카오 프로필 조회 실패:', error);
      throw new Error('카카오 프로필 조회에 실패했습니다.');
    }
  }
}

export const kakaoService = new KakaoService();
