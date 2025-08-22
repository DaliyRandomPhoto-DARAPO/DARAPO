import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Delete,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../config/multer.config';
import { S3Service } from '../common/s3.service';
import { PhotoService } from '../photo/photo.service';
import sharp from 'sharp';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly s3: S3Service,
    private readonly photoService: PhotoService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 프로필 조회' })
  async getMe(@Request() req: any) {
    const user: any = await this.userService.findById(req.user.sub);
    let profileUrl: string | null = user?.profileImage ?? null;
    if (
      profileUrl &&
      !/^https?:\/\//.test(profileUrl) &&
      !profileUrl.startsWith('/')
    ) {
      // S3 object key로 판단 → 프리사인드 URL 발급
      profileUrl = await this.s3.getSignedUrl(profileUrl);
    }
    return {
      id: user?._id?.toString(),
      kakaoId: user?.kakaoId,
      name: user?.name,
      nickname: user?.nickname,
      profileImage: profileUrl,
      email: user?.email,
    };
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 프로필 수정(닉네임, 이미지 URL 등)' })
  async updateMe(@Request() req: any, @Body() body: UpdateUserDto) {
    const updated: any = await this.userService.updateProfile(
      req.user.sub,
      body as any,
    );
    let profileUrl: string | null = updated?.profileImage ?? null;
    if (
      profileUrl &&
      !/^https?:\/\//.test(profileUrl) &&
      !profileUrl.startsWith('/')
    ) {
      profileUrl = await this.s3.getSignedUrl(profileUrl);
    }
    return {
      id: updated?._id?.toString(),
      kakaoId: updated?.kakaoId,
      name: updated?.name,
      nickname: updated?.nickname,
      profileImage: profileUrl,
      email: updated?.email,
    };
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로필 이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiResponse({ status: 201, description: '프로필 이미지 업로드 완료' })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) throw new Error('파일이 업로드되지 않았습니다.');
    const processed = await sharp(file.buffer)
      .rotate()
      .withMetadata({ exif: undefined })
      .toBuffer();
    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const key = this.s3.buildObjectKey({
      userId: req.user.sub,
      originalName: file.originalname,
      ext,
    });
    await this.s3.uploadObject({
      key,
      body: processed,
      contentType: file.mimetype,
      cacheControl: 'no-store',
    });

    const updated: any = await this.userService.updateProfile(req.user.sub, {
      profileImage: key,
    } as any);
    const signed = await this.s3.getSignedUrl(key);
    return {
      imageUrl: signed,
      user: {
        id: updated?._id?.toString(),
        name: updated?.name,
        nickname: updated?.nickname,
        profileImage: signed,
        email: updated?.email,
      },
    };
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로필 이미지 기본값으로 초기화' })
  @ApiResponse({ status: 200, description: '프로필 이미지 초기화 완료' })
  async resetAvatar(@Request() req: any) {
    const updated = await this.userService.updateProfile(req.user.sub, {
      profileImage: null,
    } as any);
    return {
      imageUrl: null,
      user: {
        id: (updated as any)._id?.toString(),
        name: (updated as any).name,
        nickname: (updated as any).nickname,
        profileImage: (updated as any).profileImage,
        email: (updated as any).email,
      },
    };
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 계정 삭제' })
  @ApiResponse({ status: 200, description: '계정 삭제 완료' })
  async deleteMe(@Request() req: any) {
    const userId: string = req.user.sub;
    if (!userId) throw new ForbiddenException('invalid user');

    // 사용자의 모든 사진 삭제 (S3 객체 포함) - 병렬화하여 성능 개선
    const myPhotos = await this.photoService.findByUserId(userId);
    const s3DeletePromises: Array<Promise<any>> = [];
    const photoDeletePromises: Array<Promise<any>> = [];

    for (const p of myPhotos) {
      if (p && p.objectKey) {
        s3DeletePromises.push(
          this.s3.deleteObject(p.objectKey).catch((err) => {
            // S3 삭제 실패는 무시하되 로깅
            console.warn('s3 delete failed for', p.objectKey, err);
          }),
        );
      }
      if (p && p._id) {
        // p._id may be a mongoose ObjectId - allow base-to-string conversion here
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        photoDeletePromises.push(
          this.photoService.deletePhoto(String(p._id)).catch((err) => {
            console.warn('photo db delete failed for', p._id, err);
          }),
        );
      }
    }

    // 병렬로 실행하고 완료를 기다림
    await Promise.allSettled(s3DeletePromises);
    await Promise.allSettled(photoDeletePromises);

    // 사용자 프로필 이미지가 S3 key라면 함께 삭제(베스트 에포트)
    try {
      const me = await this.userService.findById(userId);
      const pi: string | undefined =
        me && me.profileImage ? me.profileImage : undefined;
      if (pi && !/^https?:\/\//.test(pi) && !pi.startsWith('/')) {
        await this.s3.deleteObject(pi);
      }
    } catch {
      // 프로필 이미지 삭제 실패 무시
    }

    await this.userService.deleteUser(userId);
    return { message: '계정이 삭제되었습니다.' };
  }
}
