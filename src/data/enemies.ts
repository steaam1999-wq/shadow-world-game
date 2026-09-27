import type { EnemyTemplate } from '../types';

const e = (t: EnemyTemplate) => t;

export const ENEMIES: Record<string, EnemyTemplate> = {
  // ---- Заброшенная деревня ----
  darkWolf: e({ id: 'darkWolf', name: 'Тёмный волк', icon: '🐺', hpMul: 0.85, atkMul: 1.0, defMul: 0.7, speed: 13, dodge: 8, abilities: ['bleedStrike'], shadowId: 'wolf', shadowChance: 0.03, color: '#64748b' }),
  bandit: e({ id: 'bandit', name: 'Разбойник', icon: '🥷', hpMul: 1.0, atkMul: 1.05, defMul: 0.9, speed: 11, critChance: 10, abilities: ['heavyBlow'], shadowId: 'bandit', shadowChance: 0.03, color: '#78716c' }),
  rottenPeasant: e({ id: 'rottenPeasant', name: 'Гниющий крестьянин', icon: '🧟', hpMul: 1.25, atkMul: 0.9, defMul: 0.8, speed: 7, abilities: ['poisonBite'], color: '#65a30d' }),
  plagueHound: e({ id: 'plagueHound', name: 'Чумной пёс', icon: '🐕', hpMul: 1.0, atkMul: 1.1, defMul: 0.8, speed: 14, abilities: ['poisonBite', 'bleedStrike'], color: '#84cc16' }),
  ghoulElder: e({ id: 'ghoulElder', name: 'Староста-упырь', title: 'Хозяин мёртвой деревни', icon: '🧛', hpMul: 4.5, atkMul: 1.15, defMul: 1.0, speed: 9, abilities: ['drainLife', 'heavyBlow'], boss: 'ghoulRegen', bossDesc: 'Ниже 50% HP каждый ход восстанавливает 4% здоровья. Бейте быстро!', shadowId: 'ghoul', shadowChance: 0.3, color: '#b91c1c' }),

  // ---- Лес мёртвых ----
  skeletonArcher: e({ id: 'skeletonArcher', name: 'Скелет-лучник', icon: '💀', hpMul: 0.85, atkMul: 1.2, defMul: 0.8, speed: 12, critChance: 12, abilities: ['heavyBlow'], shadowId: 'skeleton', shadowChance: 0.03, color: '#e5e7eb' }),
  shadowHunter: e({ id: 'shadowHunter', name: 'Охотник теней', icon: '🏹', hpMul: 1.0, atkMul: 1.15, defMul: 0.9, speed: 15, dodge: 12, abilities: ['shadowStrike', 'bleedStrike'], shadowId: 'hunter', shadowChance: 0.04, color: '#7c3aed' }),
  forestWraith: e({ id: 'forestWraith', name: 'Лесной призрак', icon: '👻', hpMul: 0.9, atkMul: 1.1, defMul: 0.6, speed: 13, dodge: 18, abilities: ['weakenCurse', 'drainLife'], color: '#94a3b8' }),
  rotTreant: e({ id: 'rotTreant', name: 'Древень-гнилец', icon: '🌳', hpMul: 1.6, atkMul: 0.95, defMul: 1.4, speed: 6, abilities: ['stunBash', 'poisonBite'], color: '#4d7c0f' }),
  morok: e({ id: 'morok', name: 'Морок', title: 'Пожиратель душ', icon: '👁️', hpMul: 7.5, atkMul: 1.2, defMul: 1.1, speed: 11, abilities: ['shadowStrike', 'drainLife', 'weakenCurse'], boss: 'soulEater', bossDesc: 'Каждые 3 хода крадёт 10% вашей атаки. При HP < 30% впадает в ярость: +50% урона.', shadowId: 'morok', shadowChance: 0.3, color: '#7e22ce' }),

  // ---- Кровавые болота ----
  swampWitch: e({ id: 'swampWitch', name: 'Болотная ведьма', icon: '🧙‍♀️', hpMul: 0.95, atkMul: 1.2, defMul: 0.8, speed: 11, abilities: ['fireBolt', 'weakenCurse', 'heal'], shadowId: 'witch', shadowChance: 0.04, color: '#16a34a' }),
  corpseEater: e({ id: 'corpseEater', name: 'Трупоед', icon: '🦇', hpMul: 1.2, atkMul: 1.1, defMul: 0.9, speed: 14, abilities: ['drainLife', 'bleedStrike'], color: '#57534e' }),
  toxicToad: e({ id: 'toxicToad', name: 'Ядовитая жаба', icon: '🐸', hpMul: 1.3, atkMul: 0.95, defMul: 1.0, speed: 9, abilities: ['poisonBite', 'guard'], color: '#22c55e' }),
  bloodBerserker: e({ id: 'bloodBerserker', name: 'Кровавый берсерк', icon: '👹', hpMul: 1.2, atkMul: 1.35, defMul: 0.7, speed: 12, critChance: 15, abilities: ['frenzy', 'bleedStrike', 'heavyBlow'], shadowId: 'barbarian', shadowChance: 0.05, color: '#dc2626' }),
  swampMother: e({ id: 'swampMother', name: 'Болотная Матерь', title: 'Королева трясины', icon: '🐍', hpMul: 7.5, atkMul: 1.15, defMul: 1.15, speed: 10, abilities: ['poisonBite', 'heal', 'weakenCurse'], boss: 'swampMother', bossDesc: 'Каждый ход отравляет вас ядовитой аурой, яд накапливается. Лечится ядом.', shadowId: 'serpent', shadowChance: 0.3, color: '#15803d' }),

  // ---- Крепость теней ----
  cursedKnight: e({ id: 'cursedKnight', name: 'Проклятый рыцарь', icon: '⚔️', hpMul: 1.3, atkMul: 1.15, defMul: 1.5, speed: 9, abilities: ['heavyBlow', 'guard', 'stunBash'], shadowId: 'knight', shadowChance: 0.04, color: '#475569' }),
  fortressGuard: e({ id: 'fortressGuard', name: 'Страж крепости', icon: '🗿', hpMul: 1.6, atkMul: 1.0, defMul: 1.8, speed: 7, abilities: ['guard', 'stunBash'], color: '#6b7280' }),
  necromancer: e({ id: 'necromancer', name: 'Некромант', icon: '☠️', hpMul: 1.0, atkMul: 1.3, defMul: 0.8, speed: 11, abilities: ['drainLife', 'weakenCurse', 'shadowStrike'], shadowId: 'necro', shadowChance: 0.05, color: '#9333ea' }),
  gargoyle: e({ id: 'gargoyle', name: 'Горгулья', icon: '🦅', hpMul: 1.25, atkMul: 1.15, defMul: 1.3, speed: 13, abilities: ['armorBreak', 'heavyBlow'], color: '#71717a' }),
  ironCastellan: e({ id: 'ironCastellan', name: 'Кастелян', title: 'Железная Тьма', icon: '🏰', hpMul: 8, atkMul: 1.15, defMul: 1.6, speed: 8, abilities: ['stunBash', 'heavyBlow', 'armorBreak'], boss: 'ironCastellan', bossDesc: 'Каждые 4 хода поднимает теневой щит (20% HP). Пока щит активен — отражает 20% урона.', shadowId: 'castellan', shadowChance: 0.3, color: '#334155' }),

  // ---- Проклятый город ----
  executioner: e({ id: 'executioner', name: 'Палач', icon: '🪓', hpMul: 1.3, atkMul: 1.35, defMul: 1.0, speed: 9, critChance: 12, abilities: ['heavyBlow', 'bleedStrike'], shadowId: 'executioner', shadowChance: 0.05, color: '#991b1b' }),
  abyssCultist: e({ id: 'abyssCultist', name: 'Культист бездны', icon: '🕯️', hpMul: 1.0, atkMul: 1.3, defMul: 0.8, speed: 12, abilities: ['fireBolt', 'weakenCurse', 'heal'], color: '#c2410c' }),
  plagueDoctor: e({ id: 'plagueDoctor', name: 'Чумной доктор', icon: '🎭', hpMul: 1.1, atkMul: 1.2, defMul: 1.0, speed: 11, abilities: ['poisonBite', 'armorBreak', 'heal'], color: '#44403c' }),
  demon: e({ id: 'demon', name: 'Демон', icon: '😈', hpMul: 1.4, atkMul: 1.35, defMul: 1.1, speed: 12, abilities: ['fireBolt', 'frenzy', 'drainLife'], shadowId: 'demon', shadowChance: 0.05, color: '#ea580c' }),
  grandExecutioner: e({ id: 'grandExecutioner', name: 'Гракс', title: 'Верховный Палач', icon: '⚰️', hpMul: 8.5, atkMul: 1.3, defMul: 1.2, speed: 10, critChance: 15, abilities: ['heavyBlow', 'bleedStrike', 'frenzy'], boss: 'executioner', bossDesc: 'Казнь: если ваше HP ниже 35%, его удары наносят двойной урон. Каждый 3-й ход — кровавая рубка.', shadowId: 'executioner', shadowChance: 0.35, color: '#7f1d1d' }),

  // ---- Цитадель короля теней ----
  facelessKnight: e({ id: 'facelessKnight', name: 'Рыцарь без лица', icon: '🎭', hpMul: 1.5, atkMul: 1.3, defMul: 1.5, speed: 11, abilities: ['shadowStrike', 'stunBash', 'guard'], shadowId: 'faceless', shadowChance: 0.05, color: '#1e293b' }),
  lightDevourer: e({ id: 'lightDevourer', name: 'Пожиратель света', icon: '🌑', hpMul: 1.3, atkMul: 1.4, defMul: 1.0, speed: 14, dodge: 10, abilities: ['drainLife', 'weakenCurse', 'shadowStrike'], color: '#312e81' }),
  boneDragon: e({ id: 'boneDragon', name: 'Костяной дракон', icon: '🐉', hpMul: 1.9, atkMul: 1.35, defMul: 1.3, speed: 10, abilities: ['fireBolt', 'heavyBlow', 'armorBreak'], shadowId: 'dragon', shadowChance: 0.05, color: '#a8a29e' }),
  shadowLord: e({ id: 'shadowLord', name: 'Теневой лорд', icon: '🧛‍♂️', hpMul: 1.5, atkMul: 1.4, defMul: 1.2, speed: 13, abilities: ['shadowStrike', 'drainLife', 'frenzy'], color: '#581c87' }),
  shadowKing: e({ id: 'shadowKing', name: 'Король Теней', title: 'Последний Владыка', icon: '👑', hpMul: 9, atkMul: 1.1, defMul: 1.35, speed: 12, abilities: ['shadowStrike', 'drainLife', 'weakenCurse', 'stunBash'], boss: 'shadowKing', bossDesc: 'При 50% HP перерождается: лечит 25% HP и получает +30% атаки. Каждые 5 ходов — Теневое затмение (оглушение).', shadowId: 'king', shadowChance: 0.4, color: '#6d28d9' }),

  // ---- Tower-only ----
  towerWarden: e({ id: 'towerWarden', name: 'Страж Башни', title: 'Хранитель этажа', icon: '🗼', hpMul: 6, atkMul: 1.2, defMul: 1.3, speed: 11, abilities: ['heavyBlow', 'stunBash', 'guard', 'drainLife'], boss: 'towerWarden', bossDesc: 'С каждым ходом становится сильнее: +6% атаки за ход.', shadowId: 'warden', shadowChance: 0.25, color: '#9333ea' }),
};

export const REGULAR_ENEMY_IDS = Object.values(ENEMIES)
  .filter((x) => !x.boss)
  .map((x) => x.id);

export const BOSS_IDS = Object.values(ENEMIES)
  .filter((x) => x.boss)
  .map((x) => x.id);
