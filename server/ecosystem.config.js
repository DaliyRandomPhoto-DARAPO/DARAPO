const os = require('os');

module.exports = {
  apps: [{
    name: 'darapo-server',
    script: './dist/main.js',
    // run one process per CPU core (good default for small EC2 like t3.medium)
    instances: os.cpus().length,
    exec_mode: 'cluster',
    
    // 환경변수는 .env 파일에서 자동으로 로드됩니다
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      // increase libuv threadpool to handle native/image work (sharp, s3 presign etc.)
      // for a 2 vCPU machine (t3.medium) 4 is a reasonable starting point
      UV_THREADPOOL_SIZE: '4',
    },
    
    // 로그 설정
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // 성능 설정
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // 기타 설정
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs', '*.log']
  }]
};