import type { AchievementDef, QuestDef } from '../types';
import { SLOTS } from './items';

export const QUEST_POOL: QuestDef[] = [
  { id: 'kill5', title: 'Победи 5 врагов', event: 'kill', target: 5, reward: { gold: 150, xp: 80 } },
  { id: 'kill15', title: 'Победи 15 врагов', event: 'kill', target: 15, reward: { gold: 400, shards: 20 } },
  { id: 'battle3', title: 'Проведи 3 боя', event: 'battle', target: 3, reward: { gold: 100, xp: 60 } },
  { id: 'boss1', title: 'Победи босса', event: 'bossKill', target: 1, reward: { crystals: 15, shards: 15 } },
  { id: 'arena2', title: 'Сыграй 2 боя на арене', event: 'arenaFight', target: 2, reward: { tokens: 20, gold: 150 } },
  { id: 'arenaWin1', title: 'Победи на арене', event: 'arenaWin', target: 1, reward: { crystals: 10, tokens: 15 } },
  { id: 'upgrade1', title: 'Улучши предмет', event: 'upgrade', target: 1, reward: { gold: 200, shards: 10 } },
  { id: 'tower3', title: 'Пройди 3 этажа башни', event: 'towerFloor', target: 3, reward: { shards: 25, xp: 120 } },
  { id: 'crit10', title: 'Нанеси 10 критических ударов', event: 'critHit', target: 10, reward: { gold: 180, crystals: 5 } },
  { id: 'gold1000', title: 'Заработай 1000 золота', event: 'earnGold', target: 1000, reward: { crystals: 10, xp: 100 } },
  { id: 'potion2', title: 'Используй 2 зелья', event: 'usePotion', target: 2, reward: { gold: 120 } },
];

export const DAILY_QUEST_COUNT = 5;
export const DAILY_BONUS = { crystals: 30, shards: 40, gold: 500 };

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'firstKill', title: 'Первое убийство', description: 'Победите первого врага', icon: '🩸', reward: { crystals: 10 }, check: (s) => s.counters.kills >= 1, progress: (s) => [s.counters.kills, 1] },
  { id: 'firstBoss', title: 'Первый босс', description: 'Победите любого босса', icon: '👹', reward: { crystals: 25 }, check: (s) => s.counters.bossKills >= 1, progress: (s) => [s.counters.bossKills, 1] },
  { id: 'level10', title: 'Уровень 10', description: 'Достигните 10 уровня', icon: '⭐', reward: { crystals: 30 }, check: (s) => (s.hero?.level ?? 0) >= 10, progress: (s) => [s.hero?.level ?? 0, 10] },
  { id: 'level25', title: 'Уровень 25', description: 'Достигните 25 уровня', icon: '🌟', reward: { crystals: 60 }, check: (s) => (s.hero?.level ?? 0) >= 25, progress: (s) => [s.hero?.level ?? 0, 25] },
  { id: 'level50', title: 'Уровень 50', description: 'Достигните 50 уровня', icon: '💫', reward: { crystals: 120 }, check: (s) => (s.hero?.level ?? 0) >= 50, progress: (s) => [s.hero?.level ?? 0, 50] },
  { id: 'wins100', title: '100 побед', description: 'Одержите 100 побед', icon: '🏆', reward: { crystals: 50 }, check: (s) => s.counters.wins >= 100, progress: (s) => [s.counters.wins, 100] },
  { id: 'streak10', title: '10 побед подряд', description: 'Выиграйте 10 боёв без поражений', icon: '🔥', reward: { crystals: 40 }, check: (s) => s.counters.bestWinStreak >= 10, progress: (s) => [s.counters.bestWinStreak, 10] },
  { id: 'legendary', title: 'Первая легендарная вещь', description: 'Найдите легендарный предмет', icon: '🟧', reward: { crystals: 30 }, check: (s) => s.counters.legendaryFound >= 1, progress: (s) => [s.counters.legendaryFound, 1] },
  { id: 'mythic', title: 'Мифическая находка', description: 'Найдите мифический предмет', icon: '🟥', reward: { crystals: 80 }, check: (s) => s.counters.mythicFound >= 1, progress: (s) => [s.counters.mythicFound, 1] },
  { id: 'firstShadow', title: 'Первая тень', description: 'Получите свою первую тень', icon: '👤', reward: { crystals: 20, shards: 50 }, check: (s) => s.counters.shadowsObtained >= 1, progress: (s) => [s.counters.shadowsObtained, 1] },
  { id: 'shadowV', title: 'Тень V', description: 'Улучшите тень до V уровня', icon: '🌑', reward: { crystals: 150 }, check: (s) => s.counters.maxShadowTier >= 5, progress: (s) => [s.counters.maxShadowTier, 5] },
  { id: 'tower10', title: '10 этажей башни', description: 'Пройдите 10 этажей Башни Теней', icon: '🗼', reward: { crystals: 20 }, check: (s) => s.tower.best >= 10, progress: (s) => [s.tower.best, 10] },
  { id: 'tower50', title: '50 этажей башни', description: 'Пройдите 50 этажей Башни Теней', icon: '🏯', reward: { crystals: 100 }, check: (s) => s.tower.best >= 50, progress: (s) => [s.tower.best, 50] },
  { id: 'tower100', title: '100 этажей башни', description: 'Покорите вершину Башни Теней', icon: '🌌', reward: { crystals: 300 }, check: (s) => s.tower.best >= 100, progress: (s) => [s.tower.best, 100] },
  { id: 'arena10', title: 'Гладиатор', description: 'Одержите 10 побед на арене', icon: '🏟️', reward: { crystals: 30 }, check: (s) => s.counters.arenaWins >= 10, progress: (s) => [s.counters.arenaWins, 10] },
  { id: 'rating1500', title: 'Чемпион', description: 'Достигните рейтинга 1500', icon: '🥇', reward: { crystals: 80 }, check: (s) => s.arena.bestRating >= 1500, progress: (s) => [s.arena.bestRating, 1500] },
  { id: 'upgrade10', title: 'Кузнец', description: 'Улучшите предметы 10 раз', icon: '⚒️', reward: { crystals: 20 }, check: (s) => s.counters.upgrades >= 10, progress: (s) => [s.counters.upgrades, 10] },
  { id: 'fullGear', title: 'В полном облачении', description: 'Экипируйте все 7 слотов', icon: '🛡️', reward: { crystals: 25 }, check: (s) => SLOTS.every((sl) => !!s.equipment[sl]), progress: (s) => [SLOTS.filter((sl) => !!s.equipment[sl]).length, 7] },
  { id: 'shadowKing', title: 'Цареубийца', description: 'Победите Короля Теней', icon: '👑', reward: { crystals: 200 }, check: (s) => (s.locations.citadel ?? 0) >= 5, progress: (s) => [Math.min(s.locations.citadel ?? 0, 5), 5] },
];
