export function validateEnv(config: Record<string, any>) {
  const errors: string[] = [];

  const requireIf = (key: string, cond = true) => {
    if (cond && !config[key]) errors.push(`${key} is required`);
  };

  // App
  requireIf('JWT_SECRET');
  requireIf('JWT_EXPIRES_IN');
  requireIf('PORT', false); // 기본값 3000 사용 가능

  // DB - MongoDB Atlas
  requireIf('MONGODB_URI'); // Atlas 연결 문자열

  // Valkey (Redis 호환)
  requireIf('VALKEY_HOST', false); // 기본값 localhost
  requireIf('VALKEY_PORT', false); // 기본값 6379

  // Kakao OAuth
  requireIf('KAKAO_REST_API_KEY');
  requireIf('KAKAO_CLIENT_SECRET');
  requireIf('KAKAO_REDIRECT_URI');

  // AWS S3
  requireIf('AWS_REGION');
  requireIf('AWS_S3_BUCKET');

  // SSL/HTTPS (선택)
  requireIf('SSL_CERT_PATH', false);
  requireIf('SSL_KEY_PATH', false);

  if (errors.length) {
    throw new Error('Invalid environment: ' + errors.join(', '));
  }

  return config;
}
