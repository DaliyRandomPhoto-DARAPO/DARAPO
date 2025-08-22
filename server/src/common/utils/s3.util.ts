import { S3Service } from '../../common/s3.service';

export function isExternalUrl(v?: string | null) {
  return !!v && /^https?:\/\//.test(v);
}

export async function resolveMaybeSignedUrl(s3: S3Service, v?: string | null) {
  if (!v) return null;
  if (isExternalUrl(v) || v.startsWith('/')) return v;
  try {
    return await s3.getSignedUrl(v);
  } catch {
    return null;
  }
}
