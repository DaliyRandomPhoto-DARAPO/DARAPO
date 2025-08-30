import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './schemas/user.schema';
import { S3Service } from '../common/s3.service';
import { PhotoModule } from '../photo/photo.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PhotoModule,
    CommonModule, // CacheService 사용을 위해 추가
  ],
  controllers: [UserController],
  providers: [UserService, S3Service],
  exports: [UserService],
})
export class UserModule {}
