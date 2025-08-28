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
    return { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  @Get('readiness')
  @ApiOperation({ summary: '의존성 준비 상태 체크' })
  readiness() {
    const dbStatus = this.connection.readyState === ConnectionStates.connected ? 'up' : 'down';
    
    return {
      status: dbStatus === 'up' ? 'ready' : 'not ready',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      // Valkey 상태도 체크할 수 있음
      cache: 'unknown', // 추후 Redis/Valkey 클라이언트 주입해서 체크
    };
  }
}
