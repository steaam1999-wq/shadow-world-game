import type { CSSProperties } from 'react';
import { DAILY_BONUS } from '../data/quests';
import { allQuestsClaimed, questDef } from '../game/quests';
import { applyReward, emptyReward } from '../game/rewards';
import { useGame } from '../hooks/useGame';
import { Bar, PageTitle } from '../components/ui';
import { fmt, timeLeft } from '../utils/format';

const REWARD_ICONS: Record<string, string> = { xp: '✨', gold: '🪙', crystals: '💎', shards: '🔮', tokens: '🎖️' };

export function QuestsPage() {
  const { state, mutate, play, toast } = useGame();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const allDone = allQuestsClaimed(state);

  const claim = (id: string) => {
    mutate((d) => {
      const q = d.daily.quests.find((x) => x.id === id)!;
      const def = questDef(id);
      if (q.claimed || q.progress < def.target) return;
      q.claimed = true;
      applyReward(d, { ...emptyReward(), ...def.reward });
    });
    play('coin');
    toast({ kind: 'success', title: 'Награда получена!', icon: '📜' });
  };

  const claimBonus = () => {
    mutate((d) => {
      if (d.daily.bonusClaimed || !allQuestsClaimed(d)) return;
      d.daily.bonusClaimed = true;
      applyReward(d, { ...emptyReward(), ...DAILY_BONUS });
    });
    play('victory');
    toast({ kind: 'achievement', title: 'Сундук дня открыт!', text: `+${DAILY_BONUS.crystals} 💎 +${DAILY_BONUS.shards} 🔮 +${DAILY_BONUS.gold} 🪙`, icon: '🎁' });
  };

  return (
    <div>
      <PageTitle icon="📜" title="Ежедневные задания" subtitle={`Обновление через ${timeLeft(midnight.getTime() - Date.now())}`} />
      <div className="space-y-3">
        {state.daily.quests.map((q, i) => {
          const def = questDef(q.id);
          if (!def) return null;
          const done = q.progress >= def.target;
          return (
            <div
              key={q.id}
              className={`panel anim-fade-in flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${done && !q.claimed ? 'anim-glow border-amber-600' : ''} ${q.claimed ? 'opacity-50' : ''}`}
              style={{ animationDelay: `${i * 0.06}s`, '--glow': 'rgba(245,158,11,0.45)' } as CSSProperties}
            >
              <div className="flex-1">
                <div className="font-bold text-zinc-100">{def.title}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {Object.entries(def.reward).map(([k, v]) => (
                    <span key={k} className="chip">
                      {REWARD_ICONS[k]} {fmt(v as number)}
                    </span>
                  ))}
                </div>
                <Bar value={q.progress} max={def.target} height="h-3" className="mt-2" color="from-amber-400 to-amber-700" label={`${fmt(q.progress)} / ${fmt(def.target)}`} />
              </div>
              <button className={done && !q.claimed ? 'btn-gold' : 'btn-dark'} disabled={!done || q.claimed} onClick={() => claim(q.id)}>
                {q.claimed ? '✓ Получено' : done ? 'Забрать' : 'В процессе'}
              </button>
            </div>
          );
        })}
      </div>

      <div className={`panel mt-4 flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:text-left ${allDone && !state.daily.bonusClaimed ? 'anim-glow border-amber-500' : ''}`}>
        <div className="anim-idle text-6xl">🎁</div>
        <div className="flex-1">
          <div className="title text-2xl text-amber-200">Сундук дня</div>
          <div className="text-sm text-zinc-400">
            Выполните все задания: +{DAILY_BONUS.crystals} 💎, +{DAILY_BONUS.shards} 🔮, +{DAILY_BONUS.gold} 🪙
          </div>
        </div>
        <button className="btn-gold px-6" disabled={!allDone || state.daily.bonusClaimed} onClick={claimBonus}>
          {state.daily.bonusClaimed ? '✓ Открыт' : 'Открыть'}
        </button>
      </div>
    </div>
  );
}
