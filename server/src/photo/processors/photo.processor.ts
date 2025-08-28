// 사진 처리 큐 프로세서 - 이미지 리사이징 및 최적화
import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import sharp from 'sharp';
import { S3Service } from '../../common/s3.service';

export interface ImageProcessData {
  key: string;
  buffer: Buffer;
  contentType: string;
  width?: number;
  height?: number;
}

@Injectable()
@Processor('image-processing')
export class ImageProcessor {
  constructor(private readonly s3: S3Service) {}

  @Process()
  async process(job: Job<ImageProcessData>): Promise<any> {
    const { key, buffer, contentType } = job.data;

    try {
      Logger.log(`이미지 처리 시작: ${key}`, 'ImageProcessor');

      // 이미지 최적화
      const processed = await sharp(buffer)
        .rotate()
        .withMetadata({ exif: undefined })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      // S3 업로드
      await this.s3.uploadObject({
        key,
        body: processed,
        contentType: contentType.includes('jpeg') ? 'image/jpeg' : contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      });

      Logger.log(`이미지 처리 완료: ${key}`, 'ImageProcessor');
      return { key, size: processed.length };
    } catch (error) {
      Logger.error(`이미지 처리 실패: ${key}`, error.stack, 'ImageProcessor');
      throw error;
    }
  }
}
