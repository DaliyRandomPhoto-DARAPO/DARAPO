// 역할 기반 접근 제어(간단 구현)
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly roles: string[] = []) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.roles.length) return true;
    const request = context.switchToHttp().getRequest();
    const user = request.user as { roles?: string[] } | undefined;
    if (!user?.roles) return false;
    return this.roles.some((r) => user.roles!.includes(r));
  }
}
