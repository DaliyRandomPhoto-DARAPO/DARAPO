const os = require('os');

module.exports = {
  apps: [{
    name: 'darapo-server',
    script: './dist/main.js',

    // 인스턴스 (t4g.medium = 2 vCPU)
    instances: Math.min(os.cpus().length, 2),
    exec_mode: 'cluster',

    // V8 힙 상한 (운영 안정성)
    node_args: "--max-old-space-size=512",

    // 환경변수 (필요 시 여기서 주입, 비밀은 SSM/Secrets Manager 권장)
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      UV_THREADPOOL_SIZE: '8',
      DISABLE_MEMORY_OPTIMIZER_LOGS: 'true',
      // 민감 정보는 SSM에서 로드
    },

    // 로그 (절대 경로로 안정성 향상)
    error_file: '/home/ec2-user/DARAPO/server/logs/err.log',
    out_file: '/home/ec2-user/DARAPO/server/logs/out.log',
    log_file: '/home/ec2-user/DARAPO/server/logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // merge_logs: true, // (선택) 클러스터 각 인스턴스 로그를 하나로 합치기

    // 리소스/안정성
    max_memory_restart: '1536M',
    restart_delay: 4000,
    max_restarts: 5,
    min_uptime: '30s',
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs', '*.log'],
    kill_timeout: 5000,  // graceful shutdown 타임아웃
    wait_ready: true,    // 앱 준비 대기
    listen_timeout: 10000, // 리스닝 타임아웃
  }]
};
