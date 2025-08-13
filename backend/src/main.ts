import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
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
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

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

  const host = process.env.HOST ?? 'localhost';
  console.log(`🚀 서버가 실행되었습니다:`);
  console.log(`📱 로컬: http://localhost:${port}/api`);
  console.log(`🌐 네트워크: http://${host}:${port}/api`);
  if (!isProd) {
    console.log(`📚 API 문서: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
