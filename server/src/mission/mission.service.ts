// 미션 도메인 비즈니스 로직을 담당하는 서비스
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
    // Normalize incoming data: ensure subtitle and description exist where possible
    const data = { ...missionData } as Partial<Mission>;
    // If subtitle missing but title contains a separator, try to extract
    if ((!data.subtitle || data.subtitle === null) && typeof data.title === 'string' && data.title.includes(' - ')) {
      const parts = data.title.split(' - ');
      // assume legacy format: "Title - Subtitle"
      data.subtitle = parts.slice(1).join(' - ').trim();
    }

    // Ensure description exists
    if (!data.description && typeof data.title === 'string') {
      const base = String(data.title).replace(/^\s*/, '');
      data.description = `${base}를 주제로 사진을 찍어보세요!`;
    }

    const mission = new this.missionModel(data);
    return mission.save();
  }

  async findAll() {
    return this.missionModel.find({ isActive: true }).sort({ date: -1 }).exec();
  }

  async findById(missionId: string) {
    return this.missionModel.findById(missionId).exec();
  }

  private async createTodayMission() {
    // Pools and templates for richer mission generation
    const missionPool = [
      { title: '오늘의 노란색', subtitle: '노란색을 찾아보세요' },
      { title: '웃고 있는 사람', subtitle: '웃음이 담긴 순간' },
      { title: '하늘 바라보기', subtitle: '푸른 하늘을 담아보세요' },
      { title: '따뜻한 음료', subtitle: '따뜻한 음료와 함께하는 하루' },
      { title: '작은 행복', subtitle: '나만의 작은 행복을 기록' },
      { title: '창밖 풍경', subtitle: '창밖의 풍경을 찍어보세요' },
      { title: '간식 타임', subtitle: '좋아하는 간식을 보여주세요' },
      { title: '예쁜 꽃', subtitle: '아름다운 꽃을 찾아보세요' },
      { title: '동물 친구', subtitle: '동물과 함께한 순간' },
      { title: '특별한 순간', subtitle: '특별한 순간을 포착' },
      { title: '좋아하는 색', subtitle: '가장 좋아하는 색을 보여주세요' },
      { title: '오늘의 날씨', subtitle: '오늘의 날씨를 담아보세요' },
      { title: '친구와 함께', subtitle: '친구와의 즐거운 시간' },
      { title: '맛있는 음식', subtitle: '맛있게 보이는 음식을 찍어보세요' },
      { title: '아름다운 그림자', subtitle: '그림자를 활용한 사진' },
    ];

    function pickRandom<T>(arr: T[]) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const kstMidnight = new Date(utcMs + 9 * 60 * 60000);
    kstMidnight.setHours(0, 0, 0, 0);
    const missionDate = new Date(kstMidnight.getTime() - 9 * 60 * 60000);

    const sevenDaysBefore = new Date(missionDate.getTime() - 7 * 24 * 60 * 60000);
    const recentMissions = await this.missionModel
      .find({ date: { $gte: sevenDaysBefore, $lt: missionDate }, isActive: true })
      .exec();

    const recentTitles = new Set(recentMissions.map((m) => m.title));

  let chosen: { title: string; subtitle?: string } | null = null;
    for (let i = 0; i < 6; i++) {
      const candidate = pickRandom(missionPool);
      if (!recentTitles.has(candidate.title) || i === 5) {
        chosen = candidate;
        break;
      }
    }

    if (!chosen) {
      chosen = missionPool[0];
    }

    let displayTitle = chosen.title;
    if (chosen.subtitle) displayTitle = `${chosen.title} - ${chosen.subtitle}`;
  let description = `${chosen.title}를 주제로 사진을 찍어보세요!`;


    return this.createMission({
      title: displayTitle,
      description,
      date: missionDate,
      isActive: true,
      subtitle: chosen.subtitle,
    });
  }
}
