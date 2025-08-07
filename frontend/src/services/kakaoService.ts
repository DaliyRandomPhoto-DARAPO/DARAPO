import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

// WebBrowser 설정
WebBrowser.maybeCompleteAuthSession();

// 상수 정의 - 메모리 효율성을 위한 freezing
const ERROR_MESSAGES = Object.freeze({
  CANCELED: '사용자가 로그인을 취소했습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  NOT_SUPPORTED: '현재 환경에서는 카카오 로그인이 지원되지 않습니다.',
  INVALID_REQUEST: '잘못된 요청입니다. 앱 설정을 확인해주세요.',
  DEFAULT: '카카오 로그인 중 오류가 발생했습니다.',
  PROFILE_FETCH: '프로필 정보를 가져오는데 실패했습니다.',
  UNLINK_FAILED: '회원탈퇴에 실패했습니다.',
  NO_CLIENT_ID: '카카오 클라이언트 ID가 설정되지 않았습니다. EXPO_PUBLIC_KAKAO_REST_API_KEY를 설정해주세요.',
  TOKEN_INVALID: '토큰이 유효하지 않습니다.',
} as const);

// 카카오 OAuth 설정
const KAKAO_CONFIG = Object.freeze({
  DISCOVERY: {
    authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
    tokenEndpoint: 'https://kauth.kakao.com/oauth/token',
    userInfoEndpoint: 'https://kapi.kakao.com/v2/user/me',
    logoutEndpoint: 'https://kapi.kakao.com/v1/user/logout',
    unlinkEndpoint: 'https://kapi.kakao.com/v1/user/unlink',
  },
  SCOPES: ['profile_nickname', 'profile_image', 'account_email'],
} as const);

const ERROR_KEYWORDS = Object.freeze({
  CANCEL: Object.freeze(['cancelled', 'canceled', 'CANCEL', 'user cancelled']),
  NETWORK: Object.freeze(['network', 'NETWORK', 'timeout', 'connection']),
  NOT_SUPPORTED: Object.freeze(['not supported', 'NOT_SUPPORTED', 'unsupported']),
  INVALID: Object.freeze(['invalid', 'INVALID', 'unauthorized', 'forbidden']),
} as const);

// 카카오 로그인 에러 타입 정의
export enum KakaoLoginError {
  CANCELED = 'CANCELED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

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
  // 성능 최적화: 키 캐싱
  private _restApiKey: string | undefined = undefined;
  private _redirectUri: string | undefined = undefined;
  private _isInitialized = false;

  // 성능 최적화: 프로필 및 토큰 캐싱
  private _cachedProfile: KakaoProfile | null = null;
  private _profileCacheTime = 0;
  private _accessToken: string | null = null;
  private readonly PROFILE_CACHE_DURATION = 5 * 60 * 1000; // 5분

  /**
   * 초기화 메서드 (앱 키 캐싱)
   */
  private initializeKeys(): void {
    if (this._isInitialized) return;

    this._restApiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY || Constants.expoConfig?.extra?.kakaoRestApiKey;
    this._redirectUri = AuthSession.makeRedirectUri({
      scheme: Array.isArray(Constants.expoConfig?.scheme) 
        ? Constants.expoConfig.scheme[0] 
        : Constants.expoConfig?.scheme || 'darapo',
      path: 'kakao-auth',
    });
    this._isInitialized = true;
  }

  /**
   * 카카오 OAuth 로그인 (공식 API 사용)
   */
  async login(): Promise<{ tokens: KakaoTokens; profile: KakaoProfile }> {
    try {
      console.log('🚀 카카오 공식 OAuth 로그인 시작...');
      
      this.initializeKeys();
      
      if (!this._restApiKey) {
        throw new Error(ERROR_MESSAGES.NO_CLIENT_ID);
      }

      // OAuth 요청 생성
      const request = new AuthSession.AuthRequest({
        clientId: this._restApiKey,
        scopes: [...KAKAO_CONFIG.SCOPES],
        redirectUri: this._redirectUri!,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {},
      });

      console.log('🔗 OAuth 요청 URL 생성 중...');
      const result = await request.promptAsync({
        authorizationEndpoint: KAKAO_CONFIG.DISCOVERY.authorizationEndpoint,
      });

      if (result.type === 'cancel') {
        throw new Error(ERROR_MESSAGES.CANCELED);
      }

      if (result.type !== 'success' || !result.params.code) {
        throw new Error(ERROR_MESSAGES.INVALID_REQUEST);
      }

      console.log('✅ 카카오 인증 코드 획득 성공');

      // 인증 코드를 액세스 토큰으로 교환
      const tokens = await this.exchangeCodeForTokens(result.params.code);
      
      // 프로필 정보 가져오기
      const profile = await this.fetchProfileWithToken(tokens.accessToken);

      console.log('✅ 카카오 로그인 완료');

      return {
        tokens,
        profile,
      };
    } catch (error: any) {
      console.error('❌ 카카오 로그인 실패:', error);
      throw this.handleKakaoError(error);
    }
  }

  /**
   * 인증 코드를 액세스 토큰으로 교환
   */
  private async exchangeCodeForTokens(code: string): Promise<KakaoTokens> {
    try {
      console.log('🔄 액세스 토큰 교환 중...');
      
      const tokenRequest = await fetch(KAKAO_CONFIG.DISCOVERY.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this._restApiKey!,
          redirect_uri: this._redirectUri!,
          code,
        }).toString(),
      });

      const tokenData = await tokenRequest.json();

      if (!tokenRequest.ok) {
        throw new Error(tokenData.error_description || ERROR_MESSAGES.INVALID_REQUEST);
      }

      this._accessToken = tokenData.access_token;

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        accessTokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        refreshTokenExpiresAt: new Date(Date.now() + (tokenData.refresh_token_expires_in || 5184000) * 1000),
        scopes: tokenData.scope?.split(' ') || KAKAO_CONFIG.SCOPES,
      };
    } catch (error) {
      console.error('❌ 토큰 교환 실패:', error);
      throw error;
    }
  }

  /**
   * 액세스 토큰으로 프로필 조회
   */
  private async fetchProfileWithToken(accessToken: string): Promise<KakaoProfile> {
    try {
      console.log('👤 카카오 프로필 조회 중...');
      
      const profileRequest = await fetch(KAKAO_CONFIG.DISCOVERY.userInfoEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const profileData = await profileRequest.json();

      if (!profileRequest.ok) {
        throw new Error(profileData.msg || ERROR_MESSAGES.PROFILE_FETCH);
      }

      const profile: KakaoProfile = {
        id: profileData.id.toString(),
        nickname: profileData.kakao_account?.profile?.nickname || '사용자',
        profileImageUrl: profileData.kakao_account?.profile?.profile_image_url,
        email: profileData.kakao_account?.email,
      };

      // 프로필 캐싱
      this._cachedProfile = profile;
      this._profileCacheTime = Date.now();

      console.log('✅ 카카오 프로필 조회 성공:', {
        id: profile.id,
        nickname: profile.nickname,
        hasProfileImage: !!profile.profileImageUrl,
        hasEmail: !!profile.email,
      });

      return profile;
    } catch (error) {
      console.error('❌ 프로필 조회 실패:', error);
      throw new Error(ERROR_MESSAGES.PROFILE_FETCH);
    }
  }

  /**
   * 현재 로그인된 사용자 프로필 조회 (캐싱 적용)
   */
  async fetchProfile(): Promise<KakaoProfile> {
    try {
      // 캐시된 프로필이 유효한지 확인
      const now = Date.now();
      if (this._cachedProfile && (now - this._profileCacheTime) < this.PROFILE_CACHE_DURATION) {
        console.log('✅ 캐시된 카카오 프로필 반환');
        return this._cachedProfile;
      }

      if (!this._accessToken) {
        throw new Error(ERROR_MESSAGES.TOKEN_INVALID);
      }

      return await this.fetchProfileWithToken(this._accessToken);
    } catch (error: any) {
      console.error('❌ 카카오 프로필 조회 실패:', error);
      throw new Error(ERROR_MESSAGES.PROFILE_FETCH);
    }
  }

  /**
   * 카카오 로그아웃
   */
  async logout(): Promise<void> {
    try {
      console.log('👋 카카오 로그아웃 시작...');
      
      if (this._accessToken) {
        await fetch(KAKAO_CONFIG.DISCOVERY.logoutEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this._accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      }
      
      // 로컬 캐시 클리어
      this.clearCache();
      this._accessToken = null;
      
      console.log('✅ 카카오 로그아웃 성공');
    } catch (error: any) {
      console.error('❌ 카카오 로그아웃 실패:', error);
      // 로그아웃 실패는 치명적이지 않으므로 로컬 캐시만 클리어
      this.clearCache();
      this._accessToken = null;
    }
  }

  /**
   * 카카오 연결 해제 (회원탈퇴)
   */
  async unlink(): Promise<void> {
    try {
      console.log('🔓 카카오 연결 해제 시작...');
      
      if (!this._accessToken) {
        throw new Error(ERROR_MESSAGES.TOKEN_INVALID);
      }
      
      const unlinkRequest = await fetch(KAKAO_CONFIG.DISCOVERY.unlinkEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this._accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!unlinkRequest.ok) {
        const errorData = await unlinkRequest.json();
        throw new Error(errorData.msg || ERROR_MESSAGES.UNLINK_FAILED);
      }
      
      // 로컬 캐시 클리어
      this.clearCache();
      this._accessToken = null;
      
      console.log('✅ 카카오 연결 해제 성공');
    } catch (error: any) {
      console.error('❌ 카카오 연결 해제 실패:', error);
      throw new Error(ERROR_MESSAGES.UNLINK_FAILED);
    }
  }

  /**
   * 현재 로그인된 사용자 프로필 조회 (별칭)
   */
  async getProfile(): Promise<KakaoProfile> {
    return this.fetchProfile();
  }

  /**
   * 토큰 정보 포맷팅
   */
  private formatTokens(tokens: any): KakaoTokens {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      idToken: tokens.idToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
      scopes: tokens.scopes,
    };
  }

  /**
   * 카카오 에러 처리 (최적화된 문자열 검색)
   */
  private handleKakaoError(error: any): Error {
    console.log('🔍 에러 상세 정보:', error);
    
    const errorMessage = (error.message || '').toLowerCase();
    const errorCode = (error.code || '').toLowerCase();
    
    // 성능 최적화: 단일 문자열에서 검색
    const combinedError = `${errorMessage} ${errorCode}`;
    
    // 취소 키워드 확인 (가장 빈번한 케이스를 먼저)
    if (ERROR_KEYWORDS.CANCEL.some(keyword => combinedError.includes(keyword.toLowerCase()))) {
      return new Error(ERROR_MESSAGES.CANCELED);
    }
    
    // 네트워크 에러 확인
    if (ERROR_KEYWORDS.NETWORK.some(keyword => combinedError.includes(keyword.toLowerCase()))) {
      return new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    
    // 지원되지 않는 환경 확인
    if (ERROR_KEYWORDS.NOT_SUPPORTED.some(keyword => combinedError.includes(keyword.toLowerCase()))) {
      return new Error(ERROR_MESSAGES.NOT_SUPPORTED);
    }
    
    // 잘못된 요청 확인
    if (ERROR_KEYWORDS.INVALID.some(keyword => combinedError.includes(keyword.toLowerCase()))) {
      return new Error(ERROR_MESSAGES.INVALID_REQUEST);
    }
    
    // 기본 에러 메시지
    return new Error(ERROR_MESSAGES.DEFAULT);
  }

  /**
   * 캐시 클리어 메서드
   */
  clearCache(): void {
    this._cachedProfile = null;
    this._profileCacheTime = 0;
    console.log('🗑️ 카카오 서비스 캐시 클리어 완료');
  }

  /**
   * 디버그 정보 출력
   */
  printDebugInfo(): void {
    this.initializeKeys();
    console.log('🐛 카카오 서비스 디버그 정보:');
    console.log('- 플랫폼:', Platform.OS);
    console.log('- REST API Key:', this._restApiKey ? '설정됨' : '❌ 미설정');
    console.log('- Redirect URI:', this._redirectUri || '미설정');
    console.log('- Bundle ID:', Constants.expoConfig?.ios?.bundleIdentifier || '미설정');
    console.log('- 스키마:', Array.isArray(Constants.expoConfig?.scheme) 
      ? Constants.expoConfig.scheme[0] 
      : Constants.expoConfig?.scheme || 'darapo');
  }
}

export const kakaoService = new KakaoService();

// 개발 환경에서 디버그 정보 자동 출력
if (__DEV__) {
  kakaoService.printDebugInfo();
}
