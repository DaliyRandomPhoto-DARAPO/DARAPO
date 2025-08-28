// 공통 모듈: 캐시, S3, 필터, 인터셉터 등 공통 기능 제공
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { S3Service } from './s3.service';

@Module({
  imports: [CacheModule.register()],
  providers: [CacheService, S3Service],
  exports: [CacheService, S3Service],
})
export class CommonModule {}
