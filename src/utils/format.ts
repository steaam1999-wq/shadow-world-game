import { STAT_LABELS } from '../data/items';
import type { StatKey } from '../types';

export const fmt = (n: number) => {
  const v = Math.floor(n);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 10_000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return v.toLocaleString('ru-RU');
};

export const roundStat = (key: StatKey, v: number) => {
  const pct = STAT_LABELS[key].pct;
  return pct ? Math.round(v * 10) / 10 : Math.round(v);
};

export function formatStat(key: StatKey, v: number, withSign = true) {
  const info = STAT_LABELS[key];
  const val = roundStat(key, v);
  const sign = withSign && val > 0 ? '+' : '';
  if (key === 'hpPct' || key === 'atkPct' || key === 'defPct') return `${sign}${val}% ${info.name}`;
  return `${sign}${val}${info.pct ? '%' : ''} ${info.name}`;
}

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export function timeLeft(ms: number) {
  if (ms <= 0) return '0м';
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `${d}д ${h}ч`;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}
