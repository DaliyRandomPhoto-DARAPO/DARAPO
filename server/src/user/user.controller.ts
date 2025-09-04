// 사용자 프로필 조회/수정, 아바타 업로드 및 계정 삭제 관련 컨트롤러
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
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../config/multer.config';
import { S3Service } from '../common/s3.service';
import { resolveMaybeSignedUrl } from '../common/utils/s3.util';
import { PhotoService } from '../photo/photo.service';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
// import { CacheInterceptor } from '@nestjs/cache-manager';

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
    const profileUrl = await resolveMaybeSignedUrl(
      this.s3,
      user?.profileImage ?? null,
    );
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
    const profileUrl = await resolveMaybeSignedUrl(
      this.s3,
      updated?.profileImage ?? null,
    );
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
    if (!file) {
      const reason = req?._fileFilterReason;
      if (reason === 'invalid-mime') {
        throw new BadRequestException('이미지 파일만 업로드 가능합니다.');
      }
      throw new BadRequestException('파일이 업로드되지 않았습니다.');
    }
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('이미지 파일만 업로드 가능합니다.');
    }

    // 리사이즈/재인코딩으로 용량 및 해상도 제한(서버 부하/전송시간 감소)
    let output: Buffer;
    let ext = 'jpg';
    let contentType = 'image/jpeg';
    try {
      output = await sharp(file.buffer)
        .rotate()
        .resize({
          width: 512,
          height: 512,
          fit: 'cover',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 82, progressive: true, chromaSubsampling: '4:2:0' })
        .toBuffer();
    } catch {
      // 처리 실패 시 원본으로 폴백(최대 10MB)
      output = file.buffer;
      // 원본 mime을 최대한 존중하되 jpeg로 강제하지 않음
      if (typeof file.mimetype === 'string') {
        if (file.mimetype.includes('png')) {
          ext = 'png';
          contentType = 'image/png';
        } else if (file.mimetype.includes('webp')) {
          ext = 'webp';
          contentType = 'image/webp';
        } else if (file.mimetype.includes('gif')) {
          ext = 'gif';
          contentType = 'image/gif';
        } else if (
          file.mimetype.includes('heic') ||
          file.mimetype.includes('heif')
        ) {
          // 일부 S3/브라우저가 heic 미지원이므로 jpeg로 변경 권장
          ext = 'jpg';
          contentType = 'image/jpeg';
        } else {
          ext = 'jpg';
          contentType = 'image/jpeg';
        }
      }
    }

    // 버전 키로 업로드(캐시 가능), 이전 키는 삭제하여 누수 방지
    const version = uuidv4();
    const key = `users/${req.user.sub}/profile-${version}.${ext}`;

    // 기존 프로필 키 조회(베스트 에포트 삭제)
    let prevKey: string | undefined;
    try {
      const me = await this.userService.findById(req.user.sub);
      const pi = (me as any)?.profileImage as string | undefined;
      if (pi && !/^https?:\/\//.test(pi) && !pi.startsWith('/')) {
        prevKey = pi;
      }
    } catch {
      void 0;
    }

    try {
      await this.s3.uploadObject({
        key,
        body: output,
        contentType,
        // 프로필 이미지는 버전 키를 쓰므로 캐시 가능
        cacheControl: 'public, max-age=31536000, immutable',
      });
      Logger.log(
        `Avatar uploaded to S3: ${key} (${contentType})`,
        'UserController',
      );
    } catch (err: any) {
      Logger.error(
        `S3 upload failed for ${key}: ${err?.name || ''} ${err?.message || err}`,
        err?.stack || String(err),
        'UserController',
      );
      throw new Error(
        '프로필 이미지 업로드 중 오류가 발생했습니다. 관리자에게 문의해주세요.',
      );
    }

    if (prevKey && prevKey !== key) {
      this.s3.deleteObject(prevKey).catch(() => {
        void 0; // best-effort delete
      });
    }

    const updated: any = await this.userService.updateProfile(req.user.sub, {
      profileImage: key,
    } as any);
    const signed = await resolveMaybeSignedUrl(this.s3, key);
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
            // S3 삭제 실패는 무시하도록 로그
            Logger.warn(
              `s3 delete failed for ${String(p.objectKey)}`,
              err?.stack || err,
              'UserController',
            );
          }),
        );
      }
      if (p && p._id) {
        // p._id may be a mongoose ObjectId - explicitly convert to string first
        const idForLog =
          (p as any)._id && typeof (p as any)._id.toString === 'function'
            ? (p as any)._id.toString()
            : String((p as any)._id);

        photoDeletePromises.push(
          this.photoService.deletePhoto(String((p as any)._id)).catch((err) => {
            Logger.warn(
              `photo db delete failed for ${idForLog}`,
              err?.stack || err,
              'UserController',
            );
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
      void 0;
    }

    await this.userService.deleteUser(userId);
    return { message: '계정이 삭제되었습니다.' };
  }
}
