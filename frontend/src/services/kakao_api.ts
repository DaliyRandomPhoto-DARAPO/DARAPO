import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform, Alert } from 'react-native';
import { authAPI } from './api';

WebBrowser.maybeCompleteAuthSession();

interface LoginResult {
  success: boolean;
  accessToken?: string;
  user?: {
    id: string;
    nickname: string;
    profileImage?: string;
    email?: string;
  };
  error?: string;
}

interface AuthUrlResponse {
  authUrl: string;
}

/**
 * 백엔드 중심 카카오 인증 서비스
 * OAuth 플로우: 시스템 브라우저 → 백엔드 처리 → 앱 리다이렉트
 */
class BackendKakaoAuthService {
  private resolveLogin: ((result: LoginResult) => void) | null = null;
  private linkingSubscription: any = null;

  constructor() {
    // 컴포넌트별로 딥링크 처리를 분리하기 위해 생성자에서는 리스너 등록하지 않음
  }

  /**
   * 딥링크 처리를 시작하고 로그인 완료를 대기 (App.tsx에서 호출)
   */
  startDeepLinkHandling(): Promise<LoginResult> {
    return new Promise((resolve) => {
      this.resolveLogin = resolve;
      
      // 딥링크 리스너 등록
      if (this.linkingSubscription) {
        this.linkingSubscription.remove();
      }
      
      this.linkingSubscription = Linking.addEventListener('url', this.handleDeepLink);
      
      // 앱이 닫혀있다가 딥링크로 시작된 경우 처리
      Linking.getInitialURL().then((url) => {
        if (url && url.includes('auth/callback')) {
          this.handleDeepLink({ url });
        }
      });
    });
  }

  /**
   * 딥링크 리스너 해제
   */
  stopDeepLinkHandling() {
    if (this.linkingSubscription) {
      this.linkingSubscription.remove();
      this.linkingSubscription = null;
    }
    this.resolveLogin = null;
  }

  /**
   * 딥링크 처리 (백엔드에서 완전히 처리된 결과 받기)
   */
  private handleDeepLink = ({ url }: { url: string }) => {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      const success = params.get('success');
      const error = params.get('error');
  const token = params.get('token');
  const refresh = params.get('refresh');
      const userString = params.get('user');
      
      if (error) {
        console.error('OAuth 처리 실패:', error);
        if (this.resolveLogin) {
          this.resolveLogin({ success: false, error: decodeURIComponent(error) });
          this.resolveLogin = null;
        }
      } else if (success === 'true' && token) {
        try {
          const user = userString ? JSON.parse(decodeURIComponent(userString)) : null;
          
          // refresh 토큰 저장(보안 저장소 선호, 폴백 제공)
          if (refresh) {
            (async () => {
              try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const SecureStore: any = require('expo-secure-store');
                await SecureStore.setItemAsync('refresh_token', decodeURIComponent(refresh));
              } catch {
                // 폴백: AsyncStorage
                const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
                await AsyncStorage.setItem('refresh_token', decodeURIComponent(refresh));
              }
            })();
          }

          if (this.resolveLogin) {
            this.resolveLogin({ 
              success: true, 
              accessToken: decodeURIComponent(token),
              user
            });
            this.resolveLogin = null;
          }
        } catch (parseError) {
          console.error('사용자 정보 파싱 실패:', parseError);
          if (this.resolveLogin) {
            this.resolveLogin({ success: false, error: '사용자 정보 처리에 실패했습니다.' });
            this.resolveLogin = null;
          }
        }
      } else {
        console.error('알 수 없는 콜백 상태');
        if (this.resolveLogin) {
          this.resolveLogin({ success: false, error: '알 수 없는 오류가 발생했습니다.' });
          this.resolveLogin = null;
        }
      }
    } catch (urlError) {
      console.error('딥링크 URL 파싱 실패:', urlError);
      if (this.resolveLogin) {
        this.resolveLogin({ success: false, error: 'URL 처리에 실패했습니다.' });
        this.resolveLogin = null;
      }
    }
  };

  /**
   * 백엔드 완전 처리 카카오 로그인 시작
   */
  async login(): Promise<LoginResult> {
    try {
      const urlResponse: AuthUrlResponse = await authAPI.getKakaoAuthUrl();
      
      await this.openSystemBrowser(urlResponse.authUrl);
      
      return await this.startDeepLinkHandling();
      
    } catch (error: any) {
      console.error('카카오 로그인 실패:', error);
      throw this.formatError(error);
    }
  }

  /**
   * 시스템 브라우저 열기 (딥링크를 통한 자동 복귀)
   */
  private async openSystemBrowser(authUrl: string) {
    if (Platform.OS === 'web') {
      // 웹에서는 현재 창에서 리다이렉트
      window.location.href = authUrl;
    } else {
      // 모바일에서는 시스템 브라우저로 열기
      await WebBrowser.openBrowserAsync(authUrl);
    }
  }

  /**
   * 로그아웃 (백엔드에서 토큰 무효화)
   */
  async logout(): Promise<void> {
    try {
      await authAPI.logout();
    } catch (error: any) {
      console.warn('로그아웃 중 오류:', error);
      throw error;
    }
  }

  // 회원탈퇴 기능은 백엔드 엔드포인트 도입 시 구현 예정

  /**
   * 토큰 갱신 (백엔드에서 처리)
   */
  async refreshToken(): Promise<string> {
    try {
      const response = await authAPI.refreshToken();
      return response.accessToken;
    } catch (error: any) {
      console.error('토큰 갱신 실패:', error);
      throw this.formatError(error);
    }
  }

  /**
   * 에러 포맷팅
   */
  private formatError(error: any): Error {
    const message = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.';
    return new Error(message);
  }
}

export default new BackendKakaoAuthService();
