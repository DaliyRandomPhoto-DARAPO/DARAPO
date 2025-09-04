import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MissionService } from './mission.service';
import { MissionController } from './mission.controller';
import { Mission, MissionSchema } from './schemas/mission.schema';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    MongooseModule.forFeature([{ name: Mission.name, schema: MissionSchema }]),
    // CacheModule는 AppModule에서 글로벌로 등록됨
  ],
  controllers: [MissionController],
  providers: [MissionService],
  exports: [MissionService],
})
export class MissionModule {}
