import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { CLASSES } from '../data/classes';
import { ARENA_SHOP, generateOpponents, leaderboard, playerRank, seasonReward } from '../game/arena';
import { heroStats } from '../game/hero';
import { addItems } from '../game/inventory';
import { generateItem, rollRarity } from '../game/items';
import { useBattleLauncher } from '../hooks/useBattleLauncher';
import { useGame } from '../hooks/useGame';
import { PageTitle, Tabs } from '../components/ui';
import { fmt, timeLeft } from '../utils/format';
import { RARITY_INFO } from '../data/items';

const REFRESH_COST = 30;

export function ArenaPage() {
  const { state, mutate, play, toast } = useGame();
  const { launchArena } = useBattleLauncher();
  const [tab, setTab] = useState<'fight' | 'top' | 'shop'>('fight');
  const a = state.arena;
  const myPower = heroStats(state).power;
  const rank = playerRank(state);
  const board = leaderboard(state);

  const refresh = () => {
    if (state.currencies.gold < REFRESH_COST) {
      play('error');
      toast({ kind: 'error', title: 'Недостаточно золота' });
      return;
    }
    play('coin');
    mutate((d) => {
      d.currencies.gold -= REFRESH_COST;
      d.arena.opponents = generateOpponents(d);
    });
  };

  const buy = (id: (typeof ARENA_SHOP)[number]['id'], cost: number) => {
    if (state.currencies.tokens < cost) {
      play('error');
      toast({ kind: 'error', title: 'Недостаточно жетонов арены' });
      return;
    }
    const msg = mutate((d) => {
      d.currencies.tokens -= cost;
      switch (id) {
        case 'chest': {
          let r = rollRarity('arena');
          if (r === 'common' || r === 'uncommon') r = 'rare';
          const it = generateItem(d.hero!.level + 1, r);
          addItems(d, [it]);
          return { title: it.name, text: RARITY_INFO[it.rarity].name, icon: it.icon };
        }
        case 'shards':
          d.currencies.shards += 80;
          return { title: '+80 осколков теней', icon: '🔮' };
        case 'potions':
          d.potions += 5;
          return { title: '+5 зелий', icon: '🧪' };
        case 'crystals':
          d.currencies.crystals += 25;
          return { title: '+25 кристаллов', icon: '💎' };
      }
    });
    play('loot');
    toast({ kind: 'loot', ...msg });
  };

  return (
    <div>
      <PageTitle
        icon="🏟️"
        title="Арена"
        subtitle={`Сезон ${a.season} · до конца ${timeLeft(a.seasonEndsAt - Date.now())}`}
        right={<Tabs value={tab} onChange={setTab} tabs={[{ id: 'fight', label: 'Бои' }, { id: 'top', label: 'Лидеры' }, { id: 'shop', label: 'Магазин' }]} />}
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Рейтинг" value={a.rating} cls="text-amber-300" big />
        <Stat label="Место" value={`#${rank}`} cls="text-zinc-100" big />
        <Stat label="Победы / Пораж." value={`${a.wins} / ${a.losses}`} cls="text-zinc-200" />
        <Stat label="Жетоны" value={`🎖️ ${fmt(state.currencies.tokens)}`} cls="text-orange-300" />
      </div>

      {tab === 'fight' && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              Победа: <b className="text-emerald-400">+25</b> · Поражение: <b className="text-red-400">−15</b> · Ваша сила: <b className="text-amber-300">⚡ {fmt(myPower)}</b>
            </div>
            <button className="btn-dark !px-3 !py-2 text-xs" onClick={refresh}>
              <RefreshCw size={14} /> {REFRESH_COST} 🪙
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {a.opponents.map((o, i) => {
              const cls = CLASSES[o.classId];
              const ratio = o.power / Math.max(1, myPower);
              const diff = ratio < 0.9 ? { t: 'Легко', c: 'text-emerald-400' } : ratio < 1.12 ? { t: 'Равный', c: 'text-amber-300' } : { t: 'Опасно', c: 'text-red-400' };
              return (
                <div key={o.id} className="panel anim-fade-in relative overflow-hidden p-4" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="absolute -right-4 -top-4 text-8xl opacity-10">{cls.icon}</div>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full border-2 text-3xl"
                      style={{ borderColor: cls.color, background: `radial-gradient(circle, ${cls.color}44, #000)`, boxShadow: `0 0 16px ${cls.color}55` }}
                    >
                      {cls.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-bold text-zinc-100">{o.name}</div>
                      <div className="text-xs text-zinc-400">
                        {cls.name} · ур. {o.level}
                      </div>
                      <div className="text-xs font-bold text-amber-300">🏆 {o.rating}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-zinc-400">
                      ⚡ Сила: <b className="text-zinc-100">{fmt(o.power)}</b>
                    </span>
                    <span className={`font-bold ${diff.c}`}>{diff.t}</span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {o.gear.map((g) => (
                      <span key={g.id} className="flex h-7 w-7 items-center justify-center rounded border text-sm" style={{ borderColor: RARITY_INFO[g.rarity].color, background: '#0008' }} title={g.name}>
                        {g.icon}
                      </span>
                    ))}
                  </div>
                  <button className="btn-blood mt-3 w-full" onClick={() => launchArena(o)}>
                    ⚔ Вызвать
                  </button>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-zinc-500">На арене бой всегда начинается с полным HP и не тратит ваше здоровье.</p>
        </>
      )}

      {tab === 'top' && (
        <div className="panel overflow-hidden">
          <div className="border-b border-edge p-3 text-sm text-zinc-400">
            Награда за текущее место: {(() => {
              const r = seasonReward(rank);
              return `💎 ${r.crystals} · 🎖️ ${r.tokens} · 🪙 ${r.gold}`;
            })()}
          </div>
          <div className="max-h-[60vh] divide-y divide-edge/50 overflow-y-auto">
            {board.map((row, i) => {
              const cls = CLASSES[row.classId];
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              return (
                <div key={row.name + i} className={`flex items-center gap-3 px-3 py-2 ${row.isPlayer ? 'sticky bottom-0 top-0 z-10 bg-red-950/80 backdrop-blur' : ''}`}>
                  <span className={`w-10 text-center font-black ${i < 3 ? 'text-xl' : 'text-zinc-500'}`}>{medal ?? `#${i + 1}`}</span>
                  <span className="text-xl">{cls.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate font-bold ${row.isPlayer ? 'text-amber-300' : 'text-zinc-200'}`}>
                      {row.name} {row.isPlayer && '(вы)'}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {cls.name} · ур. {row.level}
                    </div>
                  </div>
                  <span className="font-black tabular-nums text-amber-300">{row.rating}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'shop' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ARENA_SHOP.map((it) => (
            <div key={it.id} className="panel flex flex-col items-center p-4 text-center">
              <div className="text-5xl">{it.icon}</div>
              <div className="title mt-2 text-xl text-zinc-100">{it.name}</div>
              <div className="text-xs text-zinc-400">{it.desc}</div>
              <button className="btn-gold mt-3 w-full" disabled={state.currencies.tokens < it.cost} onClick={() => buy(it.id, it.cost)}>
                🎖️ {it.cost}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, cls, big }: { label: string; value: string | number; cls: string; big?: boolean }) {
  return (
    <div className="panel p-3 text-center">
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</div>
      <div className={`font-black ${big ? 'text-3xl' : 'text-xl'} ${cls}`}>{value}</div>
    </div>
  );
}
