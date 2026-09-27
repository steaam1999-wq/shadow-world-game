import type { CSSProperties } from 'react';
import { enemyBaseStats } from '../game/combat';
import { isTowerBoss, TOWER_FLOORS, towerEnemy, towerFloorReward, towerLevel } from '../game/tower';
import { useBattleLauncher } from '../hooks/useBattleLauncher';
import { useGame } from '../hooks/useGame';
import { Bar, PageTitle } from '../components/ui';
import { fmt } from '../utils/format';

export function TowerPage() {
  const { state } = useGame();
  const { launchTower } = useBattleLauncher();
  const { current, best } = state.tower;
  const conquered = best >= TOWER_FLOORS;
  const floor = Math.min(current, TOWER_FLOORS);
  const t = towerEnemy(floor);
  const lvl = towerLevel(floor);
  const b = enemyBaseStats(t, lvl);
  const boss = isTowerBoss(floor);
  const reward = towerFloorReward(floor);
  const hpMul = boss && !t.boss ? 3 : 1;

  // show a window of floors around current
  const top = Math.min(TOWER_FLOORS, Math.max(floor + 4, 8));
  const floors = Array.from({ length: 9 }, (_, i) => top - i).filter((f) => f >= 1);

  return (
    <div>
      <PageTitle icon="🏰" title="Башня Теней" subtitle="100 этажей. Каждый 10-й этаж охраняет босс." />

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="panel p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Текущий этаж</div>
          <div className="text-3xl font-black text-purple-300">{floor}</div>
        </div>
        <div className="panel p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Рекорд</div>
          <div className="text-3xl font-black text-amber-300">{best}</div>
        </div>
        <div className="panel p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Прогресс</div>
          <div className="text-3xl font-black text-zinc-100">{best}%</div>
        </div>
      </div>
      <Bar value={best} max={TOWER_FLOORS} height="h-3" color="from-purple-500 to-fuchsia-800" className="mb-5" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.3fr]">
        {/* Tower column */}
        <div className="panel relative overflow-hidden p-3">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(124,58,237,0.15),transparent)]" />
          <div className="relative flex flex-col gap-1.5">
            {floors.map((f) => {
              const isCur = f === floor && !conquered;
              const done = f <= best;
              const fb = isTowerBoss(f);
              return (
                <div
                  key={f}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition ${
                    isCur
                      ? 'anim-glow border-purple-400 bg-purple-950/60'
                      : done
                        ? 'border-emerald-900/60 bg-emerald-950/20'
                        : fb
                          ? 'border-red-900/60 bg-red-950/30'
                          : 'border-edge bg-black/40'
                  }`}
                  style={isCur ? ({ '--glow': 'rgba(168,85,247,0.6)' } as CSSProperties) : undefined}
                >
                  <span className="w-12 font-black text-zinc-400">#{f}</span>
                  <span className="text-2xl">{done ? '✅' : towerEnemy(f).icon}</span>
                  <span className={`flex-1 truncate text-sm font-semibold ${fb ? 'text-red-300' : 'text-zinc-300'}`}>
                    {fb ? '☠ ' : ''}
                    {towerEnemy(f).name}
                  </span>
                  <span className="text-xs text-zinc-500">ур. {towerLevel(f)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current challenge */}
        <div className={`panel relative overflow-hidden p-5 ${boss ? 'border-red-800' : 'border-purple-900'}`}>
          <div className="pointer-events-none absolute -right-10 -top-10 text-[12rem] opacity-10">{t.icon}</div>
          {conquered ? (
            <div className="py-10 text-center">
              <div className="text-6xl">🌌</div>
              <div className="title shimmer-text mt-3 text-4xl">Вершина покорена!</div>
              <p className="mt-2 text-zinc-400">Вы прошли все 100 этажей Башни Теней. Легенды будут петь о вас.</p>
              <button className="btn-shadow mt-4" onClick={launchTower}>
                Сразиться с Королём снова
              </button>
            </div>
          ) : (
            <>
              <div className={`text-xs font-bold uppercase tracking-widest ${boss ? 'text-red-400' : 'text-purple-300'}`}>
                Этаж {floor} {boss ? '· БОСС ЭТАЖА' : ''}
              </div>
              <div className="mt-2 flex items-center gap-4">
                <div
                  className="anim-idle flex h-24 w-24 items-center justify-center rounded-full border-4 text-5xl"
                  style={{ borderColor: t.color, background: `radial-gradient(circle, ${t.color}55, #000)`, boxShadow: `0 0 30px ${t.color}88` }}
                >
                  {t.icon}
                </div>
                <div>
                  <div className="title text-3xl text-zinc-100">{t.name}</div>
                  {t.title && <div className="text-sm italic text-red-300/80">{t.title}</div>}
                  <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-zinc-400">
                    <span>Ур. {lvl}</span>
                    <span>❤️ {fmt(b.maxHp * hpMul)}</span>
                    <span>⚔️ {b.atk}</span>
                    <span>🛡️ {b.def}</span>
                  </div>
                </div>
              </div>
              {t.bossDesc && <div className="panel-inner mt-3 p-3 text-sm text-red-200/80">☠ {t.bossDesc}</div>}
              <div className="mt-4">
                <div className="mb-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500">Награда за этаж</div>
                <div className="flex flex-wrap gap-2">
                  <span className="chip text-purple-300">✨ {fmt(reward.xp)} XP</span>
                  <span className="chip text-amber-300">🪙 {fmt(reward.gold)}</span>
                  <span className="chip text-purple-300">🔮 {reward.shards}</span>
                  {reward.crystals > 0 && <span className="chip text-cyan-300">💎 {Math.round(reward.crystals)}</span>}
                  <span className="chip text-zinc-300">🎁 {boss ? 'Гарантированный редкий лут' : '35% шанс предмета'}</span>
                </div>
              </div>
              <button className={`${boss ? 'btn-blood' : 'btn-shadow'} mt-5 w-full py-4 text-lg`} onClick={launchTower}>
                ⚔ Штурмовать этаж {floor}
              </button>
              <p className="mt-2 text-center text-xs text-zinc-500">При поражении прогресс сохраняется — можно попробовать снова.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
