// JWT 기반 인증 가드
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CacheService } from '../../common/cache.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly stateless: boolean;

  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.stateless = String(this.configService.get('AUTH_STATELESS') || '') === 'true';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // JWT Strategy의 검증을 먼저 수행
    const isValid = await super.canActivate(context);
    if (!isValid) {
      return false;
    }

    // Stateless 모드면 캐시/블랙리스트 검증을 건너뜁니다.
    if (this.stateless) {
      return true;
    }

    // 토큰 추출 및 블랙리스트 확인
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    const userId = request.user?.sub;

    if (token) {
      // 1. 블랙리스트 확인
      const isBlacklisted = await this.cacheService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('토큰이 무효화되었습니다.');
      }

      // 2. Redis에 저장된 유효 토큰과 비교
      if (userId) {
        const storedTokens = await this.cacheService.getUserTokens(userId);
        if (!storedTokens || storedTokens.accessToken !== token) {
          throw new UnauthorizedException('유효하지 않은 토큰입니다.');
        }
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}
