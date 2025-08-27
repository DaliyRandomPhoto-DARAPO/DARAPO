// S3 키인지 외부 URL인지 판별하고, 필요시 S3 서명 URL로 변환하는 유틸 함수
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
