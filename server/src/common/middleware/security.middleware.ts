import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * 보안 미들웨어 설정
 */
export const setupSecurity = (app: INestApplication): void => {
  const isProd = process.env.NODE_ENV === 'production';

  // Helmet 보안 헤더 강화
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", ...(isProd ? [] : ["http://localhost:*", "ws://localhost:*"])],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  // Rate Limiting 강화
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15분
      max: 100, // IP당 최대 요청 수
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
      // Redis 스토어 사용 (추후)
      // store: Redis 사용 시 설정
    }),
  );

  // 추가 보안 헤더
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // API 버전 헤더
    res.setHeader('X-API-Version', '1.0.0');

    next();
  });
};

/**
 * 요청 로깅 및 모니터링 미들웨어
 */
export const setupMonitoring = (app: INestApplication): void => {
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, url, ip } = req;
      const { statusCode } = res;

      // 프로덕션에서는 구조화된 로깅
      if (process.env.NODE_ENV === 'production') {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: statusCode >= 400 ? 'error' : 'info',
          method,
          url,
          statusCode,
          duration: `${duration}ms`,
          ip: ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
        }));
      } else {
        console.log(`${method} ${url} ${statusCode} ${duration}ms`);
      }
    });

    next();
  });
};
