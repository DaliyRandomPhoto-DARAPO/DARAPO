import { GetParametersCommand, SSMClient } from '@aws-sdk/client-ssm';
import * as fs from 'fs';
import * as path from 'path';

export class SSMConfigService {
  private ssmClient: SSMClient;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.ssmClient = new SSMClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async getParameters(paths: string[]): Promise<Record<string, string>> {
    if (this.isProduction) {
      // 프로덕션 환경에서는 SSM 사용
      return await this.getParametersFromSSM(paths);
    } else {
      // 로컬 환경에서는 .env 파일 사용
      return this.getParametersFromEnv(paths);
    }
  }

  private async getParametersFromSSM(
    paths: string[],
  ): Promise<Record<string, string>> {
    const command = new GetParametersCommand({
      Names: paths,
      WithDecryption: true,
    });

    const response = await this.ssmClient.send(command);
    const parameters: Record<string, string> = {};

    response.Parameters?.forEach((param) => {
      const key = param.Name?.split('/').pop() || '';
      parameters[key] = param.Value || '';
    });

    return parameters;
  }

  private getParametersFromEnv(paths: string[]): Record<string, string> {
    const parameters: Record<string, string> = {};
    const envPath = path.join(process.cwd(), '.env');

    // .env 파일이 없으면 빈 객체 반환
    if (!fs.existsSync(envPath)) {
      return parameters;
    }

    // .env 파일 읽기
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars: Record<string, string> = {};

    envContent.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // 따옴표 제거
        envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    });

    // 요청된 파라미터들만 추출
    paths.forEach((path) => {
      const key = path.split('/').pop() || '';
      if (envVars[key]) {
        parameters[key] = envVars[key];
      }
    });

    return parameters;
  }
}
