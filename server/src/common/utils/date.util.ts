// 날짜 관련 유틸 함수 (KST 변환 등)
export function toKST(date: Date): Date {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utcMs + 9 * 60 * 60000);
}

export function getKSTMidnight(date?: Date): Date {
  const now = date || new Date();
  const kstNow = toKST(now);
  kstNow.setHours(0, 0, 0, 0);
  return kstNow;
}

export function getKSTDateForQuery(date: Date): Date {
  const kstMidnight = getKSTMidnight(date);
  // MongoDB에 저장된 UTC 시간으로 변환
  return new Date(kstMidnight.getTime() - 9 * 60 * 60000);
}

export function getKSTStartAndEndOfDay(date?: Date): { start: Date; end: Date } {
  const targetDate = date || new Date();
  const kstMidnight = getKSTMidnight(targetDate);
  const start = new Date(kstMidnight.getTime() - 9 * 60 * 60000);
  const end = new Date(start.getTime() + 24 * 60 * 60000);
  return { start, end };
}
