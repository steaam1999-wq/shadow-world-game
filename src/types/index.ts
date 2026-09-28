// ---------- Core enums ----------
export type ClassId = 'berserker' | 'guardian' | 'assassin' | 'shadowmage' | 'monk';

export type Attribute = 'str' | 'agi' | 'vit' | 'dark';

export type Slot = 'weapon' | 'helmet' | 'armor' | 'gloves' | 'boots' | 'ring' | 'amulet';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type Page =
  | 'battle'
  | 'arena'
  | 'tower'
  | 'hero'
  | 'inventory'
  | 'shadows'
  | 'quests'
  | 'achievements';

/** Every stat an item, shadow or class may modify. */
export type StatKey =
  | 'hp'
  | 'atk'
  | 'def'
  | 'critChance'
  | 'critDmg'
  | 'speed'
  | 'dodge'
  | 'block'
  | 'bleedChance'
  | 'lifesteal'
  | 'str'
  | 'agi'
  | 'vit'
  | 'dark'
  | 'hpPct'
  | 'atkPct'
  | 'defPct'
  | 'magicPct';

export type StatBlock = Partial<Record<StatKey, number>>;

export interface DerivedStats {
  maxHp: number;
  atk: number;
  def: number;
  critChance: number;
  critDmg: number;
  speed: number;
  dodge: number;
  block: number;
  bleedChance: number;
  lifesteal: number;
  magicPct: number;
  attributes: Record<Attribute, number>;
  power: number;
}

// ---------- Items ----------
export interface Item {
  id: string;
  name: string;
  slot: Slot;
  rarity: Rarity;
  level: number;
  upgrade: number;
  icon: string;
  /** Main stats (scaled by upgrade level). */
  main: StatBlock;
  /** Random affixes. */
  affixes: StatBlock;
  locked?: boolean;
  isNew?: boolean;
}

// ---------- Shadows ----------
export type ShadowAbility =
  | 'rage'
  | 'lifesteal'
  | 'thorns'
  | 'regen'
  | 'firstStrike'
  | 'poisonTouch'
  | 'burnTouch'
  | 'critBoost'
  | 'evasion'
  | 'executioner'
  | 'bulwark'
  | 'soulDrain';

export interface ShadowDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  ability: ShadowAbility;
  abilityName: string;
  abilityDesc: string;
  /** Bonuses at tier I; higher tiers multiply them. */
  bonuses: StatBlock;
  rarity: Rarity;
}

export interface ShadowInstance {
  uid: string;
  defId: string;
  tier: number; // 1..5
}

// ---------- Hero ----------
export interface Hero {
  name: string;
  classId: ClassId;
  level: number;
  xp: number;
  hp: number;
  attributes: Record<Attribute, number>;
  freePoints: number;
}

// ---------- Enemies ----------
export type EnemyAbilityId =
  | 'bleedStrike'
  | 'poisonBite'
  | 'fireBolt'
  | 'stunBash'
  | 'drainLife'
  | 'heavyBlow'
  | 'shadowStrike'
  | 'weakenCurse'
  | 'heal'
  | 'guard'
  | 'frenzy'
  | 'armorBreak';

export type BossMechanic =
  | 'ghoulRegen'
  | 'soulEater'
  | 'swampMother'
  | 'ironCastellan'
  | 'executioner'
  | 'shadowKing'
  | 'towerWarden';

export interface EnemyTemplate {
  id: string;
  name: string;
  icon: string;
  title?: string;
  hpMul: number;
  atkMul: number;
  defMul: number;
  speed: number;
  dodge?: number;
  critChance?: number;
  abilities: EnemyAbilityId[];
  boss?: BossMechanic;
  bossDesc?: string;
  shadowId?: string;
  shadowChance?: number;
  /** Visual hue for portrait glow. */
  color: string;
}

export interface LocationStage {
  enemyId: string;
  level: number;
}

export interface LocationDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  stages: LocationStage[]; // last one is the boss
  unlockLevel: number;
}

// ---------- Combat ----------
export type StatusId =
  | 'bleed'
  | 'poison'
  | 'burn'
  | 'stun'
  | 'weaken'
  | 'vulnerable'
  | 'atkUp'
  | 'defUp'
  | 'shield'
  | 'regen'
  | 'enraged'
  | 'guarding'
  | 'evasive';

export interface Status {
  id: StatusId;
  turns: number;
  /** Damage per tick for DoTs, % for buffs, absorb amount for shield. */
  value: number;
}

export interface Combatant {
  id: string;
  name: string;
  icon: string;
  color: string;
  level: number;
  isPlayer: boolean;
  classId?: ClassId;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  critChance: number;
  critDmg: number;
  speed: number;
  dodge: number;
  block: number;
  bleedChance: number;
  lifesteal: number;
  magicPct: number;
  energy: number;
  maxEnergy: number;
  statuses: Status[];
  abilities: EnemyAbilityId[];
  cooldowns: Record<string, number>;
  boss?: BossMechanic;
  shadowAbilities: { ability: ShadowAbility; tier: number }[];
  /** Arbitrary per-fight flags used by boss mechanics. */
  flags: Record<string, number>;
}

export type BattleKind = 'location' | 'tower' | 'arena';

export interface BattleContext {
  kind: BattleKind;
  locationId?: string;
  stageIndex?: number;
  floor?: number;
  arenaOpponent?: ArenaOpponent;
  enemyTemplate?: EnemyTemplate;
  isBoss: boolean;
}

export interface CombatState {
  player: Combatant;
  enemy: Combatant;
  turn: number;
  log: LogEntry[];
  over: boolean;
  winner?: 'player' | 'enemy';
  potions: number;
  potionsUsed: number;
  crits: number;
  logSeq: number;
}

export type LogKind = 'player' | 'enemy' | 'crit' | 'heal' | 'status' | 'system' | 'boss';

export interface LogEntry {
  id: number;
  text: string;
  kind: LogKind;
}

export type FloatKind = 'dmg' | 'crit' | 'heal' | 'miss' | 'block' | 'status' | 'dot';

export interface CombatStep {
  target: 'player' | 'enemy';
  float?: { text: string; kind: FloatKind };
  anim?: 'attack' | 'cast' | 'hit' | 'crit' | 'heal' | 'block' | 'dodge';
  actor?: 'player' | 'enemy';
  sound?: SoundId;
  snapshot: CombatState;
}

export type PlayerAction =
  | { type: 'attack' }
  | { type: 'defend' }
  | { type: 'heavy' }
  | { type: 'ability'; abilityId: string }
  | { type: 'potion' }
  | { type: 'skip' };

export interface ClassAbility {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlockLevel: number;
  cooldown: number;
}

export interface ClassDef {
  id: ClassId;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  color: string;
  mods: {
    hpMul: number;
    atkMul: number;
    defMul: number;
    critChance: number;
    critDmg: number;
    speed: number;
    dodge: number;
    block: number;
    bleedChance: number;
    magicPct: number;
  };
  perks: string[];
  abilities: ClassAbility[];
  recommended: Attribute[];
}

// ---------- Rewards ----------
export interface Reward {
  xp: number;
  gold: number;
  crystals: number;
  shards: number;
  tokens: number;
  items: Item[];
  shadows: ShadowInstance[];
  potions: number;
}

export interface BattleResult {
  victory: boolean;
  reward: Reward;
  levelsGained: number;
  ratingChange?: number;
  newBestFloor?: boolean;
  message?: string;
}

// ---------- Arena ----------
export interface ArenaOpponent {
  id: string;
  name: string;
  classId: ClassId;
  level: number;
  rating: number;
  power: number;
  gear: Item[];
  attributes: Record<Attribute, number>;
}

export interface ArenaBot {
  name: string;
  classId: ClassId;
  level: number;
  rating: number;
}

export interface ArenaState {
  rating: number;
  bestRating: number;
  wins: number;
  losses: number;
  season: number;
  seasonEndsAt: number;
  bots: ArenaBot[];
  opponents: ArenaOpponent[];
}

// ---------- Quests & achievements ----------
export type QuestEvent =
  | 'kill'
  | 'battle'
  | 'bossKill'
  | 'arenaFight'
  | 'arenaWin'
  | 'upgrade'
  | 'towerFloor'
  | 'shadowMerge'
  | 'earnGold'
  | 'critHit'
  | 'usePotion';

export interface QuestDef {
  id: string;
  title: string;
  event: QuestEvent;
  target: number;
  reward: Partial<Pick<Reward, 'xp' | 'gold' | 'crystals' | 'shards' | 'tokens'>>;
}

export interface QuestProgress {
  id: string;
  progress: number;
  claimed: boolean;
}

export interface DailyState {
  date: string;
  quests: QuestProgress[];
  bonusClaimed: boolean;
}

export interface Counters {
  kills: number;
  bossKills: number;
  wins: number;
  losses: number;
  battles: number;
  winStreak: number;
  bestWinStreak: number;
  legendaryFound: number;
  mythicFound: number;
  shadowsObtained: number;
  maxShadowTier: number;
  upgrades: number;
  arenaWins: number;
  goldEarned: number;
  crits: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward: { crystals: number; gold?: number; shards?: number };
  check: (s: GameState) => boolean;
  progress?: (s: GameState) => [number, number];
}

// ---------- Settings / root ----------
export interface Settings {
  sound: boolean;
  music: boolean;
}

export interface Currencies {
  gold: number;
  crystals: number;
  shards: number;
  tokens: number;
}

export interface GameState {
  version: number;
  createdAt: number;
  hero: Hero | null;
  currencies: Currencies;
  potions: number;
  inventory: Item[];
  equipment: Partial<Record<Slot, Item>>;
  shadows: ShadowInstance[];
  equippedShadows: (string | null)[];
  discoveredShadows: string[];
  locations: Record<string, number>; // cleared stages count per location
  tower: { current: number; best: number };
  arena: ArenaState;
  daily: DailyState;
  counters: Counters;
  achievements: string[];
  settings: Settings;
  lastRegenAt: number;
}

// ---------- Effects / notifications ----------
export type SoundId =
  | 'hit'
  | 'crit'
  | 'block'
  | 'miss'
  | 'heal'
  | 'victory'
  | 'defeat'
  | 'loot'
  | 'levelup'
  | 'click'
  | 'coin'
  | 'magic'
  | 'achievement'
  | 'error';

export interface Toast {
  id: number;
  kind: 'info' | 'success' | 'error' | 'achievement' | 'loot' | 'levelup';
  title: string;
  text?: string;
  icon?: string;
}
