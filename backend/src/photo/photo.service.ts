import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Photo, PhotoDocument } from './schemas/photo.schema';
import { promises as fs } from 'fs';
import { join } from 'path';

type CreatePhotoInput = {
  userId: string;
  missionId: string;
  imageUrl: string;
  fileName: string;
  comment?: string;
  isPublic?: boolean;
  fileSize?: number;
  mimeType?: string;
};

@Injectable()
export class PhotoService {
  constructor(
    @InjectModel(Photo.name) private photoModel: Model<PhotoDocument>,
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
  async upsertUserMissionPhoto(photoData: CreatePhotoInput): Promise<{ photo: Photo; replaced: boolean }>{
    const userId = new Types.ObjectId(photoData.userId);
    const missionId = new Types.ObjectId(photoData.missionId);

    const existing = await this.photoModel.findOne({ userId, missionId }).exec();
    if (!existing) {
      const created = await this.createPhoto(photoData);
      return { photo: created, replaced: false };
    }

    // 기존 파일 삭제 시도(베스트 에포트)
    const oldPath = existing.imageUrl?.startsWith('/uploads/')
      ? join(process.cwd(), existing.imageUrl.replace(/^\//, ''))
      : undefined;
    if (oldPath) {
      fs.unlink(oldPath).catch(() => {});
    }

    existing.imageUrl = photoData.imageUrl;
    existing.fileName = photoData.fileName;
    if (typeof photoData.comment !== 'undefined') existing.comment = photoData.comment;
    if (typeof photoData.isPublic !== 'undefined') (existing as any).isPublic = photoData.isPublic;
    if (typeof photoData.fileSize !== 'undefined') (existing as any).fileSize = photoData.fileSize;
    if (typeof photoData.mimeType !== 'undefined') (existing as any).mimeType = photoData.mimeType;

    const saved = await existing.save();
    return { photo: saved, replaced: true };
  }

  async findByUserId(userId: string) {
    return this.photoModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('missionId', 'title description date')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findRecentByUserId(userId: string, limit: number = 3) {
    return this.photoModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('missionId', 'title description date')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findByMissionId(missionId: string) {
    return this.photoModel
      .find({ missionId: new Types.ObjectId(missionId), isPublic: true })
      .populate('userId', 'nickname profileImage')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(photoId: string) {
    return this.photoModel
      .findById(new Types.ObjectId(photoId))
      .populate('userId', 'nickname profileImage')
      .populate('missionId', 'title description date')
      .exec();
  }

  async updatePhoto(photoId: string, updateData: Partial<Photo>) {
    const normalized: any = { ...updateData };
    if (updateData.userId && typeof (updateData as any).userId === 'string') {
      normalized.userId = new Types.ObjectId((updateData as any).userId);
    }
    if (updateData.missionId && typeof (updateData as any).missionId === 'string') {
      normalized.missionId = new Types.ObjectId((updateData as any).missionId);
    }
    return this.photoModel
      .findByIdAndUpdate(new Types.ObjectId(photoId), normalized, { new: true })
      .exec();
  }

  async deletePhoto(photoId: string) {
    return this.photoModel.findByIdAndDelete(new Types.ObjectId(photoId)).exec();
  }

  async findPublicPhotos(limit: number = 20, skip: number = 0) {
    return this.photoModel
      .find({ isPublic: true })
      .populate('userId', 'nickname profileImage')
      .populate('missionId', 'title description date')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async markAsShared(photoId: string) {
    return this.photoModel
      .findByIdAndUpdate(new Types.ObjectId(photoId), { isShared: true }, { new: true })
      .exec();
  }
}
