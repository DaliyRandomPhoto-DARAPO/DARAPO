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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { PhotoService } from './photo.service';
import { Photo } from './schemas/photo.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';
import { UploadPhotoDto } from './dto/upload-photo.dto';

@ApiTags('photos')
@Controller('photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

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

    // 로컬 파일 경로 저장
    const imageUrl = `/uploads/${file.filename}`;

    const photo = await this.photoService.createPhoto({
      ...photoData,
      userId: req.user.sub,
      imageUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    return photo;
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 사진 목록 조회' })
  @ApiResponse({ status: 200, description: '사진 목록 반환' })
  async getMyPhotos(@Request() req: any) {
    return this.photoService.findByUserId(req.user.sub);
  }

  @Get('public')
  @ApiOperation({ summary: '공개 사진 목록 조회' })
  @ApiResponse({ status: 200, description: '공개 사진 목록 반환' })
  async getPublicPhotos(
    @Query('limit') limit: string = '20',
    @Query('skip') skip: string = '0',
  ) {
    return this.photoService.findPublicPhotos(parseInt(limit), parseInt(skip));
  }

  @Get('mission/:missionId')
  @ApiOperation({ summary: '특정 미션의 사진 목록 조회' })
  @ApiResponse({ status: 200, description: '미션 사진 목록 반환' })
  async getPhotosByMission(@Param('missionId', new ParseObjectIdPipe()) missionId: string) {
    return this.photoService.findByMissionId(missionId);
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 사진 조회' })
  @ApiResponse({ status: 200, description: '사진 정보 반환' })
  async findOne(@Param('id', new ParseObjectIdPipe()) id: string) {
    return this.photoService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '사진 정보 수정' })
  @ApiResponse({ status: 200, description: '사진 정보 수정 완료' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Param('id', new ParseObjectIdPipe()) id: string, @Body() updateData: Partial<Photo>) {
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
