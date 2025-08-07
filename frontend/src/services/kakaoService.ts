import {
  login,
  loginWithKakaoAccount,
  getProfile,
  logout,
  unlink,
} from '@react-native-seoul/kakao-login';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

// 상수 정의 - 메모리 효율성을 위한 freezing
const ERROR_MESSAGES = Object.freeze({
  CANCELED: '사용자가 로그인을 취소했습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  NOT_SUPPORTED: '현재 환경에서는 카카오 로그인이 지원되지 않습니다.',
  INVALID_REQUEST: '잘못된 요청입니다. 앱 설정을 확인해주세요.',
  DEFAULT: '카카오 로그인 중 오류가 발생했습니다.',
  PROFILE_FETCH: '프로필 정보를 가져오는데 실패했습니다.',
  UNLINK_FAILED: '회원탈퇴에 실패했습니다.',
  JS_KEY_MISSING: 'JavaScript 앱 키가 설정되지 않았습니다. 웹뷰 로그인을 위해 EXPO_PUBLIC_KAKAO_JS_APP_KEY를 설정해주세요.',
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
  private _nativeAppKey: string | undefined = undefined;
  private _jsAppKey: string | undefined = undefined;
  private _isInitialized = false;

  // 성능 최적화: 프로필 캐싱
  private _cachedProfile: KakaoProfile | null = null;
  private _profileCacheTime = 0;
  private readonly PROFILE_CACHE_DURATION = 5 * 60 * 1000; // 5분

  /**
   * 초기화 메서드 (앱 키 캐싱)
   */
  private initializeKeys(): void {
    if (this._isInitialized) return;

    this._nativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY || Constants.expoConfig?.extra?.kakaoAppKey;
    this._jsAppKey = process.env.EXPO_PUBLIC_KAKAO_JS_APP_KEY || Constants.expoConfig?.extra?.kakaoJsAppKey;
    this._isInitialized = true;
  }
  /**
   * 스마트한 카카오 로그인 - 카카오톡 앱이 있으면 앱으로, 없으면 웹으로 로그인
   */
  async login(): Promise<{ tokens: KakaoTokens; profile: KakaoProfile }> {
    try {
      console.log('🚀 카카오 스마트 로그인 시작...');
      
      let tokens;
      
      try {
        // 먼저 일반 login 시도 (SDK가 자동으로 최적의 방법 선택)
        console.log('📱 카카오 로그인 시도...');
        tokens = await login();
        console.log('✅ 카카오 로그인 성공 (자동 선택)');
      } catch (error: any) {
        // 사용자 취소인 경우 즉시 에러 발생
        if (this.isUserCancelledError(error)) {
          console.log('⚠️ 사용자가 카카오 로그인을 취소했습니다.');
          throw error;
        }
        
        console.log('⚠️ 일반 로그인 실패, 카카오 계정으로 로그인 시도...');
        
        // 일반 로그인 실패 시 카카오 계정으로 로그인 시도
        tokens = await this.performWebLogin();
      }

      return await this.processLoginSuccess(tokens);
    } catch (error: any) {
      console.error('❌ 카카오 로그인 실패:', error);
      throw this.handleKakaoError(error);
    }
  }

  /**
   * 카카오 계정으로 직접 로그인 (웹뷰 사용)
   */
  async loginWithAccount(): Promise<{ tokens: KakaoTokens; profile: KakaoProfile }> {
    try {
      console.log('🌐 카카오 계정 로그인 시작...');
      
      const tokens = await this.performWebLogin();
      return await this.processLoginSuccess(tokens);
    } catch (error: any) {
      console.error('❌ 카카오 계정 로그인 실패:', error);
      throw this.handleKakaoError(error);
    }
  }

  /**
   * 웹 로그인 실행 (공통 로직)
   */
  private async performWebLogin(): Promise<any> {
    // JavaScript 앱 키 확인
    const jsAppKey = this.getJavaScriptAppKey();
    if (!jsAppKey) {
      throw new Error(ERROR_MESSAGES.JS_KEY_MISSING);
    }
    
    const tokens = await loginWithKakaoAccount();
    console.log('✅ 카카오 계정 로그인 성공');
    return tokens;
  }

  /**
   * 사용자 취소 에러인지 확인
   */
  private isUserCancelledError(error: any): boolean {
    const errorMessage = error.message || '';
    const errorCode = error.code || '';
    const errorText = `${errorMessage} ${errorCode}`.toLowerCase();
    
    return ERROR_KEYWORDS.CANCEL.some(keyword => 
      errorText.includes(keyword.toLowerCase())
    );
  }

  /**
   * JavaScript 앱 키 가져오기 (캐싱 적용)
   */
  private getJavaScriptAppKey(): string | undefined {
    this.initializeKeys();
    return this._jsAppKey;
  }

  /**
   * Native 앱 키 가져오기 (캐싱 적용)
   */
  private getNativeAppKey(): string | undefined {
    this.initializeKeys();
    return this._nativeAppKey;
  }

  /**
   * 로그인 성공 후 처리 (공통 로직)
   */
  private async processLoginSuccess(tokens: any): Promise<{ tokens: KakaoTokens; profile: KakaoProfile }> {
    console.log('🎫 카카오 토큰 획득 성공:', {
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      expiresAt: tokens.accessTokenExpiresAt,
    });

    // 사용자 프로필 정보 가져오기
    const profile = await this.fetchProfile();

    return {
      tokens: this.formatTokens(tokens),
      profile,
    };
  }

  /**
   * 사용자 프로필 정보 조회 (캐싱 적용)
   */
  async fetchProfile(): Promise<KakaoProfile> {
    try {
      // 캐시된 프로필이 유효한지 확인
      const now = Date.now();
      if (this._cachedProfile && (now - this._profileCacheTime) < this.PROFILE_CACHE_DURATION) {
        console.log('✅ 캐시된 카카오 프로필 반환');
        return this._cachedProfile;
      }

      console.log('👤 카카오 프로필 조회 시작...');
      
      const profile = await getProfile();
      
      const formattedProfile: KakaoProfile = {
        id: profile.id.toString(),
        nickname: profile.nickname || '사용자',
        profileImageUrl: profile.profileImageUrl,
        email: profile.email,
      };

      // 프로필 캐싱
      this._cachedProfile = formattedProfile;
      this._profileCacheTime = now;

      console.log('✅ 카카오 프로필 조회 성공:', {
        id: formattedProfile.id,
        nickname: formattedProfile.nickname,
        hasProfileImage: !!formattedProfile.profileImageUrl,
        hasEmail: !!formattedProfile.email,
      });

      return formattedProfile;
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
      await logout();
      console.log('✅ 카카오 로그아웃 성공');
    } catch (error: any) {
      console.error('❌ 카카오 로그아웃 실패:', error);
      // 로그아웃 실패는 치명적이지 않으므로 에러를 던지지 않음
    }
  }

  /**
   * 카카오 연결 해제 (회원탈퇴)
   */
  async unlink(): Promise<void> {
    try {
      console.log('🔓 카카오 연결 해제 시작...');
      await unlink();
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
    console.log('🐛 카카오 서비스 디버그 정보:');
    console.log('- 플랫폼:', Platform.OS);
    console.log('- Native App Key:', this.getNativeAppKey() ? '설정됨' : '❌ 미설정');
    console.log('- JS App Key:', this.getJavaScriptAppKey() ? '설정됨' : '❌ 미설정');
    console.log('- Bundle ID:', Constants.expoConfig?.ios?.bundleIdentifier || '미설정');
  }
}

export const kakaoService = new KakaoService();

// 개발 환경에서 디버그 정보 자동 출력
if (__DEV__) {
  kakaoService.printDebugInfo();
}
