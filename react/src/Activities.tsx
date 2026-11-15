/** Экраны дел: движухи, бои, рейды, районы, точки, барыга, хата, бригада, сейф. */
import { useMemo, useState, type ReactNode } from "react";
import {
  ChevronRight, Lock, Swords, Zap, Heart, Wallet, Shield, Crosshair, Dumbbell, Users, Landmark, RefreshCw,
  Package, Bike, Car, Music, Banknote, Truck, Handshake, Gavel, Building2, Skull, Flag, Crown, Store, Droplets,
  Utensils, Wrench, Warehouse, Hotel, Sword, Shirt, UserRound, Gem, Watch, Glasses, Target, Sofa, Refrigerator,
  Tv, Vault, HeartPulse, House, BriefcaseBusiness, Brain, type LucideIcon,
} from "lucide-react";
import { BattleView } from "./Battle";
import { combatTurn, flee, startBattle, npcCombatant, roles, type Battle, type SkillId, type Role } from "./combat";
import { Medallion } from "./Art";
import { Dialog, SectionTitle, IconMedal } from "./ui";
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

const jobIcon: Record<string, LucideIcon> = { port: Package, courier: Bike, car: Car, club: Music, debt: Banknote, convoy: Truck, deal: Handshake, auction: Gavel, tower: Building2 };
const bizIcon: Record<string, LucideIcon> = { kiosk: Store, wash: Droplets, shawa: Utensils, service: Wrench, club: Music, storage: Warehouse, hotel: Hotel };
const itemIcon: Record<string, LucideIcon> = { knuckle: Swords, bat: Sword, knife: Sword, sawoff: Crosshair, pistol: Crosshair, rifle: Crosshair, sniper: Crosshair, leather: Shirt, track: Shirt, vest: Shield, kevlar: Shield, heavy: Shield, tactic: Shield, cap: UserRound, chain: Gem, watch: Watch, shades: Glasses, ring: Gem };
const furnIcon: Record<string, LucideIcon> = { weights: Dumbbell, bag: Target, sofa: Sofa, fridge: Refrigerator, tv: Tv, safe: Vault };
const statIcon: Record<E.StatKey, LucideIcon> = { str: Dumbbell, def: Shield, agi: Crosshair, end: HeartPulse, int: Brain };

export const activityPages = ["deeds", "jobs", "fights", "raids", "turf", "business", "shop", "home", "crew", "bank"] as const;

/** Ряд действия в стиле 0.311: медальон, текст, кнопка справа. */
function Row({ icon, title, sub, action, locked }: { icon: LucideIcon; title: string; sub: ReactNode; action: ReactNode; locked?: boolean }) {
  return (
    <div className={"game-row activity-row" + (locked ? " locked" : "")}>
      <IconMedal icon={icon} />
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
  type Fight = { battle: Battle; kind: "fight" | "raid" | "turf"; opp?: E.Opponent; id?: string; icon: LucideIcon; result: string | null };
  const [fightState, setFightState] = useState<Fight | null>(null);
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

  /** Начать пошаговый бой: энергия списывается сразу, итог применяется по окончании. */
  const begin = (r: E.Result<GameState>, make: (s: GameState) => Battle, f: Omit<Fight, "battle" | "result">) => {
    if (!r.ok) return setToast(r.message);
    setGame(r.state);
    setFightState({ ...f, battle: make(r.state), result: null });
  };
  const settle = (f: Fight, b: Battle) => {
    const t = Date.now();
    const r =
      f.kind === "fight" ? E.settleFight(game, f.opp!, b, Math.random)
      : f.kind === "raid" ? E.settleRaid(game, f.id!, b, t)
      : E.settleCapture(game, f.id! as E.Turf["id"], b, t);
    setGame(r.state);
    if (f.kind === "fight") setOppSeed(Math.floor(Math.random() * 1e9));
    return r.message;
  };
  const onSkill = (id: SkillId) => {
    if (!fightState) return;
    const b = combatTurn(fightState.battle, id, Math.random);
    setFightState({ ...fightState, battle: b, result: b.over ? settle(fightState, b) : null });
  };
  const onFlee = () => {
    if (!fightState) return;
    const b = flee(fightState.battle);
    setFightState({ ...fightState, battle: b, result: settle(fightState, b) });
  };
  const startFight = (o: E.Opponent) =>
    begin(E.beginFight(game), (s) => startBattle(E.playerCombatant(s, s.name), npcCombatant(o)), { kind: "fight", opp: o, icon: Swords });
  const startRaid = (id: string) =>
    begin(E.beginRaid(game, id, Date.now()), (s) => startBattle(E.playerCombatant(s, s.name), E.bossCombatant(s, id, Date.now()), 6), { kind: "raid", id, icon: Skull });
  const startTurf = (id: E.Turf["id"]) =>
    begin(E.beginCapture(game, id), (s) => startBattle(E.playerCombatant(s, s.name), E.turfCombatant(id), 20), { kind: "turf", id, icon: Flag });

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
  if (page === "deeds") body = <DeedsList game={game} go={go} />;
  if (page === "jobs")
    body = (
      <>
        <p className="screen-note">Работа за энергию. Каждые 10 выполнений одной движухи — +25% к доходу.</p>
        {stats}
        {E.jobs.map((j) => {
          const m = game.eco.mastery[j.id] ?? 0;
          const lock = game.level < j.lvl;
          return (
            <Row key={j.id} icon={jobIcon[j.id] ?? BriefcaseBusiness} locked={lock} title={j.name}
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
        <p className="screen-note">Пошаговый бой: каждый ход выбирай удар или приём. Стиль боя — {roles[game.eco.role].name} (меняется в «Хате»). Драка стоит {E.FIGHT_ENERGY} энергии. Проиграл — теряешь 10% наличных; деньги в сейфе в безопасности.</p>
        {stats}
        <p className="screen-note">Твоя мощь: <b>{E.power(me)}</b></p>
        {opponents.map((o, i) => {
          const pw = E.power(o), rel = pw > E.power(me) * 1.15 ? "danger-text" : pw < E.power(me) * 0.85 ? "good-text" : "";
          return (
            <Row key={o.seed + "-" + i} icon={Swords} title={`${o.name} · ${o.level} ур.`} sub={<span className={rel}>Мощь {pw}</span>}
              action={<button className="game-button small danger" onClick={() => startFight(o)}>Наехать</button>} />
          );
        })}
        <button className="game-button secondary" onClick={() => setOppSeed(Math.floor(Math.random() * 1e9))}><RefreshCw size={14} /> Других соперников</button>
      </>
    );

  if (page === "raids")
    body = (
      <>
        <p className="screen-note">Боссы с огромным запасом здоровья. Заход — до 6 ходов за {E.RAID_ENERGY} энергии, урон сохраняется. После победы босс возвращается через 30 минут.</p>
        {stats}
        {E.bosses.map((b) => {
          const st = E.bossHealth(game, b, now), lock = game.level < b.lvl;
          return (
            <div key={b.id} className={"raid-card metal-frame" + (lock ? " locked" : "")}>
              <Row icon={Skull} locked={lock} title={b.name} sub={<>Награда ${fmt(b.cash)} · ★{b.xp} · золото {b.gold} · побед {game.eco.bossKills[b.id] ?? 0}</>}
                action={lock ? <LockTag lvl={b.lvl} /> : st.dead ? <span className="lock-tag">⏳ {Math.ceil(st.respawnIn / 60000)} мин</span> : (
                  <button className="game-button small danger" onClick={() => startRaid(b.id)}><Zap size={13} /> {E.RAID_ENERGY}</button>
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
            <Row key={t.id} icon={mine ? Crown : Flag} locked={lock && !mine} title={dname(t.id)}
              sub={mine ? <span className="good-text">Под твоим контролем · +${fmt(t.inc)}/ч</span> : <>Держит: {t.boss} · мощь {pw} · +${fmt(t.inc)}/ч</>}
              action={mine ? <span className="lock-tag">✓</span> : lock ? <LockTag lvl={t.lvl} /> : (
                <button className="game-button small danger" onClick={() => startTurf(t.id)}>Штурм</button>
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
            <Row key={b.id} icon={bizIcon[b.id] ?? Store} locked={lock} title={b.name} sub={<>есть: {n} · +${fmt(b.inc)}/ч за каждую</>}
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
                <Row key={it.id} icon={itemIcon[it.id] ?? Sword} locked={lock} title={it.name} sub={bonus}
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
    const statRows: [E.StatKey, string, string][] = [["str", "Сила", "урон в бою"], ["def", "Защита", "броня: поглощает часть урона"], ["agi", "Ловкость", "уворот, криты, меньше срывов"], ["end", "Выносливость", "+10 к здоровью"], ["int", "Интуиция", "приёмы, лечение, яд, оглушение; +3 адреналина"]];
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
          return <Row key={f.id} icon={furnIcon[f.id] ?? Sofa} title={f.name} sub={f.text} action={has ? <span className="lock-tag">Есть</span> : <button className="game-button small" disabled={game.money < f.price} onClick={() => apply(E.buyFurniture(game, f.id))}>${short(f.price)}</button>} />;
        })}
        <SectionTitle>Стиль боя</SectionTitle>
        {(Object.keys(roles) as Role[]).map((r) => (
          <Row key={r} icon={r === "brute" ? Dumbbell : r === "shooter" ? Crosshair : Brain} title={roles[r].name} sub={roles[r].text}
            action={game.eco.role === r ? <span className="lock-tag">Выбран</span> : <button className="game-button small secondary" onClick={() => apply(E.setRole(game, r))}>Выбрать</button>} />
        ))}
        <SectionTitle>Тренировки</SectionTitle>
        {game.eco.points > 0 && <p className="screen-note good-text">Свободных очков: {game.eco.points}</p>}
        {statRows.map(([k, name, text]) => (
          <Row key={k} icon={statIcon[k]} title={`${name}: ${game.eco.stats[k]}`} sub={text}
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
        <Row icon={HeartPulse} title="Подлечиться" sub={E.healPrice(game) ? `Полное здоровье за $${fmt(E.healPrice(game))}` : "Здоровье полное"}
          action={<button className="game-button small" disabled={!E.healPrice(game) || game.money < E.healPrice(game)} onClick={() => apply(E.heal(game))}>Лечиться</button>} />
      </>
    );

  return (
    <>
      {body}
      <button className="game-button secondary back-to-city" onClick={() => go(page === "deeds" ? "city" : "deeds")}>
        <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> {page === "deeds" ? "В город" : "К делам"}
      </button>
      {fightState && (
        <BattleView battle={fightState.battle} enemyIcon={fightState.icon} result={fightState.result}
          onSkill={onSkill} onFlee={onFlee} onClose={() => setFightState(null)} />
      )}
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

/** Одна строка для экрана «Город» — в том же блоке и стиле, что строки 0.311. */
export function DeedsRow({ game, go }: { game: GameState; go: (p: Page) => void }) {
  const pending = E.pendingIncome(game, Date.now());
  return (
    <button className="game-row" onClick={() => go("deeds")}>
      <Medallion index={4} />
      <span>
        <b>Дела района</b>
        <small>{pending > 0 ? `Движухи, бои, рейды · собрать с точек $${fmt(pending)}` : "Движухи, бои, рейды, точки, барыга"}</small>
      </span>
      <ChevronRight size={18} />
    </button>
  );
}

/** Экран «Дела»: список всех занятий. */
function DeedsList({ game, go }: { game: GameState; go: (p: Page) => void }) {
  const pending = E.pendingIncome(game, Date.now());
  const rows: [Page, LucideIcon, string, string][] = [
    ["jobs", BriefcaseBusiness, "Движухи", "Работа за энергию"],
    ["fights", Swords, "Бои", "Наехать на соперника"],
    ["raids", Skull, "Рейды", "Боссы города"],
    ["turf", Flag, "Районы", `Под контролем: ${game.eco.captured.length} из ${E.turfs.length}`],
    ["business", Store, "Точки", pending > 0 ? `Собрать $${fmt(pending)}` : "Бизнес и доход"],
    ["shop", Sword, "Барыга", "Оружие, броня, аксессуары"],
    ["home", House, "Хата", E.homes[game.eco.home].name],
    ["crew", Users, "Бригада", `${game.eco.crew} бойцов`],
    ["bank", Vault, "Сейф и лечение", `В сейфе $${fmt(game.eco.safe)}`],
  ];
  return (
    <>
      <p className="screen-note">Чем заняться в городе. Энергия восстанавливается сама: 1 за 20 секунд.</p>
      <div className="city-actions">
        {rows.map(([p, icon, title, sub]) => (
          <button key={p} className="game-row" onClick={() => go(p)}>
            <IconMedal icon={icon} />
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
