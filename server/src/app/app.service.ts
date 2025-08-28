import { Injectable } from '@nestjs/common';

// 애플리케이션 레벨 서비스
// 단순 예제/헬스체크 목적의 간단한 메서드를 제공합니다.
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!!!@!!';
  }
}
