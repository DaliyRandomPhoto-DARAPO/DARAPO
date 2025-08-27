// AWS S3 업로드/삭제/사인드 URL 생성을 담당하는 유틸 서비스
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private s3: S3Client;
  private bucket: string;
  private region: string;
  private signedUrlTtl: number;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get<string>('AWS_REGION') as string;
    this.bucket = this.config.get<string>('AWS_S3_BUCKET') as string;
    this.s3 = new S3Client({ region: this.region });
    this.signedUrlTtl = Number(
      this.config.get<string>('AWS_S3_SIGNED_URL_TTL') || 600,
    );
  }

  async uploadObject(params: {
    key: string;
    body: Buffer;
    contentType: string;
    cacheControl?: string;
  }) {
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl:
        params.cacheControl ?? 'public, max-age=31536000, immutable',
    });
    await this.s3.send(cmd);
    return { key: params.key };
  }

  async deleteObject(key: string) {
    const cmd = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });
    await this.s3.send(cmd);
  }

  async getSignedUrl(key: string, expiresInSec?: number) {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, cmd, {
      expiresIn: expiresInSec ?? this.signedUrlTtl,
    });
  }

  buildObjectKey(parts: {
    userId: string;
    originalName: string;
    ext?: string;
    date?: Date;
    uuid?: string;
  }) {
    const d = parts.date ?? new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const id = parts.uuid ?? uuidv4();
    const pathExt = (
      parts.ext ||
      parts.originalName.split('.').pop() ||
      'jpg'
    ).toLowerCase();
    return `users/${parts.userId}/${yyyy}/${mm}/${dd}/${id}.${pathExt}`;
  }
}
