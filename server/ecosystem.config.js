const os = require('os');

module.exports = {
  apps: [{
    name: 'darapo-server',
    script: './dist/main.js',
    // ARM64 (t4g.medium) 최적화
    instances: Math.min(os.cpus().length, 2), // 최대 2개로 제한
    exec_mode: 'cluster',
    
    // 환경변수는 SSM Parameter Store에서 로드
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      // ARM64 최적화
      UV_THREADPOOL_SIZE: '8', // t4g.medium에 맞춰 증가
    },
    
    // CloudWatch Logs 통합
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 메모리 최적화 (t4g.medium)
    max_memory_restart: '1.5G', // 2GB 중 1.5GB로 제한
    restart_delay: 4000,
    max_restarts: 5,
    min_uptime: '30s',
    
    // 보안 및 모니터링
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs', '*.log'],
    
    // 헬스체크
    health_check: {
      enabled: true,
      path: '/health/liveness',
      interval: 30000,
      timeout: 5000,
    },
  }]
};