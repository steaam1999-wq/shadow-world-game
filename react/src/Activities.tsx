/** Экраны дел: движухи, бои, рейды, районы, точки, барыга, хата, бригада, сейф. */
import { useMemo, useState, type ReactNode } from "react";
import { ChevronRight, Lock, Swords, Zap, Heart, Wallet, Shield, Crosshair, Dumbbell, Users, Landmark, RefreshCw } from "lucide-react";
import { Medallion } from "./Art";
import { Dialog, SectionTitle } from "./ui";
import { districts } from "./data";
import type { GameState } from "./game";
import * as E from "./economy";
import type { Page } from "./navigation";

type Props = {
  page: Page;
  game: GameState;
  setGame: (s: GameState) => void;
  setToast: (t: string) => void;
  go: (p: Page) => void;
};
type Outcome = { title: string; text: string; log?: string[]; win?: boolean };

const fmt = (n: number) => Math.floor(n).toLocaleString("ru-RU");
const short = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace(".0", "") + "m" : n >= 1e4 ? Math.round(n / 1e3) + "k" : fmt(n));
const dname = (id: string) => districts.find((d) => d.id === id)?.ru ?? id;

export const activityPages = ["jobs", "fights", "raids", "turf", "business", "shop", "home", "crew", "bank"] as const;

/** Ряд действия в стиле 0.311: медальон, текст, кнопка справа. */
function Row({ icon, title, sub, action, locked }: { icon: number; title: string; sub: ReactNode; action: ReactNode; locked?: boolean }) {
  return (
    <div className={"game-row activity-row" + (locked ? " locked" : "")}>
      <Medallion index={icon} />
      <span>
        <b>{title}</b>
        <small>{sub}</small>
      </span>
      <span className="activity-action">{action}</span>
    </div>
  );
}
const LockTag = ({ lvl }: { lvl: number }) => (
  <span className="lock-tag">
    <Lock size={12} /> {lvl} ур.
  </span>
);

export function Activities({ page, game, setGame, setToast, go }: Props) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [oppSeed, setOppSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const opponents = useMemo(() => {
    let s = oppSeed;
    const rng = () => ((s = (s * 1103515245 + 12345) >>> 0) % 1e6) / 1e6;
    return E.makeOpponents(game.level, rng);
  }, [oppSeed, game.level]);
  const now = Date.now();
  const me = E.playerFighter(game, game.name);

  /** Применить результат действия: состояние, сообщение, окно боя. */
  const apply = (r: E.Result<GameState>, title?: string) => {
    if (r.ok) setGame(r.state);
    if (r.log) setOutcome({ title: title ?? (r.win ? "Победа" : "Поражение"), text: r.message, log: r.log, win: r.win });
    else setToast(r.message);
  };

  const stats = (
    <div className="activity-stats metal-frame">
      <span><Swords size={14} /> {E.attack(game)}</span>
      <span><Shield size={14} /> {E.defense(game)}</span>
      <span><Crosshair size={14} /> {E.agility(game)}</span>
      <span><Heart size={14} className="red" /> {game.health}/{E.maxHealth(game)}</span>
      <span><Zap size={14} className="yellow" /> {game.energy}/{E.maxEnergy(game)}</span>
    </div>
  );

  let body: ReactNode = null;
  if (page === "jobs")
    body = (
      <>
        <p className="screen-note">Работа за энергию. Каждые 10 выполнений одной движухи — +25% к доходу.</p>
        {stats}
        {E.jobs.map((j) => {
          const m = game.eco.mastery[j.id] ?? 0;
          const lock = game.level < j.lvl;
          return (
            <Row key={j.id} icon={j.icon} locked={lock} title={j.name}
              sub={<>${fmt(j.cash[0])}–{fmt(j.cash[1])} · ★{j.xp} · мастерство {Math.floor(m / 100)} ({m % 100}%)</>}
              action={lock ? <LockTag lvl={j.lvl} /> : (
                <button className="game-button small" disabled={game.energy < j.en} onClick={() => apply(E.doJob(game, j.id, Math.random))}>
                  <Zap size={13} /> {j.en}
                </button>
              )} />
          );
        })}
      </>
    );

  if (page === "fights")
    body = (
      <>
        <p className="screen-note">Драка стоит {E.FIGHT_ENERGY} энергии. Проиграл — теряешь 10% наличных; деньги в сейфе в безопасности.</p>
        {stats}
        <p className="screen-note">Твоя мощь: <b>{E.power(me)}</b></p>
        {opponents.map((o, i) => {
          const pw = E.power(o), rel = pw > E.power(me) * 1.15 ? "danger-text" : pw < E.power(me) * 0.85 ? "good-text" : "";
          return (
            <Row key={o.seed + "-" + i} icon={2} title={`${o.name} · ${o.level} ур.`} sub={<span className={rel}>Мощь {pw}</span>}
              action={<button className="game-button small danger" onClick={() => { apply(E.fight(game, o, game.name, Math.random), `${game.name} против ${o.name}`); setOppSeed(Math.floor(Math.random() * 1e9)); }}>Наехать</button>} />
          );
        })}
        <button className="game-button secondary" onClick={() => setOppSeed(Math.floor(Math.random() * 1e9))}><RefreshCw size={14} /> Других соперников</button>
      </>
    );

  if (page === "raids")
    body = (
      <>
        <p className="screen-note">Боссы с огромным запасом здоровья. Каждый заход — {E.RAID_ENERGY} энергии, урон сохраняется. После победы босс возвращается через 30 минут.</p>
        {stats}
        {E.bosses.map((b) => {
          const st = E.bossHealth(game, b, now), lock = game.level < b.lvl;
          return (
            <div key={b.id} className={"raid-card metal-frame" + (lock ? " locked" : "")}>
              <Row icon={2} locked={lock} title={b.name} sub={<>Награда ${fmt(b.cash)} · ★{b.xp} · золото {b.gold} · побед {game.eco.bossKills[b.id] ?? 0}</>}
                action={lock ? <LockTag lvl={b.lvl} /> : st.dead ? <span className="lock-tag">⏳ {Math.ceil(st.respawnIn / 60000)} мин</span> : (
                  <button className="game-button small danger" onClick={() => apply(E.raid(game, b.id, game.name, Math.random, Date.now()), b.name)}><Zap size={13} /> {E.RAID_ENERGY}</button>
                )} />
              <div className="hp-bar"><i style={{ width: (st.hp / b.hp) * 100 + "%" }} /><span>{fmt(st.hp)} / {fmt(b.hp)}</span></div>
            </div>
          );
        })}
      </>
    );

  if (page === "turf")
    body = (
      <>
        <p className="screen-note">Захвати район — получай доход каждый час и авторитет. Штурм стоит {E.CAPTURE_ENERGY} энергии.</p>
        {stats}
        {E.turfs.map((t) => {
          const mine = game.eco.captured.includes(t.id), lock = game.level < t.lvl;
          const pw = E.power({ atk: t.atk, def: t.def, hp: t.hp, agi: t.lvl * 2 });
          return (
            <Row key={t.id} icon={0} locked={lock && !mine} title={dname(t.id)}
              sub={mine ? <span className="good-text">Под твоим контролем · +${fmt(t.inc)}/ч</span> : <>Держит: {t.boss} · мощь {pw} · +${fmt(t.inc)}/ч</>}
              action={mine ? <span className="lock-tag">✓</span> : lock ? <LockTag lvl={t.lvl} /> : (
                <button className="game-button small danger" onClick={() => apply(E.capture(game, t.id, game.name, Math.random, Date.now()), "Штурм: " + dname(t.id))}>Штурм</button>
              )} />
          );
        })}
      </>
    );

  if (page === "business") {
    const inc = E.incomePerHour(game), pending = E.pendingIncome(game, now);
    body = (
      <>
        <div className="income-box metal-frame">
          <span>Доход: <b>${fmt(inc)}/ч</b> · копится до {E.INCOME_CAP_H} ч</span>
          <strong>${fmt(pending)}</strong>
          <button className="game-button" disabled={pending <= 0} onClick={() => apply(E.collect(game, Date.now()))}>Собрать</button>
        </div>
        {E.businesses.map((b) => {
          const n = game.eco.biz[b.id] ?? 0, lock = game.level < b.lvl;
          return (
            <Row key={b.id} icon={1} locked={lock} title={b.name} sub={<>есть: {n} · +${fmt(b.inc)}/ч за каждую</>}
              action={lock ? <LockTag lvl={b.lvl} /> : <button className="game-button small" disabled={game.money < E.bizPrice(game, b)} onClick={() => apply(E.buyBusiness(game, b.id, Date.now()))}>${short(E.bizPrice(game, b))}</button>} />
          );
        })}
      </>
    );
  }

  if (page === "shop") {
    const slots: [E.Slot, string][] = [["weapon", "Оружие"], ["armor", "Броня"], ["extra", "Аксессуары"]];
    body = (
      <>
        <p className="screen-note">«Всё чистое, почти новое. Деньги вперёд».</p>
        {stats}
        {slots.map(([sl, title]) => (
          <div key={sl}>
            <SectionTitle>{title}</SectionTitle>
            {E.items.filter((i) => i.slot === sl).map((it) => {
              const own = game.eco.owned.includes(it.id), on = game.eco.gear[sl] === it.id, lock = game.level < it.lvl;
              const bonus = [it.atk && `атака +${it.atk}`, it.def && `защита +${it.def}`, it.agi && `ловкость +${it.agi}`, it.auth && `авторитет +${it.auth}`].filter(Boolean).join(" · ");
              return (
                <Row key={it.id} icon={4} locked={lock} title={it.name} sub={bonus}
                  action={on ? <span className="lock-tag">Надето</span> : own ? <button className="game-button small secondary" onClick={() => apply(E.equip(game, it.id))}>Надеть</button> : lock ? <LockTag lvl={it.lvl} /> : (
                    <button className="game-button small" disabled={game.money < it.price} onClick={() => apply(E.buyItem(game, it.id))}>${short(it.price)}</button>
                  )} />
              );
            })}
          </div>
        ))}
      </>
    );
  }

  if (page === "home") {
    const h = E.homes[game.eco.home], next = E.homes[game.eco.home + 1];
    const statRows: [E.StatKey, string, string][] = [["str", "Сила", "урон в бою"], ["def", "Защита", "меньше урона"], ["agi", "Ловкость", "криты, уклоны, меньше срывов"], ["end", "Выносливость", "+10 к здоровью"]];
    body = (
      <>
        <div className="income-box metal-frame">
          <span>Ты живёшь: <b>{h.name}</b></span>
          <small>Энергия +{h.en} · сейф ${short(E.safeCapacity(game))}</small>
          {next ? (
            game.level < next.lvl ? <span className="lock-tag"><Lock size={12} /> {next.name} — с {next.lvl} ур.</span> : (
              <button className="game-button" disabled={game.money < next.price} onClick={() => apply(E.buyHome(game, game.eco.home + 1))}>Переехать: {next.name} · ${short(next.price)}</button>
            )
          ) : <span className="good-text">Лучшее жильё в городе</span>}
        </div>
        <SectionTitle>Обстановка</SectionTitle>
        {E.furniture.map((f) => {
          const has = game.eco.furniture.includes(f.id);
          return <Row key={f.id} icon={8} title={f.name} sub={f.text} action={has ? <span className="lock-tag">Есть</span> : <button className="game-button small" disabled={game.money < f.price} onClick={() => apply(E.buyFurniture(game, f.id))}>${short(f.price)}</button>} />;
        })}
        <SectionTitle>Тренировки</SectionTitle>
        {game.eco.points > 0 && <p className="screen-note good-text">Свободных очков: {game.eco.points}</p>}
        {statRows.map(([k, name, text]) => (
          <Row key={k} icon={2} title={`${name}: ${game.eco.stats[k]}`} sub={text}
            action={<span className="row-buttons">
              {game.eco.points > 0 && <button className="game-button small" onClick={() => apply(E.spendPoint(game, k))}>+1</button>}
              <button className="game-button small secondary" disabled={game.money < E.statPrice(game.eco.stats[k])} onClick={() => apply(E.train(game, k))}><Dumbbell size={13} /> ${short(E.statPrice(game.eco.stats[k]))}</button>
            </span>} />
        ))}
      </>
    );
  }

  if (page === "crew")
    body = (
      <>
        <p className="screen-note">Каждый боец даёт +3 к атаке и защите в боях, рейдах и штурмах. Лимит растёт с уровнем.</p>
        <div className="income-box metal-frame">
          <span><Users size={16} /> Бойцов: <b>{game.eco.crew}</b> из {E.crewMax(game)}</span>
          <small>Бонус: атака +{game.eco.crew * 3} · защита +{game.eco.crew * 3}</small>
          <button className="game-button" disabled={game.eco.crew >= E.crewMax(game) || game.money < E.crewPrice(game)} onClick={() => apply(E.hire(game))}>Нанять бойца · ${fmt(E.crewPrice(game))}</button>
        </div>
      </>
    );

  if (page === "bank")
    body = (
      <>
        <p className="screen-note">Деньги в сейфе не теряются при поражении. Вместимость растёт с жильём и сейфом в хате.</p>
        <div className="income-box metal-frame">
          <span><Wallet size={16} /> Наличные: <b>${fmt(game.money)}</b></span>
          <strong><Landmark size={18} /> ${fmt(game.eco.safe)}</strong>
          <small>Вместимость: ${fmt(E.safeCapacity(game))}</small>
          <div className="row-buttons">
            <button className="game-button" onClick={() => apply(E.deposit(game, game.money))}>Положить всё</button>
            <button className="game-button secondary" onClick={() => apply(E.withdraw(game, game.eco.safe))}>Снять всё</button>
          </div>
        </div>
        <Row icon={8} title="Подлечиться" sub={E.healPrice(game) ? `Полное здоровье за $${fmt(E.healPrice(game))}` : "Здоровье полное"}
          action={<button className="game-button small" disabled={!E.healPrice(game) || game.money < E.healPrice(game)} onClick={() => apply(E.heal(game))}>Лечиться</button>} />
      </>
    );

  return (
    <>
      {body}
      <button className="game-button secondary back-to-city" onClick={() => go("city")}>
        <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> В город
      </button>
      {outcome && (
        <Dialog title={outcome.title} onClose={() => setOutcome(null)}>
          <p className={outcome.win ? "good-text" : "danger-text"}><b>{outcome.win ? "🏆 " : ""}{outcome.text}</b></p>
          {outcome.log && <div className="fight-log">{outcome.log.map((l, i) => <div key={i}>{l}</div>)}</div>}
          <button className="game-button" onClick={() => setOutcome(null)}>Ок</button>
        </Dialog>
      )}
    </>
  );
}

/** Строки раздела «Дела» для экрана «Город». */
export function CityActivities({ game, go }: { game: GameState; go: (p: Page) => void }) {
  const pending = E.pendingIncome(game, Date.now());
  const rows: [Page, number, string, string][] = [
    ["jobs", 5, "Движухи", "Работа за энергию"],
    ["fights", 2, "Бои", "Наехать на соперника"],
    ["raids", 3, "Рейды", "Боссы города"],
    ["turf", 0, "Районы", `Под контролем: ${game.eco.captured.length} из ${E.turfs.length}`],
    ["business", 1, "Точки", pending > 0 ? `Собрать $${fmt(pending)}` : "Бизнес и доход"],
    ["shop", 4, "Барыга", "Оружие, броня, аксессуары"],
    ["home", 8, "Хата", E.homes[game.eco.home].name],
    ["crew", 3, "Бригада", `${game.eco.crew} бойцов`],
    ["bank", 6, "Сейф и лечение", `В сейфе $${fmt(game.eco.safe)}`],
  ];
  return (
    <>
      <SectionTitle>Дела</SectionTitle>
      <div className="city-actions">
        {rows.map(([p, icon, title, sub]) => (
          <button key={p} className="game-row" onClick={() => go(p)}>
            <Medallion index={icon} />
            <span>
              <b>{title}</b>
              <small>{sub}</small>
            </span>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
    </>
  );
}
