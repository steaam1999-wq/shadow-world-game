import { ProfileScreen } from "./ProfileScreen";
import { PageArt } from "./SceneArt";
import { MapScreen, CityHub, ProgressScreen } from "./WorldScreens";
import { storyItemCatalog } from "./items";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Heart,
  Zap,
  Wallet,
  Star,
  Settings,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Check,
  Users,
  Download,
  Upload,
  RotateCcw,
  Shield,
  Search,
  Crown,
} from "lucide-react";
import { Portrait, Medallion } from "./Art";
import {
  districts,
  npcs,
  chapters,
  greetings,
  relationLabel,
  type NPC,
  type DistrictId,
} from "./data";
import {
  scenes,
  choose,
  travel,
  rest,
  meet,
  hasMet,
  newGame,
  parseSave,
  type ItemId,
} from "./game";
import { AppearanceEditor } from "./AppearanceEditor";
import { EquipmentPanel } from "./EquipmentPanel";
import { JobsPanel, ArenaPanel } from "./ActivitiesPanel";
import { readPage, pageNames, type Page } from "./navigation";
import { useGame } from "./useGame";
const itemData = storyItemCatalog;
const menuItems: { page: Page; icon: number; label: string }[] = [
  { page: "profile", icon: 2, label: "Профиль" },
  { page: "map", icon: 0, label: "Карта" },
  { page: "city", icon: 1, label: "Город" },
  { page: "quests", icon: 5, label: "Задания" },
  { page: "contacts", icon: 6, label: "Жители" },
  { page: "orgs", icon: 3, label: "Организации" },
  { page: "inventory", icon: 4, label: "Вещи" },
  { page: "settings", icon: 8, label: "Настройки" },
  { page: "arena", icon: 9, label: "Арена" },
  { page: "progress", icon: 10, label: "Ранги и достижения" },
];
const bottomItems = [
  ["map", 0, "Карта"],
  ["city", 1, "Город"],
  ["profile", 2, "Профиль"],
  ["arena", 9, "Арена"],
  ["inventory", 4, "Вещи"],
] as const;
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="section-title">
      <span>{children}</span>
    </h2>
  );
}
function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),a[href]",
        );
        if (nodes?.length) {
          const first = nodes[0],
            last = nodes[nodes.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={ref}
        className="game-dialog metal-frame"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="dialog-close round-control"
          onClick={onClose}
          aria-label="Закрыть окно"
        >
          <X size={18} />
        </button>
        <h2 className="dialog-title">{title}</h2>
        <div className="dialog-body">{children}</div>
      </section>
    </div>
  );
}
export default function App() {
  const { game, setGame, error, toast, setToast, replaceGame } = useGame();
  const [page, setPage] = useState<Page>(() => readPage(window.location.hash));
  const [menu, setMenu] = useState(false);
  const [npc, setNpc] = useState<NPC | null>(null);
  const [item, setItem] = useState<ItemId | null>(null);
  const [reset, setReset] = useState(false);
  const [editingAppearance, setEditingAppearance] = useState(false);
  const [filter, setFilter] = useState("Все");
  const [search, setSearch] = useState("");
  const screen = useRef<HTMLElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const go = (next: Page) => {
    setMenu(false);
    setNpc(null);
    setItem(null);
    if (readPage(window.location.hash) === next) {
      setPage(next);
      screen.current?.scrollTo({ top: 0 });
    } else window.location.hash = next;
  };
  useEffect(() => {
    const change = () => {
      setPage(readPage(window.location.hash));
      setMenu(false);
      setNpc(null);
      setItem(null);
      setReset(false);
      setEditingAppearance(false);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    screen.current?.scrollTo({ top: 0 });
  }, [page]);
  useEffect(() => {
    if (page === "quests") screen.current?.scrollTo({ top: 0 });
  }, [game.stage, page]);
  const district = districts.find((d) => d.id === game.district)!;
  const scene = scenes[game.stage];
  const speaker = npcs.find((n) => n.id === scene.speaker)!;
  const complete = game.stage === "complete";
  const known = npcs.filter((n) => hasMet(game, n.id)).length;
  const move = (id: DistrictId) => {
    const next = travel(game, id);
    setGame(next);
    if (next !== game)
      setToast("Вы прибыли: " + districts.find((d) => d.id === id)!.ru);
    else if (game.energy < 5)
      setToast("Нужно 5 энергии. Восстановите силы в профиле.");
  };
  const doRest = () => {
    if (game.arena && !game.arena.finished) {
      setToast("Сначала завершите спарринг.");
      return;
    }
    setGame((s) => rest(s));
    setToast("Отдых завершён. Здоровье и энергия восстановлены.");
  };
  const residents = npcs.filter(
    (n) =>
      (filter === "Все" ||
        (filter === "Знакомые" ? hasMet(game, n.id) : n.org === filter)) &&
      `${n.name} ${n.role}`
        .toLocaleLowerCase("ru")
        .includes(search.toLocaleLowerCase("ru")),
  );
  const npcCard = (n: NPC) => (
    <button className="resident-card" key={n.id} onClick={() => setNpc(n)}>
      <div className="resident-art">
        <Portrait look={n.look} />
        {hasMet(game, n.id) && (
          <span className="known-mark">
            <Check size={12} />
          </span>
        )}
        <span className="faction-label">{n.org}</span>
      </div>
      <h3>{n.name}</h3>
      <small>{n.role}</small>
      <div className="relation-line">
        <span>{relationLabel(game.relations[n.id])}</span>
        <b>{game.relations[n.id]}</b>
      </div>
      <div className="progress-meter">
        <i style={{ width: game.relations[n.id] + "%" }} />
      </div>
    </button>
  );
  return (
    <div className="game-shell" data-page={page}>
      <header className="game-header">
        <div className="resource-bar metal-frame">
          <span className="resource health">
            <Heart size={14} fill="currentColor" />
            <b>{game.health}</b>
          </span>
          <span className="resource energy">
            <Zap size={14} fill="currentColor" />
            <b>{game.energy}</b>
          </span>
          <span className="resource money">
            <Wallet size={14} />
            <b>${game.money}</b>
          </span>
          <span className="resource reputation">
            <Star size={14} fill="currentColor" />
            {game.reputation}
          </span>
          <button
            className="round-control small-control"
            aria-label="Настройки"
            onClick={() => go("settings")}
          >
            <Settings size={20} />
          </button>
        </div>
        <div className="name-bar">
          <button
            className="round-control"
            onClick={() => setMenu(true)}
            aria-label="Открыть меню"
          >
            <Menu size={18} />
          </button>
          <button className="player-name" onClick={() => go("profile")}>
            {game.name}
            <span> · {game.level} ур.</span>
          </button>
          <button
            className="round-control quest-control"
            onClick={() => go("quests")}
            aria-label="Открыть задания"
          >
            <Medallion faceId={game.appearance.face} index={5} />
            {!complete && <i />}
          </button>
        </div>
        <button
          className="experience-row"
          onClick={() => go("profile")}
          aria-label={`Опыт: ${game.xp % 100} из 100`}
        >
          <span>
            <Shield size={12} /> Независимый ·{" "}
            {game.reputation < 10 ? "Новичок" : "На слуху"}
          </span>
          <span>
            Опыт <b>★ {game.xp % 100}</b> / 100
          </span>
          <i style={{ width: (game.xp % 100) + "%" }} />
        </button>
      </header>
      <main
        className={"screen-scroll screen-" + page}
        ref={screen}
        aria-label={pageNames[page]}
      >
        {game.arena && !game.arena.finished && page !== "arena" && (
          <button className="active-fight-banner" onClick={() => go("arena")}>
            Идёт спарринг · вернуться на арену
          </button>
        )}
        {error && (
          <div role="alert" className="save-error">
            {error}
            <button onClick={() => go("settings")}>Настройки сохранения</button>
          </div>
        )}
        {page !== "profile" && (
          <div className="screen-title metal-frame">
            <button
              className="back-button"
              onClick={() => go("profile")}
              aria-label="В профиль"
            >
              <ChevronLeft size={21} />
            </button>
            <h1>{pageNames[page]}</h1>
            <span className="title-diamond">●</span>
          </div>
        )}
        <PageArt page={page} />
        {page === "profile" && (
          <ProfileScreen
            game={game}
            go={go}
            onRest={doRest}
            onEdit={() => setEditingAppearance(true)}
          />
        )}
        {page === "map" && <MapScreen game={game} setGame={setGame} go={go} />}
        {page === "city" && (
          <CityHub game={game} go={go} doRest={doRest} onNpc={setNpc} />
        )}
        {page === "progress" && <ProgressScreen game={game} />}
        {page === "quests" && (
          <>
            <section className="story game-panel">
              <div className="dialogue-speaker">
                <div className="speaker-portrait">
                  <Portrait look={speaker.look} />
                </div>
                <div>
                  <small>{speaker.role}</small>
                  <h2>{speaker.name}</h2>
                  <span>{complete ? "Глава завершена" : "Разговор"}</span>
                </div>
              </div>
              <div className="scene-copy">
                <h3>{scene.title}</h3>
                <p>{scene.text}</p>
              </div>
              {scene.district && game.district !== scene.district ? (
                <div className="travel-call">
                  <MapPin size={18} />
                  <p>
                    Нужно прибыть в район:{" "}
                    <b>{districts.find((d) => d.id === scene.district)!.ru}</b>.
                  </p>
                  <button
                    className="game-button"
                    disabled={
                      game.energy < 5 || (!!game.arena && !game.arena.finished)
                    }
                    onClick={() => move(scene.district!)}
                  >
                    Отправиться · −5 энергии
                  </button>
                </div>
              ) : (
                <div className="dialogue-choices">
                  {scene.choices.map((c) => (
                    <button
                      className="choice-button"
                      key={c.id}
                      disabled={
                        game.energy + (c.effect.energy ?? 0) < 0 ||
                        (!!game.arena && !game.arena.finished)
                      }
                      onClick={() => setGame((s) => choose(s, c.id))}
                    >
                      <span>
                        <b>{c.label}</b>
                        <small>{c.hint}</small>
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              )}
              {complete && (
                <div className="chapter-complete">
                  <Crown size={30} />
                  <h3>Первый шаг сделан</h3>
                  <p>Город запомнил твои решения.</p>
                  <button className="game-button" onClick={() => go("profile")}>
                    К персонажу
                  </button>
                </div>
              )}
              {game.energy < 20 && (
                <button className="text-link" onClick={doRest}>
                  Восстановить энергию бесплатно
                </button>
              )}
            </section>
            <JobsPanel game={game} setGame={setGame} />
            <SectionTitle>Кампания</SectionTitle>
            <div className="campaign-list">
              {chapters.map((c, i) => (
                <div key={c}>
                  <span>
                    {i === 0 && complete ? <Check size={15} /> : i + 1}
                  </span>
                  <b>{c}</b>
                  <small>
                    {i === 0
                      ? complete
                        ? "Завершена"
                        : "Доступна"
                      : "В разработке"}
                  </small>
                </div>
              ))}
            </div>
          </>
        )}
        {page === "arena" && <ArenaPanel game={game} setGame={setGame} />}
        {page === "contacts" && (
          <>
            <div className="gallery-tools">
              <label className="search-field">
                <Search size={15} />
                <input
                  aria-label="Найти жителя"
                  placeholder="Имя или роль"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <div className="resident-filters">
                {[
                  "Все",
                  "Знакомые",
                  "Харриган",
                  "Морено",
                  "Беллини",
                  "Полиция",
                  "Независимые",
                ].map((f) => (
                  <button
                    aria-pressed={f === filter}
                    className={filter === f ? "active" : ""}
                    key={f}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <p className="screen-note">16 жителей города · {known} знакомых</p>
            <div className="residents-grid">{residents.map(npcCard)}</div>
            {!residents.length && (
              <p className="empty-state">
                Никого не найдено. Измени поиск или познакомься с жителями.
              </p>
            )}
          </>
        )}
        {page === "orgs" && (
          <>
            {["Харриган", "Морено", "Беллини", "Полиция"].map((org, i) => (
              <section
                key={org}
                className="organization game-panel"
                data-org={i}
              >
                <div className="organization-cover">
                  <img
                    src={`${import.meta.env.BASE_URL}art/districts/${["kings", "west", "old", "center"][i]}.webp`}
                    alt=""
                    loading="lazy"
                  />
                </div>
                <div className="organization-heading">
                  <Medallion
                    faceId={game.appearance.face}
                    index={[3, 13, 10, 14][i]}
                  />
                  <div>
                    <small>{i === 3 ? "ЗАКОН И ПОРЯДОК" : "СЕМЬЯ"}</small>
                    <h2>{org}</h2>
                  </div>
                </div>
                <p>
                  {
                    [
                      "Традиции и влияние в Кингс-дистрикте.",
                      "Новые деньги и предприятия Вест-сайда.",
                      "Старый город хранит каждое обещание.",
                      "Порядок на улицах и неудобные вопросы.",
                    ][i]
                  }
                </p>
                {npcs
                  .filter((n) => n.org === org)
                  .map((n) => (
                    <button
                      className="member-row"
                      key={n.id}
                      onClick={() => setNpc(n)}
                    >
                      <span className="mini-portrait">
                        <Portrait look={n.look} />
                      </span>
                      <span>
                        {n.name}
                        <small>{n.role}</small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ))}
                <div className="development">
                  {i === 3
                    ? "Следующие расследования — в разработке"
                    : "Вступление и союзы — в разработке"}
                </div>
              </section>
            ))}
          </>
        )}
        {page === "inventory" && (
          <>
            <p className="screen-note">
              Личные вещи · {game.inventory.length} предмета
            </p>
            <EquipmentPanel game={game} setGame={setGame} />
            <h2 className="section-title">Личные и сюжетные вещи</h2>
            <div className="inventory-grid">
              {game.inventory.map((id) => (
                <button
                  className="inventory-card"
                  key={id}
                  onClick={() => setItem(id)}
                >
                  <Medallion
                    faceId={game.appearance.face}
                    index={itemData[id].icon}
                  />
                  <b>{itemData[id].name}</b>
                  <small>
                    {id === "envelope" ? "Сюжетный предмет" : "Личная вещь"}
                  </small>
                </button>
              ))}
            </div>
            <div className="development">
              Одежда надевается через карточку в сумке. Сюжетные предметы
              используются через задания.
            </div>
          </>
        )}
        {page === "settings" && (
          <div className="settings-body">
            <section className="game-panel">
              <SectionTitle>Персонаж</SectionTitle>
              <label className="setting-label">
                Имя
                <input
                  maxLength={40}
                  value={game.name}
                  onChange={(e) =>
                    setGame((s) => ({ ...s, name: e.target.value }))
                  }
                  onBlur={() =>
                    setGame((s) => ({
                      ...s,
                      name: s.name.trim() || "Новый житель",
                    }))
                  }
                />
              </label>
              <p className="small-note">Имя сохраняется автоматически.</p>
            </section>
            <section className="game-panel">
              <SectionTitle>Сохранение</SectionTitle>
              <p className="small-note">
                {error
                  ? "Есть ошибка сохранения."
                  : "Прогресс сохраняется в этом браузере."}{" "}
                Для переноса на другой телефон скачай копию.
              </p>
              <button
                className="game-button secondary"
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob([JSON.stringify(game, null, 2)], {
                      type: "application/json",
                    }),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "empire-city-save.json";
                  document.body.append(a);
                  a.click();
                  a.remove();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                <Download size={15} /> Скачать прогресс
              </button>
              <button
                className="game-button secondary"
                onClick={() => fileInput.current?.click()}
              >
                <Upload size={15} /> Загрузить прогресс
              </button>
              <input
                ref={fileInput}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    if (file.size > 1000000) throw Error();
                    const imported = parseSave(await file.text());
                    if (!imported) throw Error();
                    if (
                      window.confirm(
                        "Заменить текущий прогресс сохранением из файла?",
                      )
                    ) {
                      replaceGame(imported);
                      setToast("Прогресс загружен");
                    }
                  } catch {
                    setToast("Файл сохранения повреждён или несовместим.");
                  }
                  e.target.value = "";
                }}
              />
              <button
                className="game-button danger"
                onClick={() => setReset(true)}
              >
                <RotateCcw size={15} /> Новая игра
              </button>
            </section>
            <details className="decision-history game-panel">
              <summary>
                История решений <span>{game.decisions.length}</span>
              </summary>
              {game.decisions.length ? (
                game.decisions.map((d, i) => (
                  <p key={d.id}>
                    <b>{i + 1}.</b> {d.text}
                  </p>
                ))
              ) : (
                <p>Первое решение ещё впереди.</p>
              )}
            </details>
            <p className="version-note">
              EMPIRE CITY 0.3 · «Живой город»
              <br />
              Главы II–V, карьера, союзы и онлайн — в разработке.
            </p>
          </div>
        )}
      </main>
      <nav className="bottom-nav metal-frame" aria-label="Главное игровое меню">
        {bottomItems.map(([id, icon, label]) => (
          <button
            key={id}
            aria-label={label}
            className={page === id ? "active" : ""}
            aria-current={page === id ? "page" : undefined}
            onClick={() => go(id)}
          >
            <span className="nav-medallion">
              <Medallion faceId={game.appearance.face} index={icon} />
              {id === "profile" && <small>{game.level} ур.</small>}
            </span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {menu && (
        <Dialog title="Empire City" onClose={() => setMenu(false)}>
          <div className="game-menu">
            {menuItems.map((m) => (
              <button key={m.page} onClick={() => go(m.page)}>
                <Medallion faceId={game.appearance.face} index={m.icon} />
                <span>{m.label}</span>
              </button>
            ))}
          </div>
          <p className="version-note">Одиночная RPG · Версия 0.3</p>
        </Dialog>
      )}
      {editingAppearance && (
        <Dialog title="Твой образ" onClose={() => setEditingAppearance(false)}>
          <AppearanceEditor
            game={game}
            setGame={setGame}
            onClose={() => setEditingAppearance(false)}
          />
        </Dialog>
      )}
      {npc && (
        <Dialog title={npc.name} onClose={() => setNpc(null)}>
          <div className="npc-profile">
            <div className="npc-large-portrait">
              <Portrait look={npc.look} />
            </div>
            <span className="npc-meta">
              {npc.org} · {npc.age} лет
            </span>
            <h3>{npc.role}</h3>
            <p className="npc-place">
              <MapPin size={13} />
              {districts.find((d) => d.id === npc.district)!.ru}
            </p>
            <p>{npc.bio}</p>
            <p className="personality">
              <b>Характер:</b> {npc.personality}
            </p>
            <div className="relationship-meter">
              <span>{relationLabel(game.relations[npc.id])}</span>
              <b>{game.relations[npc.id]} / 100</b>
            </div>
            <div className="progress-meter">
              <i style={{ width: game.relations[npc.id] + "%" }} />
            </div>
            {hasMet(game, npc.id) ? (
              <blockquote>{greetings[npc.id]}</blockquote>
            ) : npc.district === game.district ? (
              <>
                <button
                  className="game-button"
                  disabled={
                    game.energy < 5 || (!!game.arena && !game.arena.finished)
                  }
                  onClick={() => {
                    setGame((s) => meet(s, npc.id));
                    setToast("Знакомство состоялось · +3 отношения · +5 опыта");
                  }}
                >
                  Представиться
                </button>
                <p className="small-note">
                  −5 энергии · +3 отношения · +5 опыта
                </p>
              </>
            ) : (
              <button
                className="game-button secondary"
                onClick={() => go("map")}
              >
                Найти на карте
              </button>
            )}
            <SectionTitle>Сюжетные линии</SectionTitle>
            <p>{npc.quests.join(" · ")}</p>
            {["mark", "tommy", "miller"].includes(npc.id) ? (
              <button
                className="game-button secondary"
                onClick={() => go("quests")}
              >
                К сюжетному заданию
              </button>
            ) : (
              <p className="development">
                Личные задания — в следующих главах.
              </p>
            )}
          </div>
        </Dialog>
      )}
      {item && (
        <Dialog title="Предмет" onClose={() => setItem(null)}>
          <div className="item-detail">
            <Medallion
              faceId={game.appearance.face}
              index={itemData[item].icon}
            />
            <h3>{itemData[item].name}</h3>
            <p>{itemData[item].description}</p>
            <button
              className="game-button"
              onClick={() =>
                go(
                  item === "phone"
                    ? "contacts"
                    : item === "ticket"
                      ? "map"
                      : "quests",
                )
              }
            >
              {item === "phone"
                ? "Открыть жителей"
                : item === "ticket"
                  ? "Карта города"
                  : "Открыть задание"}
            </button>
          </div>
        </Dialog>
      )}
      {reset && (
        <Dialog title="Новая история" onClose={() => setReset(false)}>
          <p>
            Начать всё заново? Деньги, отношения и решения будут сброшены.
            Сначала можно скачать копию прогресса.
          </p>
          <button className="game-button" onClick={() => setReset(false)}>
            Продолжить историю
          </button>
          <button
            className="game-button danger"
            onClick={() => {
              replaceGame(newGame());
              setReset(false);
              go("profile");
              setToast("Новая история началась");
            }}
          >
            Начать новую игру
          </button>
        </Dialog>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={15} />
          {toast}
        </div>
      )}
    </div>
  );
}
