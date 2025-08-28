import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  jwtSecret: process.env.JWT_SECRET,
  corsOrigins: process.env.NODE_ENV === 'production'
    ? ['https://darapo.app']
    : true,
}));

export const databaseConfig = registerAs('database', () => ({
  mongoUri: process.env.MONGODB_URI,
  connectionTimeout: 5000,
  serverSelectionTimeout: 5000,
  maxPoolSize: 10,
}));

export const cacheConfig = registerAs('cache', () => ({
  host: process.env.VALKEY_HOST || 'localhost',
  port: process.env.VALKEY_PORT ? parseInt(process.env.VALKEY_PORT, 10) : 6379,
  password: process.env.VALKEY_PASSWORD,
  ttl: 300,
  maxRetries: 3,
}));

export const awsConfig = registerAs('aws', () => ({
  region: process.env.AWS_REGION || 'us-east-1',
  s3Bucket: process.env.AWS_S3_BUCKET,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
}));

export const kakaoConfig = registerAs('kakao', () => ({
  restApiKey: process.env.KAKAO_REST_API_KEY,
  clientSecret: process.env.KAKAO_CLIENT_SECRET,
  redirectUri: process.env.KAKAO_REDIRECT_URI,
}));
