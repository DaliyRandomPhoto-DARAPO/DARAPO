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
import {
  setupSecurity,
  setupMonitoring,
} from './common/middleware/security.middleware';
import {
  MemoryOptimizer,
  memoryOptimizationMiddleware,
} from './common/utils/memoryOptimizer';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  try {
    // SSM에서 환경 변수 로드 (SSM_ENABLED === 'true'일 때만)
    if (process.env.SSM_ENABLED === 'true') {
      const ssmConfig = new SSMConfigService();
      try {
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
      } catch (error) {
        console.warn('SSM 로드 실패, .env 파일 사용:', error?.message ?? error);
        // .env 파일이 이미 ConfigModule에 의해 로드됨
      }
    } else {
      // 명시적으로 SSM 비활성화되어 있으므로 .env/프로세스 환경 변수만 사용
    }

    const app = await NestFactory.create(AppModule, {
      logger: WinstonModule.createLogger({
        transports: [
          new winston.transports.Console({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ],
      }),
    });

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
    app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());
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

    // Public routes for external crawlers/bots (outside of global 'api' prefix)
    const expressApp = app.getHttpAdapter().getInstance();
    // Privacy policy redirect (Google Play / App Store crawler friendly)
    expressApp.get(
      '/privacy',
      (_req: express.Request, res: express.Response) => {
        res.redirect(301, 'https://darapo.app/privacy');
      },
    );
    expressApp.get(
      '/privacy/',
      (_req: express.Request, res: express.Response) => {
        res.redirect(301, 'https://darapo.app/privacy');
      },
    );
    // Quietly handle favicon requests to avoid noisy 404s
    expressApp.get(
      '/favicon.ico',
      (_req: express.Request, res: express.Response) => {
        res.status(204).end();
      },
    );

    // 모든 네트워크 인터페이스에서 수신하도록 설정 (안드로이드 접근 허용)
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Server running on port ${port}`);
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}
void bootstrap();
