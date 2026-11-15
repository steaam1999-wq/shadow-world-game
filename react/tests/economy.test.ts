import { describe, it, expect } from "vitest";
import { freshGame, parseSave, type GameState } from "../src/game";
import {
  levelInfo, levelFor, xpNeed, addXp, maxEnergy, maxHealth, attack, defense, safeCapacity,
  doJob, fight, raid, capture, buyItem, equip, buyBusiness, collect, buyHome, buyFurniture,
  train, spendPoint, hire, deposit, withdraw, heal, tick, pendingIncome, incomePerHour, bizPrice,
  bossHealth, makeOpponents, bosses, businesses, statPrice, isEconomy,
  ENERGY_REGEN_MS, HEALTH_REGEN_MS, BOSS_RESPAWN_MS, INCOME_CAP_H, type Opponent,
} from "../src/economy";

/** Детерминированный генератор: одинаковые зёрна — одинаковые бои. */
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const always = (v: number) => () => v;
const T0 = 1_700_000_000_000;
const game = (patch: Partial<GameState> = {}, eco: Partial<GameState["eco"]> = {}): GameState => {
  const g = freshGame(T0);
  return { ...g, ...patch, eco: { ...g.eco, ...eco } };
};
const atLevel = (level: number, patch: Partial<GameState> = {}, eco: Partial<GameState["eco"]> = {}) => {
  let xp = 0;
  for (let l = 1; l < level; l++) xp += xpNeed(l);
  return game({ xp, level, ...patch }, eco);
};
const dummy = (o: Partial<Opponent> = {}): Opponent => ({ name: "Груша", level: 1, hp: 10, maxHp: 10, atk: 1, def: 0, agi: 0, seed: 1, ...o });
const tank = (): Opponent => ({ name: "Танк", level: 30, hp: 99999, maxHp: 99999, atk: 9999, def: 9999, agi: 0, seed: 2 });

describe("Уровни и опыт", () => {
  it("считает уровень по суммарному опыту на границах", () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(xpNeed(1) - 1)).toBe(1);
    expect(levelFor(xpNeed(1))).toBe(2);
    expect(levelFor(xpNeed(1) + xpNeed(2))).toBe(3);
    expect(levelInfo(xpNeed(1) + 5)).toEqual({ level: 2, into: 5, need: xpNeed(2) });
  });
  it("на новом уровне даёт очки, золото и восстанавливает силы", () => {
    const s = addXp(game({ energy: 3, health: 20 }), xpNeed(1) + xpNeed(2));
    expect(s.level).toBe(3);
    expect(s.eco.points).toBe(6);
    expect(s.eco.gold).toBe(5 + 4);
    expect(s.energy).toBe(maxEnergy(s));
    expect(s.health).toBe(maxHealth(s));
  });
});

describe("Движухи", () => {
  it("проверяет уровень и энергию", () => {
    expect(doJob(game(), "car", always(0.99)).ok).toBe(false);
    expect(doJob(game({ energy: 4 }), "port", always(0.99)).ok).toBe(false);
  });
  it("платит, даёт опыт и мастерство; через 10 раз доход растёт на 25%", () => {
    let s = game({ money: 0, energy: 1000 });
    const r = doJob(s, "courier", always(0.9999));
    expect(r.ok && r.win).toBe(true);
    expect(r.state.money).toBe(400);
    expect(r.state.energy).toBe(992);
    expect(r.state.eco.mastery.courier).toBe(10);
    s = { ...s, eco: { ...s.eco, mastery: { courier: 100 } } };
    expect(doJob(s, "courier", always(0.9999)).state.money).toBe(500);
  });
  it("при срыве забирает здоровье, но даёт треть опыта", () => {
    const r = doJob(game(), "port", always(0));
    expect(r.win).toBe(false);
    expect(r.state.health).toBeLessThan(100);
    expect(r.state.xp).toBe(2);
    expect(r.state.money).toBe(150);
  });
});

describe("Бои", () => {
  it("победа даёт деньги, опыт и счёт побед", () => {
    const r = fight(game(), dummy(), "Я", seeded(1));
    expect(r.win).toBe(true);
    expect(r.state.eco.wins).toBe(1);
    expect(r.state.money).toBeGreaterThan(150);
    expect(r.state.energy).toBe(95);
  });
  it("поражение забирает 10% наличных, сейф не трогает", () => {
    const r = fight(game({ money: 1000 }, { safe: 500 }), tank(), "Я", seeded(2));
    expect(r.win).toBe(false);
    expect(r.state.money).toBe(900);
    expect(r.state.eco.safe).toBe(500);
    expect(r.state.health).toBeGreaterThanOrEqual(1);
  });
  it("не пускает в драку без здоровья и энергии", () => {
    expect(fight(game({ health: 10 }), dummy(), "Я", seeded(3)).ok).toBe(false);
    expect(fight(game({ energy: 4 }), dummy(), "Я", seeded(3)).ok).toBe(false);
  });
  it("генерирует соперников около уровня игрока", () => {
    const list = makeOpponents(10, seeded(4), 20);
    expect(list.every((o) => o.level >= 8 && o.level <= 12)).toBe(true);
  });
});

describe("Рейды и районы", () => {
  it("урон по боссу сохраняется, после победы босс возвращается через 30 минут", () => {
    const boar = bosses[0];
    let s = atLevel(20, { energy: 1000 }, { stats: { str: 200, def: 200, agi: 0, end: 5, int: 5 } });
    const first = raid(s, "boar", "Я", seeded(5), T0);
    expect(first.ok).toBe(true);
    s = first.state;
    if (!first.win) expect(bossHealth(s, boar, T0).hp).toBeLessThan(boar.hp);
    let guard = 0;
    while (!bossHealth(s, boar, T0).dead && guard++ < 50) s = raid({ ...s, health: maxHealth(s) }, "boar", "Я", seeded(guard), T0).state;
    expect(s.eco.bossKills.boar).toBe(1);
    expect(raid(s, "boar", "Я", seeded(9), T0 + 1000).ok).toBe(false);
    expect(bossHealth(s, boar, T0 + BOSS_RESPAWN_MS + 1).dead).toBe(false);
  });
  it("захват района добавляет доход и не повторяется", () => {
    const s = atLevel(5, { energy: 100 }, { stats: { str: 60, def: 60, agi: 10, end: 5, int: 5 } });
    const r = capture(s, "west", "Я", seeded(6), T0);
    expect(r.win).toBe(true);
    expect(r.state.eco.captured).toEqual(["west"]);
    expect(incomePerHour(r.state)).toBe(150);
    expect(capture(r.state, "west", "Я", seeded(6), T0).ok).toBe(false);
    expect(capture(game(), "kings", "Я", seeded(6), T0).ok).toBe(false);
  });
});

describe("Барыга и снаряжение", () => {
  it("покупка кладёт вещь в сумку; в пустой слот надевает, занятый не трогает", () => {
    let s = atLevel(5, { money: 10000 });
    s = buyItem(s, "bat").state;
    expect(s.eco.loadout.equipment.weapon?.defId).toBe("bat");
    expect(attack(s)).toBe(5 * 2 + 8);
    s = buyItem(s, "knuckles").state;
    expect(s.eco.loadout.equipment.weapon?.defId).toBe("bat");
    const knuckles = s.eco.loadout.items.find((i) => i.defId === "knuckles")!;
    s = equip(s, knuckles.uid).state;
    expect(s.eco.loadout.equipment.weapon?.defId).toBe("knuckles");
    expect(s.eco.loadout.items.some((i) => i.defId === "bat")).toBe(true);
    expect(buyItem(game(), "carbine").ok).toBe(false);
  });
  it("старт: футболка, джинсы и кроссовки уже надеты", () => {
    const eq = game().eco.loadout.equipment;
    expect([eq.chest?.defId, eq.legs?.defId, eq.feet?.defId]).toEqual(["tee", "jeans", "sneakers"]);
  });
});

describe("Точки и доход", () => {
  it("цена растёт на 15% за каждую, доход копится максимум 12 часов", () => {
    let s = game({ money: 10000 });
    const kiosk = businesses[0];
    s = buyBusiness(s, "kiosk", T0).state;
    expect(bizPrice(s, kiosk)).toBe(Math.round(1500 * 1.15));
    expect(pendingIncome(s, T0 + 3_600_000)).toBe(60);
    expect(pendingIncome(s, T0 + 100 * 3_600_000)).toBe(60 * INCOME_CAP_H);
    const c = collect(s, T0 + 3_600_000);
    expect(c.state.money).toBe(s.money + 60);
    expect(pendingIncome(c.state, T0 + 3_600_000)).toBe(0);
  });
  it("вторая покупка фиксирует уже накопленное", () => {
    let s = buyBusiness(game({ money: 10000 }), "kiosk", T0).state;
    s = buyBusiness(s, "kiosk", T0 + 3_600_000).state;
    expect(pendingIncome(s, T0 + 2 * 3_600_000)).toBe(60 + 120);
  });
});

describe("Жильё, хата, тренировки, бригада, сейф", () => {
  it("жильё покупается по порядку и даёт энергию и сейф", () => {
    let s = atLevel(10, { money: 200000 });
    expect(buyHome(s, 2).ok).toBe(false);
    s = buyHome(s, 1).state;
    expect(maxEnergy(s)).toBe(100 + 9 * 2 + 10);
    expect(safeCapacity(s)).toBe(25000);
    s = buyFurniture(s, "safe").state;
    s = buyFurniture(s, "fridge").state;
    expect(safeCapacity(s)).toBe(50000);
    expect(maxEnergy(s)).toBe(100 + 18 + 10 + 10);
  });
  it("тренировки и очки повышают параметры", () => {
    let s = game({ money: 10000 }, { points: 1 });
    const price = statPrice(5);
    s = train(s, "def").state;
    expect(s.money).toBe(10000 - price);
    // защита 6×2 + броня стартовых вещей (футболка +1, джинсы +1)
    expect(defense(s)).toBe(12 + 2);
    s = spendPoint(s, "end").state;
    expect(maxHealth(s)).toBe(110);
    expect(spendPoint(s, "end").ok).toBe(false);
  });
  it("бригада ограничена уровнем", () => {
    let s = game({ money: 1e6 });
    for (let i = 0; i < 5; i++) s = hire(s).state;
    expect(s.eco.crew).toBe(3);
    expect(attack(s)).toBe(10 + 9);
  });
  it("сейф ограничен вместимостью", () => {
    let s = game({ money: 9000 });
    s = deposit(s, 9000).state;
    expect(s.eco.safe).toBe(5000);
    expect(s.money).toBe(4000);
    expect(deposit(s, 1).ok).toBe(false);
    s = withdraw(s, 2000).state;
    expect(s.money).toBe(6000);
  });
  it("лечение стоит денег и восстанавливает здоровье", () => {
    const r = heal(game({ health: 50, money: 1000 }));
    expect(r.ok).toBe(true);
    expect(r.state.health).toBe(100);
    expect(heal(game()).ok).toBe(false);
  });
});

describe("Восстановление по времени", () => {
  it("энергия 1 за 20 с, здоровье 1 за 6 с; диван ускоряет вдвое", () => {
    const s = game({ energy: 50, health: 50 });
    const t = tick(s, T0 + ENERGY_REGEN_MS * 3);
    expect(t.energy).toBe(53);
    expect(t.health).toBe(60);
    const sofa = tick(game({ health: 50 }, { furniture: ["sofa"] }), T0 + HEALTH_REGEN_MS * 2);
    expect(sofa.health).toBe(54);
  });
  it("без изменений возвращает то же состояние", () => {
    const s = game({ energy: 50 });
    expect(tick(s, T0 + 1000)).toBe(s);
  });
  it("не превышает максимум и не копит запас", () => {
    const s = tick(game({ energy: 99 }), T0 + ENERGY_REGEN_MS * 100);
    expect(s.energy).toBe(100);
    const later = tick({ ...s, energy: 90 }, T0 + ENERGY_REGEN_MS * 101);
    expect(later.energy).toBe(91);
  });
});

describe("Сохранение экономики", () => {
  it("состояние после действий проходит проверку и восстанавливается", () => {
    let s = atLevel(6, { money: 50000, energy: 200 });
    s = buyItem(s, "bat").state;
    s = buyBusiness(s, "kiosk", T0).state;
    s = doJob(s, "courier", seeded(7)).state;
    s = hire(s).state;
    expect(isEconomy(s.eco)).toBe(true);
    const capped = { ...s, energy: Math.min(s.energy, maxEnergy(s)) };
    expect(parseSave(JSON.stringify(capped))).toEqual(capped);
  });
});
