import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface AppVersionRecord {
  latestVersion: string;
  minRequiredVersion?: string;
  forceUpdate?: boolean;
  updateUrl: string;
}

@Injectable()
export class AppVersionService {
  private readonly logger = new Logger(AppVersionService.name);
  private readonly filePath: string;

  constructor() {
    // 서버 루트의 version.json을 사용합니다.
    this.filePath = path.resolve(__dirname, '../../version.json');
  }

  getRecord(): AppVersionRecord {
    // 우선 파일을 읽어 반환. 파일이 없으면 env 또는 기본값을 사용.
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw) as AppVersionRecord;
        return {
          latestVersion: parsed.latestVersion || process.env.APP_LATEST_VERSION || '1.0.0',
          minRequiredVersion:
            parsed.minRequiredVersion || process.env.APP_MIN_REQUIRED_VERSION || undefined,
          forceUpdate: parsed.forceUpdate ?? (process.env.APP_FORCE_UPDATE === 'true' ? true : false),
          updateUrl:
            parsed.updateUrl || process.env.APP_UPDATE_URL || 'https://play.google.com/store/apps/details?id=com.darapo.drapoapp',
        };
      }
    } catch (e) {
      this.logger.warn('version.json 읽기 실패, env로 대체합니다');
    }

    return {
      latestVersion: process.env.APP_LATEST_VERSION || '1.0.0',
      minRequiredVersion: process.env.APP_MIN_REQUIRED_VERSION || undefined,
      forceUpdate: process.env.APP_FORCE_UPDATE === 'true' ? true : false,
      updateUrl:
        process.env.APP_UPDATE_URL || 'https://play.google.com/store/apps/details?id=com.darapo.drapoapp',
    };
  }

  saveRecord(record: AppVersionRecord) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(record, null, 2), 'utf8');
      this.logger.log(`version.json에 저장됨: ${record.latestVersion}`);
      // 프로세스 env도 갱신(런타임 참조를 위해)
      process.env.APP_LATEST_VERSION = record.latestVersion;
      if ((record as any).minRequiredVersion) {
        process.env.APP_MIN_REQUIRED_VERSION = (record as any).minRequiredVersion;
      }
      if ((record as any).forceUpdate !== undefined) {
        process.env.APP_FORCE_UPDATE = (record as any).forceUpdate ? 'true' : 'false';
      }
      process.env.APP_UPDATE_URL = record.updateUrl;
      return true;
    } catch (e) {
      this.logger.error('version.json 저장 실패', e as any);
      return false;
    }
  }
}
