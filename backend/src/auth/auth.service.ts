import { Injectable, UnauthorizedException } from '@nestjs/common';
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

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

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
}
