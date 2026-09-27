import { useState, type CSSProperties } from 'react';
import { RARITY_INFO } from '../data/items';
import { MAX_SHADOW_TIER, SHADOW_ABILITY_TEXT, SHADOW_LIST, SHADOWS, SHADOW_TIER_NAMES } from '../data/shadows';
import { shadowBonuses } from '../game/stats';
import { absorbShadow, absorbValue, findMergePartner, mergeCost, mergeShadow, SHADOW_SLOT_LEVELS, SUMMON_COST, summonShadow, toggleEquipShadow } from '../game/shadows';
import { trackEvent } from '../game/quests';
import { useGame } from '../hooks/useGame';
import { Burst } from '../components/Particles';
import { Modal, PageTitle, Tabs } from '../components/ui';
import type { ShadowInstance, StatKey } from '../types';
import { formatStat } from '../utils/format';

export function ShadowsPage() {
  const { state, mutate, play, toast } = useGame();
  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState<'mine' | 'codex'>('mine');
  const [fx, setFx] = useState(0);
  const selected = state.shadows.find((s) => s.uid === sel) ?? null;
  const lvl = state.hero!.level;

  const sorted = [...state.shadows].sort((a, b) => b.tier - a.tier || a.defId.localeCompare(b.defId));

  const summon = () => {
    const s = mutate((d) => summonShadow(d));
    if (!s) {
      play('error');
      toast({ kind: 'error', title: 'Недостаточно осколков' });
      return;
    }
    play('magic');
    setTimeout(() => play('loot'), 200);
    setFx(Date.now());
    toast({ kind: 'loot', title: `Призвана: ${SHADOWS[s.defId].name} I`, text: RARITY_INFO[SHADOWS[s.defId].rarity].name, icon: SHADOWS[s.defId].icon });
  };

  return (
    <div>
      <PageTitle
        icon="👹"
        title="Тени"
        subtitle="Поглощайте тени павших врагов. Объединяйте одинаковые, чтобы усилить их."
        right={<Tabs value={tab} onChange={setTab} tabs={[{ id: 'mine', label: 'Мои тени' }, { id: 'codex', label: `Кодекс ${state.discoveredShadows.length}/${SHADOW_LIST.length}` }]} />}
      />

      {/* Equipped slots */}
      <div className="panel relative mb-4 overflow-hidden p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.2),transparent_70%)]" />
        <div className="relative grid grid-cols-3 gap-3">
          {state.equippedShadows.map((uid, i) => {
            const inst = uid ? state.shadows.find((s) => s.uid === uid) : null;
            const locked = lvl < SHADOW_SLOT_LEVELS[i];
            return (
              <button
                key={i}
                disabled={locked || !inst}
                onClick={() => inst && setSel(inst.uid)}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition ${
                  inst ? 'anim-glow border-purple-500 bg-purple-950/40' : 'border-dashed border-zinc-700 bg-black/30'
                }`}
                style={{ '--glow': 'rgba(168,85,247,0.5)' } as CSSProperties}
              >
                <span className="text-4xl sm:text-5xl">{locked ? '🔒' : inst ? SHADOWS[inst.defId].icon : '➕'}</span>
                <span className="text-center text-xs font-bold text-zinc-300">
                  {locked ? `Ур. ${SHADOW_SLOT_LEVELS[i]}` : inst ? `${SHADOWS[inst.defId].name} ${SHADOW_TIER_NAMES[inst.tier]}` : 'Пустой слот'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'mine' && (
        <>
          <div className="panel relative mb-4 flex flex-col items-center gap-3 overflow-hidden p-4 sm:flex-row">
            {fx > 0 && <Burst key={fx} color="#a855f7" count={24} />}
            <div className="text-5xl">🔮</div>
            <div className="flex-1 text-center sm:text-left">
              <div className="title text-xl text-purple-200">Ритуал призыва</div>
              <div className="text-xs text-zinc-400">Призвать случайную тень I уровня. Осколки: <b className="text-purple-300">{state.currencies.shards}</b></div>
            </div>
            <button className="btn-shadow px-6" disabled={state.currencies.shards < SUMMON_COST} onClick={summon}>
              Призвать · {SUMMON_COST} 🔮
            </button>
          </div>

          {sorted.length === 0 ? (
            <div className="panel p-10 text-center text-zinc-500">
              <div className="text-5xl">👤</div>
              <div className="mt-2">У вас пока нет теней. Побеждайте сильных врагов и боссов — у них есть шанс оставить свою тень.</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {sorted.map((s) => (
                <ShadowCard key={s.uid} s={s} equipped={state.equippedShadows.includes(s.uid)} canMerge={!!findMergePartner(state, s) && s.tier < MAX_SHADOW_TIER} onClick={() => setSel(s.uid)} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'codex' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SHADOW_LIST.map((d) => {
            const known = state.discoveredShadows.includes(d.id);
            return (
              <div key={d.id} className={`panel p-3 text-center ${known ? '' : 'opacity-40 grayscale'}`}>
                <div className="text-4xl">{known ? d.icon : '❓'}</div>
                <div className="mt-1 text-sm font-bold" style={{ color: RARITY_INFO[d.rarity].color }}>
                  {known ? d.name : '???'}
                </div>
                <div className="text-[11px] text-zinc-500">{known ? d.abilityName : RARITY_INFO[d.rarity].name}</div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSel(null)} title="Тень">
        {selected && <ShadowDetails s={selected} onDone={() => setSel(null)} />}
      </Modal>
    </div>
  );

  function ShadowDetails({ s, onDone }: { s: ShadowInstance; onDone: () => void }) {
    const def = SHADOWS[s.defId];
    const bonuses = shadowBonuses(s);
    const partner = findMergePartner(state, s);
    const equipped = state.equippedShadows.includes(s.uid);
    const cost = mergeCost(s.tier);
    return (
      <div>
        <div className="flex items-center gap-4">
          <div className="anim-idle flex h-24 w-24 items-center justify-center rounded-full border-2 text-5xl" style={{ borderColor: RARITY_INFO[def.rarity].color, background: 'radial-gradient(circle,#7c3aed55,#000)', boxShadow: '0 0 30px #7c3aed88' }}>
            {def.icon}
          </div>
          <div>
            <div className="title text-2xl" style={{ color: RARITY_INFO[def.rarity].color }}>
              {def.name} {SHADOW_TIER_NAMES[s.tier]}
            </div>
            <div className="text-xs italic text-zinc-400">{def.description}</div>
            <div className="mt-1 flex gap-0.5">
              {Array.from({ length: MAX_SHADOW_TIER }, (_, i) => (
                <span key={i} className={`h-2 w-5 rounded-full ${i < s.tier ? 'bg-purple-500 shadow-[0_0_6px_#a855f7]' : 'bg-zinc-700'}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="panel-inner mt-4 p-3">
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-zinc-500">Бонусы</div>
          {Object.entries(bonuses).map(([k, v]) => (
            <div key={k} className="text-sm text-emerald-300">
              {formatStat(k as StatKey, v ?? 0)}
            </div>
          ))}
          <div className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Способность: {def.abilityName}</div>
          <div className="text-sm text-purple-300">{SHADOW_ABILITY_TEXT[def.ability](s.tier)}</div>
          {s.tier < MAX_SHADOW_TIER && (
            <div className="mt-1 text-xs text-zinc-500">На уровне {SHADOW_TIER_NAMES[s.tier + 1]}: {SHADOW_ABILITY_TEXT[def.ability](s.tier + 1)}</div>
          )}
        </div>

        <div className="mt-4 grid gap-2">
          <button
            className={equipped ? 'btn-dark' : 'btn-shadow'}
            onClick={() => {
              const err = mutate((d) => toggleEquipShadow(d, s.uid));
              if (err) {
                play('error');
                toast({ kind: 'error', title: err });
              } else play('magic');
            }}
          >
            {equipped ? 'Снять' : 'Экипировать'}
          </button>
          {s.tier < MAX_SHADOW_TIER && (
            <button
              className="btn-gold"
              disabled={!partner || state.currencies.shards < cost}
              onClick={() => {
                const r = mutate((d) => {
                  const res = mergeShadow(d, s.uid);
                  if (res) trackEvent(d, 'shadowMerge');
                  return res;
                });
                if (r) {
                  play('levelup');
                  toast({ kind: 'levelup', title: `${def.name} ${SHADOW_TIER_NAMES[r.tier]}!`, text: 'Тени слились воедино', icon: def.icon });
                  setSel(r.uid);
                }
              }}
            >
              Объединить → {SHADOW_TIER_NAMES[s.tier + 1]} · {cost} 🔮 {!partner && '(нужна такая же тень)'}
            </button>
          )}
          <button
            className="btn-dark !py-2 text-xs"
            onClick={() => {
              const v = mutate((d) => absorbShadow(d, s.uid));
              play('coin');
              toast({ kind: 'success', title: `Поглощено: +${v} 🔮`, icon: '🔮' });
              onDone();
            }}
          >
            Развеять · +{absorbValue(s)} 🔮
          </button>
        </div>
      </div>
    );
  }
}

function ShadowCard({ s, equipped, canMerge, onClick }: { s: ShadowInstance; equipped: boolean; canMerge: boolean; onClick: () => void }) {
  const def = SHADOWS[s.defId];
  const r = RARITY_INFO[def.rarity];
  return (
    <button onClick={onClick} className={`panel relative flex flex-col items-center p-3 text-center transition hover:-translate-y-1 ${equipped ? 'border-purple-500' : ''}`}>
      {equipped && <span className="absolute left-2 top-2 rounded bg-purple-600 px-1 text-[9px] font-black uppercase">надета</span>}
      {canMerge && <span className="anim-pulse-soft absolute right-2 top-2 rounded bg-amber-500 px-1 text-[9px] font-black uppercase text-black">слияние</span>}
      <div className="mt-2 text-5xl drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]">{def.icon}</div>
      <div className="mt-1 text-sm font-bold" style={{ color: r.color }}>
        {def.name}
      </div>
      <div className="title text-2xl text-purple-300">{SHADOW_TIER_NAMES[s.tier]}</div>
      <div className="text-[11px] text-zinc-500">{def.abilityName}</div>
    </button>
  );
}
