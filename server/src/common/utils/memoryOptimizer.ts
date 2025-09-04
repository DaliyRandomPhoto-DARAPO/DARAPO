import v8 from 'v8';

const DISABLE_MEMOPT = process.env.DISABLE_MEMORY_OPTIMIZER === 'true';
const DISABLE_MEMOPT_LOGS =
  process.env.DISABLE_MEMORY_OPTIMIZER_LOGS === 'true';
const LOG_COOLDOWN_MS = Number(process.env.MEMOPT_LOG_COOLDOWN_MS ?? 60000); // 60s
const RSS_TRIGGER_MB = Number(process.env.MEMOPT_RSS_TRIGGER_MB ?? 300); // 300MB
const HEAP_LIMIT_PCT_WARN = Number(
  process.env.MEMOPT_HEAP_LIMIT_PCT_WARN ?? 70,
); // %
const HEAP_LIMIT_PCT_OPT = Number(process.env.MEMOPT_HEAP_LIMIT_PCT_OPT ?? 75); // %

/**
 * 메모리 사용량 모니터링 및 최적화
 */
export class MemoryOptimizer {
  private static instance: MemoryOptimizer;
  private monitoringInterval?: NodeJS.Timeout;
  private lastLogAt = 0;

  static getInstance(): MemoryOptimizer {
    if (!MemoryOptimizer.instance) {
      MemoryOptimizer.instance = new MemoryOptimizer();
    }
    return MemoryOptimizer.instance;
  }

  startMonitoring(): void {
    if (DISABLE_MEMOPT) return; // 완전 비활성
    if (this.monitoringInterval) return; // 이미 모니터링 중
    this.monitoringInterval = setInterval(() => this.checkMemoryUsage(), 30000);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  private maybeLog(
    _level: 'log' | 'warn' | 'debug',
    _msg: string,
    _meta?: any,
  ) {
    const now = Date.now();
    if (now - this.lastLogAt < LOG_COOLDOWN_MS) return; // 스로틀
    this.lastLogAt = now;
    if (DISABLE_MEMOPT_LOGS) return; // 로그 끄기
    // 로그 출력
  }

  private checkMemoryUsage(): void {
    if (DISABLE_MEMOPT) return;

    const m = process.memoryUsage();
    const heapLimitMB = v8.getHeapStatistics().heap_size_limit / 1024 / 1024;
    const heapUsedMB = m.heapUsed / 1024 / 1024;
    const rssMB = m.rss / 1024 / 1024;

    const heapPctOfLimit = heapLimitMB ? (heapUsedMB / heapLimitMB) * 100 : 0;

    // 경고 로그 (상한 기준)
    if (heapPctOfLimit > HEAP_LIMIT_PCT_WARN || rssMB > RSS_TRIGGER_MB) {
      this.maybeLog(
        'warn',
        `[MemoryOptimizer] High memory usage (limit basis): ${heapPctOfLimit.toFixed(2)}%`,
        {
          heapUsed: `${heapUsedMB.toFixed(2)}MB`,
          heapLimit: `${heapLimitMB.toFixed(0)}MB`,
          rss: `${rssMB.toFixed(2)}MB`,
        },
      );
    }

    // 최적화 트리거 (상한 기준 + RSS)
    if (heapPctOfLimit > HEAP_LIMIT_PCT_OPT || rssMB > RSS_TRIGGER_MB) {
      this.optimizeMemory(heapPctOfLimit, rssMB, heapLimitMB);
    }
  }

  private optimizeMemory(
    heapPctOfLimit: number,
    rssMB: number,
    heapLimitMB: number,
  ): void {
    // 캐시 정리/버퍼 해제 등 “가벼운” 작업만
    this.maybeLog('log', '[MemoryOptimizer] Memory optimization triggered', {
      heapPctOfLimit: `${heapPctOfLimit.toFixed(2)}%`,
      rss: `${rssMB.toFixed(2)}MB`,
      heapLimit: `${heapLimitMB.toFixed(0)}MB`,
    });

    // 개발 환경에서만 강제 GC
    if (process.env.NODE_ENV === 'development' && (global as any).gc) {
      (global as any).gc();
      this.maybeLog('debug', '[MemoryOptimizer] Forced garbage collection');
    }
  }

  getMemoryStats() {
    const m = process.memoryUsage();
    const s = v8.getHeapStatistics();
    return {
      heapUsed: m.heapUsed,
      heapTotal: m.heapTotal,
      external: m.external,
      rss: m.rss,
      heapSizeLimit: s.heap_size_limit,
      totalHeapSize: s.total_heap_size,
      usedHeapSize: s.used_heap_size,
      heapUsedPercentOfLimit: s.heap_size_limit
        ? (m.heapUsed / s.heap_size_limit) * 100
        : 0,
    };
  }
}

/**
 * 메모리 최적화 미들웨어
 */
export const memoryOptimizationMiddleware = (req: any, res: any, next: any) => {
  const DISABLE_SLOW_LOGS = process.env.DISABLE_SLOW_REQUEST_LOGS === 'true';
  const SLOW_MS = Number(process.env.SLOW_REQUEST_MS ?? 1000);

  const startTime = process.hrtime.bigint();
  res.on('finish', () => {
    if (DISABLE_SLOW_LOGS) return;
    const endTime = process.hrtime.bigint();
    const processingTime = Number(endTime - startTime) / 1e6;
    if (processingTime > SLOW_MS) {
      // 느린 요청 로깅
    }
  });
  next();
};
