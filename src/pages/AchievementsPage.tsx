import { ACHIEVEMENTS } from '../data/quests';
import { useGame } from '../hooks/useGame';
import { Bar, PageTitle } from '../components/ui';

export function AchievementsPage() {
  const { state } = useGame();
  const got = state.achievements.length;
  const list = [...ACHIEVEMENTS].sort((a, b) => Number(state.achievements.includes(b.id)) - Number(state.achievements.includes(a.id)));
  return (
    <div>
      <PageTitle icon="🏆" title="Достижения" subtitle={`Открыто ${got} из ${ACHIEVEMENTS.length}`} />
      <Bar value={got} max={ACHIEVEMENTS.length} height="h-3" color="from-amber-400 to-amber-700" className="mb-4" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => {
          const done = state.achievements.includes(a.id);
          const [cur, max] = a.progress ? a.progress(state) : [done ? 1 : 0, 1];
          return (
            <div key={a.id} className={`panel flex items-center gap-3 p-4 ${done ? 'border-amber-600/70 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : ''}`}>
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-3xl ${done ? 'border-amber-400 bg-amber-950/60' : 'border-edge bg-black/40 grayscale'}`}>
                {a.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`font-bold ${done ? 'text-amber-200' : 'text-zinc-300'}`}>{a.title}</div>
                <div className="text-xs text-zinc-500">{a.description}</div>
                {!done && <Bar value={Math.min(cur, max)} max={max} height="h-2" className="mt-1.5" color="from-zinc-400 to-zinc-600" />}
                <div className="mt-1 text-[11px] font-semibold text-cyan-300">
                  {done ? '✓ ' : ''}+{a.reward.crystals} 💎{a.reward.shards ? ` +${a.reward.shards} 🔮` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
