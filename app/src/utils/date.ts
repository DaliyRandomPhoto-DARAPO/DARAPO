/**
 * KST(Asia/Seoul) Date Utilities
 * - JS Date는 UTC epoch를 저장합니다. 이 유틸은 보기/일자 경계 연산만 KST로 강제합니다.
 */

export const KST_TZ = "Asia/Seoul" as const;

/** 내부: Intl 포맷 파츠에서 값 추출 */
const getPart = (
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPart["type"],
) => parts.find((p) => p.type === type)?.value ?? "";

/** MM/DD (KST) */
export const formatKstMMDD = (input?: string | number | Date): string => {
  const d = input ? new Date(input) : new Date();
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TZ,
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  return `${getPart(parts, "month")}/${getPart(parts, "day")}`;
};

/** YYYY-MM-DD (KST) */
export const formatKstYYYYMMDD = (
  input?: string | number | Date,
  sep: "-" | "." | "/" = "-",
): string => {
  const d = input ? new Date(input) : new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = getPart(parts, "year");
  const m = getPart(parts, "month");
  const day = getPart(parts, "day");
  return [y, m, day].join(sep);
};

/** 리스트 키 등으로 쓰는 KST 일자 키(YYYY-MM-DD) */
export const kstDateKey = (input?: string | number | Date): string =>
  formatKstYYYYMMDD(input, "-");

/** KST 자정(00:00) 기준의 UTC Date 반환 (Mongo 질의 등에 사용) */
export const kstStartOfDayUTC = (input?: string | number | Date): Date => {
  const base = input ? new Date(input) : new Date();
  // 현재 시점의 UTC epoch
  const utcMs = base.getTime() + base.getTimezoneOffset() * 60000;
  // KST로 변환 후 자정 설정
  const kst = new Date(utcMs + 9 * 60 * 60000);
  kst.setHours(0, 0, 0, 0);
  // 다시 UTC로 환산
  return new Date(kst.getTime() - 9 * 60 * 60000);
};

/** KST 자정 다음날(24h 후) UTC Date */
export const kstEndOfDayUTC = (input?: string | number | Date): Date => {
  const start = kstStartOfDayUTC(input);
  return new Date(start.getTime() + 24 * 60 * 60000);
};

/** 두 시각이 KST 기준으로 같은 날짜인지 */
export const isSameKstDay = (
  a?: string | number | Date,
  b?: string | number | Date,
): boolean => kstDateKey(a) === kstDateKey(b);
