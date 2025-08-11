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

  if (errors.length) {
    throw new Error('Invalid environment: ' + errors.join(', '));
  }

  return config;
}
