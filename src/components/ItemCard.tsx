import { Lock } from 'lucide-react';
import { RARITY_INFO, SLOT_INFO, STAT_LABELS } from '../data/items';
import { itemPower, itemStats } from '../game/items';
import type { Item, StatBlock, StatKey } from '../types';
import { formatStat, roundStat } from '../utils/format';

export function ItemIcon({ item, size = 'md', onClick, selected, better }: { item: Item; size?: 'sm' | 'md' | 'lg'; onClick?: () => void; selected?: boolean; better?: boolean }) {
  const r = RARITY_INFO[item.rarity];
  const dims = size === 'sm' ? 'h-12 w-12 text-2xl' : size === 'lg' ? 'h-20 w-20 text-4xl' : 'h-16 w-16 text-3xl';
  return (
    <button
      onClick={onClick}
      className={`group relative flex ${dims} shrink-0 items-center justify-center rounded-xl border-2 ${r.border} ${r.glow} transition hover:-translate-y-0.5 hover:brightness-125 ${
        selected ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''
      }`}
      style={{ background: `radial-gradient(circle at 50% 35%, ${r.color}40, #0a080d 70%)` }}
      title={item.name}
    >
      <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{item.icon}</span>
      {item.upgrade > 0 && (
        <span className="absolute right-0.5 top-0.5 rounded bg-black/80 px-1 text-[10px] font-black text-amber-300">+{item.upgrade}</span>
      )}
      <span className="absolute bottom-0.5 left-0.5 rounded bg-black/80 px-1 text-[9px] font-bold text-zinc-300">{item.level}</span>
      {item.isNew && <span className="absolute -left-1 -top-1 rounded-full bg-red-600 px-1 text-[8px] font-black uppercase text-white">new</span>}
      {better && <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 px-1 text-[10px] font-black text-black">▲</span>}
      {item.locked && <Lock size={10} className="absolute left-0.5 top-0.5 text-amber-300" />}
    </button>
  );
}

export function StatLines({ stats, dim = false }: { stats: StatBlock; dim?: boolean }) {
  return (
    <ul className="space-y-0.5 text-sm">
      {Object.entries(stats).map(([k, v]) => (
        <li key={k} className={dim ? 'text-zinc-400' : 'text-zinc-200'}>
          <span className="mr-1">{STAT_LABELS[k as StatKey].icon}</span>
          {formatStat(k as StatKey, v ?? 0)}
        </li>
      ))}
    </ul>
  );
}

export function ItemHeader({ item }: { item: Item }) {
  const r = RARITY_INFO[item.rarity];
  return (
    <div className="flex items-center gap-3">
      <ItemIcon item={item} size="lg" />
      <div className="min-w-0">
        <div className={`title text-xl leading-tight ${r.text}`}>
          {item.name}
          {item.upgrade > 0 && <span className="text-amber-300"> +{item.upgrade}</span>}
        </div>
        <div className="text-xs text-zinc-400">
          <span style={{ color: r.color }}>{r.name}</span> · {SLOT_INFO[item.slot].name} · Ур. {item.level}
        </div>
        <div className="mt-1 text-xs font-bold text-amber-300">⚡ Сила: {itemPower(item)}</div>
      </div>
    </div>
  );
}

/** Stat-by-stat comparison of a candidate against the equipped item. */
export function ItemCompare({ item, equipped }: { item: Item; equipped?: Item }) {
  const a = itemStats(item);
  const b = equipped ? itemStats(equipped) : {};
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])) as StatKey[];
  const pd = itemPower(item) - (equipped ? itemPower(equipped) : 0);
  return (
    <div className="panel-inner overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-edge/70 bg-black/40 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        <span>Характеристика</span>
        <span className="text-right text-emerald-400">Новый</span>
        <span className="w-16 text-right">Надет</span>
      </div>
      <div className="divide-y divide-edge/40">
        {keys.map((k) => {
          const va = a[k] ?? 0;
          const vb = b[k] ?? 0;
          const diff = roundStat(k, va - vb);
          const info = STAT_LABELS[k];
          return (
            <div key={k} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 px-3 py-1.5 text-sm">
              <span className="text-zinc-300">
                {info.icon} {k.endsWith('Pct') ? `% ${info.name}` : info.name}
              </span>
              <span className="text-right font-bold text-zinc-100">
                {roundStat(k, va)}
                {diff !== 0 && (
                  <span className={`ml-1.5 text-xs ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {diff > 0 ? '▲' : '▼'}
                    {Math.abs(diff)}
                  </span>
                )}
              </span>
              <span className="w-16 text-right text-zinc-500">{equipped ? roundStat(k, vb) : '—'}</span>
            </div>
          );
        })}
      </div>
      <div className={`flex items-center justify-between px-3 py-2 text-sm font-bold ${pd >= 0 ? 'bg-emerald-950/40 text-emerald-400' : 'bg-red-950/40 text-red-400'}`}>
        <span>{equipped ? 'Изменение силы' : 'Слот пуст'}</span>
        <span>
          {pd >= 0 ? '+' : ''}
          {pd} ⚡
        </span>
      </div>
    </div>
  );
}
