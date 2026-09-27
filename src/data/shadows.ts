import type { ShadowDef } from '../types';

export const SHADOW_TIER_MULT = [0, 1, 1.8, 2.8, 4, 5.5];
export const SHADOW_TIER_NAMES = ['', 'I', 'II', 'III', 'IV', 'V'];
export const MAX_SHADOW_TIER = 5;

export const SHADOW_ABILITY_TEXT: Record<string, (tier: number) => string> = {
  rage: (t) => `При HP ниже 50% урон +${10 + t * 6}%`,
  lifesteal: (t) => `Вампиризм ${3 + t * 2}% от урона`,
  thorns: (t) => `Отражает ${6 + t * 4}% полученного урона`,
  regen: (t) => `Восстанавливает ${1 + t}% HP каждый ход`,
  firstStrike: (t) => `Первый удар в бою +${40 + t * 20}% урона`,
  poisonTouch: (t) => `${10 + t * 5}% шанс отравить врага`,
  burnTouch: (t) => `${10 + t * 5}% шанс поджечь врага`,
  critBoost: (t) => `+${2 + t * 2}% шанс крита и +${5 + t * 5}% крит. урона`,
  evasion: (t) => `+${2 + t * 2}% уклонения`,
  executioner: (t) => `+${15 + t * 10}% урона по врагам с HP ниже 30%`,
  bulwark: (t) => `Щит ${5 + t * 4}% HP в начале боя`,
  soulDrain: (t) => `Каждый крит лечит ${2 + t}% HP`,
};

export const SHADOWS: Record<string, ShadowDef> = {
  wolf: { id: 'wolf', name: 'Тень Волка', icon: '🐺', rarity: 'uncommon', description: 'Стремительная тень лесного хищника.', ability: 'firstStrike', abilityName: 'Прыжок', abilityDesc: 'Мощный первый удар', bonuses: { atkPct: 4, speed: 1 } },
  bandit: { id: 'bandit', name: 'Тень Разбойника', icon: '🥷', rarity: 'uncommon', description: 'Нечестная, но эффективная.', ability: 'critBoost', abilityName: 'Подлый удар', abilityDesc: 'Больше критов', bonuses: { atkPct: 3, critChance: 1 } },
  ghoul: { id: 'ghoul', name: 'Тень Упыря', icon: '🧛', rarity: 'rare', description: 'Голод, который не утолить.', ability: 'lifesteal', abilityName: 'Вампиризм', abilityDesc: 'Лечение от урона', bonuses: { hpPct: 5, atkPct: 3 } },
  skeleton: { id: 'skeleton', name: 'Тень Скелета', icon: '💀', rarity: 'uncommon', description: 'Кости помнят каждый выстрел.', ability: 'critBoost', abilityName: 'Меткость', abilityDesc: 'Больше критов', bonuses: { critDmg: 6, atkPct: 2 } },
  hunter: { id: 'hunter', name: 'Тень Охотника', icon: '🏹', rarity: 'rare', description: 'Неуловимый следопыт сумрака.', ability: 'evasion', abilityName: 'Сумрак', abilityDesc: 'Уклонение', bonuses: { speed: 2, atkPct: 4 } },
  morok: { id: 'morok', name: 'Тень Морока', icon: '👁️', rarity: 'epic', description: 'Эхо Пожирателя душ.', ability: 'soulDrain', abilityName: 'Пожирание душ', abilityDesc: 'Криты лечат', bonuses: { atkPct: 7, hpPct: 5, magicPct: 6 } },
  witch: { id: 'witch', name: 'Тень Ведьмы', icon: '🧙‍♀️', rarity: 'rare', description: 'Шёпот болотных проклятий.', ability: 'burnTouch', abilityName: 'Порча', abilityDesc: 'Поджигает врагов', bonuses: { magicPct: 8, hpPct: 2 } },
  barbarian: { id: 'barbarian', name: 'Тень Варвара', icon: '🪓', rarity: 'rare', description: 'Ярость древнего воина.', ability: 'rage', abilityName: 'Ярость', abilityDesc: 'Сильнее при низком HP', bonuses: { atkPct: 8, hpPct: 5 } },
  serpent: { id: 'serpent', name: 'Тень Змеи', icon: '🐍', rarity: 'epic', description: 'Яд Болотной Матери в ваших жилах.', ability: 'poisonTouch', abilityName: 'Ядовитый укус', abilityDesc: 'Отравляет врагов', bonuses: { atkPct: 5, hpPct: 6, speed: 1 } },
  knight: { id: 'knight', name: 'Тень Рыцаря', icon: '⚔️', rarity: 'rare', description: 'Клятва, пережившая смерть.', ability: 'thorns', abilityName: 'Шипы', abilityDesc: 'Отражение урона', bonuses: { defPct: 8, hpPct: 4 } },
  necro: { id: 'necro', name: 'Тень Некроманта', icon: '☠️', rarity: 'rare', description: 'Смерть — лишь начало.', ability: 'regen', abilityName: 'Нежизнь', abilityDesc: 'Регенерация', bonuses: { magicPct: 6, hpPct: 5 } },
  castellan: { id: 'castellan', name: 'Тень Кастеляна', icon: '🏰', rarity: 'epic', description: 'Несокрушимая железная воля.', ability: 'bulwark', abilityName: 'Бастион', abilityDesc: 'Щит в начале боя', bonuses: { defPct: 12, hpPct: 8 } },
  executioner: { id: 'executioner', name: 'Тень Палача', icon: '⚰️', rarity: 'epic', description: 'Он никогда не промахивается.', ability: 'executioner', abilityName: 'Казнь', abilityDesc: 'Добивание', bonuses: { atkPct: 9, critDmg: 10 } },
  demon: { id: 'demon', name: 'Тень Демона', icon: '😈', rarity: 'epic', description: 'Пламя преисподней.', ability: 'burnTouch', abilityName: 'Адское пламя', abilityDesc: 'Поджигает врагов', bonuses: { atkPct: 8, magicPct: 8 } },
  faceless: { id: 'faceless', name: 'Тень Безликого', icon: '🎭', rarity: 'epic', description: 'Без лица, без имени, без страха.', ability: 'evasion', abilityName: 'Безликость', abilityDesc: 'Уклонение', bonuses: { defPct: 8, atkPct: 6, speed: 2 } },
  dragon: { id: 'dragon', name: 'Тень Дракона', icon: '🐉', rarity: 'legendary', description: 'Древний ужас из костей и пепла.', ability: 'rage', abilityName: 'Драконья ярость', abilityDesc: 'Сильнее при низком HP', bonuses: { atkPct: 10, hpPct: 10, defPct: 5 } },
  warden: { id: 'warden', name: 'Тень Стража Башни', icon: '🗼', rarity: 'legendary', description: 'Хранитель ста этажей.', ability: 'bulwark', abilityName: 'Незыблемость', abilityDesc: 'Щит в начале боя', bonuses: { hpPct: 12, defPct: 10, atkPct: 4 } },
  king: { id: 'king', name: 'Тень Короля', icon: '👑', rarity: 'mythic', description: 'Сама Тьма признала вас наследником.', ability: 'soulDrain', abilityName: 'Власть Короля', abilityDesc: 'Криты лечат', bonuses: { atkPct: 12, hpPct: 12, critChance: 3, magicPct: 10 } },
};

export const SHADOW_LIST = Object.values(SHADOWS);
