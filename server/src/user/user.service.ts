// 사용자 CRUD 및 프로필 관련 서비스
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CacheService } from '../common/cache.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly cacheService: CacheService,
  ) {}

  async findByKakaoId(kakaoId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ kakaoId }).exec();
  }

  async create(userData: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async updateLastLogin(userId: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { lastLoginAt: new Date() }, { new: true })
      .exec();
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find({ isActive: true }).exec();
  }

  async deleteUser(userId: string): Promise<void> {
    // DB에서 사용자 삭제
    await this.userModel.findByIdAndDelete(userId).exec();

    // Redis의 모든 토큰 무효화
    await this.cacheService.revokeUserTokens(userId);
    await this.cacheService.deleteUserSession(userId);
  }

  async updateProfile(
    userId: string,
    updateData: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .exec();
  }

  async deactivateUser(userId: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { isActive: false }, { new: true })
      .exec();
  }
}
