import { Backpack, Castle, Ghost, Swords, Trophy, User } from 'lucide-react';
import type { Page } from '../types';
import { useGame } from '../hooks/useGame';

const ITEMS: { id: Page; label: string; icon: typeof Swords }[] = [
  { id: 'battle', label: 'Бой', icon: Swords },
  { id: 'arena', label: 'Арена', icon: Trophy },
  { id: 'tower', label: 'Башня', icon: Castle },
  { id: 'hero', label: 'Герой', icon: User },
  { id: 'inventory', label: 'Инвентарь', icon: Backpack },
  { id: 'shadows', label: 'Тени', icon: Ghost },
];

export function NavBar() {
  const { page, setPage, state, play } = useGame();
  const badges: Partial<Record<Page, boolean>> = {
    hero: (state.hero?.freePoints ?? 0) > 0,
    inventory: state.inventory.some((i) => i.isNew),
  };

  return (
    <>
      {/* Desktop: side rail */}
      <nav className="fixed left-0 top-0 z-30 hidden h-full w-24 flex-col items-center gap-2 border-r border-edge/80 bg-abyss/90 pt-24 backdrop-blur lg:flex">
        {ITEMS.map((it) => (
          <NavButton key={it.id} {...it} active={page === it.id} badge={badges[it.id]} onClick={() => { play('click'); setPage(it.id); }} vertical />
        ))}
      </nav>
      {/* Mobile / tablet: bottom bar */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-edge bg-abyss/95 backdrop-blur lg:hidden">
        {ITEMS.map((it) => (
          <NavButton key={it.id} {...it} active={page === it.id} badge={badges[it.id]} onClick={() => { play('click'); setPage(it.id); }} />
        ))}
      </nav>
    </>
  );
}

function NavButton({
  label,
  icon: Icon,
  active,
  onClick,
  badge,
  vertical,
}: {
  label: string;
  icon: typeof Swords;
  active: boolean;
  onClick: () => void;
  badge?: boolean;
  vertical?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center gap-1 py-2.5 transition ${vertical ? 'w-20 rounded-2xl' : ''} ${
        active ? 'text-white' : 'text-zinc-500 hover:text-zinc-200'
      }`}
    >
      {active && (
        <span
          className={`absolute ${vertical ? 'inset-0 rounded-2xl' : 'inset-x-2 inset-y-1 rounded-xl'} border border-red-700/70 bg-gradient-to-b from-red-900/50 to-transparent shadow-[0_0_18px_rgba(220,38,38,0.35)]`}
        />
      )}
      <Icon size={vertical ? 26 : 22} className={`relative transition ${active ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]' : 'group-hover:scale-110'}`} />
      <span className="relative text-[10px] font-bold uppercase tracking-wider">{label}</span>
      {badge && <span className="absolute right-3 top-2 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />}
    </button>
  );
}
