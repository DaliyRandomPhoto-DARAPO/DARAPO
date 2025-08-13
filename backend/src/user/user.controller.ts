import { Controller, Get, Put, Post, Body, UseGuards, Request, UseInterceptors, UploadedFile, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../config/multer.config';

@ApiTags('user')
@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: '내 프로필 조회' })
	async getMe(@Request() req: any) {
		const user = await this.userService.findById(req.user.sub);
		return {
			id: (user as any)._id?.toString(),
			kakaoId: (user as any).kakaoId,
			nickname: (user as any).nickname,
			profileImage: (user as any).profileImage,
			email: (user as any).email,
		};
	}

	@Put('me')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: '내 프로필 수정(닉네임, 이미지 URL 등)' })
	async updateMe(@Request() req: any, @Body() body: UpdateUserDto) {
		const updated = await this.userService.updateProfile(req.user.sub, body as any);
		return {
			id: (updated as any)._id?.toString(),
			kakaoId: (updated as any).kakaoId,
			nickname: (updated as any).nickname,
			profileImage: (updated as any).profileImage,
			email: (updated as any).email,
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
		const imageUrl = `/uploads/${file.filename}`;
		const updated = await this.userService.updateProfile(req.user.sub, { profileImage: imageUrl } as any);
		return {
			imageUrl,
			user: {
				id: (updated as any)._id?.toString(),
				nickname: (updated as any).nickname,
				profileImage: (updated as any).profileImage,
				email: (updated as any).email,
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
