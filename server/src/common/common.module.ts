// 공통 모듈: 캐시, S3, 필터, 인터셉터 등 공통 기능 제공
import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { S3Service } from './s3.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [],
  providers: [CacheService, S3Service, JwtAuthGuard],
  exports: [CacheService, S3Service, JwtAuthGuard],
})
export class CommonModule {}
