import { describe, it, expect } from "vitest";
import {
  combatTurn, flee, startBattle, npcCombatant, hitChance, critChance, absorb, effectChance, canUse, skills, roles,
  type Combatant, type Battle,
} from "../src/combat";
import { freshGame, parseSave, type GameState } from "../src/game";
import { playerCombatant, settleFight, settleRaid, settleCapture, beginFight, beginRaid, bossHealth, bosses, makeOpponents, setRole, maxAdrenaline, FIGHT_ENERGY } from "../src/economy";

const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const always = (v: number) => () => v;
const T0 = 1_700_000_000_000;

const fighter = (o: Partial<Combatant> = {}): Combatant => ({
  name: "Игрок", hp: 200, maxHp: 200, ap: 100, maxAp: 100, str: 20, agi: 10, int: 10, atk: 40, armor: 20, level: 5,
  effects: [], cooldowns: {}, skills: roles.brute.skills, ...o,
});
const dummy = (o: Partial<Combatant> = {}): Combatant => fighter({ name: "Манекен", hp: 500, maxHp: 500, atk: 1, armor: 0, agi: 0, int: 0, skills: ["strike"], ...o });

describe("Формулы", () => {
  it("попадание, крит и поглощение бронёй в разумных пределах", () => {
    expect(hitChance(fighter(), fighter({ agi: 0 }))).toBeLessThanOrEqual(0.97);
    expect(hitChance(fighter({ agi: 0, level: 1 }), fighter({ agi: 500 }))).toBeGreaterThanOrEqual(0.55);
    expect(critChance(fighter({ agi: 0 }))).toBe(0.05);
    expect(critChance(fighter({ agi: 9999 }))).toBe(0.45);
    expect(absorb(0)).toBe(0);
    expect(absorb(100)).toBe(0.5);
    expect(effectChance(fighter({ int: 100 }), fighter({ int: 0 }))).toBe(0.85);
    expect(effectChance(fighter({ int: 0 }), fighter({ int: 100 }))).toBe(0.2);
  });
});

describe("Ход боя", () => {
  it("не меняет исходное состояние и игнорирует недоступный приём", () => {
    const b = startBattle(fighter(), dummy());
    const copy = structuredClone(b);
    const next = combatTurn(b, "strike", seeded(1));
    expect(b).toEqual(copy);
    expect(next.turn).toBe(1);
    expect(combatTurn(b, "aimed", seeded(1))).toBe(b); // не в наборе громилы
    expect(combatTurn({ ...b, player: { ...b.player, ap: 0 } }, "smash", seeded(1)).turn).toBe(0);
  });
  it("приём тратит адреналин и уходит на перезарядку", () => {
    const b = combatTurn(startBattle(fighter({ ap: 30, maxAp: 100, int: 0 }), dummy()), "smash", always(0.1));
    expect(b.player.ap).toBe(30 - skills.smash.cost + 8);
    expect(b.player.cooldowns.smash).toBe(2);
    expect(canUse(b.player, "smash")).toBe(false);
    const b2 = combatTurn(combatTurn(b, "strike", always(0.1)), "strike", always(0.1));
    expect(canUse(b2.player, "smash")).toBe(true);
  });
  it("подсечка оглушает: противник пропускает ход", () => {
    const b = combatTurn(startBattle(fighter({ int: 50 }), dummy({ atk: 50 })), "trip", always(0.1));
    expect(b.log.some((l) => l.includes("оглушён"))).toBe(true);
    expect(b.log.some((l) => l.includes("пропускает ход"))).toBe(true);
    expect(b.player.hp).toBe(200);
  });
  it("кровотечение наносит урон каждый ход", () => {
    let b = combatTurn(startBattle(fighter(), dummy()), "knife", always(0.1));
    const bleed = b.enemy.effects.find((e) => e.kind === "bleed")!;
    expect(bleed).toBeDefined();
    const hp = b.enemy.hp;
    b = combatTurn(b, "strike", always(0.99)); // промах игрока, но кровь идёт
    expect(b.enemy.hp).toBe(hp - bleed.power);
  });
  it("перевязка лечит, но не выше максимума", () => {
    const b = combatTurn(startBattle(fighter({ hp: 50 }), dummy({ atk: 0.0001 })), "bandage", always(0.99));
    expect(b.player.hp).toBeGreaterThan(50);
    const full = combatTurn(startBattle(fighter({ hp: 199 }), dummy({ atk: 0.0001 })), "bandage", always(0.99));
    expect(full.player.hp).toBeLessThanOrEqual(200);
  });
  it("одинаковые зёрна дают одинаковый бой", () => {
    const run = () => { let b: Battle = startBattle(fighter(), npcCombatant({ name: "Шрам", hp: 300, atk: 40, def: 20, agi: 10, level: 5 })); const r = seeded(42); while (!b.over) b = combatTurn(b, "strike", r); return b; };
    expect(run()).toEqual(run());
  });
  it("бой заканчивается нокаутом, бегством или лимитом ходов", () => {
    let b = startBattle(fighter({ atk: 9999 }), dummy({ hp: 10, maxHp: 10 }));
    b = combatTurn(b, "strike", always(0.1));
    expect(b.over && b.winner).toBe("player");
    expect(flee(startBattle(fighter(), dummy())).winner).toBe("enemy");
    let t = startBattle(fighter({ atk: 1 }), dummy({ hp: 100000, maxHp: 100000 }), 3);
    for (let i = 0; i < 5; i++) t = combatTurn(t, "strike", always(0.5));
    expect(t.over).toBe(true);
    expect(t.turn).toBe(3);
  });
});

describe("Бой и экономика", () => {
  const game = (patch: Partial<GameState> = {}) => ({ ...freshGame(T0), ...patch });
  it("боец игрока берёт параметры, стиль и адреналин из персонажа", () => {
    const s = setRole(game(), "surgeon").state;
    const c = playerCombatant(s, "Я");
    expect(c.skills).toEqual(roles.surgeon.skills);
    expect(c.maxAp).toBe(maxAdrenaline(s));
    expect(c.hp).toBe(s.health);
  });
  it("вход в бой списывает энергию; итог начисляет награду или штраф", () => {
    const s = game({ money: 1000 });
    const started = beginFight(s);
    expect(started.state.energy).toBe(s.energy - FIGHT_ENERGY);
    const o = makeOpponents(1, seeded(3), 1)[0];
    const won: Battle = { ...startBattle(playerCombatant(s, "Я"), npcCombatant(o)), over: true, winner: "player" };
    const w = settleFight(started.state, o, won, seeded(4));
    expect(w.state.eco.wins).toBe(1);
    expect(w.state.money).toBeGreaterThan(1000);
    const lost: Battle = { ...won, winner: "enemy", player: { ...won.player, hp: 0 } };
    const l = settleFight(started.state, o, lost, seeded(4));
    expect(l.state.money).toBe(900);
    expect(l.state.health).toBe(1);
  });
  it("урон по боссу сохраняется между заходами, смерть босса даёт награду", () => {
    const boar = bosses[0];
    let s = { ...game(), xp: 1000, level: 5 };
    expect(beginRaid({ ...game() }, "boar", T0).ok).toBe(false); // уровень мал
    const b: Battle = { ...startBattle(playerCombatant(s, "Я"), npcCombatant({ name: boar.name, hp: 300, maxHp: boar.hp, atk: 1, def: 0, agi: 0, level: 3 })), over: true, winner: "enemy", dealt: 400 };
    s = settleRaid(s, "boar", b, T0).state;
    expect(bossHealth(s, boar, T0).hp).toBe(300);
    const kill: Battle = { ...b, enemy: { ...b.enemy, hp: 0 }, winner: "player" };
    s = settleRaid(s, "boar", kill, T0).state;
    expect(s.eco.bossKills.boar).toBe(1);
    expect(bossHealth(s, boar, T0).dead).toBe(true);
  });
  it("захват района по итогам пошагового штурма", () => {
    const s = { ...game(), xp: 200, level: 3 };
    const b: Battle = { ...startBattle(playerCombatant(s, "Я"), dummy()), over: true, winner: "player" };
    const r = settleCapture(s, "west", b, T0);
    expect(r.state.eco.captured).toContain("west");
  });
  it("старое сохранение без интуиции и стиля боя загружается", () => {
    const s = freshGame(T0);
    const { int: _i, ...oldStats } = s.eco.stats;
    const { role: _r, ...oldEco } = s.eco;
    const raw = JSON.stringify({ ...s, eco: { ...oldEco, stats: oldStats } });
    const loaded = parseSave(raw);
    expect(loaded).not.toBeNull();
    expect(loaded!.eco.stats.int).toBe(5);
    expect(loaded!.eco.role).toBe("brute");
  });
});
