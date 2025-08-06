import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validateKakaoToken(kakaoToken: string) {
    // 추후 카카오 API 호출하여 토큰 검증
    // 현재는 임시로 가짜 사용자 정보 반환
    return {
      kakaoId: 'fake-kakao-id',
      nickname: '테스트 사용자',
      email: 'test@example.com',
      profileImage: null,
    };
  }

  async loginOrCreateUser(kakaoUserInfo: any) {
    let user = await this.userService.findByKakaoId(kakaoUserInfo.kakaoId);
    
    if (!user) {
      user = await this.userService.create(kakaoUserInfo);
    } else {
      await this.userService.updateLastLogin((user as any)._id.toString());
    }

    return user;
  }
}
