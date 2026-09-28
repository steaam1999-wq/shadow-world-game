import { CLASS_LIST } from '../data/classes';
import { SLOTS } from '../data/items';
import { ARENA_NAMES } from '../data/names';
import type { ArenaBot, ArenaOpponent, ArenaState, Attribute, ClassId, GameState, Rarity } from '../types';
import { pick, randInt, shuffle, uid, weighted } from '../utils/random';
import { generateItem } from './items';
import { computeStats, POINTS_PER_LEVEL } from './stats';

export const START_RATING = 1000;
export const WIN_RATING = 25;
export const LOSS_RATING = 15;
export const SEASON_LENGTH = 7 * 24 * 3600 * 1000;

export function createBots(count = 40): ArenaBot[] {
  return shuffle(ARENA_NAMES)
    .slice(0, count)
    .map((name) => ({
      name,
      classId: pick(CLASS_LIST).id,
      level: randInt(3, 45),
      rating: Math.round(700 + Math.pow(Math.random(), 1.6) * 1300),
    }));
}

export function createArenaState(): ArenaState {
  return {
    rating: START_RATING,
    bestRating: START_RATING,
    wins: 0,
    losses: 0,
    season: 1,
    seasonEndsAt: Date.now() + SEASON_LENGTH,
    bots: createBots(),
    opponents: [],
  };
}

const CLASS_ATTRS: Record<ClassId, Attribute[]> = {
  berserker: ['str', 'str', 'agi', 'vit'],
  guardian: ['vit', 'vit', 'str', 'str'],
  assassin: ['agi', 'agi', 'str', 'vit'],
  shadowmage: ['dark', 'dark', 'vit', 'str'],
  monk: ['str', 'dark', 'agi', 'vit'],
};

export function buildOpponent(name: string, classId: ClassId, level: number, rating: number): ArenaOpponent {
  const attributes: Record<Attribute, number> = { str: 0, agi: 0, vit: 0, dark: 0 };
  const pts = (level - 1) * POINTS_PER_LEVEL;
  const plan = CLASS_ATTRS[classId];
  for (let i = 0; i < pts; i++) attributes[plan[i % plan.length]] += 1;
  const tier = Math.min(4, Math.max(0, Math.floor((rating - 800) / 250)));
  const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  // low-level opponents are not fully geared yet, like a real newcomer
  const slots = SLOTS.slice(0, Math.min(SLOTS.length, 2 + Math.floor(level / 3)));
  const gear = slots.map((slot) => {
    const r = weighted<Rarity>([
      [rarities[Math.max(0, tier - 1)], 40],
      [rarities[tier], 45],
      [rarities[Math.min(4, tier + 1)], 15],
    ]);
    const it = generateItem(level, r, slot);
    it.upgrade = Math.max(0, Math.min(10, Math.floor(level / 6) + randInt(-1, 1)));
    return it;
  });
  const power = computeStats({ classId, level, attributes, gear, shadows: [] }).power;
  return { id: uid(), name, classId, level, rating, power, gear, attributes };
}

/** Three opponents: weaker, even, stronger. */
export function generateOpponents(state: GameState): ArenaOpponent[] {
  const lvl = state.hero?.level ?? 1;
  const r = state.arena.rating;
  const names = shuffle(ARENA_NAMES).slice(0, 3);
  const specs: [number, number][] = [
    [-2, -60],
    [0, 0],
    [2, 70],
  ];
  return specs.map(([dl, dr], i) =>
    buildOpponent(names[i], pick(CLASS_LIST).id, Math.max(1, lvl + dl + randInt(-1, 1)), Math.max(0, r + dr + randInt(-30, 30))),
  );
}

export function ratingDelta(win: boolean, my: number, their: number) {
  if (win) return Math.round(WIN_RATING + Math.max(-8, Math.min(10, (their - my) / 20)));
  return -LOSS_RATING;
}

/** Bots slowly move so the leaderboard feels alive. */
export function driftBots(state: GameState) {
  for (const b of state.arena.bots) {
    if (Math.random() < 0.35) b.rating = Math.max(500, b.rating + randInt(-20, 28));
    if (Math.random() < 0.08) b.level = Math.min(60, b.level + 1);
  }
}

export interface LeaderRow {
  name: string;
  classId: ClassId;
  level: number;
  rating: number;
  isPlayer: boolean;
}

export function leaderboard(state: GameState): LeaderRow[] {
  const rows: LeaderRow[] = state.arena.bots.map((b) => ({ ...b, isPlayer: false }));
  if (state.hero) rows.push({ name: state.hero.name, classId: state.hero.classId, level: state.hero.level, rating: state.arena.rating, isPlayer: true });
  return rows.sort((a, b) => b.rating - a.rating);
}

export const playerRank = (state: GameState) => leaderboard(state).findIndex((r) => r.isPlayer) + 1;

export function seasonReward(rank: number) {
  if (rank === 1) return { crystals: 300, tokens: 300, gold: 5000 };
  if (rank <= 3) return { crystals: 200, tokens: 200, gold: 3000 };
  if (rank <= 10) return { crystals: 100, tokens: 120, gold: 1500 };
  if (rank <= 25) return { crystals: 50, tokens: 60, gold: 800 };
  return { crystals: 20, tokens: 30, gold: 300 };
}

/** Closes the season if expired. Returns reward info when it did. */
export function checkSeason(state: GameState): { rank: number; reward: ReturnType<typeof seasonReward> } | null {
  const a = state.arena;
  if (Date.now() < a.seasonEndsAt) return null;
  const rank = playerRank(state);
  const reward = seasonReward(rank);
  state.currencies.crystals += reward.crystals;
  state.currencies.tokens += reward.tokens;
  state.currencies.gold += reward.gold;
  a.season += 1;
  a.seasonEndsAt = Date.now() + SEASON_LENGTH;
  a.rating = Math.round(START_RATING + (a.rating - START_RATING) / 2);
  for (const b of a.bots) b.rating = Math.round(START_RATING + (b.rating - START_RATING) / 2);
  a.opponents = [];
  return { rank, reward };
}

export const ARENA_SHOP = [
  { id: 'chest', name: 'Сундук гладиатора', desc: 'Предмет редкости «Редкий» или выше', icon: '🎁', cost: 60 },
  { id: 'shards', name: 'Мешок осколков', desc: '+80 осколков теней', icon: '🔮', cost: 50 },
  { id: 'potions', name: 'Набор зелий', desc: '+5 зелий здоровья', icon: '🧪', cost: 30 },
  { id: 'crystals', name: 'Кристаллы', desc: '+25 кристаллов', icon: '💎', cost: 90 },
] as const;
