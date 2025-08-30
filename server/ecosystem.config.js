const os = require('os');
require('dotenv').config();

module.exports = {
  apps: [{
    name: 'darapo-server',
    script: './dist/main.js',
    instances: Math.min(os.cpus().length, 2),
    exec_mode: 'cluster',
    node_args: "--max-old-space-size=512",

    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.PORT || 3000,

      // MongoDB
      MONGODB_URI: process.env.MONGODB_URI,

      // JWT
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

      // Cache
      VALKEY_HOST: process.env.VALKEY_HOST,
      VALKEY_PORT: process.env.VALKEY_PORT,
      VALKEY_PASSWORD: process.env.VALKEY_PASSWORD,

      // OAuth
      KAKAO_REST_API_KEY: process.env.KAKAO_REST_API_KEY,
      KAKAO_CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET,
      KAKAO_REDIRECT_URI: process.env.KAKAO_REDIRECT_URI,

      // AWS
      AWS_REGION: process.env.AWS_REGION,
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,

      // PM2 최적화
      UV_THREADPOOL_SIZE: '8',
      DISABLE_MEMORY_OPTIMIZER_LOGS: 'true',
    },

    error_file: '/home/ec2-user/DARAPO/server/logs/err.log',
    out_file: '/home/ec2-user/DARAPO/server/logs/out.log',
    log_file: '/home/ec2-user/DARAPO/server/logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    max_memory_restart: '1536M',
    restart_delay: 4000,
    max_restarts: 5,
    min_uptime: '30s',
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs', '*.log'],
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
  }]
};