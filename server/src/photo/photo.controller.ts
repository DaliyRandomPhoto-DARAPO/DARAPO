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
import { PhotoService } from './photo.service';
import { Photo } from './schemas/photo.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { S3Service } from '../common/s3.service';
import { normalizeImage } from '../common/utils/image.util';
import { resolveMaybeSignedUrl } from '../common/utils/s3.util';

@ApiTags('photos')
@Controller('photo')
export class PhotoController {
  constructor(
    private readonly photoService: PhotoService,
    private readonly s3: S3Service,
  ) {}

  private async withSignedImageUrl(p: any) {
    const base = { ...p }; // lean object copy
    let imageUrl: string | null = base.imageUrl ?? null;
    if (base.objectKey) {
      try {
        imageUrl = await this.s3.getSignedUrl(base.objectKey);
      } catch (e) {
        // 서버명 실패 시 로그만 남기고 계속
        Logger.warn(
          `sign image failed ${base.objectKey}`,
          e?.stack || e,
          'PhotoController',
        );
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
          Logger.warn(
            `sign avatar failed ${pi}`,
            e?.stack || e,
            'PhotoController',
          );
        }
      }
    }
    return { ...base, imageUrl };
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
    await this.s3.uploadObject({
      key,
      body: processed,
      contentType: file.mimetype,
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
        ...((photo as any).toJSON ? (photo as any).toJSON() : photo),
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
    const list = await this.photoService.findByUserId(req.user.sub);
    return await Promise.all(list.map((p: any) => this.withSignedImageUrl(p)));
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
    const list = await this.photoService.findRecentByUserId(
      req.user.sub,
      parseInt(limit),
    );
    return await Promise.all(list.map((p: any) => this.withSignedImageUrl(p)));
  }

  @Get('public')
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
