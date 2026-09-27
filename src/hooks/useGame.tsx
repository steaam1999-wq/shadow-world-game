import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { BattleContext, Combatant, GameState, Page, SoundId, Toast } from '../types';
import { localSaveAdapter, newGameState, type SaveAdapter } from '../game/save';
import { checkAchievements, ensureDaily } from '../game/quests';
import { checkSeason, generateOpponents } from '../game/arena';
import { heroStats, HP_REGEN_PER_SEC } from '../game/hero';
import { audio } from '../utils/audio';
import { todayKey } from '../utils/format';

export interface ActiveBattle {
  key: number;
  ctx: BattleContext;
  player: Combatant;
  enemy: Combatant;
}

interface GameApi {
  state: GameState;
  page: Page;
  setPage: (p: Page) => void;
  /** Immutable update: receives a draft copy, returns any value. */
  mutate: <T>(fn: (draft: GameState) => T) => T;
  toast: (t: Omit<Toast, 'id'>) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  play: (s: SoundId) => void;
  battle: ActiveBattle | null;
  startBattle: (ctx: BattleContext, player: Combatant, enemy: Combatant) => void;
  closeBattle: () => void;
  levelUp: number | null;
  clearLevelUp: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  saveNow: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameApi | null>(null);

export function GameProvider({ children, adapter = localSaveAdapter }: { children: ReactNode; adapter?: SaveAdapter }) {
  const [state, setState] = useState<GameState>(() => adapter.load() ?? newGameState());
  const stateRef = useRef(state);
  const [page, setPageRaw] = useState<Page>('battle');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [battle, setBattle] = useState<ActiveBattle | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const toastSeq = useRef(0);
  const battleRef = useRef<ActiveBattle | null>(null);
  battleRef.current = battle;

  audio.soundOn = state.settings.sound;

  const play = useCallback((s: SoundId) => audio.play(s), []);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++toastSeq.current;
      setToasts((list) => [...list.slice(-4), { ...t, id }]);
      setTimeout(() => dismissToast(id), t.kind === 'achievement' ? 4500 : 3000);
    },
    [dismissToast],
  );

  const mutate = useCallback(
    <T,>(fn: (draft: GameState) => T): T => {
      const prev = stateRef.current;
      const draft = structuredClone(prev);
      const out = fn(draft);
      const fresh = checkAchievements(draft);
      stateRef.current = draft;
      setState(draft);
      for (const a of fresh) {
        toast({ kind: 'achievement', title: `Достижение: ${a.title}`, text: `+${a.reward.crystals} 💎`, icon: a.icon });
        audio.play('achievement');
      }
      const before = prev.hero?.level ?? 0;
      const after = draft.hero?.level ?? 0;
      if (prev.hero && after > before) {
        setLevelUp(after);
        audio.play('levelup');
      }
      return out;
    },
    [toast],
  );

  const setPage = useCallback((p: Page) => {
    setPageRaw(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Autosave (debounced)
  useEffect(() => {
    const t = setTimeout(() => adapter.save(state), 400);
    return () => clearTimeout(t);
  }, [state, adapter]);

  // Save on tab close
  useEffect(() => {
    const onHide = () => adapter.save(stateRef.current);
    window.addEventListener('beforeunload', onHide);
    return () => window.removeEventListener('beforeunload', onHide);
  }, [adapter]);

  // Music toggle
  useEffect(() => {
    if (!state.settings.music) {
      audio.setMusic(false);
      return;
    }
    // Browsers require a gesture before audio can start.
    const start = () => audio.setMusic(true);
    start();
    window.addEventListener('pointerdown', start, { once: true });
    return () => window.removeEventListener('pointerdown', start);
  }, [state.settings.music]);

  // Game loop: HP regeneration, daily reset, arena season
  useEffect(() => {
    const onStart = stateRef.current;
    if (onStart.hero && (onStart.daily.date !== todayKey() || !onStart.arena.opponents.length)) {
      mutate((d) => {
        ensureDaily(d);
        if (!d.arena.opponents.length) d.arena.opponents = generateOpponents(d);
      });
    }
    const id = setInterval(() => {
      const s = stateRef.current;
      if (!s.hero) return;
      const now = Date.now();
      const max = heroStats(s).maxHp;
      const needsRegen = !battleRef.current && s.hero.hp < max;
      const dayChanged = s.daily.date !== todayKey();
      const seasonOver = now >= s.arena.seasonEndsAt;
      if (!needsRegen && !dayChanged && !seasonOver) {
        if (s.lastRegenAt < now - 5000) stateRef.current = { ...s, lastRegenAt: now };
        return;
      }
      mutate((d) => {
        if (needsRegen) {
          const secs = Math.min(600, Math.max(1, (now - d.lastRegenAt) / 1000));
          d.hero!.hp = Math.min(max, d.hero!.hp + max * HP_REGEN_PER_SEC * secs);
        }
        d.lastRegenAt = now;
        if (dayChanged) {
          ensureDaily(d);
          toast({ kind: 'info', title: 'Новый день!', text: 'Ежедневные задания обновлены', icon: '📜' });
        }
        const season = checkSeason(d);
        if (season) {
          d.arena.opponents = generateOpponents(d);
          toast({
            kind: 'success',
            title: `Сезон арены завершён! Место #${season.rank}`,
            text: `+${season.reward.crystals} 💎 +${season.reward.tokens} 🎖 +${season.reward.gold} 🪙`,
            icon: '🏟️',
          });
        }
      });
    }, 1000);
    return () => clearInterval(id);
  }, [mutate, toast]);

  const startBattle = useCallback((ctx: BattleContext, player: Combatant, enemy: Combatant) => {
    setBattle({ key: Date.now(), ctx, player, enemy });
  }, []);

  const closeBattle = useCallback(() => {
    setBattle(null);
    mutate((d) => {
      d.lastRegenAt = Date.now();
    });
  }, [mutate]);

  const saveNow = useCallback(() => {
    adapter.save(stateRef.current);
    toast({ kind: 'success', title: 'Игра сохранена', icon: '💾' });
  }, [adapter, toast]);

  const resetGame = useCallback(() => {
    adapter.clear();
    const fresh = newGameState();
    stateRef.current = fresh;
    setState(fresh);
    setBattle(null);
    setPageRaw('battle');
    setSettingsOpen(false);
  }, [adapter]);

  const api = useMemo<GameApi>(
    () => ({
      state,
      page,
      setPage,
      mutate,
      toast,
      toasts,
      dismissToast,
      play,
      battle,
      startBattle,
      closeBattle,
      levelUp,
      clearLevelUp: () => setLevelUp(null),
      settingsOpen,
      setSettingsOpen,
      saveNow,
      resetGame,
    }),
    [state, page, setPage, mutate, toast, toasts, dismissToast, play, battle, startBattle, closeBattle, levelUp, settingsOpen, saveNow, resetGame],
  );

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
