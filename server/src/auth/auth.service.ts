// 인증 관련 비즈니스 로직을 담당하는 서비스
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import axios from 'axios';
import { KakaoClient } from './clients/kakao.client';
import { ConfigService } from '@nestjs/config';
import { logError } from '../common/utils/logger.util';
import { UserDocument } from '../user/schemas/user.schema';
import { CacheService } from '../common/cache.service';

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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // 카카오 OAuth 관련 설정값
  private readonly KAKAO_CLIENT_ID: string;
  private readonly KAKAO_CLIENT_SECRET: string;
  private readonly KAKAO_REDIRECT_URI: string;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly kakaoClient: KakaoClient,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    this.KAKAO_CLIENT_ID = this.configService.getOrThrow<string>('KAKAO_REST_API_KEY');
    this.KAKAO_CLIENT_SECRET = this.configService.getOrThrow<string>('KAKAO_CLIENT_SECRET');
    this.KAKAO_REDIRECT_URI = this.configService.getOrThrow<string>('KAKAO_REDIRECT_URI');
  }

  async getKakaoAuthUrl(): Promise<string> {
    if (!this.KAKAO_CLIENT_ID) throw new Error('카카오 클라이언트 ID 미설정');
    const baseUrl = 'https://kauth.kakao.com/oauth/authorize';
    const params = new URLSearchParams({
      client_id: this.KAKAO_CLIENT_ID,
      redirect_uri: this.KAKAO_REDIRECT_URI,
      response_type: 'code',
      scope: 'profile_nickname,profile_image,account_email',
    });
    return `${baseUrl}?${params.toString()}`;
  }

  async handleKakaoCallback(code: string) {
    try {
      const tokenResponse = await this.exchangeCodeForToken(code);
      const userInfo = await this.getKakaoUserInfo(tokenResponse.access_token);
      return {
        kakaoId: userInfo.id.toString(),
        nickname: userInfo.kakao_account?.profile?.nickname || '카카오 사용자',
        email: userInfo.kakao_account?.email,
        profileImage: userInfo.kakao_account?.profile?.profile_image_url,
      };
    } catch (error) {
      logError(this.logger, 'OAuth 콜백 처리 실패', error);
      throw new UnauthorizedException('카카오 로그인 처리 실패');
    }
  }

  private async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const tokenUrl = 'https://kauth.kakao.com/oauth/token';
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.KAKAO_CLIENT_ID,
        client_secret: this.KAKAO_CLIENT_SECRET,
        redirect_uri: this.KAKAO_REDIRECT_URI,
        code,
      });
      const response = await axios.post(tokenUrl, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return response.data;
    } catch (error) {
      logError(this.logger, '액세스 토큰 교환 실패', error);
      throw new UnauthorizedException('카카오 토큰 교환 실패');
    }
  }

  private async getKakaoUserInfo(accessToken: string): Promise<KakaoUserInfo> {
    return this.kakaoClient.getUserMe(accessToken);
  }

  async loginOrCreateUser(kakaoUserInfo: {
    kakaoId: string;
    nickname: string;
    email?: string;
    profileImage?: string;
  }): Promise<{ accessToken: string; refreshToken: string; user: UserDocument }> {
    let user = await this.userService.findByKakaoId(kakaoUserInfo.kakaoId);
    if (!user) {
      user = await this.userService.create({
        kakaoId: kakaoUserInfo.kakaoId,
        name: kakaoUserInfo.nickname,
        nickname: kakaoUserInfo.nickname,
        email: kakaoUserInfo.email,
        profileImage: kakaoUserInfo.profileImage,
      });
    } else if (!user.name) {
      user = await this.userService.updateProfile(
        user._id!.toString(),
        { name: user.nickname },
      );
    }
    return this.generateJWT(user!);
  }

  async generateJWT(user: UserDocument) {
    const userId = user._id!.toString();
    if (!userId) throw new Error('사용자 ID를 찾을 수 없습니다.');
    const payload = {
      sub: userId,
      kakaoId: user.kakaoId,
      nickname: user.nickname,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: userId, typ: 'refresh' },
      { expiresIn: '14d' },
    );

    // 토큰 정보를 Redis에 저장
    const tokenData = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + (14 * 24 * 60 * 60 * 1000), // 14일 후 만료
    };
    await this.cacheService.storeUserToken(userId, tokenData);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      // 리프레시 토큰이 블랙리스트에 있는지 확인
      const isBlacklisted = await this.cacheService.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('토큰이 블랙리스트에 있습니다.');
      }

      const payload: any = this.jwtService.verify(refreshToken);
      if (payload.typ !== 'refresh')
        throw new UnauthorizedException('invalid refresh token');
      const user = await this.findUserById(payload.sub);
      const newAccess = this.jwtService.sign({
        sub: user._id!.toString(),
        kakaoId: user.kakaoId,
        nickname: user.nickname,
      });
      return { accessToken: newAccess };
    } catch {
      throw new UnauthorizedException('refresh failed');
    }
  }

  async findUserById(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return user;
  }

  async logout(userId: string): Promise<void> {
    try {
      // 사용자의 모든 토큰을 블랙리스트에 추가
      await this.cacheService.revokeUserTokens(userId);
      this.logger.log(`사용자 ${userId}의 모든 토큰이 블랙리스트에 추가되었습니다.`);
    } catch (error) {
      logError(this.logger, '로그아웃 처리 실패', error);
      throw error;
    }
  }

  async deleteAccount(_userId: string): Promise<void> {
    // 계정 삭제 처리
    // (참고) 카카오 연결 해제 필요시 해당 로직을 추가 구현
    await this.userService.deleteUser(_userId);
  }

  // 블랙리스트 관련 로직은 Redis 기반 세션/토큰 관리 전략 도입 시 재설계 예정
}
