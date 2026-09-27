import { Plus, RotateCcw } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { ATTRIBUTE_INFO, CLASSES } from '../data/classes';
import { SLOTS, SLOT_INFO } from '../data/items';
import { allocatePoint, heroStats, respec, RESPEC_COST } from '../game/hero';
import { xpToNext } from '../game/stats';
import { useGame } from '../hooks/useGame';
import { ItemIcon } from '../components/ItemCard';
import { ItemModal } from '../components/ItemModal';
import { Bar, Confirm, PageTitle } from '../components/ui';
import type { Attribute } from '../types';
import { fmt } from '../utils/format';

export function HeroPage() {
  const { state, mutate, play, toast, setPage } = useGame();
  const [itemId, setItemId] = useState<string | null>(null);
  const [confirmRespec, setConfirmRespec] = useState(false);
  const hero = state.hero!;
  const cls = CLASSES[hero.classId];
  const st = heroStats(state);
  const need = xpToNext(hero.level);

  const add = (attr: Attribute, n: number) => {
    if (hero.freePoints <= 0) return;
    play('click');
    mutate((d) => allocatePoint(d, attr, n));
  };

  const statRows: [string, string, string][] = [
    ['❤️', 'Здоровье', fmt(st.maxHp)],
    ['⚔️', 'Атака', fmt(st.atk)],
    ['🛡️', 'Защита', fmt(st.def)],
    ['🎯', 'Шанс крита', `${st.critChance.toFixed(1)}%`],
    ['💥', 'Крит. урон', `${Math.round(st.critDmg)}%`],
    ['💨', 'Скорость', st.speed.toFixed(1)],
    ['🌀', 'Уклонение', `${st.dodge.toFixed(1)}%`],
    ['🧱', 'Блок', `${st.block.toFixed(1)}%`],
    ['🩸', 'Кровотечение', `${st.bleedChance.toFixed(1)}%`],
    ['🦇', 'Вампиризм', `${st.lifesteal.toFixed(1)}%`],
    ['✨', 'Сила магии', `+${Math.round(st.magicPct)}%`],
  ];

  return (
    <div>
      <PageTitle icon="👤" title="Герой" subtitle="Характеристики, экипировка и способности" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        {/* Portrait + equipment */}
        <div className="panel relative overflow-hidden p-5">
          <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 50% 40%, ${cls.color}22, transparent 60%)` }} />
          <div className="relative flex flex-col items-center">
            <div className="text-center">
              <div className="title text-3xl text-zinc-100">{hero.name}</div>
              <div className="text-sm" style={{ color: cls.color }}>
                {cls.icon} {cls.name} · Уровень {hero.level}
              </div>
            </div>
            <div className="mt-4 grid w-full max-w-md grid-cols-[auto_1fr_auto] items-center gap-3">
              <div className="flex flex-col gap-2">
                {(['helmet', 'armor', 'gloves', 'boots'] as const).map((s) => (
                  <Slot key={s} slot={s} onOpen={setItemId} goInventory={() => setPage('inventory')} />
                ))}
              </div>
              <div className="flex flex-col items-center">
                <div
                  className="anim-idle flex h-36 w-36 items-center justify-center rounded-full border-4 text-7xl sm:h-44 sm:w-44 sm:text-8xl"
                  style={{ borderColor: cls.color, background: `radial-gradient(circle at 50% 35%, ${cls.color}55, #050407 70%)`, boxShadow: `0 0 40px ${cls.color}77` }}
                >
                  {cls.icon}
                </div>
                <div className="mt-3 rounded-xl border border-amber-500/40 bg-black/60 px-4 py-1.5 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Сила героя</div>
                  <div className="text-2xl font-black text-amber-300">⚡ {fmt(st.power)}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {(['weapon', 'ring', 'amulet'] as const).map((s) => (
                  <Slot key={s} slot={s} onOpen={setItemId} goInventory={() => setPage('inventory')} />
                ))}
              </div>
            </div>
            <div className="mt-5 w-full max-w-md space-y-2">
              <Bar value={hero.hp} max={st.maxHp} height="h-4" color="from-emerald-500 to-emerald-800" label={`HP ${fmt(hero.hp)} / ${fmt(st.maxHp)}`} />
              <Bar value={hero.xp} max={need} height="h-4" color="from-purple-500 to-indigo-800" label={`XP ${fmt(hero.xp)} / ${fmt(need)}`} />
            </div>
          </div>
        </div>

        {/* Attributes & stats */}
        <div className="flex flex-col gap-4">
          <div className={`panel p-4 ${hero.freePoints > 0 ? 'anim-glow border-amber-600/70' : ''}`} style={{ '--glow': 'rgba(245,158,11,0.4)' } as CSSProperties}>
            <div className="mb-3 flex items-center justify-between">
              <div className="title text-xl text-zinc-100">Характеристики</div>
              <div className="flex items-center gap-2">
                <span className={`chip ${hero.freePoints ? 'border-amber-500 text-amber-300' : 'text-zinc-500'}`}>Очки: {hero.freePoints}</span>
                <button className="rounded-lg border border-edge p-1.5 text-zinc-400 hover:text-white" title={`Сбросить за ${RESPEC_COST} 💎`} onClick={() => setConfirmRespec(true)}>
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {(Object.keys(ATTRIBUTE_INFO) as Attribute[]).map((a) => {
                const info = ATTRIBUTE_INFO[a];
                const rec = cls.recommended.includes(a);
                return (
                  <div key={a} className="panel-inner flex items-center gap-3 px-3 py-2">
                    <span className="text-2xl">{info.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 font-bold text-zinc-100">
                        {info.name} <span className="text-amber-300">{st.attributes[a]}</span>
                        {rec && <span className="rounded bg-emerald-900/60 px-1.5 text-[9px] font-bold uppercase text-emerald-300">рекоменд.</span>}
                      </div>
                      <div className="truncate text-[11px] text-zinc-500">{info.desc}</div>
                    </div>
                    <button className="btn-gold !p-2" disabled={!hero.freePoints} onClick={() => add(a, 1)} aria-label={`+1 ${info.name}`}>
                      <Plus size={16} />
                    </button>
                    <button className="btn-dark !px-2 !py-2 text-xs" disabled={hero.freePoints < 5} onClick={() => add(a, 5)}>
                      +5
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel p-4">
            <div className="title mb-2 text-xl text-zinc-100">Боевые параметры</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {statRows.map(([icon, name, v]) => (
                <div key={name} className="flex items-center justify-between border-b border-edge/40 py-1">
                  <span className="text-zinc-400">
                    {icon} {name}
                  </span>
                  <span className="font-bold tabular-nums text-zinc-100">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel mt-4 p-4">
        <div className="title mb-2 text-xl text-zinc-100">Способности · {cls.name}</div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {cls.abilities.map((ab) => {
            const open = hero.level >= ab.unlockLevel;
            return (
              <div key={ab.id} className={`panel-inner p-3 ${open ? 'border-purple-800/60' : 'opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">✨ {ab.name}</span>
                  <span className="text-xs text-zinc-500">{open ? `${ab.cost} ⚡ · КД ${ab.cooldown}` : `🔒 ур. ${ab.unlockLevel}`}</span>
                </div>
                <div className="mt-1 text-xs text-zinc-400">{ab.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel mt-4 grid grid-cols-2 gap-2 p-4 text-center sm:grid-cols-4">
        {[
          ['Убийств', state.counters.kills],
          ['Боссов', state.counters.bossKills],
          ['Лучшая серия', state.counters.bestWinStreak],
          ['Критов', state.counters.crits],
        ].map(([k, v]) => (
          <div key={k}>
            <div className="text-2xl font-black text-zinc-100">{fmt(v as number)}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{k}</div>
          </div>
        ))}
      </div>

      <ItemModal itemId={itemId} onClose={() => setItemId(null)} />
      <Confirm
        open={confirmRespec}
        danger={false}
        title="Сбросить характеристики?"
        text={`Все распределённые очки вернутся. Стоимость: ${RESPEC_COST} 💎`}
        confirmLabel={`Сбросить · ${RESPEC_COST} 💎`}
        onClose={() => setConfirmRespec(false)}
        onConfirm={() => {
          setConfirmRespec(false);
          if (state.currencies.crystals < RESPEC_COST) {
            play('error');
            toast({ kind: 'error', title: 'Недостаточно кристаллов' });
            return;
          }
          mutate((d) => {
            d.currencies.crystals -= RESPEC_COST;
            respec(d);
          });
          play('magic');
        }}
      />
    </div>
  );
}

function Slot({ slot, onOpen, goInventory }: { slot: (typeof SLOTS)[number]; onOpen: (id: string) => void; goInventory: () => void }) {
  const { state } = useGame();
  const item = state.equipment[slot];
  const info = SLOT_INFO[slot];
  if (item) return <ItemIcon item={item} onClick={() => onOpen(item.id)} />;
  return (
    <button
      onClick={goInventory}
      title={info.name}
      className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-black/40 text-2xl opacity-60 transition hover:opacity-100"
    >
      {info.icon}
      <span className="text-[8px] font-bold uppercase text-zinc-500">{info.name}</span>
    </button>
  );
}
