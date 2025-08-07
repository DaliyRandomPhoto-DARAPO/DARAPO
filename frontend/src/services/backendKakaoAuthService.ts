import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';
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
 * 백엔드 완전 중심의 카카오 인증 서비스
 * 
 * 새로운 플로우:
 * 1. 프론트엔드에서 시스템 브라우저로 OAuth 시작
 * 2. 백엔드에서 OAuth 완료 후 JWT 생성
 * 3. 백엔드에서 앱으로 완성된 토큰과 사용자 정보 리다이렉트
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
    console.log('🔗 백엔드 완료 딥링크 수신:', url);
    
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // 백엔드에서 전달된 파라미터 추출
      const success = params.get('success');
      const error = params.get('error');
      const token = params.get('token');
      const userString = params.get('user');
      
      if (error) {
        console.error('❌ 백엔드 OAuth 처리 실패:', error);
        if (this.resolveLogin) {
          this.resolveLogin({ success: false, error: decodeURIComponent(error) });
          this.resolveLogin = null;
        }
      } else if (success === 'true' && token) {
        console.log('✅ 백엔드 OAuth 완료, JWT 토큰 수신');
        
        try {
          // 백엔드에서 처리된 사용자 정보 파싱
          const user = userString ? JSON.parse(decodeURIComponent(userString)) : null;
          
          if (this.resolveLogin) {
            this.resolveLogin({ 
              success: true, 
              accessToken: decodeURIComponent(token),
              user
            });
            this.resolveLogin = null;
          }
        } catch (parseError) {
          console.error('❌ 사용자 정보 파싱 실패:', parseError);
          if (this.resolveLogin) {
            this.resolveLogin({ success: false, error: '사용자 정보 처리에 실패했습니다.' });
            this.resolveLogin = null;
          }
        }
      } else {
        console.error('❌ 알 수 없는 콜백 파라미터');
        if (this.resolveLogin) {
          this.resolveLogin({ success: false, error: '알 수 없는 오류가 발생했습니다.' });
          this.resolveLogin = null;
        }
      }
    } catch (urlError) {
      console.error('❌ 딥링크 URL 파싱 실패:', urlError);
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
      console.log('🔄 백엔드 완전 처리 로그인 시작...');
      
      // 1. 백엔드에서 OAuth URL 생성
      const urlResponse: AuthUrlResponse = await authAPI.getKakaoAuthUrl();
      console.log('✅ 인증 URL 획득:', urlResponse.authUrl);
      
      // 2. 시스템 브라우저로 인증 페이지 열기
      await this.openSystemBrowser(urlResponse.authUrl);
      
      // 3. 딥링크를 통한 백엔드 완료 결과 대기
      return await this.startDeepLinkHandling();
      
    } catch (error: any) {
      console.error('❌ 백엔드 완전 처리 로그인 실패:', error);
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
      console.log('🔄 백엔드 중심 로그아웃 시작...');
      
      // 백엔드에 로그아웃 요청 전송
      await authAPI.logout();
      
      console.log('✅ 백엔드 로그아웃 완료');
      
    } catch (error: any) {
      console.warn('⚠️ 백엔드 로그아웃 중 오류:', error);
      // 로그아웃은 실패해도 로컬 상태는 정리되어야 함
    }
  }

  /**
   * 회원탈퇴 (백엔드에서 카카오 연결 해제 및 계정 삭제)
   */
  async deleteAccount(): Promise<void> {
    try {
      console.log('🔄 백엔드 중심 회원탈퇴 시작...');
      
      // 백엔드에 회원탈퇴 요청 전송
      await authAPI.deleteAccount();
      
      console.log('✅ 백엔드 회원탈퇴 완료');
      
    } catch (error: any) {
      console.error('❌ 회원탈퇴 실패:', error);
      throw this.formatError(error);
    }
  }

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
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    } else if (error.message) {
      return new Error(error.message);
    } else {
      return new Error('알 수 없는 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자 친화적인 에러 알림
   */
  private showErrorAlert(title: string, message: string) {
    Alert.alert(title, message, [
      {
        text: '확인',
        style: 'default',
      },
    ]);
  }
}

export default new BackendKakaoAuthService();
