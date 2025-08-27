import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// 루트 컨트롤러
// 간단한 헬스체크 또는 기본 엔드포인트용으로 사용됩니다.
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // 루트 GET 엔드포인트
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
