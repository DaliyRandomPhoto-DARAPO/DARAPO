import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 글로벌 prefix 설정
  app.setGlobalPrefix('api');
  
  // CORS 설정
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 전역 Validation Pipe 설정
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('DARAPO API')
    .setDescription('Daily Random Photo API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 모든 네트워크 인터페이스에서 수신하도록 설정 (안드로이드 접근 허용)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 서버가 실행되었습니다:`);
  console.log(`📱 로컬: http://localhost:${port}/api`);
  console.log(`🌐 네트워크: http://192.168.45.191:${port}/api`);
  console.log(`📚 API 문서: http://localhost:${port}/api`);
}
bootstrap();
