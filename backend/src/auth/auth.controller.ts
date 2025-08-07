import { Controller, Post, Body, BadRequestException, Get, Res, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

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
        console.error('카카오 OAuth 에러:', query.error);
        // 에러 발생 시 앱으로 에러 정보 전달
        const errorUrl = `darapo://auth/callback?error=${encodeURIComponent(query.error)}`;
        return res.redirect(errorUrl);
      }

      if (!query.code) {
        console.error('인증 코드 누락');
        const errorUrl = `darapo://auth/callback?error=${encodeURIComponent('인증 코드를 받지 못했습니다.')}`;
        return res.redirect(errorUrl);
      }

      console.log('🔄 백엔드에서 완전한 OAuth 처리 시작');
      
      // 1. 인증 코드로 토큰 획득 및 사용자 정보 조회
      const kakaoUserInfo = await this.authService.handleKakaoCallback(query.code);
      console.log('✅ 카카오 사용자 정보 획득:', kakaoUserInfo.nickname);
      
      // 2. 사용자 로그인 또는 회원가입 처리
      const user = await this.authService.loginOrCreateUser(kakaoUserInfo);
      console.log('✅ 사용자 데이터베이스 처리 완료');
      
      // 3. JWT 토큰 생성
      const authResult = await this.authService.generateJWT(user);
      console.log('✅ JWT 토큰 생성 완료');
      
      // 4. 앱으로 성공 정보와 함께 리다이렉트
      const successUrl = `darapo://auth/callback?` +
        `success=true&` +
        `token=${encodeURIComponent(authResult.accessToken)}&` +
        `user=${encodeURIComponent(JSON.stringify(authResult.user))}`;
      
      console.log('🎉 OAuth 완료, 앱으로 리다이렉트');
      return res.redirect(successUrl);
      
    } catch (error) {
      console.error('❌ 카카오 OAuth 완전 처리 실패:', error.message);
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
    if (!body.code) {
      throw new BadRequestException('인증 코드가 필요합니다.');
    }

    try {
      console.log('카카오 OAuth 콜백 처리 시작');
      
      // 인증 코드로 토큰 획득 및 사용자 정보 조회
      const kakaoUserInfo = await this.authService.handleKakaoCallback(body.code);
      
      // 사용자 로그인 또는 회원가입 처리
      const user = await this.authService.loginOrCreateUser(kakaoUserInfo);
      
      // JWT 토큰 생성 및 반환
      const result = await this.authService.generateJWT(user);
      
      console.log('카카오 로그인 성공:', result.user.nickname);
      
      return result;
    } catch (error) {
      console.error('카카오 OAuth 콜백 처리 실패:', error.message);
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@Request() req) {
    try {
      console.log('로그아웃 요청:', req.user.sub);
      
      // 서버 측 토큰 무효화 처리
      await this.authService.logout(req.user.sub);
      
      return { message: '로그아웃되었습니다.' };
    } catch (error) {
      console.error('로그아웃 실패:', error.message);
      throw error;
    }
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  async refreshToken(@Request() req) {
    try {
      console.log('토큰 갱신 요청:', req.user.sub);
      
      const user = await this.authService.findUserById(req.user.sub);
      const result = await this.authService.generateJWT(user);
      
      return result;
    } catch (error) {
      console.error('토큰 갱신 실패:', error.message);
      throw error;
    }
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

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '계정 삭제 (카카오 연결 해제 포함)' })
  @ApiResponse({ status: 200, description: '계정 삭제 성공' })
  async deleteAccount(@Request() req) {
    try {
      console.log('계정 삭제 요청:', req.user.sub);
      
      // 카카오 연결 해제 및 사용자 데이터 삭제
      await this.authService.deleteAccount(req.user.sub);
      
      return { message: '계정이 삭제되었습니다.' };
    } catch (error) {
      console.error('계정 삭제 실패:', error.message);
      throw error;
    }
  }

  @Post('kakao-login')
  @ApiOperation({ summary: '카카오 로그인 (레거시)' })
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
