import { Controller, Post, Body, BadRequestException, Get, Res, Delete, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { NativeLoginDto, WebCallbackDto } from './dto/kakao.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('kakao')
  @ApiOperation({ summary: '카카오 OAuth 인증 URL 반환' })
  @ApiResponse({ status: 200, description: '인증 URL 반환' })
  async getKakaoAuthUrl() {
    const authUrl = await this.authService.getKakaoAuthUrl();
    return { authUrl };
  }

  @Get('kakao/callback')
  @ApiOperation({ summary: '카카오 OAuth 완전한 콜백 처리 (브라우저용)' })
  @ApiResponse({ status: 302, description: '앱으로 리다이렉트' })
  async kakaoWebCallback(@Query() query: { code?: string; error?: string; state?: string }, @Res() res: Response) {
    try {
      if (query.error) {
        const errorUrl = `darapo://auth/callback?error=${encodeURIComponent(query.error)}`;
        return res.redirect(errorUrl);
      }

      if (!query.code) {
        const errorUrl = `darapo://auth/callback?error=${encodeURIComponent('인증 코드를 받지 못했습니다.')}`;
        return res.redirect(errorUrl);
      }

      const kakaoUserInfo = await this.authService.handleKakaoCallback(query.code);
      const authResult = await this.authService.loginOrCreateUser(kakaoUserInfo);
      
      const successUrl = `darapo://auth/callback?` +
        `success=true&` +
        `token=${encodeURIComponent(authResult.accessToken)}&` +
        `refresh=${encodeURIComponent(authResult.refreshToken)}&` +
        `user=${encodeURIComponent(JSON.stringify(authResult.user))}`;
      
      return res.redirect(successUrl);
      
    } catch (error) {
      console.error('OAuth 처리 실패:', error.message);
      const errorUrl = `darapo://auth/callback?error=${encodeURIComponent('로그인 처리 중 오류가 발생했습니다.')}`;
      return res.redirect(errorUrl);
    }
  }

  @Post('kakao/callback')
  @ApiOperation({ summary: '카카오 OAuth 콜백 처리' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async kakaoCallback(@Body() body: { code: string; state?: string }) {
  throw new BadRequestException('deprecated endpoint');
  }

  /**
   * 딥링크 동작을 빠르게 검증하기 위한 개발용 엔드포인트
   * 사용 방법(디바이스/시뮬레이터 브라우저에서 호출):
   *   GET /api/auth/debug/deeplink?token=<ACCESS>&user=<URLENCODED_JSON>
   * 주의: ENABLE_DEBUG_ENDPOINTS=true 환경에서만 활성화됩니다(운영 비활성 권장).
   */
  @Get('debug/deeplink')
  @ApiOperation({ summary: '딥링크 리다이렉트 디버그(DEV 전용)' })
  async debugDeeplink(
    @Query('token') token: string,
    @Res() res: Response,
    @Query('user') user?: string,
  ) {
    if (process.env.ENABLE_DEBUG_ENDPOINTS !== 'true') {
      throw new ForbiddenException('Debug endpoint is disabled');
    }
    if (!token) {
      throw new BadRequestException('token is required');
    }
    const successUrl = `darapo://auth/callback?success=true&token=${encodeURIComponent(token)}${
      user ? `&user=${encodeURIComponent(user)}` : ''
    }`;
    return res.redirect(successUrl);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@Request() req) {
    try {
      await this.authService.logout(req.user.sub);
      return { message: '로그아웃되었습니다.' };
    } catch (error) {
      console.error('로그아웃 실패:', error.message);
      throw error;
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  async refreshToken(@Request() req, @Body('refreshToken') rt?: string) {
    const token = rt ?? req.cookies?.rt;
    if (!token) {
      throw new BadRequestException('refresh token required');
    }
    return this.authService.refreshAccessToken(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '현재 사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 정보 반환' })
  async getCurrentUser(@Request() req) {
    try {
      const user = await this.authService.findUserById(req.user.sub);
      
      return {
        id: (user as any)._id.toString(),
        kakaoId: user.kakaoId,
        nickname: user.nickname,
        profileImage: user.profileImage,
        email: user.email,
      };
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error.message);
      throw error;
    }
  }
}
