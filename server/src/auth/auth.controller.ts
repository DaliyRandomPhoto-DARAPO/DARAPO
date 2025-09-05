// 인증 관련 엔드포인트 정의 (카카오 OAuth, 토큰 갱신, 로그아웃 등)
import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Res,
  UseGuards,
  Request,
  Query,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
// import { NativeLoginDto, WebCallbackDto } from './dto/kakao.dto'; // 미사용
import { logError } from '../common/utils/logger.util';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Get('kakao')
  @ApiOperation({ summary: '카카오 OAuth 인증 URL 반환' })
  @ApiResponse({ status: 200, description: '인증 URL 반환' })
  async getKakaoAuthUrl(@Query('returnUrl') returnUrl?: string) {
    let authUrl = await this.authService.getKakaoAuthUrl();

    // Expo Go 또는 커스텀 스킴 앱 복귀를 위해 state에 returnUrl을 담아 전달
    if (returnUrl) {
      try {
        // 간단한 유효성 검사: 허용 스킴만 통과
        const parsed = new URL(returnUrl);
        const allowedSchemes = new Set(['exp:', 'exps:', 'darapo:']);
        if (allowedSchemes.has(parsed.protocol)) {
          const sep = authUrl.includes('?') ? '&' : '?';
          authUrl = `${authUrl}${sep}state=${encodeURIComponent(returnUrl)}`;
        }
      } catch (e) {
        // invalid returnUrl — ignore
        Logger.warn(
          'invalid returnUrl in getKakaoAuthUrl',
          e?.message || e,
          'AuthController',
        );
      }
    }
    return { authUrl };
  }

  @Get('kakao/callback')
  @ApiOperation({ summary: '카카오 OAuth 완전한 콜백 처리 (브라우저용)' })
  @ApiResponse({ status: 302, description: '앱으로 리다이렉트' })
  async kakaoWebCallback(
    @Query() query: { code?: string; error?: string; state?: string },
    @Res() res: Response,
  ) {
    try {
      // state로 전달된 returnUrl 사용(Expo Go 등)
      const getRedirectBase = () => {
        const fallback = 'darapo://auth/callback';
        if (!query.state) return fallback;
        try {
          const parsed = new URL(query.state);
          const allowedSchemes = new Set(['exp:', 'exps:', 'darapo:']);
          return allowedSchemes.has(parsed.protocol) ? query.state : fallback;
        } catch {
          return fallback;
        }
      };
      const base = getRedirectBase();

      const renderDeepLinkHtml = (targetUrl: string, title = '로그인 처리 중...') => {
        // 간단한 HTML 브릿지: 일부 인앱 브라우저가 302로 커스텀 스킴을 막는 문제를 우회
        // 1) location.href로 시도
        // 2) iframe 백업 시도
        // 3) Android intent:// 백업 시도
        // 4) 수동 클릭 링크 제공
        const safe = JSON.stringify(targetUrl);
        // Android intent fallback 구성 (darapo 스킴 가정). state로 들어온 exp:// 등은 그대로 사용.
        const isDarapo = targetUrl.startsWith('darapo://');
        const intent = isDarapo
          ? 'intent://' + targetUrl.replace('darapo://', '') + '#Intent;scheme=darapo;package=com.darapo.drapoapp;end'
          : '';
        const intentJs = intent
          ? `try { if (/Android/i.test(navigator.userAgent)) { window.location.href = ${JSON.stringify(
              intent,
            )}; } } catch (e) {}`
          : '';
        const manualLink = `<a href="${targetUrl.replace(/"/g, '&quot;')}">앱으로 돌아가기</a>`;
        return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, 'Helvetica Neue', Arial, sans-serif; padding: 24px; line-height: 1.5; }
      .box { max-width: 560px; margin: 12vh auto; text-align: center; }
      .btn { display: inline-block; padding: 12px 16px; border-radius: 8px; background: #111; color: #fff; text-decoration: none; }
      .hint { color: #666; margin-top: 12px; font-size: 14px; }
      @media (prefers-color-scheme: dark) { body { background:#000; color:#fff; } .btn { background:#fee500; color:#000; } .hint{ color:#aaa; } }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>${title}</h1>
      <p>자동으로 앱으로 돌아갑니다. 잠시만 기다려 주세요.</p>
      <p>${manualLink}</p>
      <p class="hint">자동으로 이동하지 않으면 버튼을 눌러 주세요.</p>
    </div>
    <script>
      (function(){
        var target = ${safe};
        try { window.location.href = target; } catch (e) {}
        setTimeout(function(){
          try {
            var iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = target;
            document.body.appendChild(iframe);
          } catch (e) {}
        }, 150);
        setTimeout(function(){ ${intentJs} }, 400);
      })();
    </script>
  </body>
</html>`;
      };

      if (query.error) {
        const errorUrl = `${base}${base.includes('?') ? '&' : '?'}error=${encodeURIComponent(query.error)}`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(renderDeepLinkHtml(errorUrl, '로그인 실패'));
      }

      if (!query.code) {
        const errorUrl = `${base}${base.includes('?') ? '&' : '?'}error=${encodeURIComponent('인증 코드를 받지 못했습니다.')}`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(renderDeepLinkHtml(errorUrl, '로그인 실패'));
      }

      const kakaoUserInfo = await this.authService.handleKakaoCallback(
        query.code,
      );
      const authResult =
        await this.authService.loginOrCreateUser(kakaoUserInfo);

      const successUrl = `${base}${base.includes('?') ? '&' : '?'}success=true&token=${encodeURIComponent(authResult.accessToken)}&refresh=${encodeURIComponent(authResult.refreshToken)}&user=${encodeURIComponent(JSON.stringify(authResult.user))}`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(renderDeepLinkHtml(successUrl));
    } catch (error) {
      logError(this.logger, 'OAuth 처리 실패', error, 'AuthController');
      const base = 'darapo://auth/callback';
      const errorUrl = `${base}${base.includes('?') ? '&' : '?'}error=${encodeURIComponent('로그인 처리 중 오류가 발생했습니다.')}`;
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>로그인 오류</title></head><body>
        <p>로그인 처리 중 오류가 발생했습니다.</p>
        <a href="${errorUrl}">앱으로 돌아가기</a>
        <script>try{location.href='${errorUrl}';}catch(e){}</script>
      </body></html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }
  }

  @Post('kakao/callback')
  @ApiOperation({ summary: '카카오 OAuth 콜백 처리' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async kakaoCallback(@Body() _body: { code: string; state?: string }) {
    // deprecated endpoint
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
    } catch (err) {
      logError(this.logger, '로그아웃 실패', err, 'AuthController');
      throw err;
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
        name: (user as any).name,
        nickname: user.nickname,
        profileImage: user.profileImage,
        email: user.email,
      };
    } catch (error) {
      logError(this.logger, '사용자 정보 조회 실패', error, 'AuthController');
      throw error;
    }
  }
}
