import { useState } from "react";
import {
  Heart,
  Zap,
  Shield,
  MapPin,
  ChevronRight,
  ChevronDown,
  Shirt,
  UserRound,
  Footprints,
  Hand,
  Columns2,
  Coffee,
  Pencil,
  Star,
  Users,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { Medallion } from "./Art";
import { profileBackdrop } from "./profileArt";
import { districts, npcs } from "./data";
import { scenes, hasMet, type GameState } from "./game";
import { combatStats, slotNames, type EquipmentSlot } from "./equipment";
import type { Page } from "./navigation";
const slotLabels: Record<EquipmentSlot, string> = {
  head: "Голова",
  chest: "Верх",
  legs: "Брюки",
  feet: "Обувь",
  weapon: "Руки",
};
const slotIcons = {
  head: UserRound,
  chest: Shirt,
  legs: Columns2,
  feet: Footprints,
  weapon: Hand,
};
export function ProfileScreen({
  game,
  go,
  onRest,
  onEdit,
}: {
  game: GameState;
  go: (p: Page) => void;
  onRest: () => void;
  onEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const district = districts.find((d) => d.id === game.district)!;
  const stats = combatStats(game.loadout);
  const known = npcs.filter((n) => hasMet(game, n.id)).length;
  const complete = game.stage === "complete";
  const blocked = !!game.arena && !game.arena.finished;
  const slot = (id: EquipmentSlot) => {
    const item = game.loadout.equipment[id],
      Icon = slotIcons[id];
    return (
      <button
        key={id}
        className={`profile-slot ${item ? "has-item" : ""}`}
        aria-label={`${slotNames[id]}: ${item?.name ?? "не надето"}`}
        title={item?.name ?? slotNames[id]}
        onClick={() => go("inventory")}
      >
        {item ? (
          <img
            src={`${import.meta.env.BASE_URL}art/${game.appearance.face === "veteran" ? "painted-gear" : "gear-ink"}/${item.visualAssetId}.webp`}
            alt=""
          />
        ) : (
          <Icon size={19} />
        )}
        <small>{slotLabels[id]}</small>
      </button>
    );
  };
  const vitals = [
    { label: "Атака", value: stats.attack, Icon: Zap, tone: "attack" },
    { label: "Защита", value: stats.defense, Icon: Shield, tone: "defense" },
    { label: "Здоровье", value: game.health, Icon: Heart, tone: "health" },
    { label: "Энергия", value: game.energy, Icon: Zap, tone: "energy" },
  ];
  return (
    <section className="player-profile" aria-label="Профиль персонажа">
      <h1 className="sr-only">Профиль</h1>
      <section
        className="profile-portrait-card"
        aria-label="Образ и экипировка"
      >
        <header className="profile-card-header">
          <span>Образ персонажа</span>
          <button aria-label="Изменить образ" onClick={onEdit}>
            <Pencil size={13} />
            Изменить образ
          </button>
        </header>
        <div
          className="profile-figure"
          data-backdrop={game.appearance.backdrop}
          style={{
            backgroundImage: `url(${profileBackdrop(game.appearance, game.district)})`,
          }}
        >
          <div className="profile-rail">
            {slot("head")}
            {slot("chest")}
            {slot("legs")}
          </div>
          <div className="profile-avatar">
            <Avatar
              equipment={game.loadout.equipment}
              appearance={game.appearance}
            />
          </div>
          <div className="profile-rail">
            {slot("feet")}
            {slot("weapon")}
            <button
              className="profile-slot"
              aria-label="Отдохнуть"
              onClick={onRest}
              disabled={blocked}
            >
              <Coffee size={20} />
              <small>Отдых</small>
            </button>
          </div>
        </div>
        <button className="profile-location" onClick={() => go("city")}>
          <MapPin size={14} />
          <span>{district.ru}</span>
          <small>Войти в район</small>
          <ChevronRight size={15} />
        </button>
      </section>
      <dl className="profile-vitals" aria-label="Основные характеристики">
        {vitals.map(({ label, value, Icon, tone }) => (
          <div key={tone} className={`profile-vital vital-${tone}`}>
            <dt>
              <Icon size={12} />
              {label}
            </dt>
            <dd>
              {value}
              {["health", "energy"].includes(tone) && <small>/ 100</small>}
            </dd>
          </div>
        ))}
      </dl>
      <button className="profile-mission" onClick={() => go("quests")}>
        <Medallion index={5} />
        <span>
          <small>{complete ? "ПРОЙДЕНО" : "ТЕКУЩАЯ ИСТОРИЯ"}</small>
          <b>{complete ? "Глава I завершена" : "Цена власти · Глава I"}</b>
          <em>{complete ? "Посмотреть итоги" : scenes[game.stage].title}</em>
        </span>
        <ChevronRight size={17} />
      </button>
      <section className="profile-details">
        <button
          className="profile-details-toggle"
          aria-expanded={expanded}
          aria-controls="profile-details-body"
          onClick={() => setExpanded(!expanded)}
        >
          <span>Характеристики</span>
          <ChevronDown
            size={16}
            style={{ transform: expanded ? "none" : "rotate(-90deg)" }}
          />
        </button>
        {expanded && (
          <dl id="profile-details-body" className="profile-facts">
            <div>
              <dt>Наличные</dt>
              <dd>${game.money}</dd>
            </div>
            <div>
              <dt>Репутация</dt>
              <dd>
                <Star size={12} />
                {game.reputation}
              </dd>
            </div>
            <div>
              <dt>Уровень</dt>
              <dd>
                {game.level}
                <small>{game.xp} опыта</small>
              </dd>
            </div>
            <div>
              <dt>Знакомые</dt>
              <dd>
                <Users size={12} />
                {known}
                <small>/ 16</small>
              </dd>
            </div>
          </dl>
        )}
      </section>
      <div className="profile-links">
        <button onClick={() => go("contacts")}>
          <Medallion index={6} />
          <span>Жители города</span>
          <ChevronRight size={14} />
        </button>
        <button onClick={() => go("progress")}>
          <Medallion index={10} />
          <span>Ранг и достижения</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </section>
  );
}
