import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { MissionModule } from '../mission/mission.module';
import { PhotoModule } from '../photo/photo.module';
import { UserModule } from '../user/user.module';
import { HealthModule } from '../health/health.module';
import { validateEnv } from '../config/env.validation';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// 애플리케이션의 루트 모듈
// - 환경설정, DB 연결, 주요 하위 모듈을 초기화합니다.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
  // ttl: 제한 기간 (밀리초 단위), limit: 해당 기간 내 허용 요청 수
  ttl: 60000, // 밀리초
  limit: 120,
      },
    ]),
    // Valkey (Redis 호환) 캐시 설정
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (cs: ConfigService) => ({
        // cache-manager-redis-store (node-redis v4) 사용
        store: (await redisStore({
          socket: {
            host: cs.get<string>('VALKEY_HOST') || 'localhost',
            port: cs.get<number>('VALKEY_PORT') || 6379,
          },
          password: cs.get<string>('VALKEY_PASSWORD') || undefined,
        })) as any,
        ttl: 300,
      }),
    }),
    
    // Bull 큐도 Valkey 사용
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        redis: {
          host: cs.get<string>('VALKEY_HOST') || 'localhost',
          port: cs.get<number>('VALKEY_PORT') || 6379,
          password: cs.get<string>('VALKEY_PASSWORD') || undefined,
        },
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        uri: cs.get<string>('MONGODB_URI'), // Atlas 연결 문자열
        // Atlas 최적화 설정
        maxPoolSize: 10, // 연결 풀 크기
        serverSelectionTimeoutMS: 30000, // 서버 선택 타임아웃 증가
        socketTimeoutMS: 45000, // 소켓 타임아웃
        bufferCommands: false, // 연결 실패 시 명령어 버퍼링 비활성화
        tls: true,
        tlsInsecure: false,
        retryAttempts: 10, // 재시도 횟수 증가
        retryDelay: 5000, // 재시도 간격 (5초)
      }),
    }),
    AuthModule,
    MissionModule,
    PhotoModule,
    UserModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}