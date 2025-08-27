// 사용자 CRUD 및 프로필 관련 서비스
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByKakaoId(kakaoId: string): Promise<User | null> {
    return this.userModel.findOne({ kakaoId }).exec();
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async updateLastLogin(userId: string): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { lastLoginAt: new Date() }, { new: true })
      .exec();
  }

  async findById(userId: string): Promise<User | null> {
    return this.userModel.findById(userId).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find({ isActive: true }).exec();
  }

  async deleteUser(userId: string): Promise<void> {
    await this.userModel.findByIdAndDelete(userId).exec();
  }

  async updateProfile(
    userId: string,
    updateData: Partial<User>,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .exec();
  }

  async deactivateUser(userId: string): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { isActive: false }, { new: true })
      .exec();
  }
}
