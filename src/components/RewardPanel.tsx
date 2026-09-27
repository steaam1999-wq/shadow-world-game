import type { CSSProperties } from 'react';
import { RARITY_INFO } from '../data/items';
import { getLocation } from '../data/locations';
import { SHADOWS, SHADOW_TIER_NAMES } from '../data/shadows';
import { useBattleLauncher } from '../hooks/useBattleLauncher';
import { useGame } from '../hooks/useGame';
import type { BattleContext, BattleResult } from '../types';
import { fmt } from '../utils/format';
import { ItemIcon } from './ItemCard';
import { Burst } from './Particles';

export function RewardPanel({ result, ctx, enemyName, onClose }: { result: BattleResult; ctx: BattleContext; enemyName: string; onClose: () => void }) {
  const { state, setPage } = useGame();
  const { launchLocation, launchTower } = useBattleLauncher();
  const r = result.reward;
  const win = result.victory;

  let next: { label: string; run: () => void } | null = null;
  if (win && ctx.kind === 'location') {
    const loc = getLocation(ctx.locationId!);
    const nextStage = ctx.stageIndex! + 1;
    if (nextStage < loc.stages.length) next = { label: `Дальше: бой ${nextStage + 1}`, run: () => launchLocation(loc.id, nextStage) };
    else next = { label: 'Сразиться снова', run: () => launchLocation(loc.id, ctx.stageIndex!) };
  } else if (!win && ctx.kind === 'location') {
    next = { label: 'Реванш', run: () => launchLocation(ctx.locationId!, ctx.stageIndex!) };
  } else if (ctx.kind === 'tower' && state.tower.current <= 100 && !(win && ctx.floor === 100)) {
    next = { label: win ? `Этаж ${state.tower.current}` : 'Повторить этаж', run: () => launchTower() };
  } else if (ctx.kind === 'arena') {
    next = { label: 'К арене', run: () => { onClose(); setPage('arena'); } };
  }

  const rewardRows = [
    { icon: '✨', label: 'Опыт', v: r.xp, cls: 'text-purple-300' },
    { icon: '🪙', label: 'Золото', v: r.gold, cls: 'text-amber-300' },
    { icon: '💎', label: 'Кристаллы', v: r.crystals, cls: 'text-cyan-300' },
    { icon: '🔮', label: 'Осколки', v: r.shards, cls: 'text-purple-300' },
    { icon: '🎖️', label: 'Жетоны', v: r.tokens, cls: 'text-orange-300' },
    { icon: '🧪', label: 'Зелья', v: r.potions, cls: 'text-emerald-300' },
  ].filter((x) => x.v > 0);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm">
      <div className="relative w-full max-w-md py-6 text-center">
        {win && <Burst color="#fbbf24" count={24} />}
        <div
          className={`title ${win ? 'anim-victory shimmer-text' : 'anim-defeat text-red-600'} text-6xl drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] sm:text-7xl`}
        >
          {win ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
        </div>
        <div className="mt-1 text-sm text-zinc-400">{win ? `${enemyName} повержен` : `${enemyName} оказался сильнее`}</div>
        {result.message && <div className="mt-2 text-sm font-semibold text-amber-300">{result.message}</div>}
        {result.ratingChange !== undefined && (
          <div className={`mt-3 text-2xl font-black ${result.ratingChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {result.ratingChange >= 0 ? '+' : ''}
            {result.ratingChange} рейтинга · {state.arena.rating}
          </div>
        )}
        {result.newBestFloor && <div className="mt-2 font-bold text-purple-300">🏆 Новый рекорд башни: этаж {state.tower.best}</div>}

        {rewardRows.length > 0 && (
          <div className="panel mt-5 grid grid-cols-2 gap-2 p-3 text-left sm:grid-cols-3">
            {rewardRows.map((row, i) => (
              <div key={row.label} className="anim-loot panel-inner flex items-center gap-2 px-2.5 py-2" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <span className="text-xl">{row.icon}</span>
                <div>
                  <div className={`text-lg font-black leading-none ${row.cls}`}>+{fmt(row.v)}</div>
                  <div className="text-[10px] uppercase text-zinc-500">{row.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {(r.items.length > 0 || r.shadows.length > 0) && (
          <div className="mt-4">
            <div className="title mb-2 text-xl text-amber-200">ДРОП</div>
            <div className="flex flex-wrap justify-center gap-3">
              {r.items.map((it, i) => (
                <div key={it.id} className="anim-loot flex w-28 flex-col items-center gap-1" style={{ animationDelay: `${0.8 + i * 0.2}s` }}>
                  <ItemIcon item={it} size="lg" />
                  <span className="line-clamp-2 text-[11px] font-semibold leading-tight" style={{ color: RARITY_INFO[it.rarity].color }}>
                    {it.name}
                  </span>
                </div>
              ))}
              {r.shadows.map((sh, i) => {
                const def = SHADOWS[sh.defId];
                return (
                  <div key={sh.uid} className="anim-loot flex w-32 flex-col items-center gap-1" style={{ animationDelay: `${1 + i * 0.2}s` }}>
                    <div className="anim-glow flex h-20 w-20 items-center justify-center rounded-full border-2 border-purple-400 bg-[radial-gradient(circle,#7c3aed66,#000)] text-4xl" style={{ '--glow': 'rgba(168,85,247,0.8)' } as CSSProperties}>
                      {def.icon}
                    </div>
                    <span className="text-xs font-bold text-purple-300">
                      НОВАЯ ТЕНЬ!
                      <br />
                      {def.name} {SHADOW_TIER_NAMES[sh.tier]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!win && ctx.kind !== 'arena' && (
          <div className="panel-inner mt-5 p-3 text-left text-sm text-zinc-300">
            <div className="mb-1 font-bold text-amber-300">Как стать сильнее:</div>
            <ul className="list-inside list-disc space-y-0.5 text-zinc-400">
              <li>Распределите очки характеристик в «Герой»</li>
              <li>Наденьте и улучшите лучшую экипировку</li>
              <li>Экипируйте и объединяйте тени</li>
              <li>Пройдите предыдущие бои ради опыта</li>
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {next && (
            <button className="btn-blood px-6 py-3.5 text-base" onClick={next.run}>
              ⚔ {next.label}
            </button>
          )}
          <button className="btn-dark px-6 py-3.5 text-base" onClick={onClose}>
            Продолжить
          </button>
        </div>
      </div>
    </div>
  );
}
