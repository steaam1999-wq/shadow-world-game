import { Award, ScrollText, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import { CLASSES } from '../data/classes';
import { heroStats } from '../game/hero';
import { claimableQuests } from '../game/quests';
import { xpToNext } from '../game/stats';
import { useGame } from '../hooks/useGame';
import { fmt } from '../utils/format';
import { Bar, Currency } from './ui';

export function TopBar() {
  const { state, setPage, page, setSettingsOpen, play } = useGame();
  const hero = state.hero!;
  const st = heroStats(state);
  const cls = CLASSES[hero.classId];
  const need = xpToNext(hero.level);
  const claim = claimableQuests(state);

  return (
    <header className="sticky top-0 z-40 border-b border-edge/80 bg-abyss/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 sm:px-5">
        <button
          onClick={() => setPage('hero')}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 text-2xl"
          style={{ borderColor: cls.color, boxShadow: `0 0 16px ${cls.color}55`, background: `radial-gradient(circle, ${cls.color}33, #000)` }}
          title="Герой"
        >
          {cls.icon}
          <span className="absolute -bottom-2 -right-2 rounded-md border border-amber-400/60 bg-black px-1 text-[11px] font-black text-amber-300">
            {hero.level}
          </span>
          {hero.freePoints > 0 && <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-amber-400" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="title truncate text-lg leading-none text-zinc-100">{hero.name}</span>
            <span className="hidden text-xs text-zinc-500 sm:inline">{cls.name}</span>
          </div>
          <div className="mt-1 grid max-w-md grid-cols-2 gap-1.5">
            <Bar value={hero.hp} max={st.maxHp} height="h-3.5" label={`${fmt(hero.hp)} / ${fmt(st.maxHp)}`} />
            <Bar
              value={hero.xp}
              max={need}
              height="h-3.5"
              color="from-purple-500 to-indigo-800"
              label={`XP ${Math.floor((hero.xp / need) * 100)}%`}
            />
          </div>
        </div>

        <div className="hidden items-center gap-4 rounded-xl border border-edge bg-black/40 px-3 py-2 text-sm md:flex">
          <Currency icon="🪙" value={state.currencies.gold} color="text-amber-300" title="Золото" />
          <Currency icon="💎" value={state.currencies.crystals} color="text-cyan-300" title="Кристаллы" />
          <Currency icon="🔮" value={state.currencies.shards} color="text-purple-300" title="Осколки теней" />
          <Currency icon="🎖️" value={state.currencies.tokens} color="text-orange-300" title="Жетоны арены" />
        </div>

        <div className="flex items-center gap-1">
          <IconBtn active={page === 'quests'} onClick={() => { play('click'); setPage('quests'); }} title="Задания" badge={claim}>
            <ScrollText size={20} />
          </IconBtn>
          <IconBtn active={page === 'achievements'} onClick={() => { play('click'); setPage('achievements'); }} title="Достижения">
            <Award size={20} />
          </IconBtn>
          <IconBtn onClick={() => { play('click'); setSettingsOpen(true); }} title="Настройки">
            <Settings size={20} />
          </IconBtn>
        </div>
      </div>
      <div className="flex items-center justify-around border-t border-edge/60 px-2 py-1.5 text-xs md:hidden">
        <Currency icon="🪙" value={state.currencies.gold} color="text-amber-300" />
        <Currency icon="💎" value={state.currencies.crystals} color="text-cyan-300" />
        <Currency icon="🔮" value={state.currencies.shards} color="text-purple-300" />
        <Currency icon="🎖️" value={state.currencies.tokens} color="text-orange-300" />
        <Currency icon="🧪" value={state.potions} color="text-emerald-300" />
      </div>
    </header>
  );
}

function IconBtn({ children, onClick, title, badge, active }: { children: ReactNode; onClick: () => void; title: string; badge?: number; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`relative rounded-xl border p-2.5 transition ${active ? 'border-red-700 bg-red-950/60 text-white' : 'border-edge bg-black/40 text-zinc-300 hover:border-zinc-500 hover:text-white'}`}
    >
      {children}
      {!!badge && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white shadow-[0_0_10px_rgba(239,68,68,0.8)]">
          {badge}
        </span>
      )}
    </button>
  );
}
