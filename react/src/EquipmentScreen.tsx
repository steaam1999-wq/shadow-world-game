/**
 * Экран «Экипировка»: аватар со слотами + инвентарь.
 *
 * Связь «клик по предмету → внешний вид персонажа»:
 *   onClick(предмет)                                 — пользователь нажал вещь в сумке
 *     → E.equip(game, uid)                            — обёртка над equipItem (шаги a–e)
 *     → setGame(result.state)                         — новое состояние игры (новый объект loadout)
 *     → React перерисовывает <Avatar equipment={...}> — слой этого слота меняется,
 *                                                       старая вещь возвращается в список сумки
 *   onEquipmentChange (шаг e) дополнительно подсвечивает сменившийся слой на аватаре.
 */
import { useState } from "react";
import { HardHat, Glasses, Gem, Shirt, Shield, PersonStanding, Footprints, Swords, Coins, type LucideIcon } from "lucide-react";
import { Avatar } from "./avatar/Avatar";
import { SectionTitle } from "./ui";
import { SLOT_IDS, SLOT_NAMES, RARITY_NAMES, defOf, itemDef, equipmentStats, type SlotId, type ItemDef } from "./equipment";
import * as E from "./economy";
import type { GameState } from "./game";

export const SLOT_ICON: Record<SlotId, LucideIcon> = {
  head: HardHat, face: Glasses, neck: Gem, chest: Shirt, outer: Shield, legs: PersonStanding, feet: Footprints, weapon: Swords,
};
export const LEFT_SLOTS: SlotId[] = ["head", "face", "neck", "chest"];
export const RIGHT_SLOTS: SlotId[] = ["weapon", "outer", "legs", "feet"];

export const statLine = (d: ItemDef) =>
  [d.stats.atk && `атака +${d.stats.atk}`, d.stats.def && `броня +${d.stats.def}`, d.stats.agi && `ловкость +${d.stats.agi}`, d.stats.int && `интуиция +${d.stats.int}`, d.stats.auth && `авторитет +${d.stats.auth}`]
    .filter(Boolean).join(" · ");

/** Кнопка слота: надетая вещь (клик — снять) или пустой слот (клик — показать подходящие вещи). */
export function SlotButton({ game, slot, onClick, active, compact }: { game: GameState; slot: SlotId; onClick: () => void; active?: boolean; compact?: boolean }) {
  const d = defOf(game.eco.loadout.equipment[slot]);
  const Icon = SLOT_ICON[slot];
  return (
    <button className={"gear-slot" + (compact ? " compact" : "") + (d ? " filled rarity-" + d.rarity : "") + (active ? " active" : "")} onClick={onClick}
      title={d ? `${d.name} — нажми, чтобы снять` : `${SLOT_NAMES[slot]}: пусто`} aria-label={d ? `${SLOT_NAMES[slot]}: ${d.name}` : `${SLOT_NAMES[slot]}: пусто`}>
      <Icon size={20} />
      {!compact && <small>{d ? d.name : SLOT_NAMES[slot]}</small>}
    </button>
  );
}

export function EquipmentScreen({ game, setGame, setToast }: { game: GameState; setGame: (s: GameState) => void; setToast: (t: string) => void }) {
  const [filter, setFilter] = useState<SlotId | "all">("all");
  const lo = game.eco.loadout;
  const bonus = equipmentStats(lo.equipment);

  /** Применить результат экономики: новое состояние → React перерисует аватар и списки. */
  const apply = (r: E.Result<GameState>) => {
    if (r.ok) setGame(r.state);
    setToast(r.message);
  };
  // клик по вещи в сумке → надеть её (старая вещь из этого слота вернётся в сумку)
  const onItemClick = (uid: string) => apply(E.equip(game, uid));
  // клик по занятому слоту → снять; по пустому → показать вещи для этого слота
  const onSlotClick = (slot: SlotId) => (lo.equipment[slot] ? apply(E.unequip(game, slot)) : setFilter(slot));

  const bag = lo.items.filter((i) => filter === "all" || itemDef(i.defId)?.slot === filter);
  return (
    <>
      <section className="gear-stage metal-frame">
        <div className="gear-rail">{LEFT_SLOTS.map((s) => <SlotButton key={s} game={game} slot={s} active={filter === s} onClick={() => onSlotClick(s)} />)}</div>
        <div className="gear-avatar"><Avatar equipment={lo.equipment} /></div>
        <div className="gear-rail">{RIGHT_SLOTS.map((s) => <SlotButton key={s} game={game} slot={s} active={filter === s} onClick={() => onSlotClick(s)} />)}</div>
      </section>
      <div className="gear-bonus">
        <span>Атака +{bonus.atk}</span><span>Броня +{bonus.def}</span><span>Ловкость +{bonus.agi}</span><span>Интуиция +{bonus.int}</span><span>Авторитет +{bonus.auth}</span>
      </div>
      <SectionTitle>Сумка · {lo.items.length}</SectionTitle>
      <div className="gear-tabs">
        <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>Все</button>
        {SLOT_IDS.map((s) => { const I = SLOT_ICON[s]; return <button key={s} className={filter === s ? "on" : ""} onClick={() => setFilter(s)} title={SLOT_NAMES[s]}><I size={15} /></button>; })}
      </div>
      {bag.length === 0 && <p className="screen-note">{filter === "all" ? "Сумка пуста. Загляни к барыге." : `Нет вещей для слота «${SLOT_NAMES[filter]}». Загляни к барыге.`}</p>}
      <div className="gear-list">
        {bag.map((inst) => {
          const d = itemDef(inst.defId)!;
          const Icon = SLOT_ICON[d.slot];
          const cur = defOf(lo.equipment[d.slot]);
          const locked = game.level < d.lvl;
          return (
            <div key={inst.uid} className={"gear-item rarity-" + d.rarity + (locked ? " locked" : "")}>
              <span className="round-control icon-medal"><Icon size={18} /></span>
              <span className="gear-text">
                <b>{d.name}</b>
                <small>{SLOT_NAMES[d.slot]} · {RARITY_NAMES[d.rarity]} · {statLine(d)}</small>
                {cur && <small className="muted">Сейчас: {cur.name}</small>}
              </span>
              <span className="row-buttons">
                <button className="game-button small" disabled={locked} onClick={() => onItemClick(inst.uid)}>{locked ? `${d.lvl} ур.` : "Надеть"}</button>
                <button className="game-button small secondary" onClick={() => apply(E.sellItem(game, inst.uid))} title={`Продать за $${Math.floor(d.price / 2)}`}><Coins size={13} /></button>
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
