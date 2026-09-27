import type { Counters, GameState } from '../types';
import { createArenaState } from './arena';
import { createDaily } from './quests';

export const SAVE_VERSION = 1;
const SAVE_KEY = 'shadows-last-warrior/save';

/**
 * Storage abstraction. Swap `localSaveAdapter` for a server-backed adapter
 * (e.g. REST / websocket) without touching game logic.
 */
export interface SaveAdapter {
  load(): GameState | null;
  save(state: GameState): void;
  clear(): void;
}

const emptyCounters = (): Counters => ({
  kills: 0,
  bossKills: 0,
  wins: 0,
  losses: 0,
  battles: 0,
  winStreak: 0,
  bestWinStreak: 0,
  legendaryFound: 0,
  mythicFound: 0,
  shadowsObtained: 0,
  maxShadowTier: 0,
  upgrades: 0,
  arenaWins: 0,
  goldEarned: 0,
  crits: 0,
});

export function newGameState(): GameState {
  return {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    hero: null,
    currencies: { gold: 100, crystals: 20, shards: 0, tokens: 0 },
    potions: 3,
    inventory: [],
    equipment: {},
    shadows: [],
    equippedShadows: [null, null, null],
    discoveredShadows: [],
    locations: {},
    tower: { current: 1, best: 0 },
    arena: createArenaState(),
    daily: createDaily(),
    counters: emptyCounters(),
    achievements: [],
    settings: { sound: true, music: false },
    lastRegenAt: Date.now(),
  };
}

/** Merges a loaded save over defaults so newly added fields never crash old saves. */
function migrate(raw: Partial<GameState>): GameState {
  const base = newGameState();
  return {
    ...base,
    ...raw,
    currencies: { ...base.currencies, ...raw.currencies },
    tower: { ...base.tower, ...raw.tower },
    arena: { ...base.arena, ...raw.arena },
    counters: { ...base.counters, ...raw.counters },
    settings: { ...base.settings, ...raw.settings },
    daily: raw.daily ?? base.daily,
    equippedShadows: raw.equippedShadows ?? base.equippedShadows,
    version: SAVE_VERSION,
  };
}

export const localSaveAdapter: SaveAdapter = {
  load() {
    try {
      const txt = localStorage.getItem(SAVE_KEY);
      if (!txt) return null;
      return migrate(JSON.parse(txt));
    } catch {
      return null;
    }
  },
  save(state) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  },
  clear() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
  },
};
