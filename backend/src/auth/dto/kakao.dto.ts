import { IsOptional, IsString } from 'class-validator';

export class NativeLoginDto {
  @IsString()
  kakaoAccessToken!: string;
}

export class WebCallbackDto {
  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  state?: string;
}
