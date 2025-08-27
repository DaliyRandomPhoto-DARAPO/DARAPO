// 요청 경로나 파라미터에서 전달된 문자열 ObjectId의 유효성을 검사하는 파이프
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('올바르지 않은 ObjectId 입니다.');
    }
    return value;
  }
}
