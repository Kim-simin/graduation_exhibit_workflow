import type { Exhibition } from './get-exhibitions';
import { STANDARD_CATEGORIES, getStandardCategory } from '@/src/utils/categoryMapper';

export type BrowseMode = 'major' | 'industry';
export const MAJORS = STANDARD_CATEGORIES.filter(item => item.id !== 'all').map(item => ({ id: item.id, name: item.name }));
export const INDUSTRIES = [
  { id: 'digital', name: '디지털 서비스', majors: ['it_sw', 'design_ux', 'game_meta'] },
  { id: 'manufacturing', name: '제조·제품', majors: ['engineering', 'design_ux'] },
  { id: 'space', name: '건축·도시', majors: ['architecture'] },
  { id: 'culture', name: '문화·콘텐츠', majors: ['media_toon', 'art_craft', 'game_meta'] },
  { id: 'lifestyle', name: '패션·라이프스타일', majors: ['fashion', 'art_craft'] },
  { id: 'business', name: '비즈니스·마케팅', majors: ['business'] },
];
export function majorId(item: Exhibition) {
  const name = getStandardCategory(item.category || item.department);
  return MAJORS.find(major => major.name === name)?.id || 'design_ux';
}
export function inField(item: Exhibition, mode: BrowseMode, field: string) {
  if (!field || field === 'all') return true;
  return mode === 'major' ? majorId(item) === field : Boolean(INDUSTRIES.find(industry => industry.id === field)?.majors.includes(majorId(item)));
}
export function mediaUrl(value?: string | null) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  return '/api/images/' + value.split('/').map(encodeURIComponent).join('/');
}
export function safeExternalUrl(value?: string) {
  return value && /^https?:\/\//i.test(value) ? value : undefined;
}
export type ExhibitionStatus = '예정' | '진행 중' | '종료' | '일정 미정';

// Only classify complete calendar dates; a year or partial range is not an event date.
export function exhibitionDates(period: string): { start: string; end: string } | null {
  const full = /\b(20\d{2})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})/;
  const first = period.match(full);
  if (!first) return null;
  const iso = (year: number, month: number, day: number) => {
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date.toISOString().slice(0, 10) : null;
  };
  const start = iso(+first[1], +first[2], +first[3]);
  if (!start) return null;
  const tail = period.slice((first.index || 0) + first[0].length).replace(/^[.일\s]*(?:\([^)]*\))?\s*/, '');
  const range = tail.match(/^[-~–—]\s*(.*)/);
  if (!range) return { start, end: start };
  const lastFull = range[1].match(full);
  const short = range[1].match(/^(\d{1,2})[.\-/월]\s*(\d{1,2})/);
  let end: string | null = null;
  if (lastFull) end = iso(+lastFull[1], +lastFull[2], +lastFull[3]);
  else if (short) end = iso(+first[1] + (+short[1] < +first[2] ? 1 : 0), +short[1], +short[2]);
  return end && end >= start ? { start, end } : null;
}
export function exhibitionStatus(item: Exhibition, today: string): ExhibitionStatus {
  const dates = exhibitionDates(item.period || item.schedule || '');
  if (!dates) return '일정 미정';
  return today < dates.start ? '예정' : today > dates.end ? '종료' : '진행 중';
}
export function koreaToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
