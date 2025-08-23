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
    // Pools and templates for richer mission generation
    const missionPool = [
      { title: '오늘의 노란색', subtitle: '노란색을 찾아보세요', tags: ['color', 'yellow'] },
      { title: '웃고 있는 사람', subtitle: '웃음이 담긴 순간', tags: ['people', 'smile'] },
      { title: '하늘 바라보기', subtitle: '푸른 하늘을 담아보세요', tags: ['sky', 'nature'] },
      { title: '따뜻한 음료', subtitle: '따뜻한 음료와 함께하는 하루', tags: ['food', 'drink'] },
      { title: '작은 행복', subtitle: '나만의 작은 행복을 기록', tags: ['mood'] },
      { title: '창밖 풍경', subtitle: '창밖의 풍경을 찍어보세요', tags: ['window', 'landscape'] },
      { title: '간식 타임', subtitle: '좋아하는 간식을 보여주세요', tags: ['food', 'snack'] },
      { title: '예쁜 꽃', subtitle: '아름다운 꽃을 찾아보세요', tags: ['nature', 'flower'] },
      { title: '동물 친구', subtitle: '동물과 함께한 순간', tags: ['animal'] },
      { title: '특별한 순간', subtitle: '특별한 순간을 포착', tags: ['moment'] },
      { title: '좋아하는 색', subtitle: '가장 좋아하는 색을 보여주세요', tags: ['color'] },
      { title: '오늘의 날씨', subtitle: '오늘의 날씨를 담아보세요', tags: ['weather'] },
      { title: '친구와 함께', subtitle: '친구와의 즐거운 시간', tags: ['people', 'friend'] },
      { title: '맛있는 음식', subtitle: '맛있게 보이는 음식을 찍어보세요', tags: ['food'] },
      { title: '아름다운 그림자', subtitle: '그림자를 활용한 사진', tags: ['shadow', 'art'] },
    ];

    const twistTemplates = [
      '반사된 모습',
      '흑백으로',
      '근접 촬영',
      '넓은 풍경과 함께',
      '짧은 노출로 움직임 표현',
    ];

    const rareTags = ['rare', 'limited'];

    // Weighted selection helper
    function pickRandom<T>(arr: T[]) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    // Compute KST midnight as mission date (stored in UTC)
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const kstMidnight = new Date(utcMs + 9 * 60 * 60000);
    kstMidnight.setHours(0, 0, 0, 0);
    const missionDate = new Date(kstMidnight.getTime() - 9 * 60 * 60000);

    // Avoid recent duplicates: check last 7 days
    const sevenDaysBefore = new Date(missionDate.getTime() - 7 * 24 * 60 * 60000);
    const recentMissions = await this.missionModel
      .find({ date: { $gte: sevenDaysBefore, $lt: missionDate }, isActive: true })
      .exec();

    const recentTitles = new Set(recentMissions.map((m) => m.title));

    // Try to pick a mission not used in the last 7 days, fallback after few tries
  let chosen: { title: string; subtitle?: string; tags?: string[] } | null = null;
    for (let i = 0; i < 6; i++) {
      const candidate = pickRandom(missionPool);
      if (!recentTitles.has(candidate.title) || i === 5) {
        chosen = candidate;
        break;
      }
    }

    const isRare = Math.random() < 0.15; // 15% chance
    const twist = Math.random() < 0.4 ? pickRandom(twistTemplates) : undefined;

    // At this point chosen should not be null; ensure fallback
    if (!chosen) {
      chosen = missionPool[0];
    }

    const tags = [...(chosen.tags || []), ...(isRare ? rareTags : [])];

    // Build display title and description while preserving legacy `title`/`description`
    let displayTitle = chosen.title;
    if (chosen.subtitle) displayTitle = `${chosen.title} - ${chosen.subtitle}`;
    if (isRare) displayTitle = `✨ ${displayTitle}`;

    let description = `${chosen.title}를 주제로 사진을 찍어보세요!`;
    if (twist) description += ` 이번 미션은 '${twist}'을(를) 시도해보세요.`;

    return this.createMission({
      // legacy fields kept for backward compatibility
      title: displayTitle,
      description,
      date: missionDate,
      isActive: true,
      // new structured fields
      subtitle: chosen.subtitle,
      tags,
      isRare,
      twist,
    });
  }
}
