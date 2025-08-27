import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppVersionController } from './app-version/app-version.controller';
import { AppVersionService } from './app-version/app-version.service';
import { AuthModule } from './auth/auth.module';
import { MissionModule } from './mission/mission.module';
import { PhotoModule } from './photo/photo.module';
import { UserModule } from './user/user.module';
import { HealthModule } from './health/health.module';
import { validateEnv } from './config/env.validation';
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
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        uri:
          cs.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/darapo',
  // 필요시 환경 변수로 DB 이름 지정
  dbName: cs.get<string>('MONGODB_DB') ?? undefined,
      }),
    }),
    AuthModule,
    MissionModule,
    PhotoModule,
    UserModule,
    HealthModule,
  ],
  controllers: [AppController, AppVersionController],
  providers: [AppService, AppVersionService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}