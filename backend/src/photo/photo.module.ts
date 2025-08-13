import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { Photo, PhotoSchema } from './schemas/photo.schema';
import { multerConfig } from '../config/multer.config';
import { S3Service } from '../common/s3.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Photo.name, schema: PhotoSchema }]),
    MulterModule.register(multerConfig),
  ],
  providers: [PhotoService, S3Service],
  controllers: [PhotoController],
  exports: [PhotoService],
})
export class PhotoModule {}
