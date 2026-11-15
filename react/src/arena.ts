/**
 * Арена: бои один на один с другими «игроками» (сгенерированными соперниками со своей экипировкой).
 * Рейтинг по Эло, лиги, 5 попыток в день. Бой — тот же пошаговый движок (combat.ts).
 */
import { npcCombatant, roles, type Battle, type Combatant, type Role } from "./combat";
import { ITEMS, SLOT_IDS, emptyEquipment, equipmentStats, type Equipment } from "./equipment";
import type { EcoHost, Rng, Result } from "./economy";

export type ArenaState = { rating: number; wins: number; losses: number; day: string; used: number; best: number };
export const freshArena = (): ArenaState => ({ rating: 1000, wins: 0, losses: 0, day: "", used: 0, best: 1000 });
export const ARENA_ATTEMPTS = 5;

export const LEAGUES = [
  { min: 0, name: "Бронза" },
  { min: 1100, name: "Серебро" },
  { min: 1300, name: "Золото" },
  { min: 1500, name: "Платина" },
  { min: 1700, name: "Легенда" },
];
export const leagueOf = (rating: number) => [...LEAGUES].reverse().find((l) => rating >= l.min)!;

const NICKS = ["Тимур Gold", "Дэн Кобра", "Саня Блэк", "Макс Призрак", "Рус Бетон", "Гоша Neon", "Артём Шах", "Влад Сталь", "Эрик Ворон", "Костя Дрифт", "Ильдар Бокс", "Женя Тень", "Марк Zero", "Стас Лис", "Ник Шторм"];

export type Rival = {
  name: string;
  level: number;
  rating: number;
  role: Role;
  stats: { str: number; def: number; agi: number; end: number; int: number };
  equipment: Equipment;
  seed: number;
};

const rnd = (rng: Rng, a: number, b: number) => Math.floor(a + rng() * (b - a + 1));

/** Соперники около уровня и рейтинга игрока, в экипировке по своему уровню. */
export function makeRivals(level: number, rating: number, rng: Rng, n = 3): Rival[] {
  return Array.from({ length: n }, () => {
    const l = Math.max(1, level + rnd(rng, -1, 1));
    const equipment = emptyEquipment();
    for (const slot of SLOT_IDS) {
      if (rng() > 0.85) continue;
      const fit = ITEMS.filter((i) => i.slot === slot && i.lvl <= l).sort((a, b) => b.lvl - a.lvl).slice(0, 2);
      if (fit.length) equipment[slot] = { uid: "r" + slot, defId: fit[rnd(rng, 0, fit.length - 1)].id };
    }
    const pts = 25 + (l - 1) * 3;
    const share = [rng() + 0.5, rng() + 0.5, rng() + 0.5, rng() + 0.5, rng() + 0.3];
    const total = share.reduce((a, b) => a + b, 0);
    const [str, def, agi, end, int] = share.map((x) => Math.max(3, Math.round((x / total) * pts)));
    const role = (["brute", "shooter", "surgeon"] as Role[])[rnd(rng, 0, 2)];
    return { name: NICKS[rnd(rng, 0, NICKS.length - 1)], level: l, rating: Math.max(800, rating + rnd(rng, -120, 120)), role, stats: { str, def, agi, end, int }, equipment, seed: rnd(rng, 1, 1e9) };
  });
}

/** Боец соперника: те же формулы, что у игрока (сила×2 + оружие, защита×2 + броня, …). */
export function rivalCombatant(r: Rival): Combatant {
  const g = equipmentStats(r.equipment);
  const hp = 100 + (r.stats.end - 5) * 10 + r.level * 6;
  const base = npcCombatant({ name: r.name, hp, atk: r.stats.str * 2 + g.atk, def: r.stats.def * 2 + g.def, agi: r.stats.agi + g.agi, level: r.level, int: r.stats.int + g.int });
  return { ...base, str: r.stats.str, ap: 60 + base.int * 3, maxAp: 60 + base.int * 3, skills: roles[r.role].skills };
}

/** Изменение рейтинга по Эло (K = 32). */
export function eloDelta(mine: number, theirs: number, win: boolean, k = 32): number {
  const expected = 1 / (1 + Math.pow(10, (theirs - mine) / 400));
  return Math.round(k * ((win ? 1 : 0) - expected));
}

type ArenaHost = EcoHost & { eco: EcoHost["eco"] & { arena: ArenaState } };

export const attemptsLeft = (a: ArenaState, today: string) => ARENA_ATTEMPTS - (a.day === today ? a.used : 0);

/** Начать бой на арене: тратится попытка дня, энергия не нужна. */
export function beginArena<T extends ArenaHost>(s: T, today: string): Result<T> {
  const a = s.eco.arena;
  if (attemptsLeft(a, today) <= 0) return { state: s, ok: false, message: "Попытки на сегодня закончились — приходи завтра" };
  if (s.health < 30) return { state: s, ok: false, message: "Слишком мало здоровья для арены" };
  const used = a.day === today ? a.used + 1 : 1;
  return { state: { ...s, eco: { ...s.eco, arena: { ...a, day: today, used } } }, ok: true, message: "" };
}

/** Итог боя: рейтинг по Эло, деньги и опыт за победу. На арене деньги при поражении не отнимают. */
export function settleArena<T extends ArenaHost>(s: T, r: Rival, b: Battle, rng: Rng, addXp: (s: T, xp: number) => T): Result<T> {
  const a = s.eco.arena, win = b.winner === "player";
  const delta = eloDelta(a.rating, r.rating, win);
  const rating = Math.max(0, a.rating + delta);
  let next: T = { ...s, health: Math.max(1, b.player.hp), eco: { ...s.eco, arena: { ...a, rating, best: Math.max(a.best, rating), wins: a.wins + (win ? 1 : 0), losses: a.losses + (win ? 0 : 1) } } };
  if (!win) return { state: addXp(next, 2), ok: true, message: `Поражение: рейтинг ${delta} (${rating})`, win: false };
  const money = 40 * r.level + rnd(rng, 0, 60);
  next = addXp({ ...next, money: next.money + money, eco: { ...next.eco, earned: next.eco.earned + money } }, 6 + r.level);
  return { state: next, ok: true, message: `Победа! Рейтинг +${delta} (${rating}), +$${money}, +${6 + r.level} опыта`, win: true };
}

export const isArena = (x: unknown): x is ArenaState =>
  !!x && typeof x === "object" && ["rating", "wins", "losses", "used", "best"].every((k) => typeof (x as Record<string, unknown>)[k] === "number") && typeof (x as ArenaState).day === "string";
