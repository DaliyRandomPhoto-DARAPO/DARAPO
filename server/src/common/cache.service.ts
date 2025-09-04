// Redis 캐시 서비스 - 데이터 캐싱 및 세션 관리
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  // 사용자 세션 관리
  async setUserSession(
    userId: string,
    sessionData: any,
    ttl = 3600,
  ): Promise<void> {
    await this.set(`user:session:${userId}`, sessionData, ttl);
  }

  async getUserSession(userId: string): Promise<any> {
    return this.get(`user:session:${userId}`);
  }

  async deleteUserSession(userId: string): Promise<void> {
    await this.del(`user:session:${userId}`);
  }

  // 미션 캐시
  async cacheMission(
    missionId: string,
    missionData: any,
    ttl = 300,
  ): Promise<void> {
    await this.set(`mission:${missionId}`, missionData, ttl);
  }

  async getCachedMission(missionId: string): Promise<any> {
    return this.get(`mission:${missionId}`);
  }

  // 사진 캐시
  async cachePhotos(queryKey: string, photos: any[], ttl = 180): Promise<void> {
    await this.set(`photos:${queryKey}`, photos, ttl);
  }

  async getCachedPhotos(queryKey: string): Promise<any[]> {
    const cached = await this.get<any[]>(`photos:${queryKey}`);
    return cached || [];
  }

  // JWT 토큰 블랙리스트 관리
  async blacklistToken(token: string, ttl?: number): Promise<void> {
    // 토큰을 블랙리스트에 추가 (기본 14일 TTL)
    const defaultTtl = ttl || 14 * 24 * 60 * 60; // 14일
    await this.set(`blacklist:token:${token}`, true, defaultTtl);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.get<boolean>(`blacklist:token:${token}`);
    return result === true;
  }

  // 사용자별 토큰 저장 및 관리
  async storeUserToken(
    userId: string,
    tokenData: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
    },
  ): Promise<void> {
    await this.set(`user:tokens:${userId}`, tokenData, 14 * 24 * 60 * 60); // 14일
  }

  async getUserTokens(userId: string): Promise<any> {
    return this.get(`user:tokens:${userId}`);
  }

  async revokeUserTokens(userId: string): Promise<void> {
    const tokens = await this.getUserTokens(userId);
    if (tokens) {
      // 액세스 토큰을 블랙리스트에 추가
      if (tokens.accessToken) {
        await this.blacklistToken(tokens.accessToken);
      }
      // 리프레시 토큰을 블랙리스트에 추가
      if (tokens.refreshToken) {
        await this.blacklistToken(tokens.refreshToken);
      }
    }
    // 사용자 토큰 정보 삭제
    await this.del(`user:tokens:${userId}`);
  }

  // 토큰 만료 자동 정리 (주기적으로 호출)
  async cleanupExpiredTokens(): Promise<void> {
    // Redis TTL을 이용하므로 별도 정리 불필요
    // 이 메서드는 미래 확장을 위한 플레이스홀더
  }
}
