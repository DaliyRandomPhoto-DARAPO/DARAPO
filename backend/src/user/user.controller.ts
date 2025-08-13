import { Controller, Get, Put, Post, Body, UseGuards, Request, UseInterceptors, UploadedFile, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../config/multer.config';
import { S3Service } from '../common/s3.service';
import sharp from 'sharp';

@ApiTags('user')
@Controller('user')
export class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly s3: S3Service,
	) {}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: '내 프로필 조회' })
	async getMe(@Request() req: any) {
		const user: any = await this.userService.findById(req.user.sub);
		let profileUrl: string | null = user?.profileImage ?? null;
		if (profileUrl && !/^https?:\/\//.test(profileUrl) && !profileUrl.startsWith('/')) {
			// S3 object key로 판단 → 프리사인드 URL 발급
			profileUrl = await this.s3.getSignedUrl(profileUrl);
		}
		return {
			id: user?._id?.toString(),
			kakaoId: user?.kakaoId,
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
		const updated: any = await this.userService.updateProfile(req.user.sub, body as any);
		let profileUrl: string | null = updated?.profileImage ?? null;
		if (profileUrl && !/^https?:\/\//.test(profileUrl) && !profileUrl.startsWith('/')) {
			profileUrl = await this.s3.getSignedUrl(profileUrl);
		}
		return {
			id: updated?._id?.toString(),
			kakaoId: updated?.kakaoId,
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
	async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
		if (!file) throw new Error('파일이 업로드되지 않았습니다.');
		const processed = await sharp(file.buffer).rotate().withMetadata({ exif: undefined }).toBuffer();
		const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
		const key = this.s3.buildObjectKey({ userId: req.user.sub, originalName: file.originalname, ext });
		await this.s3.uploadObject({ key, body: processed, contentType: file.mimetype, cacheControl: 'no-store' });

		const updated: any = await this.userService.updateProfile(req.user.sub, { profileImage: key } as any);
		const signed = await this.s3.getSignedUrl(key);
		return {
			imageUrl: signed,
			user: {
				id: updated?._id?.toString(),
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
		const updated = await this.userService.updateProfile(req.user.sub, { profileImage: null } as any);
		return {
			imageUrl: null,
			user: {
				id: (updated as any)._id?.toString(),
				nickname: (updated as any).nickname,
				profileImage: (updated as any).profileImage,
				email: (updated as any).email,
			},
		};
	}
}
