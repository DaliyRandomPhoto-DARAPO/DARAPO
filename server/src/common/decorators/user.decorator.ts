/**
 * 요청 컨텍스트에서 현재 사용자 정보를 추출하는 데코레이터
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as
      | { sub: string; kakaoId?: string; nickname?: string }
      | undefined;
  },
);
