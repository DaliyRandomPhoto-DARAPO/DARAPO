// 서비스 헬스체크 엔드포인트 (liveness, readiness)
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get('liveness')
  @ApiOperation({ summary: '애플리케이션 생존 체크' })
  liveness() {
    return { status: 'ok' };
  }

  @Get('readiness')
  @ApiOperation({ summary: '의존성(예: DB) 준비 상태 체크' })
  readiness() {
    return {
      db:
        this.connection.readyState === ConnectionStates.connected
          ? 'up'
          : 'down',
    };
  }
}
