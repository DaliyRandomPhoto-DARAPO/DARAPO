// JWT 기반 인증 가드
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CacheService } from '../../common/cache.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly cacheService: CacheService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // JWT Strategy의 검증을 먼저 수행
    const isValid = await super.canActivate(context);
    if (!isValid) {
      return false;
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
