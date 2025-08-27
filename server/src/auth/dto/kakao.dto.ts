// 카카오 관련 DTO 정의
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NativeLoginDto {
  @ApiProperty({ description: 'Kakao access token' })
  @IsString()
  kakaoAccessToken!: string;
}

export class WebCallbackDto {
  @ApiProperty({ description: 'Authorization code from Kakao' })
  @IsString()
  code!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  state?: string;
}
