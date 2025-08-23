import { BASE_URL } from '../services/api';
import type { Mission } from '../types/mission';

export function normalizeMission(raw: any): Mission | undefined {
  if (!raw) return undefined;
  const id = raw._id || raw.id || String(Math.random());
  const title = (raw.title || raw.name || '오늘의 미션') as string;
  const subtitle = raw.subtitle ?? null;
  const description = raw.description ?? null;
  const isRare = !!raw.isRare;
  const twist = raw.twist ?? null;
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const imageUrlRaw = raw.imageUrl ?? raw.image?.url ?? null;
  const imageUrl = imageUrlRaw ? (String(imageUrlRaw).startsWith('http') ? String(imageUrlRaw) : `${BASE_URL.replace(/\/$/, '')}/${String(imageUrlRaw).replace(/^\//, '')}`) : null;
  const date = raw.date ? (typeof raw.date === 'string' ? raw.date : (raw.date as Date).toISOString()) : undefined;

  return {
    _id: String(id),
    title: String(title),
    subtitle: subtitle === null ? undefined : subtitle,
    description: description === null ? undefined : description,
    date,
    isRare,
    twist,
    tags,
    imageUrl,
  } as Mission;
}
