import type { ClassDef, ClassId } from '../types';

/**
 * Class registry. To add a new class: add its id to `ClassId`,
 * define it here and implement its ability ids in game/abilities.ts.
 */
export const CLASSES: Record<ClassId, ClassDef> = {
  berserker: {
    id: 'berserker',
    name: 'Берсерк',
    icon: '🪓',
    tagline: 'Ярость, не знающая страха',
    description: 'Сокрушает врагов огромным уроном и частыми критами, но плохо защищён.',
    color: '#dc2626',
    mods: { hpMul: 1.05, atkMul: 1.25, defMul: 0.7, critChance: 5, critDmg: 25, speed: 0, dodge: 0, block: 0, bleedChance: 5, magicPct: 0 },
    perks: ['+25% атаки', '+5% шанс крита', '+25% крит. урона', '−30% защиты'],
    recommended: ['str', 'agi'],
    abilities: [
      { id: 'bloodRage', name: 'Кровавая ярость', description: 'Удар 220% урона, накладывает кровотечение и даёт +30% атаки на 3 хода.', cost: 50, unlockLevel: 1, cooldown: 3 },
      { id: 'whirlwind', name: 'Вихрь стали', description: 'Три удара по 90% урона, каждый может критовать.', cost: 60, unlockLevel: 5, cooldown: 3 },
      { id: 'lastStand', name: 'Последний рубеж', description: 'Чем меньше у вас HP, тем сильнее удар (до 500%). Вампиризм 30%.', cost: 70, unlockLevel: 12, cooldown: 4 },
    ],
  },
  guardian: {
    id: 'guardian',
    name: 'Страж',
    icon: '🛡️',
    tagline: 'Несокрушимая стена',
    description: 'Огромный запас здоровья, высокая защита и шанс заблокировать атаку. Бьёт тем сильнее, чем крепче его броня.',
    color: '#d4a017',
    mods: { hpMul: 1.3, atkMul: 1.0, defMul: 1.4, critChance: 0, critDmg: 0, speed: -1, dodge: 0, block: 15, bleedChance: 0, magicPct: 0 },
    perks: ['+30% HP', '+40% защиты', '15% блока', 'Удары усилены защитой (+80%)'],
    recommended: ['vit', 'str'],
    abilities: [
      { id: 'shieldBash', name: 'Удар щитом', description: '150% урона + защита, оглушает врага на 1 ход.', cost: 50, unlockLevel: 1, cooldown: 3 },
      { id: 'aegis', name: 'Эгида', description: 'Щит на 35% max HP и +40% защиты на 3 хода.', cost: 50, unlockLevel: 5, cooldown: 4 },
      { id: 'retribution', name: 'Возмездие', description: 'Урон равен 120% атаки + 60% вашей защиты ×2. Лечит 15% HP.', cost: 70, unlockLevel: 12, cooldown: 4 },
    ],
  },
  assassin: {
    id: 'assassin',
    name: 'Ассасин',
    icon: '🗡️',
    tagline: 'Смерть из тени',
    description: 'Быстрый и неуловимый убийца в белом капюшоне. Скрытый клинок на запястье, меч на бедре, смертельные криты и кровотечение.',
    color: '#22c55e',
    mods: { hpMul: 1.0, atkMul: 1.05, defMul: 0.9, critChance: 8, critDmg: 40, speed: 6, dodge: 12, block: 0, bleedChance: 15, magicPct: 0 },
    perks: ['+6 скорости', '12% уклонения', '+40% крит. урона', '15% кровотечения'],
    recommended: ['agi', 'str'],
    abilities: [
      { id: 'shadowStab', name: 'Удар из тени', description: 'Гарантированный крит 180% урона + кровотечение.', cost: 50, unlockLevel: 1, cooldown: 3 },
      { id: 'venom', name: 'Ядовитые клинки', description: 'Два удара по 80%, сильный яд на 4 хода.', cost: 45, unlockLevel: 5, cooldown: 3 },
      { id: 'vanish', name: 'Исчезновение', description: '+60% уклонения на 2 хода и удар 150% с гарантированным критом.', cost: 70, unlockLevel: 12, cooldown: 5 },
    ],
  },
  shadowmage: {
    id: 'shadowmage',
    name: 'Маг Тени',
    icon: '🔮',
    tagline: 'Власть над бездной',
    description: 'Магический урон, игнорирующий броню, проклятия и контроль.',
    color: '#a855f7',
    mods: { hpMul: 0.9, atkMul: 1.1, defMul: 0.8, critChance: 3, critDmg: 10, speed: 1, dodge: 3, block: 0, bleedChance: 0, magicPct: 25 },
    perks: ['+25% магии', 'Способности игнорируют броню', 'Проклятия и контроль', '−20% защиты'],
    recommended: ['dark', 'vit'],
    abilities: [
      { id: 'abyssFlame', name: 'Пламя бездны', description: 'Магия 200% (игнор брони) + горение 3 хода.', cost: 50, unlockLevel: 1, cooldown: 2 },
      { id: 'hex', name: 'Проклятие', description: 'Враг слабеет (−30% атаки) и уязвим (−40% защиты) 3 хода.', cost: 40, unlockLevel: 5, cooldown: 4 },
      { id: 'voidPrison', name: 'Темница пустоты', description: 'Магия 260%, оглушение на 1 ход и похищение 20% урона в HP.', cost: 75, unlockLevel: 12, cooldown: 4 },
    ],
  },
};

export const CLASS_LIST = Object.values(CLASSES);

export const ATTRIBUTE_INFO = {
  str: { name: 'Сила', icon: '💪', desc: '+2 атаки, +2 HP' },
  agi: { name: 'Ловкость', icon: '🌀', desc: '+0.4% крит, +0.35 скорости, +0.25% уклонения' },
  vit: { name: 'Выносливость', icon: '❤️', desc: '+14 HP, +0.6 защиты, +0.2% блока' },
  dark: { name: 'Тьма', icon: '🌑', desc: '+2% магии, +1% крит. урона, +1 атака' },
} as const;
