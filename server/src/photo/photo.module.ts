import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { BullModule } from '@nestjs/bull';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { ImageProcessor } from './processors/photo.processor';
import { Photo, PhotoSchema } from './schemas/photo.schema';
import { multerConfig } from '../config/multer.config';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    MongooseModule.forFeature([{ name: Photo.name, schema: PhotoSchema }]),
    MulterModule.register(multerConfig),
    BullModule.registerQueue({
      name: 'image-processing',
    }),
    // CacheModule는 AppModule에서 글로벌로 등록됨
  ],
  providers: [PhotoService, ImageProcessor],
  controllers: [PhotoController],
  exports: [PhotoService],
})
export class PhotoModule {}
