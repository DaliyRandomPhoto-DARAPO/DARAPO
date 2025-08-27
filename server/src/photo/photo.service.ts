// 사진 데이터의 생성/수정/삭제 및 조회 로직을 담당하는 서비스
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Photo, PhotoDocument } from './schemas/photo.schema';
import { S3Service } from '../common/s3.service';

type CreatePhotoInput = {
  userId: string;
  missionId: string;
  objectKey: string;
  comment?: string;
  isPublic?: boolean;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
};

@Injectable()
export class PhotoService {
  constructor(
    @InjectModel(Photo.name) private photoModel: Model<PhotoDocument>,
    private readonly s3: S3Service,
  ) {}

  async createPhoto(photoData: CreatePhotoInput) {
    const normalized: any = { ...photoData };
    if (photoData.userId && typeof photoData.userId === 'string') {
      normalized.userId = new Types.ObjectId(photoData.userId);
    }
    if (photoData.missionId && typeof photoData.missionId === 'string') {
      normalized.missionId = new Types.ObjectId(photoData.missionId);
    }
    const photo = new this.photoModel(normalized);
    return photo.save();
  }

  /**
   * 동일 사용자+미션(=하루) 사진이 있으면 새 파일로 교체, 없으면 생성
   * 반환: { photo, replaced }
   */
  async upsertUserMissionPhoto(
    photoData: CreatePhotoInput,
  ): Promise<{ photo: Photo; replaced: boolean }> {
    const userId = new Types.ObjectId(photoData.userId);
    const missionId = new Types.ObjectId(photoData.missionId);

    const existing = await this.photoModel
      .findOne({ userId, missionId })
      .exec();
    if (!existing) {
      const created = await this.createPhoto(photoData);
      return { photo: created, replaced: false };
    }

    // 기존 S3 오브젝트 삭제(베스트 에포트)
    const prevKey = (existing as any).objectKey as string | undefined;
    if (prevKey) {
      this.s3.deleteObject(prevKey).catch(() => {});
    }

    (existing as any).objectKey = photoData.objectKey;
    if (typeof photoData.comment !== 'undefined')
      existing.comment = photoData.comment;
    if (typeof photoData.isPublic !== 'undefined')
      (existing as any).isPublic = photoData.isPublic;
    if (typeof photoData.fileSize !== 'undefined')
      (existing as any).fileSize = photoData.fileSize;
    if (typeof photoData.mimeType !== 'undefined')
      (existing as any).mimeType = photoData.mimeType;
    if (typeof photoData.width !== 'undefined')
      (existing as any).width = photoData.width;
    if (typeof photoData.height !== 'undefined')
      (existing as any).height = photoData.height;

    const saved = await existing.save();
    return { photo: saved, replaced: true };
  }

  async findByUserId(userId: string) {
    return this.photoModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('missionId', 'title description date')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findRecentByUserId(userId: string, limit: number = 3) {
    return this.photoModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('missionId', 'title description date')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findByMissionId(missionId: string) {
    return this.photoModel
      .find({ missionId: new Types.ObjectId(missionId), isPublic: true })
      .populate('userId', 'nickname profileImage')
      .populate('missionId', 'title description date')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findById(photoId: string) {
    return this.photoModel
      .findById(new Types.ObjectId(photoId))
      .populate('userId', 'nickname profileImage')
      .populate('missionId', 'title description date')
      .lean()
      .exec();
  }

  async updatePhoto(photoId: string, updateData: Partial<Photo>) {
    const normalized: any = { ...updateData };
    if (updateData.userId && typeof (updateData as any).userId === 'string') {
      normalized.userId = new Types.ObjectId((updateData as any).userId);
    }
    if (
      updateData.missionId &&
      typeof (updateData as any).missionId === 'string'
    ) {
      normalized.missionId = new Types.ObjectId((updateData as any).missionId);
    }
    return this.photoModel
      .findByIdAndUpdate(new Types.ObjectId(photoId), normalized, { new: true })
      .exec();
  }

  async deletePhoto(photoId: string) {
    const doc = await this.photoModel
      .findById(new Types.ObjectId(photoId))
      .exec();
    if (doc?.objectKey) {
      this.s3.deleteObject(doc.objectKey).catch(() => {});
    }
    return this.photoModel
      .findByIdAndDelete(new Types.ObjectId(photoId))
      .exec();
  }

  async findPublicPhotos(limit: number = 20, skip: number = 0) {
    return this.photoModel
      .find({ isPublic: true })
      .populate('userId', 'nickname profileImage')
      .populate('missionId', 'title description date')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .exec();
  }

  async markAsShared(photoId: string) {
    return this.photoModel
      .findByIdAndUpdate(
        new Types.ObjectId(photoId),
        { isShared: true },
        { new: true },
      )
      .exec();
  }
}
