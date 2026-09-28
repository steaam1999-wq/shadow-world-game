import { useState } from 'react';
import { CLASS_LIST } from '../data/classes';
import { generateItem } from '../game/items';
import { createHero, heroStats } from '../game/hero';
import { generateOpponents } from '../game/arena';
import { useGame } from '../hooks/useGame';
import type { ClassId } from '../types';
import { HeroModel } from '../components/HeroModel';

const STARTER_WEAPON: Record<ClassId, string> = {
  berserker: '🪓',
  guardian: '🔨',
  assassin: '🔪',
  shadowmage: '🪄',
};

export function CreateHero() {
  const { mutate, play, toast } = useGame();
  const [name, setName] = useState('');
  const [cls, setCls] = useState<ClassId>('berserker');
  const selected = CLASS_LIST.find((c) => c.id === cls)!;

  const start = () => {
    play('levelup');
    mutate((d) => {
      d.hero = createHero(name, cls);
      const weapon = generateItem(1, 'uncommon', 'weapon');
      weapon.icon = STARTER_WEAPON[cls];
      weapon.isNew = false;
      d.equipment.weapon = weapon;
      const armor = generateItem(1, 'common', 'armor');
      armor.isNew = false;
      d.equipment.armor = armor;
      d.hero.hp = heroStats(d).maxHp;
      d.arena.opponents = generateOpponents(d);
    });
    toast({ kind: 'success', title: 'Путь начинается', text: 'Отправляйтесь в Заброшенную деревню', icon: '⚔️' });
  };

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center px-4 py-10">
      <div className="anim-fade-in text-center">
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.5em] text-red-500/80">dark fantasy rpg</div>
        <h1 className="title text-5xl leading-none text-zinc-100 drop-shadow-[0_0_25px_rgba(220,38,38,0.6)] sm:text-7xl">
          ТЕНИ
        </h1>
        <div className="title mt-1 text-2xl text-red-500 sm:text-4xl">Последний Воин</div>
        <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-400">
          Король Теней поглотил мир. Вы — последний, кто может держать клинок. Сражайтесь, забирайте тени павших и поднимайтесь на вершину Башни.
        </p>
      </div>

      <div className="mt-8 grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
        {CLASS_LIST.map((c, i) => {
          const active = c.id === cls;
          return (
            <button
              key={c.id}
              onClick={() => {
                play('click');
                setCls(c.id);
              }}
              className={`anim-fade-in panel group relative overflow-hidden p-4 text-left transition hover:-translate-y-1 ${active ? 'scale-[1.02]' : 'opacity-75 hover:opacity-100'}`}
              style={{
                animationDelay: `${i * 0.08}s`,
                borderColor: active ? c.color : undefined,
                boxShadow: active ? `0 0 30px ${c.color}66, inset 0 0 40px ${c.color}22` : undefined,
              }}
            >
              <div className="absolute -right-6 -top-6 text-8xl opacity-10 transition group-hover:scale-110">{c.icon}</div>
              <div className="h-20 w-20 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <HeroModel classId={c.id} crop="bust" animate={active} className="h-full w-full" />
              </div>
              <div className="title mt-2 text-2xl" style={{ color: c.color }}>
                {c.name}
              </div>
              <div className="text-xs italic text-zinc-400">{c.tagline}</div>
            </button>
          );
        })}
      </div>

      <div className="panel anim-fade-in mt-4 w-full p-5" key={cls}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[auto_1fr_1fr]">
          <div className="mx-auto h-56 w-40" style={{ background: `radial-gradient(ellipse at 50% 60%, ${selected.color}33, transparent 65%)` }}>
            <HeroModel classId={cls} className="h-full w-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]" />
          </div>
          <div>
            <div className="title text-3xl" style={{ color: selected.color }}>
              {selected.icon} {selected.name}
            </div>
            <p className="mt-1 text-sm text-zinc-300">{selected.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.perks.map((p) => (
                <span key={p} className={`chip ${p.startsWith('−') ? 'text-red-300' : 'text-emerald-300'}`}>
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-zinc-500">Способности</div>
            <ul className="space-y-1.5">
              {selected.abilities.map((a) => (
                <li key={a.id} className="panel-inner px-3 py-2 text-sm">
                  <span className="font-bold text-purple-300">✨ {a.name}</span>
                  <span className="text-xs text-zinc-500"> · ур. {a.unlockLevel}</span>
                  <div className="text-xs text-zinc-400">{a.description}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 18))}
            onKeyDown={(e) => e.key === 'Enter' && start()}
            placeholder="Имя героя"
            className="flex-1 rounded-xl border border-edge bg-black/60 px-4 py-3 text-lg font-semibold text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-600 focus:shadow-[0_0_16px_rgba(220,38,38,0.35)]"
          />
          <button className="btn-blood px-8 py-3.5 text-lg" onClick={start}>
            ⚔ Начать путь
          </button>
        </div>
      </div>
    </div>
  );
}
