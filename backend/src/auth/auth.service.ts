import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import axios from 'axios';

interface KakaoUserInfo {
  id: number;
  kakao_account: {
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
    email?: string;
  };
}

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

@Injectable()
export class AuthService {
  private readonly KAKAO_CLIENT_ID = process.env.KAKAO_REST_API_KEY;
  private readonly KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;
  private readonly KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/kakao/callback';

  // 로그아웃된 토큰들을 메모리에 저장 (실제로는 Redis 등 사용)
  private blacklistedTokens = new Set<string>();

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 카카오 OAuth 인증 URL 생성
   */
  async getKakaoAuthUrl(): Promise<string> {
    if (!this.KAKAO_CLIENT_ID) {
      throw new Error('카카오 클라이언트 ID가 설정되지 않았습니다.');
    }

    const baseUrl = 'https://kauth.kakao.com/oauth/authorize';
    const params = new URLSearchParams({
      client_id: this.KAKAO_CLIENT_ID,
      redirect_uri: this.KAKAO_REDIRECT_URI,
      response_type: 'code',
      scope: 'profile_nickname,profile_image,account_email',
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * 카카오 OAuth 콜백 처리 (인증 코드 -> 토큰 -> 사용자 정보)
   */
  async handleKakaoCallback(code: string) {
    try {
      console.log('카카오 OAuth 콜백 처리 시작');

      // 1. 인증 코드로 액세스 토큰 획득
      const tokenResponse = await this.exchangeCodeForToken(code);
      
      // 2. 액세스 토큰으로 사용자 정보 조회
      const userInfo = await this.getKakaoUserInfo(tokenResponse.access_token);

      return {
        kakaoId: userInfo.id.toString(),
        nickname: userInfo.kakao_account?.profile?.nickname || '카카오 사용자',
        email: userInfo.kakao_account?.email,
        profileImage: userInfo.kakao_account?.profile?.profile_image_url,
      };
    } catch (error) {
      console.error('카카오 OAuth 콜백 처리 실패:', error);
      throw new UnauthorizedException('카카오 로그인 처리에 실패했습니다.');
    }
  }

  /**
   * 인증 코드를 액세스 토큰으로 교환
   */
  private async exchangeCodeForToken(code: string): Promise<KakaoTokenResponse> {
    try {
      const response = await axios.post<KakaoTokenResponse>(
        'https://kauth.kakao.com/oauth/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.KAKAO_CLIENT_ID!,
          client_secret: this.KAKAO_CLIENT_SECRET || '',
          redirect_uri: this.KAKAO_REDIRECT_URI,
          code,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('카카오 토큰 교환 실패:', error.response?.data || error.message);
      throw new UnauthorizedException('카카오 토큰 교환에 실패했습니다.');
    }
  }

  /**
   * 액세스 토큰으로 카카오 사용자 정보 조회
   */
  private async getKakaoUserInfo(accessToken: string): Promise<KakaoUserInfo> {
    try {
      const response = await axios.get<KakaoUserInfo>('https://kapi.kakao.com/v2/user/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      });

      return response.data;
    } catch (error) {
      console.error('카카오 사용자 정보 조회 실패:', error.response?.data || error.message);
      throw new UnauthorizedException('카카오 사용자 정보 조회에 실패했습니다.');
    }
  }

  /**
   * 카카오 토큰 검증 및 사용자 정보 조회 (레거시 메서드)
   */
  async validateKakaoToken(kakaoToken: string) {
    try {
      console.log('카카오 토큰 검증 시작:', kakaoToken.substring(0, 20) + '...');
      
      // 카카오 API로 토큰 검증 및 사용자 정보 조회
      const response = await axios.get<KakaoUserInfo>('https://kapi.kakao.com/v2/user/me', {
        headers: {
          'Authorization': `Bearer ${kakaoToken}`,
          'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      });

      const kakaoUserInfo = response.data;
      console.log('카카오 API 응답 성공:', {
        id: kakaoUserInfo.id,
        nickname: kakaoUserInfo.kakao_account?.profile?.nickname,
        hasEmail: !!kakaoUserInfo.kakao_account?.email,
      });

      return {
        kakaoId: kakaoUserInfo.id.toString(),
        nickname: kakaoUserInfo.kakao_account?.profile?.nickname || '카카오 사용자',
        email: kakaoUserInfo.kakao_account?.email,
        profileImage: kakaoUserInfo.kakao_account?.profile?.profile_image_url,
      };
    } catch (error) {
      console.error('카카오 토큰 검증 실패:', error.response?.data || error.message);
      throw new UnauthorizedException('유효하지 않은 카카오 토큰입니다.');
    }
  }

  async loginOrCreateUser(kakaoUserInfo: any) {
    let user = await this.userService.findByKakaoId(kakaoUserInfo.kakaoId);
    
    if (!user) {
      console.log('새 사용자 생성:', kakaoUserInfo.kakaoId);
      user = await this.userService.create(kakaoUserInfo);
    } else {
      console.log('기존 사용자 로그인:', kakaoUserInfo.kakaoId);
      await this.userService.updateLastLogin((user as any)._id.toString());
    }

    return user;
  }

  async generateJWT(user: any) {
    const payload = { 
      sub: user._id.toString(), 
      kakaoId: user.kakaoId,
      nickname: user.nickname,
    };
    
    const accessToken = this.jwtService.sign(payload);
    
    return {
      accessToken,
      user: {
        id: user._id.toString(),
        kakaoId: user.kakaoId,
        nickname: user.nickname,
        profileImage: user.profileImage,
        email: user.email,
      },
    };
  }

  /**
   * 사용자 ID로 사용자 찾기
   */
  async findUserById(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  /**
   * 로그아웃 (토큰 블랙리스트에 추가)
   */
  async logout(userId: string): Promise<void> {
    try {
      console.log('사용자 로그아웃 처리:', userId);
      
      // 실제로는 Redis 등에 토큰을 블랙리스트로 관리
      // 여기서는 간단히 로그만 출력
      console.log('✅ 로그아웃 완료');
      
    } catch (error) {
      console.error('로그아웃 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 계정 삭제 (카카오 연결 해제 포함)
   */
  async deleteAccount(userId: string): Promise<void> {
    try {
      console.log('계정 삭제 시작:', userId);
      
      // 1. 사용자 정보 조회
      const user = await this.findUserById(userId);
      
      // 2. 카카오에서 연결 해제 (사용자의 액세스 토큰이 필요하지만 여기서는 생략)
      // await this.unlinkKakaoAccount(user.kakaoId);
      console.log('카카오 연결 해제 (구현 필요):', user.kakaoId);
      
      // 3. 사용자 데이터 삭제
      await this.userService.deleteUser(userId);
      
      console.log('✅ 계정 삭제 완료');
      
    } catch (error) {
      console.error('계정 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 토큰이 블랙리스트에 있는지 확인
   */
  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * 토큰을 블랙리스트에 추가
   */
  addToBlacklist(token: string): void {
    this.blacklistedTokens.add(token);
  }
}
