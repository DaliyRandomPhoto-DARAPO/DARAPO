// 사진 업로드 요청에서 사용되는 DTO
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UploadPhotoDto {
  @IsMongoId()
  missionId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
