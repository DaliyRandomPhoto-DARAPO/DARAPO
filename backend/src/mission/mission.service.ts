import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mission, MissionDocument } from './schemas/mission.schema';

@Injectable()
export class MissionService {
  constructor(
    @InjectModel(Mission.name) private missionModel: Model<MissionDocument>,
  ) {}

  async getTodayMission() {
    // Compute KST day range (Asia/Seoul)
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const kstNow = new Date(utcMs + 9 * 60 * 60000);
    // KST midnight
    kstNow.setHours(0, 0, 0, 0);
    // Convert KST midnight to UTC for querying Mongo (Date stored as UTC)
    const start = new Date(kstNow.getTime() - 9 * 60 * 60000);
    const end = new Date(start.getTime() + 24 * 60 * 60000);

    let todayMission = await this.missionModel
      .findOne({
        date: { $gte: start, $lt: end },
        isActive: true,
      })
      .exec();

    // 오늘의 미션이 없으면 새로 생성
    if (!todayMission) {
      todayMission = await this.createTodayMission();
    }

    return todayMission;
  }

  async createMission(missionData: Partial<Mission>) {
    const mission = new this.missionModel(missionData);
    return mission.save();
  }

  async findAll() {
    return this.missionModel.find({ isActive: true }).sort({ date: -1 }).exec();
  }

  async findById(missionId: string) {
    return this.missionModel.findById(missionId).exec();
  }

  private async createTodayMission() {
    const missionTitles = [
      '오늘의 노란색 찾기',
      '웃고 있는 사람 촬영',
      '하늘 바라보기',
      '따뜻한 음료와 함께',
      '나만의 작은 행복',
      '창밖 풍경 담기',
      '좋아하는 간식과 함께',
      '예쁜 꽃 발견하기',
      '동물 친구들',
      '특별한 순간 포착',
      '내가 좋아하는 색깔',
      '오늘의 날씨와 함께',
      '친구와의 즐거운 시간',
      '맛있는 음식 사진',
      '아름다운 그림자',
    ];

    const randomTitle =
      missionTitles[Math.floor(Math.random() * missionTitles.length)];
    // Use KST midnight for mission date
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const kstMidnight = new Date(utcMs + 9 * 60 * 60000);
    kstMidnight.setHours(0, 0, 0, 0);
    const missionDate = new Date(kstMidnight.getTime() - 9 * 60 * 60000);

    return this.createMission({
      title: randomTitle,
      description: `${randomTitle}를 주제로 사진을 찍어보세요!`,
      date: missionDate,
      isActive: true,
    });
  }
}
