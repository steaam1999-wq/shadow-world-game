import { Shirt, Footprints, Hand, Columns2, UserRound } from "lucide-react";
import { Avatar } from "./Avatar";
import {
  equipmentSlots,
  slotNames,
  combatStats,
  type EquipmentSlot,
  type GearItem,
} from "./equipment";
import { equipGear, unequipGear, type GameState } from "./game";
import type { Dispatch, SetStateAction } from "react";
export function EquipmentPanel({
  game,
  setGame,
}: {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
}) {
  const locked = !!game.arena && !game.arena.finished;
  const stats = combatStats(game.loadout);
  const slotIcons = {
    head: UserRound,
    chest: Shirt,
    weapon: Hand,
    legs: Columns2,
    feet: Footprints,
  };
  const image = (item: GearItem) =>
    `${import.meta.env.BASE_URL}art/${game.appearance.face === "veteran" ? "painted-gear" : "gear-ink"}/${item.visualAssetId}.webp`;
  // React sees the new GameState -> Avatar receives a new equipment object -> layers update.
  const onEquip = (item: GearItem) =>
    setGame((current) => equipGear(current, item.id));
  const onUnequip = (slot: EquipmentSlot) =>
    setGame((current) => unequipGear(current, slot));
  return (
    <section className="equipment-manager">
      <h2 className="section-title">Экипировка</h2>
      <p className="screen-note">
        Атака {stats.attack} · Защита {stats.defense}.{" "}
        {locked
          ? "Смена вещей недоступна во время боя."
          : "Выбери предмет: внешний вид изменится сразу."}
      </p>
      <div className="equipment-preview">
        <Avatar
          equipment={game.loadout.equipment}
          appearance={game.appearance}
        />
      </div>
      <div className="equipped-list">
        {equipmentSlots.map((slot) => {
          const item = game.loadout.equipment[slot];
          const Icon = slotIcons[slot];
          return (
            <div className="equipped-row" key={slot}>
              <span className="equipped-thumb">
                {item ? <img src={image(item)} alt="" /> : <Icon size={20} />}
              </span>
              <span className="equipped-description">
                <small>{slotNames[slot]}</small>
                <b>{item?.name ?? "Не надето"}</b>
              </span>
              {item && (
                <button
                  className="compact-button"
                  aria-label={`Снять ${item.name}`}
                  disabled={locked}
                  onClick={() => onUnequip(slot)}
                >
                  Снять
                </button>
              )}
            </div>
          );
        })}
      </div>
      <h3 className="bag-heading">В сумке · {game.loadout.inventory.length}</h3>
      <div className="gear-grid">
        {game.loadout.inventory.map((item) => (
          <button
            className="gear-card"
            key={item.id}
            disabled={locked || game.level < item.minLevel}
            onClick={() => onEquip(item)}
          >
            <img className="gear-item-image" src={image(item)} alt="" />
            <b>{item.name}</b>
            <small className="gear-slot-label">
              {slotNames[item.slot]} · ур. {item.minLevel}
            </small>
            <span>
              +{item.stats.attack} атака · +{item.stats.defense} защита
            </span>
            <em>
              {game.level < item.minLevel
                ? "Нужен уровень " + item.minLevel
                : "Надеть"}
            </em>
          </button>
        ))}
      </div>
      {!game.loadout.inventory.length && (
        <p className="screen-note">
          Все вещи надеты. Сними предмет, чтобы вернуть его в сумку.
        </p>
      )}
    </section>
  );
}
