import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { join } from 'path';
import * as express from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestTimingInterceptor } from './common/interceptors/request-timing.interceptor';
import { SSMConfigService } from './config/ssm.config';
import { setupSecurity, setupMonitoring } from './common/middleware/security.middleware';
import { MemoryOptimizer, memoryOptimizationMiddleware } from './common/utils/memoryOptimizer';

async function bootstrap() {
  // SSM에서 환경 변수 로드
  const ssmConfig = new SSMConfigService();
  const ssmParams = await ssmConfig.getParameters([
    '/darapo/JWT_SECRET',
    '/darapo/MONGODB_URI',
    '/darapo/KAKAO_REST_API_KEY',
    '/darapo/KAKAO_CLIENT_SECRET',
    // 필요한 파라미터들 추가
  ]);

  // 환경 변수 설정
  Object.entries(ssmParams).forEach(([key, value]) => {
    process.env[key] = value;
  });

  const app = await NestFactory.create(AppModule);

  // 글로벌 prefix 설정
  app.setGlobalPrefix('api');

  // CORS 운영 도메인만 허용
  const isProd = process.env.NODE_ENV === 'production';
  const allowedOrigins = isProd
    ? ['https://darapo.app'] // 운영 도메인만 허용, 필요시 추가
    : true;
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // 프록시 신뢰 설정 (X-Forwarded-For 헤더 사용을 위해)
  app.getHttpAdapter().getInstance().set('trust proxy', 2);

  // 보안 및 모니터링 미들웨어 적용
  setupSecurity(app);
  setupMonitoring(app);

  // 메모리 최적화 미들웨어 적용
  app.use(memoryOptimizationMiddleware);

  // 메모리 모니터링 시작
  const memoryOptimizer = MemoryOptimizer.getInstance();
  memoryOptimizer.startMonitoring();

  // 전역 Validation Pipe/Filter/Interceptor 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
    new RequestTimingInterceptor(),
  );

  // Swagger 운영 환경 비활성화
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('DARAPO API')
      .setDescription('Daily Random Photo API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // 정적 파일 서빙: 업로드 이미지 제공
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // 모든 네트워크 인터페이스에서 수신하도록 설정 (안드로이드 접근 허용)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
