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
  const mode = String(this.configService.get('AUTH_STATELESS') ?? '').toLowerCase();
  // 기본값: stateless ('' 또는 undefined 포함) → 'false'로 명시해야만 상태저장 모드
  this.stateless = mode !== 'false';
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
      let isBlacklisted = false;
      try {
        isBlacklisted = await this.cacheService.isTokenBlacklisted(token);
      } catch {
        // 캐시 오류 시 가용성 우선: 블랙리스트 체크를 건너뜀
        isBlacklisted = false;
      }
      if (isBlacklisted) {
        throw new UnauthorizedException('토큰이 무효화되었습니다.');
      }

      // 2. Redis에 저장된 유효 토큰과 비교
      if (userId) {
        try {
          const storedTokens = await this.cacheService.getUserTokens(userId);
          // 저장 토큰이 없거나 일치하지 않더라도 가용성 위해 통과
          if (storedTokens && storedTokens.accessToken && storedTokens.accessToken !== token) {
            throw new UnauthorizedException('유효하지 않은 토큰입니다.');
          }
        } catch {
          // 캐시 오류 시 통과 (상태저장 모드에서도 장애 전파 방지)
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
