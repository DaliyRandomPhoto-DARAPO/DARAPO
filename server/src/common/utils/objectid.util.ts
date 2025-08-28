// ObjectId 변환 유틸 함수
import { Types } from 'mongoose';

export function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  if (id instanceof Types.ObjectId) {
    return id;
  }
  return new Types.ObjectId(id);
}

export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}
