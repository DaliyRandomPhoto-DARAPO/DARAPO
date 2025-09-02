// 사진 업로드/조회/삭제 관련 API 엔드포인트 (에러 핸들링 개선)
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
  InternalServerErrorException,
  UseGuards,
  Request,
  Logger,
  NotFoundException,
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
import { isValidObjectId } from '../common/utils/objectid.util';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { S3Service } from '../common/s3.service';
import { normalizeImage } from '../common/utils/image.util';
import { resolveMaybeSignedUrl } from '../common/utils/s3.util';
import { CacheInterceptor } from '@nestjs/cache-manager';
import type { ImageProcessData } from './processors/photo.processor';

@ApiTags('photos')
@Controller('photo')
export class PhotoController {
  private readonly logger = new Logger(PhotoController.name);

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
          // S3 서명 실패 시 로그만 남기고 계속
          this.logger.warn(
            `S3 sign image failed: ${base.objectKey} ${e instanceof Error ? e.message : String(e)}`,
          );
          // imageUrl을 null로 설정하여 클라이언트가 처리할 수 있도록 함
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
            this.logger.warn(
              `S3 sign avatar failed: ${pi} ${e instanceof Error ? e.message : String(e)}`,
            );
            // 프로필 이미지 서명 실패 시 null로 설정
            base.userId.profileImage = null;
          }
        }
      }
      
      return { ...base, imageUrl };
    } catch (error) {
      this.logger.error(
        'withSignedImageUrl error',
        error instanceof Error ? error.stack : String(error),
      );
      // 에러가 발생해도 기본 객체는 반환
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
    try {
      if (!file) {
        throw new BadRequestException('파일이 업로드되지 않았습니다.');
      }
      if (!file.mimetype?.startsWith('image/')) {
        throw new BadRequestException('이미지 파일만 업로드할 수 있습니다.');
      }

      // 이미지 정규화(회전, 포맷) 및 메타 추출
      let norm: { buffer: Buffer; width?: number; height?: number; ext?: string };
      try {
        norm = await normalizeImage(file.buffer);
      } catch (e) {
        // sharp 등 오류 시 원본으로 폴백
        this.logger.warn(
          `normalizeImage failed, using original buffer: ${e instanceof Error ? e.message : String(e)}`,
        );
        norm = {
          buffer: file.buffer,
          width: undefined,
          height: undefined,
          ext: undefined,
        };
      }
      const processed = norm.buffer;
      const ext =
        norm.ext || (file.originalname.split('.').pop() || 'jpg').toLowerCase();
      const key = this.s3.buildObjectKey({
        userId: req.user.sub,
        originalName: file.originalname,
        ext,
      });

      // 큐에 이미지 처리 작업 추가 (비동기)
      try {
        await this.imageQueue.add({
          key,
          bufferBase64: processed.toString('base64'),
          contentType: file.mimetype,
          width: norm.width,
          height: norm.height,
        });
      } catch (e) {
        // 큐 추가 실패 시(예: Redis 연결 문제) 동기 업로드로 폴백하여 사용자 경험 보장
        this.logger.warn(
          `image queue add failed, falling back to direct S3 upload: ${e instanceof Error ? e.message : String(e)}`,
        );
        await this.s3.uploadObject({
          key,
          body: processed,
          contentType: file.mimetype,
        });
      }

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
  } catch (error) {
      this.logger.error(
        'uploadPhoto error',
    error instanceof Error ? `${error.message}\n${error.stack}` : String(error),
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('사진 업로드 중 오류가 발생했습니다.');
    }
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 사진 목록 조회' })
  @ApiResponse({ status: 200, description: '사진 목록 반환' })
  async getMyPhotos(@Request() req: any) {
    try {
      this.logger.debug(`Getting photos for user: ${req.user.sub}`);
      // JWT payload 검증: ObjectId 형식 확인
      const userId: string | undefined = req.user?.sub;
      if (!userId) {
        throw new BadRequestException('인증 정보가 없습니다.');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('유효하지 않은 사용자 ID입니다.');
      }
      
      const list = await this.photoService.findByUserId(userId);
      this.logger.debug(`Found ${list.length} photos for user`);
      
      if (!list || list.length === 0) {
        return [];
      }

      // Promise.all 대신 순차 처리로 에러 추적 개선
  const result: any[] = [];
      for (const photo of list) {
        try {
          const processedPhoto = await this.withSignedImageUrl(photo);
          result.push(processedPhoto);
        } catch (error) {
          this.logger.error(
            `Error processing photo ${photo._id}`,
            error instanceof Error ? error.stack : String(error),
          );
          // 개별 사진 처리 실패 시 null 이미지로 추가
          result.push({ ...photo, imageUrl: null });
        }
      }
      
  return result;
    } catch (error) {
      this.logger.error(
        'getMyPhotos error',
        error instanceof Error ? error.stack : String(error),
      );
  if (error instanceof BadRequestException) throw error;
  // 조회 오류 시에도 빈 배열로 응답하여 앱 크래시/UX 저하 방지
  return [];
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
      const userId: string | undefined = req.user?.sub;
      if (!userId) {
        throw new BadRequestException('인증 정보가 없습니다.');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('유효하지 않은 사용자 ID입니다.');
      }
      const parsedLimit = Math.min(Math.max(1, parseInt(limit) || 3), 10); // 1-10 사이로 제한
      
      const list = await this.photoService.findRecentByUserId(
        userId,
        parsedLimit,
      );
      
      if (!list || list.length === 0) {
        return [];
      }

  return await Promise.all(
        list.map(async (p: any) => {
          try {
            return await this.withSignedImageUrl(p);
          } catch (error) {
            this.logger.error(
              `Error processing recent photo ${p._id}`,
              error instanceof Error ? error.stack : String(error),
            );
            return { ...p, imageUrl: null };
          }
        })
      );
    } catch (error) {
      this.logger.error(
        'getMyRecentPhotos error',
        error instanceof Error ? error.stack : String(error),
      );
  if (error instanceof BadRequestException) throw error;
  // 조회 오류 시에도 빈 배열로 응답하여 앱 크래시/UX 저하 방지
  return [];
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
    try {
      const parsedLimit = Math.min(Math.max(1, parseInt(limit) || 20), 50);
      const parsedSkip = Math.max(0, parseInt(skip) || 0);
      
      const list = await this.photoService.findPublicPhotos(parsedLimit, parsedSkip);
      
      if (!list || list.length === 0) {
        return [];
      }

      return await Promise.all(
        list.map(async (p: any) => {
          try {
            return await this.withSignedImageUrl(p);
          } catch (error) {
            this.logger.error(
              `Error processing public photo ${p._id}`,
              error instanceof Error ? error.stack : String(error),
            );
            return { ...p, imageUrl: null };
          }
        })
      );
    } catch (error) {
      this.logger.error(
        'getPublicPhotos error',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('공개 사진을 가져오는 중 오류가 발생했습니다.');
    }
  }

  @Get('mission/:missionId')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: '특정 미션의 사진 목록 조회' })
  @ApiResponse({ status: 200, description: '미션 사진 목록 반환' })
  async getPhotosByMission(
    @Param('missionId', new ParseObjectIdPipe()) missionId: string,
  ) {
    try {
      const list = await this.photoService.findByMissionId(missionId);
      
      if (!list || list.length === 0) {
        return [];
      }

      return await Promise.all(
        list.map(async (p: any) => {
          try {
            return await this.withSignedImageUrl(p);
          } catch (error) {
            this.logger.error(
              `Error processing mission photo ${p._id}`,
              error instanceof Error ? error.stack : String(error),
            );
            return { ...p, imageUrl: null };
          }
        })
      );
    } catch (error) {
      this.logger.error(
        'getPhotosByMission error',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('미션 사진을 가져오는 중 오류가 발생했습니다.');
    }
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: '특정 사진 조회' })
  @ApiResponse({ status: 200, description: '사진 정보 반환' })
  async findOne(@Param('id', new ParseObjectIdPipe()) id: string) {
    try {
      const p: any = await this.photoService.findById(id);
      if (!p) {
        throw new NotFoundException('사진을 찾을 수 없습니다.');
      }
      
      return await this.withSignedImageUrl(p);
    } catch (error) {
      this.logger.error(
        'findOne error',
        error instanceof Error ? error.stack : String(error),
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('사진을 가져오는 중 오류가 발생했습니다.');
    }
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
    try {
      return await this.photoService.updatePhoto(id, updateData);
    } catch (error) {
      this.logger.error(
        'update error',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('사진 정보 수정 중 오류가 발생했습니다.');
    }
  }

  @Put(':id/share')
  @ApiOperation({ summary: '사진 공유 완료 표시' })
  @ApiResponse({ status: 200, description: '공유 완료 처리' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async markAsShared(@Param('id', new ParseObjectIdPipe()) id: string) {
    try {
      return await this.photoService.markAsShared(id);
    } catch (error) {
      this.logger.error(
        'markAsShared error',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('사진 공유 처리 중 오류가 발생했습니다.');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: '사진 삭제' })
  @ApiResponse({ status: 200, description: '사진 삭제 완료' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id', new ParseObjectIdPipe()) id: string) {
    try {
      return await this.photoService.deletePhoto(id);
    } catch (error) {
      this.logger.error(
        'remove error',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('사진 삭제 중 오류가 발생했습니다.');
    }
  }
}