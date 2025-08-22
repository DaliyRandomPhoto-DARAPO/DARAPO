import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MissionModule } from './mission/mission.module';
import { PhotoModule } from './photo/photo.module';
import { UserModule } from './user/user.module';
import { HealthModule } from './health/health.module';
import { validateEnv } from './config/env.validation';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    // v6 스타일: 배열 형태, ttl은 ms 단위
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        uri:
          cs.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/darapo',
        dbName: cs.get<string>('MONGODB_DB') ?? undefined,
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
