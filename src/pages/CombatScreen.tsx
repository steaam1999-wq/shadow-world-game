import { FastForward, Flag, Bot, ScrollText } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { CLASSES } from '../data/classes';
import { getLocation } from '../data/locations';
import { canUseAction, getUnlockedAbilities, HEAVY_COST, playRound, startCombat, STATUS_INFO } from '../game/combat';
import { resolveBattle } from '../game/rewards';
import { isTowerBoss } from '../game/tower';
import { useGame, type ActiveBattle } from '../hooks/useGame';
import type { BattleResult, Combatant, CombatState, CombatStep, FloatKind, PlayerAction } from '../types';
import { Bar } from '../components/ui';
import { RewardPanel } from '../components/RewardPanel';

interface FloatNum {
  id: number;
  side: 'player' | 'enemy';
  text: string;
  kind: FloatKind;
  x: number;
}

const FLOAT_COLOR: Record<FloatKind, string> = {
  dmg: 'text-red-400',
  crit: 'text-amber-300 crit',
  heal: 'text-emerald-400',
  miss: 'text-zinc-300',
  block: 'text-sky-300',
  status: 'text-purple-300 !text-lg',
  dot: 'text-orange-400 !text-xl',
};

const LOG_COLOR: Record<string, string> = {
  player: 'text-zinc-200',
  enemy: 'text-red-300',
  crit: 'text-amber-300 font-bold',
  heal: 'text-emerald-400',
  status: 'text-purple-300',
  system: 'text-sky-300',
  boss: 'text-red-400 font-bold',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function CombatScreen({ battle }: { battle: ActiveBattle }) {
  const { mutate, closeBattle, play, state } = useGame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initial = useMemo(() => startCombat(battle.player, battle.enemy, state.potions), [battle.key]);
  const [cs, setCs] = useState<CombatState>(initial.state);
  const [busy, setBusyState] = useState(true);
  const busyRef = useRef(true);
  const setBusy = (v: boolean) => {
    busyRef.current = v;
    setBusyState(v);
  };
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const [anim, setAnim] = useState<Record<'player' | 'enemy', { cls: string; k: number }>>({ player: { cls: '', k: 0 }, enemy: { cls: '', k: 0 } });
  const [shake, setShake] = useState(0);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [showAbilities, setShowAbilities] = useState(false);
  const [auto, setAuto] = useState(false);
  const [fast, setFast] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const alive = useRef(true);
  const floatSeq = useRef(0);
  const csRef = useRef(cs);
  csRef.current = cs;
  const fastRef = useRef(fast);
  fastRef.current = fast;
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [cs.log.length, showLog]);

  const finish = useCallback(
    (final: CombatState) => {
      const res = mutate((d) => resolveBattle(d, battle.ctx, final));
      setTimeout(() => play(res.victory ? 'victory' : 'defeat'), 150);
      if (res.reward.items.length || res.reward.shadows.length) setTimeout(() => play('loot'), 900);
      setResult(res);
    },
    [mutate, battle.ctx, play],
  );

  const playSteps = useCallback(
    async (steps: CombatStep[]) => {
      setBusy(true);
      for (const s of steps) {
        if (!alive.current) return;
        setCs(s.snapshot);
        if (s.float) {
          const f: FloatNum = { id: ++floatSeq.current, side: s.target, text: s.float.text, kind: s.float.kind, x: (Math.random() - 0.5) * 60 };
          setFloats((list) => [...list.slice(-8), f]);
          setTimeout(() => alive.current && setFloats((list) => list.filter((x) => x.id !== f.id)), 1400);
        }
        if (s.anim || s.actor) {
          const targetCls =
            s.anim === 'crit' ? 'anim-crit' : s.anim === 'hit' ? 'anim-hit' : s.anim === 'heal' ? 'anim-heal' : s.anim === 'block' ? 'anim-block' : s.anim === 'dodge' ? 'anim-dodge' : '';
          setAnim((a) => {
            const next = { ...a };
            if (s.actor) next[s.actor] = { cls: s.actor === 'player' ? 'lunge-player' : 'lunge-enemy', k: a[s.actor].k + 1 };
            if (targetCls && s.target !== s.actor) next[s.target] = { cls: targetCls, k: a[s.target].k + 1 };
            return next;
          });
          if (s.anim === 'crit') setShake((x) => x + 1);
        }
        if (s.sound) play(s.sound);
        const base = s.float || s.anim ? (s.float?.kind === 'crit' ? 650 : 480) : 60;
        await sleep(fastRef.current ? base * 0.45 : base);
      }
      if (!alive.current) return;
      const last = steps[steps.length - 1]?.snapshot;
      if (last?.over) {
        await sleep(500);
        if (alive.current) finish(last);
        return;
      }
      setBusy(false);
    },
    [play, finish],
  );

  // Opening steps (first strike etc.)
  useEffect(() => {
    void playSteps(initial.steps);
  }, [initial, playSteps]);

  const act = useCallback(
    (action: PlayerAction) => {
      if (busyRef.current || csRef.current.over) return;
      if (!canUseAction(csRef.current, action).ok) {
        play('error');
        return;
      }
      setShowAbilities(false);
      busyRef.current = true;
      const r = playRound(csRef.current, action);
      void playSteps(r.steps);
    },
    [playSteps, play],
  );

  const p = cs.player;
  const e = cs.enemy;
  const stunned = p.statuses.some((s) => s.id === 'stun');
  const abilities = getUnlockedAbilities(p.classId!, p.level);

  // Auto battle: polls instead of relying on render timing
  const resultRef = useRef(result);
  resultRef.current = result;
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      const c = csRef.current;
      if (busyRef.current || c.over || resultRef.current) return;
      let action: PlayerAction = { type: 'attack' };
      if (c.player.statuses.some((s) => s.id === 'stun')) action = { type: 'skip' };
      else if (c.player.hp < c.player.maxHp * 0.3 && canUseAction(c, { type: 'potion' }).ok) action = { type: 'potion' };
      else {
        const ab = [...getUnlockedAbilities(c.player.classId!, c.player.level)]
          .reverse()
          .find((a) => canUseAction(c, { type: 'ability', abilityId: a.id }).ok);
        if (ab) action = { type: 'ability', abilityId: ab.id };
        else if (c.player.energy >= HEAVY_COST + 40) action = { type: 'heavy' };
      }
      act(action);
    }, 300);
    return () => clearInterval(id);
  }, [auto, act]);

  const flee = () => {
    if (result) return;
    if (battle.ctx.kind === 'arena') {
      const final = { ...csRef.current, over: true, winner: 'enemy' as const };
      finish(final);
      return;
    }
    mutate((d) => {
      d.hero!.hp = csRef.current.player.hp;
      d.potions = csRef.current.potions;
    });
    closeBattle();
  };

  const title = useMemo(() => {
    const c = battle.ctx;
    if (c.kind === 'location') {
      const loc = getLocation(c.locationId!);
      return `${loc.name} · ${c.isBoss ? 'БОСС' : `Бой ${c.stageIndex! + 1}`}`;
    }
    if (c.kind === 'tower') return `Башня Теней · Этаж ${c.floor}${isTowerBoss(c.floor!) ? ' · БОСС' : ''}`;
    return `Арена · ${c.arenaOpponent!.rating} рейтинг`;
  }, [battle.ctx]);

  const bg = battle.ctx.kind === 'location' ? getLocation(battle.ctx.locationId!).gradient : battle.ctx.kind === 'tower' ? 'from-purple-950/80 via-slate-950 to-black' : 'from-amber-950/60 via-red-950/60 to-black';

  return (
    <div className={`fixed inset-0 z-50 flex flex-col overflow-hidden bg-gradient-to-b ${bg} bg-abyss`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)]" />
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 bg-black/50 px-3 py-2 backdrop-blur">
        <div className="min-w-0">
          <div className="title truncate text-lg text-zinc-100 sm:text-xl">{title}</div>
          <div className="text-xs text-zinc-400">Ход {cs.turn}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <ToggleBtn on={auto} onClick={() => setAuto((v) => !v)} title="Автобой">
            <Bot size={18} /> <span className="hidden sm:inline">Авто</span>
          </ToggleBtn>
          <ToggleBtn on={fast} onClick={() => setFast((v) => !v)} title="Ускорение">
            <FastForward size={18} /> <span className="hidden sm:inline">x2</span>
          </ToggleBtn>
          <ToggleBtn on={showLog} onClick={() => setShowLog((v) => !v)} title="Лог боя" className="lg:hidden">
            <ScrollText size={18} />
          </ToggleBtn>
          <button onClick={flee} disabled={!!result} className="btn-dark !px-3 !py-2 text-xs" title="Отступить">
            <Flag size={16} /> <span className="hidden sm:inline">Отступить</span>
          </button>
        </div>
      </div>

      {/* Arena */}
      <div className="relative z-10 flex min-h-0 flex-1">
        <div key={shake} className={`relative flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-3 py-3 lg:flex-row lg:gap-10 ${shake ? 'anim-shake' : ''}`}>
          <div className="order-3 w-full max-w-xs lg:order-1">
            <Fighter c={p} side="player" anim={anim.player.cls} animKey={anim.player.k} floats={floats.filter((f) => f.side === 'player')} />
          </div>
          <div className="title anim-vs order-2 text-4xl text-red-500 lg:text-7xl">VS</div>
          <div className="order-1 w-full max-w-xs lg:order-3">
            <Fighter c={e} side="enemy" anim={anim.enemy.cls} animKey={anim.enemy.k} floats={floats.filter((f) => f.side === 'enemy')} bossDesc={battle.ctx.enemyTemplate?.bossDesc} />
          </div>
        </div>

        {/* Log (desktop) */}
        <aside className="hidden w-80 shrink-0 flex-col border-l border-white/10 bg-black/60 lg:flex">
          <div className="title border-b border-white/10 px-4 py-2 text-lg text-zinc-300">Лог боя</div>
          <LogList log={cs.log} refEl={logRef} />
        </aside>
        {showLog && (
          <div className="absolute inset-x-2 top-2 z-30 flex max-h-[45%] flex-col rounded-xl border border-white/10 bg-black/90 lg:hidden">
            <LogList log={cs.log} refEl={logRef} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="safe-bottom relative z-20 border-t border-white/10 bg-black/70 p-2 backdrop-blur sm:p-3">
        {showAbilities && (
          <div className="anim-pop-in absolute inset-x-2 bottom-full mb-2 grid gap-2 rounded-2xl border border-purple-700/60 bg-black/95 p-2 shadow-[0_0_30px_rgba(168,85,247,0.35)] sm:mx-auto sm:max-w-2xl">
            {CLASSES[p.classId!].abilities.map((ab) => {
              const unlocked = ab.unlockLevel <= p.level;
              const check = canUseAction(cs, { type: 'ability', abilityId: ab.id });
              return (
                <button
                  key={ab.id}
                  disabled={!unlocked || !check.ok || busy}
                  onClick={() => act({ type: 'ability', abilityId: ab.id })}
                  className="flex items-center gap-3 rounded-xl border border-purple-800/60 bg-gradient-to-r from-purple-950/80 to-black p-3 text-left transition hover:border-purple-400 disabled:opacity-40"
                >
                  <span className="text-2xl">✨</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-purple-200">
                      {ab.name}{' '}
                      <span className="text-xs font-semibold text-zinc-400">
                        · {ab.cost} ⚡{!unlocked ? ` · с ${ab.unlockLevel} ур.` : ''}
                        {unlocked && !check.ok && check.reason ? ` · ${check.reason}` : ''}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400">{ab.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {stunned && !busy && !cs.over ? (
          <button className="btn-shadow w-full py-4 text-base" onClick={() => act({ type: 'skip' })}>
            💫 Вы оглушены — пропустить ход
          </button>
        ) : (
          <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1.5 sm:gap-3">
            <ActionBtn icon="⚔️" label="Атака" hint="+20 ⚡" cls="btn-blood" disabled={busy} onClick={() => act({ type: 'attack' })} />
            <ActionBtn icon="🛡️" label="Защита" hint="+30 ⚡" cls="btn-dark" disabled={busy} onClick={() => act({ type: 'defend' })} />
            <ActionBtn
              icon="💥"
              label="Сильный"
              hint={`${HEAVY_COST} ⚡`}
              cls="btn-gold"
              disabled={busy || !canUseAction(cs, { type: 'heavy' }).ok}
              onClick={() => act({ type: 'heavy' })}
            />
            <ActionBtn
              icon="✨"
              label="Способн."
              hint={`${abilities.filter((a) => canUseAction(cs, { type: 'ability', abilityId: a.id }).ok).length} готово`}
              cls="btn-shadow"
              disabled={busy}
              glow={abilities.some((a) => canUseAction(cs, { type: 'ability', abilityId: a.id }).ok)}
              onClick={() => setShowAbilities((v) => !v)}
            />
            <ActionBtn
              icon="🧪"
              label="Зелье"
              hint={`x${cs.potions}`}
              cls="btn-green"
              disabled={busy || !canUseAction(cs, { type: 'potion' }).ok}
              onClick={() => act({ type: 'potion' })}
            />
          </div>
        )}
      </div>

      {result && (
        <RewardPanel
          result={result}
          ctx={battle.ctx}
          enemyName={e.name}
          onClose={closeBattle}
        />
      )}
    </div>
  );
}

function LogList({ log, refEl }: { log: CombatState['log']; refEl: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={refEl} className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3 font-mono text-[12px] leading-snug">
      {log.map((l) => (
        <div key={l.id} className={`anim-fade-in ${LOG_COLOR[l.kind]}`}>
          <span className="text-zinc-600">&gt; </span>
          {l.text}
        </div>
      ))}
    </div>
  );
}

function ToggleBtn({ on, onClick, children, title, className = '' }: { on: boolean; onClick: () => void; children: ReactNode; title: string; className?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold uppercase transition ${
        on ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'border-white/15 bg-black/40 text-zinc-400 hover:text-white'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function ActionBtn({
  icon,
  label,
  hint,
  cls,
  disabled,
  onClick,
  glow,
}: {
  icon: string;
  label: string;
  hint: string;
  cls: string;
  disabled: boolean;
  onClick: () => void;
  glow?: boolean;
}) {
  return (
    <button className={`${cls} flex-col !gap-0.5 !px-1 !py-2.5 sm:!py-3.5 ${glow && !disabled ? 'anim-glow' : ''}`} style={glow ? ({ '--glow': 'rgba(168,85,247,0.7)' } as CSSProperties) : undefined} disabled={disabled} onClick={onClick}>
      <span className="text-2xl leading-none sm:text-3xl">{icon}</span>
      <span className="text-[10px] leading-tight sm:text-xs">{label}</span>
      <span className="text-[9px] font-semibold normal-case opacity-70 sm:text-[10px]">{hint}</span>
    </button>
  );
}

function Fighter({
  c,
  side,
  anim,
  animKey,
  floats,
  bossDesc,
}: {
  c: Combatant;
  side: 'player' | 'enemy';
  anim: string;
  animKey: number;
  floats: FloatNum[];
  bossDesc?: string;
}) {
  const hpPct = c.hp / c.maxHp;
  const isBoss = !!c.boss;
  const shield = c.statuses.find((s) => s.id === 'shield');
  return (
    <div className={`relative flex items-center gap-3 lg:flex-col lg:gap-4 ${side === 'enemy' ? 'flex-row-reverse lg:flex-col' : ''}`}>
      {/* Portrait */}
      <div className="relative">
        <div
          key={animKey + anim}
          className={`relative flex h-24 w-24 items-center justify-center rounded-full border-4 sm:h-28 sm:w-28 lg:h-44 lg:w-44 ${anim}`}
          style={{
            borderColor: c.color,
            background: `radial-gradient(circle at 50% 35%, ${c.color}55, #050407 70%)`,
            boxShadow: `0 0 ${isBoss ? 50 : 30}px ${c.color}${isBoss ? 'aa' : '66'}, inset 0 0 30px #000`,
            filter: c.hp <= 0 ? 'grayscale(1) brightness(0.4)' : undefined,
          }}
        >
          <span className="anim-idle text-5xl sm:text-6xl lg:text-8xl" style={{ filter: 'drop-shadow(0 4px 8px #000)' }}>
            {c.icon}
          </span>
          {shield && <div className="absolute -inset-2 rounded-full border-2 border-sky-400/70 shadow-[0_0_20px_rgba(56,189,248,0.6)]" />}
          {isBoss && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md border border-red-500 bg-red-950 px-2 text-[10px] font-black tracking-widest text-red-300">БОСС</div>}
        </div>
      </div>

      {floats.map((f) => (
        <span key={f.id} className={`float-num ${FLOAT_COLOR[f.kind]}`} style={{ marginLeft: f.x }}>
          {f.text}
        </span>
      ))}

      {/* Info */}
      <div className={`min-w-0 flex-1 lg:w-full ${side === 'enemy' ? 'text-right lg:text-center' : 'lg:text-center'}`}>
        <div className="title truncate text-lg text-zinc-100 lg:text-2xl">{c.name}</div>
        <div className="text-xs text-zinc-400">Уровень {c.level}</div>
        <Bar
          value={c.hp}
          max={c.maxHp}
          height="h-5"
          lag
          className="mt-1.5"
          color={hpPct < 0.3 ? 'from-red-600 to-red-950' : side === 'player' ? 'from-emerald-500 to-emerald-800' : 'from-red-500 to-red-800'}
          label={`${Math.ceil(c.hp)} / ${c.maxHp}${shield ? ` 🔰${shield.value}` : ''}`}
        />
        {c.isPlayer && (
          <Bar value={c.energy} max={c.maxEnergy} height="h-2.5" className="mt-1" color="from-amber-300 to-amber-600" label={<span className="text-[8px]">{c.energy} ⚡</span>} />
        )}
        <div className={`mt-1.5 flex min-h-6 flex-wrap gap-1 ${side === 'enemy' ? 'justify-end lg:justify-center' : 'lg:justify-center'}`}>
          {c.statuses.map((s) => {
            const info = STATUS_INFO[s.id];
            return (
              <span
                key={s.id}
                title={`${info.name}${s.turns < 50 ? ` (${s.turns} х.)` : ''}`}
                className={`anim-pop-in inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${
                  info.bad ? 'border-red-800 bg-red-950/70 text-red-200' : 'border-emerald-800 bg-emerald-950/70 text-emerald-200'
                }`}
              >
                {info.icon}
                {s.turns < 50 && s.id !== 'stun' && <span>{s.turns}</span>}
              </span>
            );
          })}
          {(c.flags.atkStolen ?? 0) > 0 && <span className="rounded-md border border-purple-800 bg-purple-950/70 px-1.5 py-0.5 text-[11px] font-bold text-purple-200">👁️ −{c.flags.atkStolen}% атк</span>}
        </div>
        {bossDesc && <div className="mt-1 hidden text-[11px] italic text-red-300/80 lg:block">{bossDesc}</div>}
      </div>
    </div>
  );
}
