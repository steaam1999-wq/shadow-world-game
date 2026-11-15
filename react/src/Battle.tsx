/** Экран пошагового боя: полоски здоровья и адреналина, эффекты, лог, панель приёмов. */
import { useEffect, useRef } from "react";
import { Swords, HeartPulse, Footprints, Crosshair, Wind, Syringe, Zap, Droplet, Skull, Ban, Flame, Shield, LogOut, type LucideIcon } from "lucide-react";
import { PlayerPortrait } from "./Art";
import { IconMedal } from "./ui";
import { skills, canUse, type Battle, type Combatant, type SkillId, type EffectKind } from "./combat";

const skillIcon: Record<SkillId, LucideIcon> = {
  strike: Swords, smash: Flame, trip: Footprints, knife: Droplet, aimed: Crosshair, smoke: Wind, venom: Skull, adrenaline: Syringe, bandage: HeartPulse,
};
const effectName: Record<EffectKind, string> = { bleed: "Кровотечение", poison: "Яд", stun: "Оглушён", rage: "Стимулятор", focus: "Фокус", guard: "Дым" };
const effectIcon: Record<EffectKind, LucideIcon> = { bleed: Droplet, poison: Skull, stun: Ban, rage: Syringe, focus: Zap, guard: Wind };

function Fighter({ c, portrait, side }: { c: Combatant; portrait: React.ReactNode; side: "left" | "right" }) {
  return (
    <div className={"battle-fighter " + side}>
      <div className="battle-portrait">{portrait}</div>
      <b>{c.name}</b>
      <div className="battle-bar hp"><i style={{ width: (c.hp / c.maxHp) * 100 + "%" }} /><span>{c.hp} / {c.maxHp}</span></div>
      <div className="battle-bar ap"><i style={{ width: (c.ap / c.maxAp) * 100 + "%" }} /><span>адреналин {c.ap}</span></div>
      <div className="battle-effects">
        {c.effects.map((e) => {
          const I = effectIcon[e.kind];
          return <span key={e.kind} title={effectName[e.kind]}><I size={12} /> {effectName[e.kind]}{e.kind !== "stun" ? ` · ${e.turns}` : ""}</span>;
        })}
      </div>
    </div>
  );
}

export function BattleView({
  battle, enemyIcon = Swords, result, onSkill, onFlee, onClose,
}: {
  battle: Battle;
  enemyIcon?: LucideIcon;
  result: string | null;
  onSkill: (id: SkillId) => void;
  onFlee: () => void;
  onClose: () => void;
}) {
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [battle.log.length]);
  const p = battle.player;
  return (
    <div className="modal-backdrop battle-backdrop">
      <section className="game-dialog metal-frame battle" role="dialog" aria-modal="true" aria-label="Бой">
        <h2 className="dialog-title">{battle.over ? (battle.winner === "player" ? "Победа" : "Поражение") : `Бой · ход ${battle.turn + 1}`}</h2>
        <div className="battle-sides">
          <Fighter c={p} side="left" portrait={<PlayerPortrait />} />
          <span className="battle-vs">VS</span>
          <Fighter c={battle.enemy} side="right" portrait={<IconMedal icon={enemyIcon} />} />
        </div>
        <div className="battle-log" ref={log} aria-live="polite">
          {battle.log.slice(-40).map((l, i) => <div key={i} className={l.startsWith("—") ? "turn" : l.startsWith("Крит") ? "crit" : ""}>{l}</div>)}
        </div>
        {battle.over ? (
          <>
            {result && <p className={battle.winner === "player" ? "good-text" : "danger-text"}><b>{result}</b></p>}
            <button className="game-button" onClick={onClose}>Закрыть</button>
          </>
        ) : (
          <>
            <div className="battle-skills">
              {p.skills.map((id) => {
                const sk = skills[id], I = skillIcon[id], cd = p.cooldowns[id] ?? 0;
                return (
                  <button key={id} className="battle-skill" disabled={!canUse(p, id)} onClick={() => onSkill(id)} title={sk.text}>
                    <I size={18} />
                    <b>{sk.name}</b>
                    <small>{cd ? `перезарядка ${cd}` : sk.cost ? `адреналин ${sk.cost}` : "бесплатно"}</small>
                  </button>
                );
              })}
            </div>
            <button className="game-button secondary small battle-flee" onClick={onFlee}><LogOut size={14} /> Уйти из боя</button>
            <p className="small-note"><Shield size={11} /> Броня поглощает {Math.round((p.armor / (p.armor + 100)) * 100)}% урона</p>
          </>
        )}
      </section>
    </div>
  );
}
