import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import {
  Lock,
  MapPin,
  X,
  ChevronRight,
  Check,
  Building2,
  Landmark,
  Factory,
  BriefcaseBusiness,
  House,
} from "lucide-react";
import { districts, npcs, type DistrictId, type NPC } from "./data";
import { Medallion, Portrait, CityArt } from "./Art";
import { travel, type GameState } from "./game";
import { progression } from "./progression";
import type { Page } from "./navigation";
export const districtPins: {
  id: DistrictId;
  x: number;
  y: number;
  icon: number;
}[] = [
  { id: "center", x: 64, y: 51, icon: 1 },
  { id: "kings", x: 74, y: 24, icon: 3 },
  { id: "old", x: 21, y: 43, icon: 8 },
  { id: "industrial", x: 23, y: 77, icon: 15 },
  { id: "west", x: 77, y: 77, icon: 19 },
];
const districtSymbols = {
  center: Building2,
  kings: House,
  old: Landmark,
  industrial: Factory,
  west: BriefcaseBusiness,
};
function DistrictSymbol({ id }: { id: DistrictId }) {
  const Icon = districtSymbols[id];
  return <Icon size={20} strokeWidth={1.5} aria-hidden="true" />;
}
export function MapScreen({
  game,
  setGame,
  go,
}: {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
  go: (p: Page) => void;
}) {
  const [selected, setSelected] = useState<DistrictId | null>(null);
  useEffect(() => {
    if (!selected) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selected]);
  const district = districts.find((d) => d.id === selected);
  const locked = selected && !game.unlocked.includes(selected);
  return (
    <section className="world-map" aria-label="Интерактивная карта Empire City">
      <p className="map-caption">
        EMPIRE CITY <span>Пять районов · один город</span>
      </p>
      {districtPins.map((pin) => {
        const d = districts.find((d) => d.id === pin.id)!;
        const closed = !game.unlocked.includes(pin.id);
        return (
          <button
            className={
              "district-pin " +
              (closed ? "pin-locked" : "") +
              (game.district === pin.id ? " pin-current" : "")
            }
            key={pin.id}
            style={{ left: pin.x + "%", top: pin.y + "%" }}
            onClick={() => setSelected(pin.id)}
            aria-label={"Район: " + d.ru}
            aria-current={game.district === pin.id ? "location" : undefined}
          >
            <span className="map-pin-symbol">
              <DistrictSymbol id={pin.id} />
            </span>
            <b>{d.ru}</b>
            <small>
              {closed ? (
                <>
                  <Lock size={10} /> Закрыт
                </>
              ) : game.district === pin.id ? (
                <>
                  <MapPin size={10} /> Вы здесь
                </>
              ) : (
                "−5 энергии"
              )}
            </small>
          </button>
        );
      })}
      <p className="map-footnote">
        <MapPin size={12} /> Нажми на район, чтобы узнать больше
      </p>
      {district && (
        <div className="map-info-backdrop" onClick={() => setSelected(null)}>
          <section
            className="map-info"
            role="dialog"
            aria-modal="true"
            aria-label={district.ru}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="map-info-close"
              aria-label="Закрыть район"
              onClick={() => setSelected(null)}
            >
              <X size={19} />
            </button>
            <span className="map-district-symbol">
              <DistrictSymbol id={district.id} />
            </span>
            <h2>{district.ru}</h2>
            <small>{district.faction}</small>
            <p>{district.description}</p>
            {locked ? (
              <p className="map-locked-hint">
                Откроется после завершения главы I.
              </p>
            ) : game.district === district.id ? (
              <button className="game-button" onClick={() => go("city")}>
                Войти в район
              </button>
            ) : (
              <button
                className="game-button"
                disabled={
                  game.energy < 5 || (!!game.arena && !game.arena.finished)
                }
                onClick={() => {
                  setGame((s) => travel(s, district.id));
                  go("city");
                }}
              >
                Отправиться · −5 энергии
              </button>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
export function CityHub({
  game,
  go,
  doRest,
  onNpc,
}: {
  game: GameState;
  go: (p: Page) => void;
  doRest: () => void;
  onNpc: (n: NPC) => void;
}) {
  const d = districts.find((d) => d.id === game.district)!;
  const actions: { label: string; icon: number; page: Page; sub: string }[] = [
    { label: "Поручения", icon: 5, page: "quests", sub: "Глава и 10 дел" },
    { label: "Арена", icon: 9, page: "arena", sub: "Городской ринг" },
    { label: "Жители", icon: 6, page: "contacts", sub: "16 историй" },
    { label: "Экипировка", icon: 12, page: "inventory", sub: "Твой комплект" },
    { label: "Семьи", icon: 3, page: "orgs", sub: "Влияние города" },
    { label: "Карта", icon: 0, page: "map", sub: "Пять районов" },
  ];
  return (
    <section className="city-hub" data-district={game.district}>
      <div className="hub-view">
        <CityArt variant={districts.findIndex((d) => d.id === game.district)} />
        <div className="hub-heading">
          <span className="hub-eyebrow">
            <MapPin size={12} /> EMPIRE CITY
          </span>
          <h2>{d.ru}</h2>
          <p>{d.description}</p>
          <small>{d.faction}</small>
        </div>
      </div>
      <div className="hub-grid">
        {actions.map((a) => (
          <button
            className="hub-action"
            key={a.page}
            onClick={() => go(a.page)}
          >
            <Medallion index={a.icon} />
            <b>{a.label}</b>
            <small>{a.sub}</small>
          </button>
        ))}
      </div>
      <aside className="hub-rail">
        <button onClick={doRest}>
          <Medallion index={8} />
          <span>Отдых</span>
        </button>
        <button onClick={() => go("progress")}>
          <Medallion index={10} />
          <span>Ранг</span>
        </button>
        <button onClick={() => go("settings")}>
          <Medallion index={18} />
          <span>Настройки</span>
        </button>
      </aside>
      <div className="hub-people">
        <h3>Люди района</h3>
        <div>
          {npcs
            .filter((n) => n.district === game.district)
            .map((n) => (
              <button key={n.id} onClick={() => onNpc(n)}>
                <span className="hub-person-portrait">
                  <Portrait look={n.look} />
                </span>
                <b>{n.name.split(" ")[0]}</b>
              </button>
            ))}
        </div>
        <button className="hub-all-people" onClick={() => go("contacts")}>
          Все жители <ChevronRight size={13} />
        </button>
      </div>
    </section>
  );
}
export function ProgressScreen({ game }: { game: GameState }) {
  const [tab, setTab] = useState<"rank" | "achievements">("rank");
  const p = progression(game);
  return (
    <section className="progress-screen">
      <div className="progress-tabs">
        <button
          className={tab === "rank" ? "active" : ""}
          onClick={() => setTab("rank")}
        >
          Ранг
        </button>
        <button
          className={tab === "achievements" ? "active" : ""}
          onClick={() => setTab("achievements")}
        >
          Достижения
        </button>
      </div>
      {tab === "rank" ? (
        <>
          <div className="rank-overview">
            <Medallion index={10} />
            <small>ТЕКУЩИЙ РАНГ</small>
            <h2>{p.rank.name}</h2>
            <p>
              {p.next ? "Следующий: " + p.next.name : "Высший ранг достигнут"}
            </p>
            <div className="rank-meter">
              <i style={{ width: p.progress + "%" }} />
            </div>
            <b>{p.progress}%</b>
            <small>
              {p.score}
              {p.next ? " / " + p.next.at : ""} очков влияния
            </small>
          </div>
          <div className="rank-facts">
            {[
              ["Опыт", game.xp],
              ["Репутация", game.reputation],
              ["Поручения выполнены", p.jobs + " / 10"],
              ["Победы на арене", game.arenaWins],
              ["Знакомые", p.friends + " / 16"],
              ["Открытые районы", game.unlocked.length + " / 5"],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>
          <p className="screen-note">
            Ранг отражает опыт, репутацию, завершённые поручения и победы. Это
            показатель влияния; скрытых боевых бонусов нет.
          </p>
        </>
      ) : (
        <>
          <p className="screen-note">
            Получено: {p.achievements.filter((a) => a.value >= a.target).length}{" "}
            / {p.achievements.length}
          </p>
          <div className="achievement-list">
            {p.achievements.map((a) => (
              <article
                key={a.id}
                className={a.value >= a.target ? "earned" : ""}
              >
                <Medallion index={a.icon} />
                <div>
                  <h3>{a.name}</h3>
                  <p>{a.description}</p>
                  <small>
                    {Math.min(a.value, a.target)} / {a.target}
                  </small>
                </div>
                {a.value >= a.target && <Check size={16} />}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
