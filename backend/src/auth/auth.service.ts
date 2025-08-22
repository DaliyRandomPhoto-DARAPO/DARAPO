import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import axios from 'axios';
import { KakaoClient } from './clients/kakao.client';
import { ConfigService } from '@nestjs/config';

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
  private readonly KAKAO_CLIENT_ID: string;
  private readonly KAKAO_CLIENT_SECRET: string;
  private readonly KAKAO_REDIRECT_URI: string;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly kakaoClient: KakaoClient,
    private readonly configService: ConfigService,
  ) {
    this.KAKAO_CLIENT_ID =
      this.configService.get<string>('KAKAO_REST_API_KEY')!;
    this.KAKAO_CLIENT_SECRET = this.configService.get<string>(
      'KAKAO_CLIENT_SECRET',
    )!;
    this.KAKAO_REDIRECT_URI =
      this.configService.get<string>('KAKAO_REDIRECT_URI')!;
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
      console.error('OAuth 콜백 처리 실패:', error);
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
      console.error('액세스 토큰 교환 실패:', error.response?.data || error);
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
  }) {
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
        (user as any)._id?.toString(),
        { name: user.nickname },
      );
    }
    return this.generateJWT(user);
  }

  async generateJWT(user: any) {
    const userId = user._id?.toString();
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
    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        kakaoId: user.kakaoId,
        name: user.name,
        nickname: user.nickname,
        profileImage: user.profileImage,
        email: user.email,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload: any = this.jwtService.verify(refreshToken);
      if (payload.typ !== 'refresh')
        throw new UnauthorizedException('invalid refresh token');
      const user = await this.findUserById(payload.sub);
      const newAccess = this.jwtService.sign({
        sub: (user as any)._id?.toString(),
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

  async logout(_userId: string): Promise<void> {
    // 실제로는 Redis 등에 토큰을 블랙리스트로 관리해야 함
    // 현재는 클라이언트에서 토큰 삭제로 처리
    return;
  }

  async deleteAccount(_userId: string): Promise<void> {
    // if needed, implement unlinking kakao here. currently we just delete user
    // const user = await this.findUserById(_userId);
    // 카카오 연결 해제 필요시 구현
    await this.userService.deleteUser(_userId);
  }

  // 블랙리스트 관련 로직은 Redis 세션 전략 도입 시 재설계 예정
}
