import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Photo, PhotoDocument } from './schemas/photo.schema';

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

  async findByUserId(userId: string) {
    return this.photoModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('missionId', 'title description date')
      .sort({ createdAt: -1 })
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
