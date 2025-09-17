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
    // Privacy policy direct response (Google Play / App Store crawler friendly)
    expressApp.get(
      '/privacy',
      (_req: express.Request, res: express.Response) => {
        res.send(`
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>개인정보처리방침 | DARAPO</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; max-width: 860px; margin: 0 auto; padding: 24px; }
    h1 { color: #333; } h2 { color: #555; margin-top: 32px; }
    ul { margin: 16px 0; } li { margin: 8px 0; }
    .contact { background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0; }
  </style>
</head>
<body>
  <h1>개인정보처리방침</h1>
  <p style="color: #666;">최종 업데이트: 2025-08-13</p>
  
  <p>darapo – Daily Random Photo(이하 "서비스")는 이용자의 개인정보를 중요하게 생각하며 아래와 같이 처리합니다. 본 페이지는 Google Play 심사 및 이용자 안내를 위한 공개 페이지로, 서비스 제공에 필요한 최소한의 정보만을 수집·처리합니다.</p>

  <h2>1. 수집하는 개인정보</h2>
  <ul>
    <li>카카오 로그인 시: 카카오 계정 식별자(kakaoId), 닉네임, 프로필 이미지(선택적)</li>
    <li>사용자가 업로드한 사진: 서버(및 AWS S3)에 저장되며, 미션 제공 및 피드 노출을 위해 사용됩니다.</li>
    <li>이메일: 카카오에서 제공되는 경우 저장될 수 있습니다(선택적).</li>
    <li>서비스 운영 로그(오류·접속 기록 등): 서비스 개선·보안 목적, 개인 식별 최소화 처리</li>
  </ul>

  <h2>2. 이용 목적</h2>
  <ul>
    <li>회원 식별 및 인증, 서비스 제공 및 운영</li>
    <li>사진 업로드 및 피드 제공</li>
    <li>오류 분석 및 보안/안정성 향상</li>
  </ul>

  <h2>3. 보관 및 파기</h2>
  <ul>
    <li>이용자가 탈퇴 요청(앱 내 '탈퇴' 기능 또는 문의)을 하면 계정 정보 및 사용자가 업로드한 사진(저장된 S3 객체 포함)을 삭제합니다.</li>
    <li>백업·로그 등으로 인해 즉시 삭제가 어렵거나 법적 보관 의무가 있는 경우, 해당 목적에 필요한 최소 기간 동안만 보관하며 지체 없이 파기합니다 (<strong>통상 30일 이내 처리 원칙</strong>).</li>
  </ul>

  <h2>4. 제3자 제공과 처리위탁</h2>
  <ul>
    <li>법령에 근거하거나 이용자의 동의가 있는 경우를 제외하고 제3자에게 제공하지 않습니다.</li>
    <li>처리 위탁: 이미지 저장·전송을 위해 AWS S3 등 클라우드 서비스를 사용합니다. 소셜 로그인은 카카오를 통해 이뤄지며, 관련 프로필 정보가 제공될 수 있습니다.</li>
  </ul>

  <h2>5. 이용자의 권리</h2>
  <ul>
    <li>열람, 정정, 삭제, 처리정지 요구가 가능합니다.</li>
    <li>앱 내 문의 또는 아래 연락처로 요청하실 수 있습니다.</li>
  </ul>

  <h2>6. 정보보안</h2>
  <p>전송 구간 암호화, 접근 통제, 최소 권한 원칙 등 합리적인 보호 조치를 적용합니다.</p>

  <h2>7. 문의처</h2>
  <div class="contact">
    <p><strong>이메일:</strong> <a href="mailto:hhee200456@gmail.com">hhee200456@gmail.com</a></p>
  </div>

  <h2 id="delete-account">8. 계정 삭제 방법</h2>
  <ul>
    <li>앱 내 <strong>설정 → 탈퇴</strong> 메뉴를 통해 계정 및 관련 데이터를 삭제할 수 있습니다.</li>
    <li><strong>삭제되는 데이터</strong>: 카카오 로그인 계정 식별자(kakaoId), 닉네임/프로필 이미지(선택 이메일 포함 가능), 사용자가 업로드한 사진, 서비스 운영 로그</li>
    <li><strong>처리 시점</strong>: 탈퇴 즉시 서비스 내에서 비활성/삭제 처리되며, 백업 및 로그에 남아 있는 데이터는 <strong>30일 이내</strong> 완전 파기합니다. 법적 보관 의무가 있는 경우 해당 기간 동안만 최소한으로 보관합니다.</li>
    <li><strong>대체 요청 경로</strong>: 앱 사용이 불가능한 경우 <a href="mailto:hhee200456@gmail.com">hhee200456@gmail.com</a> 으로 계정 삭제를 요청할 수 있습니다. 본인 확인 후 처리합니다.</li>
  </ul>

  <footer style="margin-top: 40px; color: #777; font-size: 14px;">
    <p>본 페이지는 서비스 업데이트에 따라 변경될 수 있으며, 주요 변경 시 본 페이지를 통해 고지합니다.</p>
    <p>URL: https://api.darapo.site/privacy</p>
  </footer>
</body>
</html>
        `);
      },
    );
    expressApp.get(
      '/privacy/',
      (_req: express.Request, res: express.Response) => {
        res.redirect(301, '/privacy');
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
