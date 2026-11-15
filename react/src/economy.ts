/**
 * Экономика и развитие персонажа: движухи, бои, рейды, районы, точки, жильё,
 * снаряжение, тренировки, бригада, сейф, регенерация.
 * Все функции чистые: принимают состояние и возвращают новое. Случайность и время
 * передаются параметрами (rng, now), поэтому всё детерминированно тестируется.
 */
import type { DistrictId } from "./data";

export type Rng = () => number;
export type StatKey = "str" | "def" | "agi" | "end";
export type Slot = "weapon" | "armor" | "extra";

export type Economy = {
  stats: Record<StatKey, number>;
  points: number;
  gold: number;
  safe: number;
  gear: Record<Slot, string | null>;
  owned: string[];
  biz: Record<string, number>;
  /** доход, накопленный до последнего изменения ставки, и момент начала текущего накопления */
  banked: number;
  incomeAt: number;
  home: number;
  furniture: string[];
  captured: DistrictId[];
  crew: number;
  bosses: Record<string, { hp: number; deadAt?: number }>;
  bossKills: Record<string, number>;
  jobsTotal: number;
  mastery: Record<string, number>;
  wins: number;
  losses: number;
  /** моменты, от которых считается регенерация энергии и здоровья */
  regenAt: number;
  hpAt: number;
  restAt: number;
  earned: number;
};

/** Минимальная часть GameState, с которой работает экономика. */
export type EcoHost = {
  money: number;
  energy: number;
  health: number;
  reputation: number;
  xp: number;
  level: number;
  district: DistrictId;
  eco: Economy;
};

// ---------------- данные ----------------
export type Job = { id: string; name: string; lvl: number; en: number; cash: [number, number]; xp: number; risk: number; icon: number };
export const jobs: Job[] = [
  { id: "port",    name: "Разгрузить фуры в порту",        lvl: 1,  en: 5,  cash: [120, 200],     xp: 6,   risk: 0.05, icon: 4 },
  { id: "courier", name: "Курьерская смена",               lvl: 1,  en: 8,  cash: [250, 400],     xp: 10,  risk: 0.05, icon: 5 },
  { id: "car",     name: "Перегнать машину без вопросов",  lvl: 3,  en: 12, cash: [500, 800],     xp: 16,  risk: 0.12, icon: 0 },
  { id: "club",    name: "Фейсконтроль в клубе",           lvl: 5,  en: 15, cash: [900, 1300],    xp: 22,  risk: 0.1,  icon: 1 },
  { id: "debt",    name: "Вернуть старый долг",            lvl: 8,  en: 20, cash: [1500, 2400],   xp: 30,  risk: 0.18, icon: 6 },
  { id: "convoy",  name: "Сопроводить груз",               lvl: 12, en: 25, cash: [2800, 4200],   xp: 42,  risk: 0.15, icon: 4 },
  { id: "deal",    name: "Ночная сделка в порту",          lvl: 18, en: 35, cash: [6000, 9000],   xp: 60,  risk: 0.22, icon: 5 },
  { id: "auction", name: "Подпольный аукцион",             lvl: 25, en: 45, cash: [14000, 20000], xp: 85,  risk: 0.25, icon: 7 },
  { id: "tower",   name: "Тендер на стройку в центре",     lvl: 32, en: 60, cash: [30000, 45000], xp: 120, risk: 0.2,  icon: 1 },
];

export type Item = { id: string; slot: Slot; name: string; lvl: number; price: number; atk?: number; def?: number; agi?: number; auth?: number };
export const items: Item[] = [
  { id: "knuckle", slot: "weapon", name: "Кастет", lvl: 1, price: 300, atk: 4 },
  { id: "bat", slot: "weapon", name: "Бита", lvl: 3, price: 900, atk: 8 },
  { id: "knife", slot: "weapon", name: "Нож-бабочка", lvl: 5, price: 2500, atk: 14 },
  { id: "sawoff", slot: "weapon", name: "Обрез", lvl: 9, price: 7000, atk: 24 },
  { id: "pistol", slot: "weapon", name: "Пистолет", lvl: 14, price: 18000, atk: 38 },
  { id: "rifle", slot: "weapon", name: "Автомат", lvl: 20, price: 50000, atk: 60 },
  { id: "sniper", slot: "weapon", name: "Снайперка", lvl: 28, price: 140000, atk: 90 },
  { id: "leather", slot: "armor", name: "Кожанка", lvl: 1, price: 300, def: 4 },
  { id: "track", slot: "armor", name: "Олимпийка", lvl: 3, price: 900, def: 8 },
  { id: "vest", slot: "armor", name: "Лёгкий бронежилет", lvl: 6, price: 3000, def: 15 },
  { id: "kevlar", slot: "armor", name: "Кевлар", lvl: 10, price: 9000, def: 26 },
  { id: "heavy", slot: "armor", name: "Тяжёлый бронежилет", lvl: 16, price: 25000, def: 40 },
  { id: "tactic", slot: "armor", name: "Тактический комплект", lvl: 22, price: 70000, def: 60 },
  { id: "cap", slot: "extra", name: "Кепка", lvl: 1, price: 200, agi: 2 },
  { id: "chain", slot: "extra", name: "Золотая цепь", lvl: 4, price: 1500, agi: 4, auth: 5 },
  { id: "watch", slot: "extra", name: "Часы с гравировкой", lvl: 8, price: 6000, agi: 7, auth: 10 },
  { id: "shades", slot: "extra", name: "Тёмные очки", lvl: 12, price: 15000, agi: 11, auth: 15 },
  { id: "ring", slot: "extra", name: "Перстень", lvl: 18, price: 40000, agi: 16, auth: 25 },
];

export type Biz = { id: string; name: string; lvl: number; price: number; inc: number };
export const businesses: Biz[] = [
  { id: "kiosk", name: "Ларёк у остановки", lvl: 1, price: 1500, inc: 60 },
  { id: "wash", name: "Автомойка", lvl: 4, price: 8000, inc: 280 },
  { id: "shawa", name: "Шаурмичная", lvl: 7, price: 25000, inc: 800 },
  { id: "service", name: "Автосервис", lvl: 11, price: 80000, inc: 2300 },
  { id: "club", name: "Ночной клуб", lvl: 16, price: 250000, inc: 6500 },
  { id: "storage", name: "Склад в порту", lvl: 22, price: 800000, inc: 19000 },
  { id: "hotel", name: "Отель в центре", lvl: 30, price: 3000000, inc: 65000 },
];

export const homes = [
  { name: "Комната в общаге", price: 0, lvl: 1, en: 0, safe: 5000 },
  { name: "Однушка на окраине", price: 15000, lvl: 3, en: 10, safe: 25000 },
  { name: "Двушка в Старом городе", price: 60000, lvl: 8, en: 20, safe: 100000 },
  { name: "Лофт в Промзоне", price: 200000, lvl: 14, en: 35, safe: 400000 },
  { name: "Пентхаус в Сити-центре", price: 750000, lvl: 20, en: 55, safe: 1500000 },
  { name: "Особняк в Кингс-дистрикте", price: 3000000, lvl: 28, en: 80, safe: 6000000 },
];

export type Furniture = { id: string; name: string; price: number; text: string; str?: number; agi?: number; en?: number };
export const furniture: Furniture[] = [
  { id: "weights", name: "Штанга", price: 2000, text: "+3 к силе", str: 3 },
  { id: "bag", name: "Боксёрская груша", price: 3500, text: "+3 к ловкости", agi: 3 },
  { id: "sofa", name: "Диван", price: 5000, text: "Здоровье восстанавливается вдвое быстрее" },
  { id: "fridge", name: "Холодильник", price: 6000, text: "+10 к макс. энергии", en: 10 },
  { id: "tv", name: "Телевизор", price: 9000, text: "+10% опыта за движухи" },
  { id: "safe", name: "Сейф", price: 12000, text: "Вместимость сейфа ×2" },
];

export type Turf = { id: DistrictId; boss: string; lvl: number; hp: number; atk: number; def: number; inc: number; auth: number };
/** Районы, которые можно взять под контроль (id совпадают с районами карты). */
export const turfs: Turf[] = [
  { id: "west", boss: "Банда Рыжего", lvl: 2, hp: 230, atk: 21, def: 21, inc: 150, auth: 20 },
  { id: "industrial", boss: "Бригада Штыря", lvl: 6, hp: 270, atk: 44, def: 44, inc: 600, auth: 50 },
  { id: "old", boss: "Люди Седого", lvl: 11, hp: 340, atk: 72, def: 72, inc: 1800, auth: 120 },
  { id: "center", boss: "Совет Пятерых", lvl: 20, hp: 480, atk: 125, def: 120, inc: 9000, auth: 400 },
  { id: "kings", boss: "Гвардия Харриганов", lvl: 30, hp: 600, atk: 185, def: 165, inc: 30000, auth: 900 },
];

export type Boss = { id: string; name: string; lvl: number; hp: number; atk: number; def: number; cash: number; xp: number; gold: number };
export const bosses: Boss[] = [
  { id: "boar", name: "Кабан с рынка", lvl: 3, hp: 700, atk: 35, def: 16, cash: 3000, xp: 60, gold: 2 },
  { id: "shtyr", name: "Бригадир Штырь", lvl: 8, hp: 1300, atk: 54, def: 28, cash: 15000, xp: 200, gold: 4 },
  { id: "baron", name: "Барон Порта", lvl: 15, hp: 2600, atk: 84, def: 54, cash: 60000, xp: 600, gold: 8 },
  { id: "sedoy", name: "Седой", lvl: 25, hp: 3800, atk: 137, def: 84, cash: 250000, xp: 1800, gold: 15 },
];

export const nicknames = ["Шрам", "Бульдог", "Кастет", "Тихий", "Хромой", "Сиплый", "Кирпич", "Гвоздь", "Рыжий", "Штырь", "Кабан", "Малой", "Чиж", "Жила", "Балу", "Танкист", "Сварщик", "Дизель", "Лом", "Буря"];

// ---------------- константы ----------------
export const ENERGY_REGEN_MS = 20_000;
export const HEALTH_REGEN_MS = 6_000;
export const INCOME_CAP_H = 12;
export const BOSS_RESPAWN_MS = 30 * 60_000;
export const REST_COOLDOWN_MS = 4 * 3_600_000;
export const FIGHT_ENERGY = 5;
export const RAID_ENERGY = 10;
export const CAPTURE_ENERGY = 20;

export const freshEconomy = (now: number): Economy => ({
  stats: { str: 5, def: 5, agi: 5, end: 5 },
  points: 0,
  gold: 5,
  safe: 0,
  gear: { weapon: null, armor: null, extra: null },
  owned: [],
  biz: {},
  banked: 0,
  incomeAt: now,
  home: 0,
  furniture: [],
  captured: [],
  crew: 0,
  bosses: {},
  bossKills: {},
  jobsTotal: 0,
  mastery: {},
  wins: 0,
  losses: 0,
  regenAt: now,
  hpAt: now,
  restAt: 0,
  earned: 0,
});

// ---------------- уровни ----------------
export const xpNeed = (level: number) => Math.round(40 * Math.pow(level, 1.45));
/** Уровень по суммарному опыту и прогресс внутри уровня. */
export function levelInfo(xp: number): { level: number; into: number; need: number } {
  let level = 1, acc = 0;
  while (xp >= acc + xpNeed(level)) { acc += xpNeed(level); level++; }
  return { level, into: xp - acc, need: xpNeed(level) };
}
export const levelFor = (xp: number) => levelInfo(xp).level;

// ---------------- производные параметры ----------------
const item = (id: string | null) => (id ? items.find((i) => i.id === id) : undefined);
const gearSum = (e: Economy, k: "atk" | "def" | "agi" | "auth") =>
  (["weapon", "armor", "extra"] as Slot[]).reduce((a, sl) => a + (item(e.gear[sl])?.[k] ?? 0), 0);
const furnSum = (e: Economy, k: "str" | "agi" | "en") =>
  furniture.reduce((a, f) => a + (e.furniture.includes(f.id) ? f[k] ?? 0 : 0), 0);
export const hasFurniture = (e: Economy, id: string) => e.furniture.includes(id);

export const strength = (s: EcoHost) => s.eco.stats.str + furnSum(s.eco, "str");
export const agility = (s: EcoHost) => s.eco.stats.agi + furnSum(s.eco, "agi") + gearSum(s.eco, "agi");
export const attack = (s: EcoHost) => strength(s) * 2 + gearSum(s.eco, "atk") + s.eco.crew * 3;
export const defense = (s: EcoHost) => s.eco.stats.def * 2 + gearSum(s.eco, "def") + s.eco.crew * 3;
export const maxHealth = (s: EcoHost) => 100 + (s.eco.stats.end - 5) * 10;
export const maxEnergy = (s: EcoHost) => 100 + (s.level - 1) * 2 + homes[s.eco.home].en + furnSum(s.eco, "en");
export const safeCapacity = (s: EcoHost) => homes[s.eco.home].safe * (hasFurniture(s.eco, "safe") ? 2 : 1);
export const authority = (s: EcoHost) =>
  s.reputation + gearSum(s.eco, "auth") + s.eco.home * 15 + turfs.reduce((a, t) => a + (s.eco.captured.includes(t.id) ? t.auth : 0), 0);
export const incomePerHour = (s: EcoHost) =>
  businesses.reduce((a, b) => a + (s.eco.biz[b.id] ?? 0) * b.inc, 0) +
  turfs.reduce((a, t) => a + (s.eco.captured.includes(t.id) ? t.inc : 0), 0);
export const pendingIncome = (s: EcoHost, now: number) =>
  Math.floor(Math.min(incomePerHour(s) * INCOME_CAP_H, s.eco.banked + (incomePerHour(s) * Math.max(0, now - s.eco.incomeAt)) / 3_600_000));
export const bizPrice = (s: EcoHost, b: Biz) => Math.round(b.price * Math.pow(1.15, s.eco.biz[b.id] ?? 0));
export const statPrice = (v: number) => Math.round(40 * Math.pow(v, 1.45));
export const crewPrice = (s: EcoHost) => Math.round(500 * Math.pow(s.eco.crew + 1, 1.5));
export const crewMax = (s: EcoHost) => s.level + 2;
export const healPrice = (s: EcoHost) => (s.health >= maxHealth(s) ? 0 : Math.max(100, Math.round((maxHealth(s) - s.health) * 3 * (1 + s.level / 10))));

// ---------------- опыт и награды ----------------
/** Начислить опыт: при новом уровне — 3 очка параметров, 2 золота, полные энергия и здоровье. */
export function addXp<T extends EcoHost>(s: T, xp: number): T {
  if (!xp) return s;
  const total = s.xp + xp;
  const level = levelFor(total);
  const ups = level - s.level;
  if (ups <= 0) return { ...s, xp: total, level };
  const next = { ...s, xp: total, level, eco: { ...s.eco, points: s.eco.points + ups * 3, gold: s.eco.gold + ups * 2 } };
  return { ...next, energy: maxEnergy(next), health: maxHealth(next) };
}
function addMoney<T extends EcoHost>(s: T, cash: number): T {
  return { ...s, money: Math.max(0, s.money + cash), eco: cash > 0 ? { ...s.eco, earned: s.eco.earned + cash } : s.eco };
}
const rnd = (rng: Rng, a: number, b: number) => Math.floor(a + rng() * (b - a + 1));

// ---------------- время ----------------
/** Регенерация энергии и здоровья по времени. Возвращает то же состояние, если ничего не изменилось. */
export function tick<T extends EcoHost>(s: T, now: number): T {
  const me = maxEnergy(s), mh = maxHealth(s);
  const hpStep = HEALTH_REGEN_MS / (hasFurniture(s.eco, "sofa") ? 2 : 1);
  const step = (cur: number, max: number, at: number, ms: number): [number, number] => {
    if (cur >= max) return [cur, now - at >= ms ? now : at];
    const g = Math.floor((now - at) / ms);
    if (g <= 0) return [cur, at];
    const v = Math.min(max, cur + g);
    return [v, v >= max ? now : at + g * ms];
  };
  const [energy, regenAt] = step(s.energy, me, s.eco.regenAt, ENERGY_REGEN_MS);
  const [health, hpAt] = step(s.health, mh, s.eco.hpAt, hpStep);
  if (energy === s.energy && health === s.health && regenAt === s.eco.regenAt && hpAt === s.eco.hpAt) return s;
  return { ...s, energy, health, eco: { ...s.eco, regenAt, hpAt } };
}
/** Отдых: бесплатно восстанавливает всё, но не чаще раза в 4 часа. */
export function restAvailableIn(s: EcoHost, now: number) {
  if (!s.eco.restAt) return 0; // ещё ни разу не отдыхал
  return Math.max(0, s.eco.restAt + REST_COOLDOWN_MS - now);
}
export function rest<T extends EcoHost>(s: T, now: number): Result<T> {
  if (restAvailableIn(s, now) > 0) return fail(s, "Отдых будет доступен позже");
  return ok({ ...s, energy: maxEnergy(s), health: maxHealth(s), eco: { ...s.eco, restAt: now, regenAt: now, hpAt: now } }, "Силы восстановлены");
}

// ---------------- результат действия ----------------
export type Result<T> = { state: T; ok: boolean; message: string; log?: string[]; win?: boolean };
const ok = <T>(state: T, message: string, extra: Partial<Result<T>> = {}): Result<T> => ({ state, ok: true, message, ...extra });
const fail = <T>(state: T, message: string): Result<T> => ({ state, ok: false, message });

// ---------------- бой ----------------
export type Fighter = { name: string; hp: number; maxHp: number; atk: number; def: number; agi: number };
export function playerFighter(s: EcoHost, name: string): Fighter {
  return { name, hp: s.health, maxHp: maxHealth(s), atk: attack(s), def: defense(s), agi: agility(s) };
}
function hit(a: Fighter, b: Fighter, rng: Rng): string {
  if (rng() < b.agi / (b.agi + 120)) return `${b.name} уходит от удара`;
  const crit = rng() < a.agi / (a.agi + 90);
  let dmg = Math.max(1, Math.round(Math.max(a.atk * 0.15, a.atk * (0.8 + rng() * 0.4) - b.def * 0.6)));
  if (crit) dmg = Math.round(dmg * 1.8);
  b.hp = Math.max(0, b.hp - dmg);
  return `${a.name} бьёт ${crit ? "критом " : ""}на ${dmg}`;
}
/** Бой по раундам. Мутирует копии бойцов; победа — нокаут или больший процент оставшегося здоровья. */
export function battle(p: Fighter, e: Fighter, rounds: number, rng: Rng) {
  const log: string[] = [];
  for (let r = 0; r < rounds && p.hp > 0 && e.hp > 0; r++) {
    log.push(hit(p, e, rng));
    if (e.hp <= 0) break;
    log.push(hit(e, p, rng));
  }
  const win = e.hp <= 0 || (p.hp > 0 && p.hp / p.maxHp > e.hp / e.maxHp);
  return { win, log };
}
export const power = (f: { atk: number; def: number; hp: number; agi: number }) => Math.round(f.atk * 1.2 + f.def + f.hp / 10 + f.agi);

export type Opponent = Fighter & { level: number; seed: number };
export function makeOpponents(level: number, rng: Rng, count = 4): Opponent[] {
  return Array.from({ length: count }, () => {
    const l = Math.max(1, level + rnd(rng, -2, 2));
    const pts = 20 + (l - 1) * 3;
    const str = Math.round(pts * (0.2 + rng() * 0.15));
    const df = Math.round(pts * (0.2 + rng() * 0.15));
    const agi = Math.round(pts * (0.15 + rng() * 0.15));
    const end = Math.max(3, pts - str - df - agi);
    const gear = (0.6 + rng() * 0.6) * (l * 2.4 + l * l * 0.05);
    const hp = 100 + end * 10 + l * 8;
    return { name: nicknames[rnd(rng, 0, nicknames.length - 1)], level: l, hp, maxHp: hp, atk: Math.round(str * 2 + gear * 1.1), def: Math.round(df * 2 + gear), agi, seed: rnd(rng, 1, 1e9) };
  });
}
const enoughHealth = (s: EcoHost) => s.health >= maxHealth(s) * 0.2;

// ---------------- действия ----------------
export function doJob<T extends EcoHost>(s: T, id: string, rng: Rng): Result<T> {
  const j = jobs.find((x) => x.id === id);
  if (!j) return fail(s, "Нет такой движухи");
  if (s.level < j.lvl) return fail(s, `Откроется с ${j.lvl} уровня`);
  if (s.energy < j.en) return fail(s, `Не хватает энергии (нужно ${j.en})`);
  let next: T = { ...s, energy: s.energy - j.en };
  if (rng() < Math.max(0.02, j.risk - agility(s) / 400)) {
    const loss = Math.min(next.health - 1, rnd(rng, 5, 15) + j.lvl);
    next = addXp({ ...next, health: next.health - loss }, Math.ceil(j.xp / 3));
    return { state: next, ok: true, message: `Сорвалось: −${loss} здоровья, +${Math.ceil(j.xp / 3)} опыта`, win: false };
  }
  const m = s.eco.mastery[id] ?? 0;
  const cash = Math.round(rnd(rng, j.cash[0], j.cash[1]) * (1 + Math.floor(m / 100) * 0.25));
  const xp = Math.round(j.xp * (hasFurniture(s.eco, "tv") ? 1.1 : 1));
  next = { ...next, reputation: next.reputation + 1, eco: { ...next.eco, mastery: { ...next.eco.mastery, [id]: m + 10 }, jobsTotal: next.eco.jobsTotal + 1 } };
  next = addXp(addMoney(next, cash), xp);
  return { state: next, ok: true, message: `${j.name}: +$${cash}, +${xp} опыта`, win: true };
}

export function fight<T extends EcoHost>(s: T, o: Opponent, name: string, rng: Rng): Result<T> {
  if (!enoughHealth(s)) return fail(s, "Слишком мало здоровья — отдохни или подлечись");
  if (s.energy < FIGHT_ENERGY) return fail(s, `Не хватает энергии (нужно ${FIGHT_ENERGY})`);
  const p = playerFighter(s, name), e = { ...o };
  const res = battle(p, e, 8, rng);
  let next: T = { ...s, energy: s.energy - FIGHT_ENERGY, health: Math.max(1, p.hp) };
  if (res.win) {
    const cash = o.level * rnd(rng, 40, 90);
    next = { ...next, reputation: next.reputation + rnd(rng, 1, 3), eco: { ...next.eco, wins: next.eco.wins + 1 } };
    next = addXp(addMoney(next, cash), 4 + o.level);
    return { state: next, ok: true, message: `Победа над ${o.name}: +$${cash}, +${4 + o.level} опыта`, log: res.log, win: true };
  }
  const lost = Math.round(next.money * 0.1);
  next = addXp({ ...next, money: next.money - lost, eco: { ...next.eco, losses: next.eco.losses + 1 } }, 1);
  return { state: next, ok: true, message: `Поражение от ${o.name}: −$${lost} (сейф не тронут)`, log: res.log, win: false };
}

export function bossHealth(s: EcoHost, b: Boss, now: number): { hp: number; dead: boolean; respawnIn: number } {
  const st = s.eco.bosses[b.id];
  if (!st) return { hp: b.hp, dead: false, respawnIn: 0 };
  if (st.deadAt !== undefined) {
    const left = st.deadAt + BOSS_RESPAWN_MS - now;
    return left > 0 ? { hp: 0, dead: true, respawnIn: left } : { hp: b.hp, dead: false, respawnIn: 0 };
  }
  return { hp: st.hp, dead: false, respawnIn: 0 };
}
export function raid<T extends EcoHost>(s: T, id: string, name: string, rng: Rng, now: number): Result<T> {
  const b = bosses.find((x) => x.id === id);
  if (!b) return fail(s, "Нет такого босса");
  if (s.level < b.lvl) return fail(s, `Откроется с ${b.lvl} уровня`);
  const st = bossHealth(s, b, now);
  if (st.dead) return fail(s, "Босс ещё не вернулся");
  if (!enoughHealth(s)) return fail(s, "Слишком мало здоровья");
  if (s.energy < RAID_ENERGY) return fail(s, `Не хватает энергии (нужно ${RAID_ENERGY})`);
  const p = playerFighter(s, name);
  const e: Fighter = { name: b.name, hp: st.hp, maxHp: b.hp, atk: b.atk, def: b.def, agi: b.lvl };
  const res = battle(p, e, 3, rng);
  const dealt = st.hp - e.hp;
  let next: T = { ...s, energy: s.energy - RAID_ENERGY, health: Math.max(1, p.hp) };
  if (e.hp <= 0) {
    next = { ...next, reputation: next.reputation + 10, eco: { ...next.eco, gold: next.eco.gold + b.gold, bosses: { ...next.eco.bosses, [id]: { hp: 0, deadAt: now } }, bossKills: { ...next.eco.bossKills, [id]: (next.eco.bossKills[id] ?? 0) + 1 } } };
    next = addXp(addMoney(next, b.cash), b.xp);
    return { state: next, ok: true, message: `${b.name} повержен! +$${b.cash}, +${b.xp} опыта, +${b.gold} золота`, log: res.log, win: true };
  }
  next = addXp({ ...next, eco: { ...next.eco, bosses: { ...next.eco.bosses, [id]: { hp: e.hp } } } }, 2);
  return { state: next, ok: true, message: `Нанесено ${dealt} урона. У босса осталось ${e.hp}`, log: res.log, win: false };
}

export function capture<T extends EcoHost>(s: T, id: DistrictId, name: string, rng: Rng, now: number): Result<T> {
  const t = turfs.find((x) => x.id === id);
  if (!t) return fail(s, "Этот район не захватить");
  if (s.eco.captured.includes(id)) return fail(s, "Район уже под контролем");
  if (s.level < t.lvl) return fail(s, `Откроется с ${t.lvl} уровня`);
  if (!enoughHealth(s)) return fail(s, "Слишком мало здоровья");
  if (s.energy < CAPTURE_ENERGY) return fail(s, `Не хватает энергии (нужно ${CAPTURE_ENERGY})`);
  const p = playerFighter(s, name);
  const e: Fighter = { name: t.boss, hp: t.hp, maxHp: t.hp, atk: t.atk, def: t.def, agi: t.lvl * 2 };
  const res = battle(p, e, 12, rng);
  let next: T = { ...s, energy: s.energy - CAPTURE_ENERGY, health: Math.max(1, p.hp) };
  if (!res.win) {
    next = addXp({ ...next, eco: { ...next.eco, losses: next.eco.losses + 1 } }, 3);
    return { state: next, ok: true, message: `Штурм сорвался: ${t.boss} устояли`, log: res.log, win: false };
  }
  // доход меняется — фиксируем накопленное
  const banked = pendingIncome(next, now);
  next = { ...next, eco: { ...next.eco, banked, incomeAt: now, captured: [...next.eco.captured, id], wins: next.eco.wins + 1 } };
  next = addXp(addMoney(next, t.inc * 3), 25 + t.lvl * 6);
  return { state: next, ok: true, message: `Район под контролем! +$${t.inc}/ч`, log: res.log, win: true };
}

export function buyItem<T extends EcoHost>(s: T, id: string): Result<T> {
  const it = item(id);
  if (!it) return fail(s, "Нет такого предмета");
  if (s.eco.owned.includes(id)) return fail(s, "Уже куплено");
  if (s.level < it.lvl) return fail(s, `Доступно с ${it.lvl} уровня`);
  if (s.money < it.price) return fail(s, `Нужно $${it.price}`);
  const cur = item(s.eco.gear[it.slot]);
  const wear = !cur || cur.price < it.price;
  return ok({ ...s, money: s.money - it.price, eco: { ...s.eco, owned: [...s.eco.owned, id], gear: wear ? { ...s.eco.gear, [it.slot]: id } : s.eco.gear } }, `${it.name} куплен${wear ? " и надет" : ""}`);
}
export function equip<T extends EcoHost>(s: T, id: string): Result<T> {
  const it = item(id);
  if (!it || !s.eco.owned.includes(id)) return fail(s, "Предмета нет в сумке");
  return ok({ ...s, eco: { ...s.eco, gear: { ...s.eco.gear, [it.slot]: id } } }, `${it.name} надет`);
}
export function buyBusiness<T extends EcoHost>(s: T, id: string, now: number): Result<T> {
  const b = businesses.find((x) => x.id === id);
  if (!b) return fail(s, "Нет такой точки");
  if (s.level < b.lvl) return fail(s, `Доступно с ${b.lvl} уровня`);
  const price = bizPrice(s, b);
  if (s.money < price) return fail(s, `Нужно $${price}`);
  const banked = pendingIncome(s, now);
  return ok({ ...s, money: s.money - price, reputation: s.reputation + 2, eco: { ...s.eco, banked, incomeAt: now, biz: { ...s.eco.biz, [id]: (s.eco.biz[id] ?? 0) + 1 } } }, `${b.name}: +$${b.inc}/ч`);
}
export function collect<T extends EcoHost>(s: T, now: number): Result<T> {
  const v = pendingIncome(s, now);
  if (v <= 0) return fail(s, "Пока нечего собирать");
  return ok({ ...addMoney(s, v), eco: { ...addMoney(s, v).eco, banked: 0, incomeAt: now } }, `Собрано: +$${v}`);
}
export function buyHome<T extends EcoHost>(s: T, index: number): Result<T> {
  const h = homes[index];
  if (!h || index !== s.eco.home + 1) return fail(s, "Сначала предыдущее жильё");
  if (s.level < h.lvl) return fail(s, `Доступно с ${h.lvl} уровня`);
  if (s.money < h.price) return fail(s, `Нужно $${h.price}`);
  const next = { ...s, money: s.money - h.price, eco: { ...s.eco, home: index } };
  return ok({ ...next, energy: maxEnergy(next) }, `Переезд: ${h.name}`);
}
export function buyFurniture<T extends EcoHost>(s: T, id: string): Result<T> {
  const f = furniture.find((x) => x.id === id);
  if (!f) return fail(s, "Нет такой вещи");
  if (s.eco.furniture.includes(id)) return fail(s, "Уже стоит в хате");
  if (s.money < f.price) return fail(s, `Нужно $${f.price}`);
  return ok({ ...s, money: s.money - f.price, eco: { ...s.eco, furniture: [...s.eco.furniture, id] } }, `${f.name} теперь в хате`);
}
export function train<T extends EcoHost>(s: T, k: StatKey): Result<T> {
  const price = statPrice(s.eco.stats[k]);
  if (s.money < price) return fail(s, `Нужно $${price}`);
  const next = { ...s, money: s.money - price, eco: { ...s.eco, stats: { ...s.eco.stats, [k]: s.eco.stats[k] + 1 } } };
  return ok(k === "end" ? { ...next, health: next.health + 10 } : next, "Тренировка: +1");
}
export function spendPoint<T extends EcoHost>(s: T, k: StatKey): Result<T> {
  if (s.eco.points <= 0) return fail(s, "Нет свободных очков");
  const next = { ...s, eco: { ...s.eco, points: s.eco.points - 1, stats: { ...s.eco.stats, [k]: s.eco.stats[k] + 1 } } };
  return ok(k === "end" ? { ...next, health: next.health + 10 } : next, "+1 к параметру");
}
export function hire<T extends EcoHost>(s: T): Result<T> {
  if (s.eco.crew >= crewMax(s)) return fail(s, "Больше бойцов не потянуть — нужен уровень выше");
  const price = crewPrice(s);
  if (s.money < price) return fail(s, `Нужно $${price}`);
  return ok({ ...s, money: s.money - price, reputation: s.reputation + 3, eco: { ...s.eco, crew: s.eco.crew + 1 } }, `В бригаде ${s.eco.crew + 1} бойцов`);
}
export function deposit<T extends EcoHost>(s: T, amount: number): Result<T> {
  const v = Math.min(amount, s.money, safeCapacity(s) - s.eco.safe);
  if (v <= 0) return fail(s, safeCapacity(s) <= s.eco.safe ? "Сейф полон" : "Нечего класть");
  return ok({ ...s, money: s.money - v, eco: { ...s.eco, safe: s.eco.safe + v } }, `В сейф: $${v}`);
}
export function withdraw<T extends EcoHost>(s: T, amount: number): Result<T> {
  const v = Math.min(amount, s.eco.safe);
  if (v <= 0) return fail(s, "Сейф пуст");
  return ok({ ...s, money: s.money + v, eco: { ...s.eco, safe: s.eco.safe - v } }, `Из сейфа: $${v}`);
}
export function heal<T extends EcoHost>(s: T): Result<T> {
  const price = healPrice(s);
  if (!price) return fail(s, "Здоровье полное");
  if (s.money < price) return fail(s, `Нужно $${price}`);
  return ok({ ...s, money: s.money - price, health: maxHealth(s) }, `Подлечился за $${price}`);
}

/** Проверка сохранённой экономики (для parseSave). */
export function isEconomy(e: unknown): e is Economy {
  if (!e || typeof e !== "object") return false;
  const x = e as Record<string, unknown>;
  const num = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0;
  const stats = x.stats as Record<string, unknown> | undefined;
  const gear = x.gear as Record<string, unknown> | undefined;
  return (
    !!stats && ["str", "def", "agi", "end"].every((k) => num(stats[k])) &&
    ["points", "gold", "safe", "banked", "incomeAt", "home", "crew", "jobsTotal", "wins", "losses", "regenAt", "hpAt", "restAt", "earned"].every((k) => num(x[k])) &&
    (x.home as number) < homes.length &&
    !!gear && ["weapon", "armor", "extra"].every((k) => gear[k] === null || items.some((i) => i.id === gear[k])) &&
    Array.isArray(x.owned) && x.owned.every((id) => items.some((i) => i.id === id)) &&
    Array.isArray(x.furniture) && x.furniture.every((id) => furniture.some((f) => f.id === id)) &&
    Array.isArray(x.captured) && x.captured.every((id) => turfs.some((t) => t.id === id)) &&
    !!x.biz && typeof x.biz === "object" && Object.entries(x.biz).every(([k, v]) => businesses.some((b) => b.id === k) && num(v)) &&
    !!x.mastery && typeof x.mastery === "object" &&
    !!x.bosses && typeof x.bosses === "object" &&
    !!x.bossKills && typeof x.bossKills === "object"
  );
}
