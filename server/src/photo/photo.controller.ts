// 사진 업로드/조회/삭제 관련 API 엔드포인트
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PhotoService } from './photo.service';
import { Photo } from './schemas/photo.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { S3Service } from '../common/s3.service';
import { normalizeImage } from '../common/utils/image.util';
import { resolveMaybeSignedUrl } from '../common/utils/s3.util';
import { CacheInterceptor } from '@nestjs/cache-manager';
import type { ImageProcessData } from './processors/photo.processor';

@ApiTags('photos')
@Controller('photo')
export class PhotoController {
  constructor(
    private readonly photoService: PhotoService,
    private readonly s3: S3Service,
    @InjectQueue('image-processing') private readonly imageQueue: Queue<ImageProcessData>,
  ) {}

  private async withSignedImageUrl(p: any) {
    try {
      const base = { ...p }; // lean object copy
      let imageUrl: string | null = base.imageUrl ?? null;

      if (base.objectKey) {
        try {
          imageUrl = await this.s3.getSignedUrl(base.objectKey);
        } catch (e) {
          Logger.warn(
            `S3 sign failed for ${base.objectKey}: ${e?.message}`,
            'PhotoController',
          );
          // S3 실패 시에도 객체는 반환
          imageUrl = null;
        }
      }

      // sign user avatar if it's an S3 key (not http and not starting with /)
      if (
        base.userId &&
        typeof base.userId === 'object' &&
        base.userId.profileImage
      ) {
        const pi = base.userId.profileImage as string;
        if (!/^https?:\/\//.test(pi) && !pi.startsWith('/')) {
          try {
            base.userId = {
              ...base.userId,
              profileImage: await this.s3.getSignedUrl(pi),
            };
          } catch (e) {
            Logger.warn(`Avatar sign failed for ${pi}: ${e?.message}`);
            // 실패 시 원본 유지
          }
        }
      }

      return { ...base, imageUrl };
    } catch (error) {
      Logger.error('withSignedImageUrl failed:', error?.stack || error);
      // 최소한의 데이터라도 반환
      return { ...p, imageUrl: null };
    }
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사진 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '사진 업로드 완료' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body() photoData: UploadPhotoDto,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다.');
    }

    // 이미지 정규화(회전, 포맷) 및 메타 추출
    const norm = await normalizeImage(file.buffer);
    const processed = norm.buffer;
    const ext =
      norm.ext || (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const key = this.s3.buildObjectKey({
      userId: req.user.sub,
      originalName: file.originalname,
      ext,
    });

    // 큐에 이미지 처리 작업 추가 (비동기)
    await this.imageQueue.add({
      key,
      buffer: processed,
      contentType: file.mimetype,
      width: norm.width,
      height: norm.height,
    });

    const width = norm.width;
    const height = norm.height;

    const { photo, replaced } = await this.photoService.upsertUserMissionPhoto({
      ...photoData,
      userId: req.user.sub,
      objectKey: key,
      fileSize: processed.length,
      mimeType: file.mimetype,
      width,
      height,
    });

    const signedUrl = await resolveMaybeSignedUrl(this.s3, key);
    return {
      photo: {
        ...(photo.toJSON ? photo.toJSON() : photo),
        imageUrl: signedUrl,
      },
      replaced,
    };
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 사진 목록 조회' })
  @ApiResponse({ status: 200, description: '사진 목록 반환' })
  async getMyPhotos(@Request() req: any) {
    try {
      console.log('=== DEBUG: getMyPhotos 시작 ===');
      console.log('User ID:', req.user?.sub);
      console.log('User Agent:', req.headers['user-agent']);

      const list = await this.photoService.findByUserId(req.user.sub);
      console.log('DB 조회 결과 개수:', list?.length || 0);

      const results = await Promise.all(list.map((p: any) => this.withSignedImageUrl(p)));
      console.log('서명 URL 처리 완료:', results.length);

      return results;
    } catch (error) {
      console.error('=== getMyPhotos 에러 ===');
      console.error('에러 타입:', error.constructor.name);
      console.error('에러 메시지:', error.message);
      console.error('스택트레이스:', error.stack);
      throw error;
    }
  }

  @Get('mine/recent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 최근 사진 조회' })
  @ApiResponse({ status: 200, description: '최근 사진 목록 반환' })
  async getMyRecentPhotos(
    @Request() req: any,
    @Query('limit') limit: string = '3',
  ) {
    try {
      console.log('=== DEBUG: getMyRecentPhotos 시작 ===');
      console.log('User ID:', req.user?.sub);
      console.log('Limit:', limit);

      const list = await this.photoService.findRecentByUserId(
        req.user.sub,
        parseInt(limit),
      );
      console.log('DB 조회 결과:', list?.length || 0);

      if (!list || list.length === 0) {
        return [];
      }

      // withSignedImageUrl에서 에러 발생 시 개별 처리
      const results = await Promise.allSettled(
        list.map((p: any) => this.withSignedImageUrl(p))
      );

      return results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as any).value);
    } catch (error) {
      console.error('=== getMyRecentPhotos 에러 ===');
      console.error('에러 타입:', error.constructor.name);
      console.error('에러 메시지:', error.message);
      console.error('스택트레이스:', error.stack);
      throw error;
    }
  }

  @Get('public')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: '공개 사진 목록 조회' })
  @ApiResponse({ status: 200, description: '공개 사진 목록 반환' })
  async getPublicPhotos(
    @Query('limit') limit: string = '20',
    @Query('skip') skip: string = '0',
  ) {
    const list = await this.photoService.findPublicPhotos(
      parseInt(limit),
      parseInt(skip),
    );
    return await Promise.all(list.map((p: any) => this.withSignedImageUrl(p)));
  }

  @Get('mission/:missionId')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: '특정 미션의 사진 목록 조회' })
  @ApiResponse({ status: 200, description: '미션 사진 목록 반환' })
  async getPhotosByMission(
    @Param('missionId', new ParseObjectIdPipe()) missionId: string,
  ) {
    const list = await this.photoService.findByMissionId(missionId);
    // lean() 결과에 toJSON이 없어 500이 발생하던 문제를 공통 헬퍼로 해결
    return await Promise.all(list.map((p: any) => this.withSignedImageUrl(p)));
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: '특정 사진 조회' })
  @ApiResponse({ status: 200, description: '사진 정보 반환' })
  async findOne(@Param('id', new ParseObjectIdPipe()) id: string) {
    const p: any = await this.photoService.findById(id);
    if (!p) return p;
    return this.withSignedImageUrl(p);
  }

  @Put(':id')
  @ApiOperation({ summary: '사진 정보 수정' })
  @ApiResponse({ status: 200, description: '사진 정보 수정 완료' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(
    @Param('id', new ParseObjectIdPipe()) id: string,
    @Body() updateData: Partial<Photo>,
  ) {
    return this.photoService.updatePhoto(id, updateData);
  }

  @Put(':id/share')
  @ApiOperation({ summary: '사진 공유 완료 표시' })
  @ApiResponse({ status: 200, description: '공유 완료 처리' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async markAsShared(@Param('id', new ParseObjectIdPipe()) id: string) {
    return this.photoService.markAsShared(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '사진 삭제' })
  @ApiResponse({ status: 200, description: '사진 삭제 완료' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id', new ParseObjectIdPipe()) id: string) {
    return this.photoService.deletePhoto(id);
  }
}
