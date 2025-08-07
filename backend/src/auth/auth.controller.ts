import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('kakao-login')
  @ApiOperation({ summary: '카카오 로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async kakaoLogin(@Body() body: { kakaoToken: string }) {
    if (!body.kakaoToken) {
      throw new BadRequestException('카카오 토큰이 필요합니다.');
    }

    try {
      console.log('카카오 로그인 요청 수신');
      
      // 카카오 토큰 검증 및 사용자 정보 조회
      const kakaoUserInfo = await this.authService.validateKakaoToken(body.kakaoToken);
      
      // 사용자 로그인 또는 회원가입 처리
      const user = await this.authService.loginOrCreateUser(kakaoUserInfo);
      
      // JWT 토큰 생성 및 반환
      const result = await this.authService.generateJWT(user);
      
      console.log('카카오 로그인 성공:', result.user.nickname);
      
      return result;
    } catch (error) {
      console.error('카카오 로그인 처리 실패:', error.message);
      throw error;
    }
  }
}
