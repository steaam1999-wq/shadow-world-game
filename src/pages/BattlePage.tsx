import { Lock, Skull } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { ENEMIES } from '../data/enemies';
import { LOCATIONS } from '../data/locations';
import { enemyBaseStats } from '../game/combat';
import { heroStats } from '../game/hero';
import { enemyXp } from '../game/rewards';
import { potionPrice, rest, restPrice, buyPotion, INSTANT_HEAL_COST } from '../game/shop';
import { useBattleLauncher } from '../hooks/useBattleLauncher';
import { useGame } from '../hooks/useGame';
import { Bar, PageTitle } from '../components/ui';
import { fmt } from '../utils/format';

export const isLocationUnlocked = (cleared: Record<string, number>, index: number) =>
  index === 0 || (cleared[LOCATIONS[index - 1].id] ?? 0) >= LOCATIONS[index - 1].stages.length;

export function BattlePage() {
  const { state, mutate, toast, play } = useGame();
  const { launchLocation } = useBattleLauncher();
  const hero = state.hero!;
  const st = heroStats(state);

  const currentIdx = Math.max(0, LOCATIONS.findIndex((l, i) => isLocationUnlocked(state.locations, i) && (state.locations[l.id] ?? 0) < l.stages.length));
  const allDone = LOCATIONS.every((l) => (state.locations[l.id] ?? 0) >= l.stages.length);
  const [selected, setSelected] = useState(allDone ? LOCATIONS.length - 1 : currentIdx);
  const loc = LOCATIONS[selected];
  const cleared = state.locations[loc.id] ?? 0;

  const nextGoal = (() => {
    if (allDone) return { text: 'Все земли очищены! Покоряйте Башню и Арену.', loc: -1, stage: -1 };
    const l = LOCATIONS[currentIdx];
    const s = state.locations[l.id] ?? 0;
    const t = ENEMIES[l.stages[s].enemyId];
    return { text: `${l.name}: ${t.boss ? 'БОСС ' : ''}${t.name} (ур. ${l.stages[s].level})`, loc: currentIdx, stage: s };
  })();

  const doRest = (crystals: boolean) => {
    const r = mutate((d) => rest(d, crystals));
    if (r.ok) {
      play('heal');
      toast({ kind: 'success', title: 'Силы восстановлены', icon: '🔥' });
    } else {
      play('error');
      toast({ kind: 'error', title: r.reason });
    }
  };

  const buy = () => {
    const r = mutate((d) => buyPotion(d));
    if (r.ok) {
      play('coin');
      toast({ kind: 'success', title: '+1 зелье здоровья', icon: '🧪' });
    } else {
      play('error');
      toast({ kind: 'error', title: r.reason });
    }
  };

  return (
    <div>
      <PageTitle icon="⚔️" title="Поход" subtitle="Очищайте земли от тьмы, побеждайте боссов и собирайте лут" />

      {/* Next goal */}
      <div className="panel anim-glow mb-4 flex flex-col gap-3 border-red-800/60 p-4 sm:flex-row sm:items-center" style={{ '--glow': 'rgba(185,28,28,0.35)' } as CSSProperties}>
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-widest text-red-400">Следующая цель</div>
          <div className="title text-xl text-zinc-100">{nextGoal.text}</div>
        </div>
        {nextGoal.loc >= 0 && (
          <button className="btn-blood px-6 py-3 text-base" onClick={() => launchLocation(LOCATIONS[nextGoal.loc].id, nextGoal.stage)}>
            ⚔ В бой!
          </button>
        )}
      </div>

      {/* Camp */}
      <div className="panel mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-bold text-zinc-300">🔥 Лагерь</span>
            <span className="text-xs text-zinc-500">HP восстанавливается со временем</span>
          </div>
          <Bar value={hero.hp} max={st.maxHp} height="h-4" color="from-emerald-500 to-emerald-800" label={`${fmt(hero.hp)} / ${fmt(st.maxHp)}`} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-dark !py-2 text-xs" onClick={() => doRest(false)} disabled={hero.hp >= st.maxHp}>
            Отдых {restPrice(state)} 🪙
          </button>
          <button className="btn-dark !py-2 text-xs" onClick={() => doRest(true)} disabled={hero.hp >= st.maxHp}>
            Мгновенно {INSTANT_HEAL_COST} 💎
          </button>
          <button className="btn-green !py-2 text-xs" onClick={buy}>
            🧪 x{state.potions} · +1 за {potionPrice(state)} 🪙
          </button>
        </div>
      </div>

      {/* Locations */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {LOCATIONS.map((l, i) => {
          const unlocked = isLocationUnlocked(state.locations, i);
          const c = state.locations[l.id] ?? 0;
          const done = c >= l.stages.length;
          return (
            <button
              key={l.id}
              disabled={!unlocked}
              onClick={() => {
                play('click');
                setSelected(i);
              }}
              className={`relative flex w-36 shrink-0 flex-col items-center gap-1 rounded-2xl border p-3 transition sm:w-40 ${
                selected === i ? 'border-red-600 bg-red-950/40 shadow-[0_0_18px_rgba(220,38,38,0.4)]' : 'border-edge bg-panel/80 hover:border-zinc-500'
              } disabled:opacity-40`}
            >
              <span className="text-3xl">{unlocked ? l.icon : '🔒'}</span>
              <span className="text-center text-xs font-bold leading-tight text-zinc-200">{l.name}</span>
              <span className="text-[10px] text-zinc-500">ур. {l.stages[0].level}–{l.stages[l.stages.length - 1].level}</span>
              <div className="flex gap-0.5">
                {l.stages.map((_, si) => (
                  <span key={si} className={`h-1.5 w-4 rounded-full ${si < c ? (si === l.stages.length - 1 ? 'bg-amber-400' : 'bg-red-500') : 'bg-zinc-700'}`} />
                ))}
              </div>
              {done && <span className="absolute right-2 top-2 text-xs">✅</span>}
            </button>
          );
        })}
      </div>

      <div className={`panel relative overflow-hidden bg-gradient-to-br ${loc.gradient} p-4 sm:p-6`}>
        <div className="pointer-events-none absolute -right-8 -top-8 text-[10rem] opacity-10">{loc.icon}</div>
        <div className="relative">
          <h2 className="title text-3xl text-zinc-100">
            {loc.icon} {loc.name}
          </h2>
          <p className="max-w-xl text-sm text-zinc-400">{loc.description}</p>
        </div>
        <div className="relative mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {loc.stages.map((s, i) => {
            const t = ENEMIES[s.enemyId];
            const b = enemyBaseStats(t, s.level);
            const locked = i > cleared;
            const isNext = i === cleared;
            const boss = !!t.boss;
            return (
              <div
                key={i}
                className={`relative flex flex-col rounded-2xl border p-3 transition ${
                  boss ? 'border-red-700/80 bg-gradient-to-b from-red-950/70 to-black/80' : 'border-edge bg-black/50'
                } ${isNext ? 'anim-glow' : ''} ${locked ? 'opacity-45' : ''}`}
                style={isNext ? ({ '--glow': boss ? 'rgba(239,68,68,0.6)' : 'rgba(251,191,36,0.4)' } as CSSProperties) : undefined}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-3xl"
                    style={{ borderColor: t.color, background: `radial-gradient(circle, ${t.color}44, #000)` }}
                  >
                    {locked ? <Lock size={20} className="text-zinc-500" /> : t.icon}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${boss ? 'text-red-400' : 'text-zinc-500'}`}>
                      {boss ? '☠ Босс' : `Бой ${i + 1}`} · ур. {s.level}
                    </div>
                    <div className="truncate font-bold text-zinc-100">{t.name}</div>
                    {t.title && <div className="truncate text-xs italic text-red-300/80">{t.title}</div>}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-400">
                  <span>❤️ {fmt(b.maxHp)}</span>
                  <span>⚔️ {b.atk}</span>
                  <span>🛡️ {b.def}</span>
                  <span className="text-purple-300">✨ {enemyXp(s.level, boss)} XP</span>
                </div>
                {boss && t.bossDesc && <div className="mt-1.5 text-[11px] leading-snug text-red-200/70">{t.bossDesc}</div>}
                {t.shadowId && <div className="mt-1 text-[11px] text-purple-300/80">👤 Шанс тени: {Math.round((t.shadowChance ?? 0) * 100)}%</div>}
                <div className="mt-auto pt-3">
                  <button
                    disabled={locked}
                    onClick={() => launchLocation(loc.id, i)}
                    className={`${boss ? 'btn-blood' : isNext ? 'btn-gold' : 'btn-dark'} w-full !py-2 text-sm`}
                  >
                    {locked ? 'Закрыто' : i < cleared ? 'Повторить' : boss ? <><Skull size={16} /> Бросить вызов</> : 'Сражаться'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
