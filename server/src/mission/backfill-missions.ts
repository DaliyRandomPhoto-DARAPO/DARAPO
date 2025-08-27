import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MissionService } from './mission.service';

async function main() {
  console.warn('⚠️ Running mission backfill. Make sure you run this against a development DB only.');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const svc = app.get(MissionService);
    // Find missions missing subtitle or description
    const missing = await (svc as any).missionModel.find({ $or: [ { subtitle: { $exists: false } }, { description: { $exists: false } } ] }).exec();
    console.info(`Found ${missing.length} missions to backfill`);
    for (const m of missing) {
      const title = String(m.title || '오늘의 미션');
      let subtitle = m.subtitle;
      if ((!subtitle || subtitle === null) && title.includes(' - ')) {
        subtitle = title.split(' - ').slice(1).join(' - ').trim();
      }
      const description = m.description || `${title.replace(/^\s*/, '')}를 주제로 사진을 찍어보세요!`;
      await (svc as any).missionModel.updateOne({ _id: m._id }, { $set: { subtitle, description } }).exec();
      console.info(`Backfilled mission ${m._id}`);
    }
    console.info('Backfill complete');
  } catch (e) {
    console.error('Backfill error', e);
  } finally {
    await app.close();
    process.exit(0);
  }
}

main();
