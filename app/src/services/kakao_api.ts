import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "./api";

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
   * 딥링크 처리를 시작하고 로그인 완료를 대기 (login() 내부에서 선등록)
   */
  startDeepLinkHandling(): Promise<LoginResult> {
    return new Promise((resolve) => {
      this.resolveLogin = resolve;

      // 딥링크 리스너 등록
      if (this.linkingSubscription) {
        this.linkingSubscription.remove();
      }

      this.linkingSubscription = Linking.addEventListener(
        "url",
        this.handleDeepLink,
      );

      // 앱이 닫혀있다가 딥링크로 시작된 경우 처리
      Linking.getInitialURL().then((url) => {
        if (url && url.includes("auth/callback")) {
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
      const result = this.parseCallbackUrl(url);
      if (this.resolveLogin) {
        this.resolveLogin(result);
        this.resolveLogin = null;
      }
    } catch (urlError) {
      if (this.resolveLogin) {
        this.resolveLogin({
          success: false,
          error: "URL 처리에 실패했습니다.",
        });
        this.resolveLogin = null;
      }
    }
  };

  private parseCallbackUrl(url: string): LoginResult {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const success = params.get("success");
    const error = params.get("error");
    const token = params.get("token");
    const refresh = params.get("refresh");
    const userString = params.get("user");

    if (error) {
      return { success: false, error: decodeURIComponent(error) };
    }
    if (success === "true" && token) {
      try {
        const user = userString
          ? JSON.parse(decodeURIComponent(userString))
          : undefined;
        if (refresh) {
          const value = decodeURIComponent(refresh);
          AsyncStorage.setItem("refresh_token", value).catch(() => {});
        }
        return {
          success: true,
          accessToken: decodeURIComponent(token),
          user,
        } as LoginResult;
      } catch {
        return { success: false, error: "사용자 정보 처리에 실패했습니다." };
      }
    }
    return { success: false, error: "알 수 없는 오류가 발생했습니다." };
  }

  /**
   * 카카오 로그인 시작
   */
  async login(): Promise<LoginResult> {
    try {
      // Expo/앱으로 복귀할 리디렉트 URL 구성
      const returnUrl = Linking.createURL("auth/callback");
      const urlResponse: AuthUrlResponse =
        await authAPI.getKakaoAuthUrlWithReturn(returnUrl);

      // 1) 우선 딥링크 리스너를 등록(이벤트 놓치지 않기 위해)
      const waitForDeepLink = this.startDeepLinkHandling();

      // 2) 인증 세션 열기: 브라우저 자동 닫힘 및 앱 복귀 보장
      const callbackUrl = await this.openAuthSession(
        urlResponse.authUrl,
        returnUrl,
      );

      // 3) openAuthSessionAsync가 url을 반환한 경우 즉시 파싱하여 반환
      if (callbackUrl) {
        const parsed = this.parseCallbackUrl(callbackUrl);
        // 리스너 정리
        this.stopDeepLinkHandling();
        return parsed;
      }

      // 4) 일부 환경에서는 이벤트로만 전달될 수 있으므로 리스너 결과 대기
      const result = await waitForDeepLink;
      return result;
    } catch (error: any) {
      throw this.formatError(error);
    }
  }

  /**
   * 시스템 브라우저 열기 (딥링크를 통한 자동 복귀)
   */
  private async openAuthSession(
    authUrl: string,
    returnUrl: string,
  ): Promise<string | null> {
    if (Platform.OS === "web") {
      window.location.href = authUrl;
      return null;
    }
    // openAuthSessionAsync는 iOS/Android에서 SFAuthenticationSession/Custom Tabs를 사용해 복귀를 보장
    const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
    // 사용자가 취소한 경우 등은 이후 딥링크로 오지 않으니 에러 처리
    if (result.type === "cancel") {
      throw new Error("사용자가 로그인을 취소했습니다.");
    }
    // 성공 시 콜백 URL을 반환(일부 플랫폼에서는 여기서만 url을 제공)
    if ((result as any).url) {
      return (result as any).url as string;
    }
    return null;
  }

  /**
   * 로그아웃 (백엔드에서 토큰 무효화)
   */
  async logout(): Promise<void> {
    try {
      await authAPI.logout();
    } catch (error: any) {
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
      throw this.formatError(error);
    }
  }

  /**
   * 에러 포맷팅
   */
  private formatError(error: any): Error {
    const message =
      error.response?.data?.message ||
      error.message ||
      "알 수 없는 오류가 발생했습니다.";
    return new Error(message);
  }
}

export default new BackendKakaoAuthService();
