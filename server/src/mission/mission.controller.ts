import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MissionService } from './mission.service';
import { Mission } from './schemas/mission.schema';
import { ParseObjectIdPipe } from '../common/pipes/parse-objectid.pipe';
import { CreateMissionDto } from './dto/create-mission.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('missions')
@Controller('mission')
export class MissionController {
  constructor(private readonly missionService: MissionService) {}

  @Get('today')
  @ApiOperation({ summary: '오늘의 미션 조회' })
  @ApiResponse({ status: 200, description: '오늘의 미션 반환' })
  async getTodayMission() {
    return this.missionService.getTodayMission();
  }

  @Get()
  @ApiOperation({ summary: '전체 미션 목록 조회' })
  @ApiResponse({ status: 200, description: '미션 목록 반환' })
  async findAll() {
    return this.missionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 미션 조회' })
  @ApiResponse({ status: 200, description: '미션 정보 반환' })
  async findOne(@Param('id', new ParseObjectIdPipe()) id: string) {
    return this.missionService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '새 미션 생성' })
  @ApiResponse({ status: 201, description: '미션 생성 완료' })
  @UseGuards(JwtAuthGuard)
  async create(@Body() missionData: CreateMissionDto) {
    const payload: Partial<Mission> = {
      title: missionData.title,
      description: missionData.description,
      date: new Date(missionData.date),
      isActive: missionData.isActive ?? true,
      imageUrl: missionData.imageUrl,
  subtitle: missionData.subtitle,
    };
    return this.missionService.createMission(payload);
  }
}
