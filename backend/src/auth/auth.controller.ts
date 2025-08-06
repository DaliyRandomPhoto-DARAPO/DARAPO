import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('kakao-login')
  @ApiOperation({ summary: '카카오 로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  async kakaoLogin(@Body() body: { kakaoToken: string }) {
    // 임시로 가짜 로그인 처리 (추후 실제 카카오 API 연동)
    return {
      accessToken: 'fake-jwt-token',
      user: {
        id: 'fake-user-id',
        nickname: '테스트 사용자',
        profileImage: null,
      },
    };
  }
}
