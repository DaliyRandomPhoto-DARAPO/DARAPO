import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { ImageProcessor } from './processors/photo.processor';
import { Photo, PhotoSchema } from './schemas/photo.schema';
import { multerConfig } from '../config/multer.config';
import { S3Service } from '../common/s3.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Photo.name, schema: PhotoSchema }]),
    MulterModule.register(multerConfig),
    BullModule.registerQueue({
      name: 'image-processing',
    }),
    CacheModule.register(),
  ],
  providers: [PhotoService, S3Service, ImageProcessor],
  controllers: [PhotoController],
  exports: [PhotoService],
})
export class PhotoModule {}
