// JWT 검증 전략: 토큰에서 사용자 정보를 추출하고 유효성 검사
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../common/cache.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    const secret = configService.getOrThrow<string>('JWT_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // 토큰이 블랙리스트에 있는지 확인 (임시로 비활성화 - Guard에서 처리 권장)
    // const token = this.getTokenFromRequest();
    // if (token) {
    //   const isBlacklisted = await this.cacheService.isTokenBlacklisted(token);
    //   if (isBlacklisted) {
    //     throw new UnauthorizedException('Token has been revoked');
    //   }
    // }

    return {
      sub: payload.sub,
      kakaoId: payload.kakaoId,
      nickname: payload.nickname,
    };
  }

  private getTokenFromRequest(): string | null {
    // 요청에서 토큰 추출 (필요 시 구현)
    // 현재는 간단히 null 반환, 실제로는 request에서 추출
    return null; // TODO: request에서 토큰 추출 로직 추가
  }
}
