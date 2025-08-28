import v8 from 'v8';

/**
 * 메모리 사용량 모니터링 및 최적화
 */
export class MemoryOptimizer {
  private static instance: MemoryOptimizer;
  private monitoringInterval?: NodeJS.Timeout;

  static getInstance(): MemoryOptimizer {
    if (!MemoryOptimizer.instance) {
      MemoryOptimizer.instance = new MemoryOptimizer();
    }
    return MemoryOptimizer.instance;
  }

  /**
   * 메모리 모니터링 시작
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      return; // 이미 모니터링 중
    }

    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // 30초마다 체크

    console.log('[MemoryOptimizer] Memory monitoring started');
  }

  /**
   * 메모리 모니터링 중지
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('[MemoryOptimizer] Memory monitoring stopped');
    }
  }

  /**
   * 메모리 사용량 체크 및 최적화
   */
  private checkMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    // 메모리 사용량이 80% 이상이면 경고
    if (usagePercent > 80) {
      console.warn(`[MemoryOptimizer] High memory usage: ${usagePercent.toFixed(2)}%`, {
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`,
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
      });

      // 강제 가비지 컬렉션 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        if (global.gc) {
          global.gc();
          console.log('[MemoryOptimizer] Forced garbage collection');
        }
      }
    }

    // 힙 사용량이 70% 이상이면 최적화 권장
    if (usagePercent > 70) {
      this.optimizeMemory();
    }
  }

  /**
   * 메모리 최적화 수행
   */
  private optimizeMemory(): void {
    // 캐시 정리 요청 (추후 구현)
    console.log('[MemoryOptimizer] Memory optimization triggered');
  }

  /**
   * 현재 메모리 상태 조회
   */
  getMemoryStats() {
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      heapUsedPercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      heapSizeLimit: heapStats.heap_size_limit,
      totalHeapSize: heapStats.total_heap_size,
      usedHeapSize: heapStats.used_heap_size,
    };
  }
}

/**
 * 메모리 최적화 미들웨어
 */
export const memoryOptimizationMiddleware = (req: any, res: any, next: any) => {
  // 요청 시작 시간 기록
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    // 요청 처리 시간 계산
    const endTime = process.hrtime.bigint();
    const processingTime = Number(endTime - startTime) / 1e6; // 밀리초

    // 느린 요청 로깅 (1초 이상)
    if (processingTime > 1000) {
      console.warn(`[MemoryOptimizer] Slow request: ${req.method} ${req.url} - ${processingTime.toFixed(2)}ms`);
    }
  });

  next();
};
