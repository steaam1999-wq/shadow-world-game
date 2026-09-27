import type { Rarity, Slot, StatKey } from '../types';

export const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

export const RARITY_INFO: Record<
  Rarity,
  { name: string; color: string; text: string; border: string; glow: string; mult: number; affixes: number; sell: number }
> = {
  common: { name: 'Обычный', color: '#9ca3af', text: 'text-gray-300', border: 'border-gray-600', glow: '', mult: 1, affixes: 0, sell: 1 },
  uncommon: { name: 'Необычный', color: '#22c55e', text: 'text-green-400', border: 'border-green-600', glow: 'shadow-[0_0_12px_rgba(34,197,94,0.35)]', mult: 1.2, affixes: 1, sell: 2 },
  rare: { name: 'Редкий', color: '#3b82f6', text: 'text-blue-400', border: 'border-blue-500', glow: 'shadow-[0_0_14px_rgba(59,130,246,0.45)]', mult: 1.45, affixes: 2, sell: 4 },
  epic: { name: 'Эпический', color: '#a855f7', text: 'text-purple-400', border: 'border-purple-500', glow: 'shadow-[0_0_16px_rgba(168,85,247,0.55)]', mult: 1.75, affixes: 3, sell: 8 },
  legendary: { name: 'Легендарный', color: '#f59e0b', text: 'text-amber-400', border: 'border-amber-400', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.6)]', mult: 2.1, affixes: 4, sell: 16 },
  mythic: { name: 'Мифический', color: '#ef4444', text: 'text-red-400', border: 'border-red-500', glow: 'shadow-[0_0_24px_rgba(239,68,68,0.7)]', mult: 2.6, affixes: 5, sell: 32 },
};

export const SLOTS: Slot[] = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'ring', 'amulet'];

export const SLOT_INFO: Record<Slot, { name: string; icon: string; group: 'weapon' | 'armor' | 'accessory' }> = {
  weapon: { name: 'Оружие', icon: '⚔️', group: 'weapon' },
  helmet: { name: 'Шлем', icon: '⛑️', group: 'armor' },
  armor: { name: 'Броня', icon: '🥋', group: 'armor' },
  gloves: { name: 'Перчатки', icon: '🧤', group: 'armor' },
  boots: { name: 'Сапоги', icon: '🥾', group: 'armor' },
  ring: { name: 'Кольцо', icon: '💍', group: 'accessory' },
  amulet: { name: 'Амулет', icon: '📿', group: 'accessory' },
};

/** Base item names per slot (noun) with icon. */
export const ITEM_BASES: Record<Slot, { name: string; icon: string }[]> = {
  weapon: [
    { name: 'Меч', icon: '🗡️' },
    { name: 'Клинок', icon: '⚔️' },
    { name: 'Топор', icon: '🪓' },
    { name: 'Молот', icon: '🔨' },
    { name: 'Посох', icon: '🪄' },
    { name: 'Кинжал', icon: '🔪' },
    { name: 'Коса', icon: '⚰️' },
  ],
  helmet: [
    { name: 'Шлем', icon: '⛑️' },
    { name: 'Капюшон', icon: '🎩' },
    { name: 'Корона', icon: '👑' },
  ],
  armor: [
    { name: 'Доспех', icon: '🥋' },
    { name: 'Кираса', icon: '🦺' },
    { name: 'Плащ', icon: '🧥' },
  ],
  gloves: [
    { name: 'Перчатки', icon: '🧤' },
    { name: 'Наручи', icon: '🥊' },
  ],
  boots: [
    { name: 'Сапоги', icon: '🥾' },
    { name: 'Поножи', icon: '👢' },
  ],
  ring: [
    { name: 'Кольцо', icon: '💍' },
    { name: 'Перстень', icon: '💎' },
  ],
  amulet: [
    { name: 'Амулет', icon: '📿' },
    { name: 'Талисман', icon: '🧿' },
  ],
};

/** Genitive suffixes per rarity — avoids adjective gender agreement. */
export const ITEM_SUFFIXES: Record<Rarity, string[]> = {
  common: ['новобранца', 'путника', 'бродяги', 'ополченца'],
  uncommon: ['охотника', 'ветерана', 'наёмника', 'стража'],
  rare: ['Палача', 'Пепла', 'Крови', 'Сумрака', 'Волка'],
  epic: ['Бездны', 'Мрака', 'Проклятых', 'Кровавой луны', 'Некроманта'],
  legendary: ['Короля Теней', 'Пожирателя Душ', 'Чёрного Солнца', 'Вечной Ночи'],
  mythic: ['Первой Тьмы', 'Последнего Воина', 'Конца Времён'],
};

/** Main stats per slot: per-level growth. */
export const SLOT_MAIN: Record<Slot, Partial<Record<StatKey, [number, number]>>> = {
  // [base, perLevel]
  weapon: { atk: [6, 2.4] },
  helmet: { hp: [14, 5], def: [1, 0.5] },
  armor: { def: [3, 1.1], hp: [20, 7] },
  gloves: { atk: [2, 0.9], critChance: [1, 0.05] },
  boots: { speed: [1, 0.08], def: [1, 0.5] },
  ring: { atk: [2, 0.8], critDmg: [4, 0.25] },
  amulet: { hp: [10, 4], dark: [1, 0.2] },
};

/** Affix pool: [min, max] at level 1, grows with level by growth factor. */
export const AFFIX_POOL: { stat: StatKey; base: [number, number]; perLevel: number; slots?: Slot[] }[] = [
  { stat: 'str', base: [1, 3], perLevel: 0.35 },
  { stat: 'agi', base: [1, 3], perLevel: 0.35 },
  { stat: 'vit', base: [1, 3], perLevel: 0.35 },
  { stat: 'dark', base: [1, 3], perLevel: 0.35 },
  { stat: 'atk', base: [2, 5], perLevel: 0.7 },
  { stat: 'hp', base: [10, 20], perLevel: 3 },
  { stat: 'def', base: [1, 3], perLevel: 0.4 },
  { stat: 'critChance', base: [1, 3], perLevel: 0.03 },
  { stat: 'critDmg', base: [4, 10], perLevel: 0.15 },
  { stat: 'speed', base: [1, 2], perLevel: 0.04 },
  { stat: 'dodge', base: [1, 2], perLevel: 0.03 },
  { stat: 'block', base: [1, 3], perLevel: 0.03 },
  { stat: 'bleedChance', base: [2, 5], perLevel: 0.05 },
  { stat: 'lifesteal', base: [1, 3], perLevel: 0.03 },
  { stat: 'atkPct', base: [2, 4], perLevel: 0.04 },
  { stat: 'hpPct', base: [2, 4], perLevel: 0.04 },
  { stat: 'magicPct', base: [3, 6], perLevel: 0.06 },
];

export const STAT_LABELS: Record<StatKey, { name: string; pct?: boolean; icon: string }> = {
  hp: { name: 'Здоровье', icon: '❤️' },
  atk: { name: 'Урон', icon: '⚔️' },
  def: { name: 'Защита', icon: '🛡️' },
  critChance: { name: 'Шанс крита', pct: true, icon: '🎯' },
  critDmg: { name: 'Крит. урон', pct: true, icon: '💥' },
  speed: { name: 'Скорость', icon: '💨' },
  dodge: { name: 'Уклонение', pct: true, icon: '🌀' },
  block: { name: 'Блок', pct: true, icon: '🧱' },
  bleedChance: { name: 'Кровотечение', pct: true, icon: '🩸' },
  lifesteal: { name: 'Вампиризм', pct: true, icon: '🦇' },
  str: { name: 'Сила', icon: '💪' },
  agi: { name: 'Ловкость', icon: '🌀' },
  vit: { name: 'Выносливость', icon: '❤️' },
  dark: { name: 'Тьма', icon: '🌑' },
  hpPct: { name: 'к здоровью', pct: true, icon: '❤️' },
  atkPct: { name: 'к атаке', pct: true, icon: '⚔️' },
  defPct: { name: 'к защите', pct: true, icon: '🛡️' },
  magicPct: { name: 'Сила магии', pct: true, icon: '✨' },
};

export const INVENTORY_LIMIT = 60;
export const MAX_UPGRADE = 15;
