import { IsOptional, IsString, MaxLength, IsUrl, IsEmail, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[0-9a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ ]*$/, { message: '이름에는 특수문자를 사용할 수 없습니다.' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^[0-9a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ ]*$/, { message: '닉네임에는 특수문자를 사용할 수 없습니다.' })
  nickname?: string;

  @IsOptional()
  @IsUrl({ require_protocol: false }, { message: '올바른 이미지 URL이 아닙니다.' })
  profileImage?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
