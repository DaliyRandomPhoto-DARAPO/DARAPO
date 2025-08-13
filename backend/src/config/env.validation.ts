export function validateEnv(config: Record<string, any>) {
  const errors: string[] = [];

  const requireIf = (key: string, cond = true) => {
    if (cond && !config[key]) errors.push(`${key} is required`);
  };

  // App
  requireIf('JWT_SECRET');

  // DB
  requireIf('MONGODB_URI');

  // Kakao OAuth
  requireIf('KAKAO_REST_API_KEY');
  requireIf('KAKAO_CLIENT_SECRET');
  requireIf('KAKAO_REDIRECT_URI');

  // AWS S3
  requireIf('AWS_REGION');
  requireIf('AWS_S3_BUCKET');
  // Credentials can be provided via environment/instance profile; optional explicit keys
  // requireIf('AWS_ACCESS_KEY_ID');
  // requireIf('AWS_SECRET_ACCESS_KEY');

  if (errors.length) {
    throw new Error('Invalid environment: ' + errors.join(', '));
  }

  return config;
}
