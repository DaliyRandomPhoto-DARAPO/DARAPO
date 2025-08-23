import { Controller, Get, Put, Body, Headers, ForbiddenException } from '@nestjs/common';
import { AppVersionService, AppVersionRecord } from './app-version.service';

@Controller('app-version')
export class AppVersionController {
  constructor(private readonly svc: AppVersionService) {}

  @Get()
  get() {
    return this.svc.getRecord();
  }

  @Put()
  update(@Body() body: any, @Headers('x-admin-token') token?: string) {
    const adminToken = process.env.APP_ADMIN_TOKEN || '';
    if (!adminToken || token !== adminToken) {
      throw new ForbiddenException('관리자 토큰 필요');
    }

    const record: any = {
      latestVersion: body.latestVersion,
      updateUrl: body.updateUrl,
    };
    if (body.minRequiredVersion) record.minRequiredVersion = body.minRequiredVersion;
    if (typeof body.forceUpdate === 'boolean') record.forceUpdate = body.forceUpdate;

    const ok = this.svc.saveRecord(record);
    return { ok };
  }
}
