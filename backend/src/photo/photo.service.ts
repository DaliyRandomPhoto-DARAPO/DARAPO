import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Photo, PhotoDocument } from './schemas/photo.schema';

@Injectable()
export class PhotoService {
  constructor(
    @InjectModel(Photo.name) private photoModel: Model<PhotoDocument>,
  ) {}

  async createPhoto(photoData: Partial<Photo>) {
    const photo = new this.photoModel(photoData);
    return photo.save();
  }

  async findByUserId(userId: string) {
    return this.photoModel
      .find({ userId })
      .populate('missionId', 'title description date')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByMissionId(missionId: string) {
    return this.photoModel
      .find({ missionId, isPublic: true })
      .populate('userId', 'nickname profileImage')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(photoId: string) {
    return this.photoModel
      .findById(photoId)
      .populate('userId', 'nickname profileImage')
      .populate('missionId', 'title description date')
      .exec();
  }

  async updatePhoto(photoId: string, updateData: Partial<Photo>) {
    return this.photoModel
      .findByIdAndUpdate(photoId, updateData, { new: true })
      .exec();
  }

  async deletePhoto(photoId: string) {
    return this.photoModel.findByIdAndDelete(photoId).exec();
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
      .findByIdAndUpdate(photoId, { isShared: true }, { new: true })
      .exec();
  }
}
