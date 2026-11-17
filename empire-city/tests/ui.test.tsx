// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import App from "../src/App";
import { pages, pageNames, type Page } from "../src/navigation";
import { SAVE_KEY, freshGame } from "../src/game";
import { gearCatalog } from "../src/equipment";
let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    value: vi.fn(),
    configurable: true,
  });
  localStorage.clear();
  localStorage.setItem(SAVE_KEY, JSON.stringify(freshGame()));
  window.history.replaceState(null, "", "/");
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root.render(<App />);
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
const button = (name: string) => {
  const found = Array.from(host.querySelectorAll("button")).find(
    (b) =>
      b.getAttribute("aria-label") === name ||
      b.textContent?.trim() === name ||
      b.querySelector("b")?.textContent === name,
  );
  if (!found) throw Error("Кнопка не найдена: " + name);
  return found;
};
const click = async (name: string) => {
  await act(async () => {
    button(name).click();
    await new Promise((r) => setTimeout(r, 0));
  });
};
const route = async (page: Page) => {
  await act(async () => {
    window.history.replaceState(null, "", "/#" + page);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
};
const saved = () => JSON.parse(localStorage.getItem(SAVE_KEY)!);
describe("Новый игровой интерфейс", () => {
  it("показывает профиль с полноростовым героем и открывает десять экранов без потери прогресса", async () => {
    expect(host.querySelector(".avatar-renderer")).not.toBeNull();
    expect(host.querySelector(".hero")).toBeNull();
    expect(host.querySelectorAll(".bottom-nav>button")).toHaveLength(5);
    for (const p of pages) {
      await route(p);
      expect(host.querySelector("h1")?.textContent).toBe(pageNames[p]);
      expect(saved().money).toBe(150);
    }
    await click("Открыть меню");
    expect(host.querySelector("[role=dialog]")).not.toBeNull();
    await click("Закрыть окно");
    expect(host.querySelector("[role=dialog]")).toBeNull();
  });
  it("проходит главу через реальные кнопки интерфейса и восстанавливает её после перемонтирования", async () => {
    await route("quests");
    for (const text of [
      "Выбрать работу в баре",
      "Отправиться · −5 энергии",
      "Помочь на кухне",
      "Поблагодарить и выйти",
      "Спросить, как можно помочь законно",
      "Завершить первую главу",
    ])
      await click(text);
    expect(saved()).toMatchObject({
      stage: "complete",
      money: 270,
      xp: 105,
      level: 2,
      energy: 75,
      reputation: 6,
    });
    await act(async () => root.unmount());
    root = createRoot(host);
    await act(async () => root.render(<App />));
    expect(host.querySelector(".scene-copy")?.textContent).toContain(
      "Глава I завершена",
    );
    await route("settings");
    await click("Новая игра");
    await click("Продолжить историю");
    expect(saved().stage).toBe("complete");
    expect(host.querySelector("[role=dialog]")).toBeNull();
  });
  it("сохраняет знакомство и блокирует повторную награду через профиль NPC", async () => {
    await route("contacts");
    const emma = Array.from(
      host.querySelectorAll<HTMLButtonElement>(".resident-card"),
    ).find((b) => b.textContent?.includes("Эмма Уилсон"))!;
    await act(async () => emma.click());
    await click("Представиться");
    expect(saved().relations.emma).toBe(48);
    expect(saved().energy).toBe(95);
    expect(
      host.querySelector(".npc-profile blockquote")?.textContent,
    ).toContain("Эмма Уилсон");
    expect(
      Array.from(host.querySelectorAll("button")).some(
        (b) => b.textContent === "Представиться",
      ),
    ).toBe(false);
    await click("Закрыть окно");
    await act(async () => emma.click());
    expect(saved().xp).toBe(5);
  });
});

describe("Экипировка и арена в интерфейсе", () => {
  it("заменяет футболку на худи, обновляет обувь и восстанавливает наряд после загрузки", async () => {
    const game = { ...freshGame(), level: 2, xp: 100 };
    game.loadout.inventory.push(
      gearCatalog["gear.hoodie"],
      gearCatalog["gear.cargo"],
    );
    await act(async () => root.unmount());
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    root = createRoot(host);
    await act(async () => root.render(<App />));
    await route("inventory");
    await click("Городское худи");
    await click("Брюки карго");
    expect(
      host.querySelectorAll('[data-visual-asset="hoodie.gray"]'),
    ).toHaveLength(1);
    expect(host.querySelector('[data-visual-asset="tee.black"]')).toBeNull();
    expect(
      saved().loadout.inventory.filter(
        (i: { id: string }) => i.id === "gear.tee",
      ),
    ).toHaveLength(1);
    await click("Снять Белые кроссовки");
    expect(host.querySelector('[data-base-clothing="feet"]')).not.toBeNull();
    expect(
      host.querySelector('[data-visual-asset="sneakers.white"]'),
    ).toBeNull();
    await click("Белые кроссовки");
    const before = saved().loadout;
    await act(async () => root.unmount());
    root = createRoot(host);
    await act(async () => root.render(<App />));
    expect(saved().loadout).toEqual(before);
    for (const asset of ["hoodie.gray", "cargo.olive", "sneakers.white"])
      expect(
        host.querySelector(`[data-visual-asset="${asset}"]`),
      ).not.toBeNull();
  });

  it("клик по вещи добавляет слой; снятие очищает слой и возвращает вещь", async () => {
    await route("inventory");
    await click("Снять Базовая футболка");
    await click("Базовая футболка");
    expect(saved().loadout.equipment.chest.id).toBe("gear.tee");
    expect(host.querySelector('[data-slot="chest"]')).not.toBeNull();
    await route("profile");
    expect(host.querySelector('[data-slot="chest"]')).not.toBeNull();
    await route("inventory");
    await click("Снять Базовая футболка");
    expect(saved().loadout.equipment.chest).toBeNull();
    expect(host.querySelector('[data-slot="chest"]')).toBeNull();
    expect(
      saved().loadout.inventory.filter(
        (i: { id: string }) => i.id === "gear.tee",
      ),
    ).toHaveLength(1);
  });
  it("экипирует перчатки и завершает спарринг через кнопки", async () => {
    await route("inventory");
    await click("Тренировочные перчатки");
    await route("arena");
    await click("Начать спарринг");
    await route("inventory");
    expect(
      Array.from(host.querySelectorAll<HTMLButtonElement>(".gear-card")).every(
        (b) => b.disabled,
      ),
    ).toBe(true);
    await route("quests");
    expect(
      Array.from(
        host.querySelectorAll<HTMLButtonElement>(".story .choice-button"),
      ).every((b) => b.disabled),
    ).toBe(true);
    await route("map");
    await click("Район: Старый город");
    expect(button("Отправиться · −5 энергии").disabled).toBe(true);
    await route("arena");
    await click("Удар");
    expect(host.querySelector(".player-fighter b")?.textContent).toBe(
      saved().name,
    );
    expect(
      host
        .querySelector('progress[aria-label="Твоё здоровье"]')
        ?.getAttribute("value"),
    ).toBe(String(saved().health));
    expect(
      host
        .querySelector('progress[aria-label^="Здоровье:"]')
        ?.getAttribute("value"),
    ).toBe(String(saved().arena.enemyHealth));
    let turns = 0;
    while (!saved().arena.finished && turns++ < 15) await click("Удар");
    expect(saved().arena.result).toBe("won");
    expect(saved().money).toBe(210);
    expect(saved().arenaWins).toBe(1);
  });
  it("выполняет побочное поручение через выбор в интерфейсе", async () => {
    await route("quests");
    await click("Взять поручение");
    await click("Доставить на метро");
    expect(saved().questProgress["delivery-app"]).toBe("complete");
    expect(saved().money).toBe(195);
  });
});

describe("Игровые сцены", () => {
  it("город открывает арену и прогресс через значки, карта переносит в выбранный район", async () => {
    await route("city");
    expect(host.querySelectorAll(".hub-action")).toHaveLength(6);
    await click("Арена");
    expect(host.querySelector("h1")?.textContent).toBe("Арена");
    await route("city");
    await click("Ранг");
    expect(host.querySelector("h1")?.textContent).toBe("Ранги и достижения");
    await route("map");
    expect(host.querySelectorAll(".district-pin")).toHaveLength(5);
    await click("Район: Старый город");
    await click("Отправиться · −5 энергии");
    expect(saved().district).toBe("old");
    expect(host.querySelector("h1")?.textContent).toBe("Город");
    expect(
      (host.querySelector(".hub-view .city-art") as HTMLElement).style
        .backgroundImage,
    ).toContain("districts/old.webp");
  });
  it("показывает Алину крупным планом при выборе бойца", async () => {
    await route("arena");
    await click("Выбрать бойца: Алина «Вектор»");
    expect(
      host
        .querySelector(".opponent-card .fighter-portrait")
        ?.getAttribute("aria-label"),
    ).toBe("Алина «Вектор» крупным планом");
    expect(host.querySelector(".opponent-card h3")?.textContent).toBe(
      "Алина «Вектор»",
    );
  });
});

describe("Редактор образа", () => {
  it("показывает предпросмотр, отменяет изменения и сохраняет выбранный образ после загрузки", async () => {
    const original = saved();
    await click("Изменить образ");
    await click("Типаж: Ветеран");
    await click("Современная классика");
    expect(
      host.querySelector(".appearance-preview .painted-master"),
    ).not.toBeNull();
    expect(
      host
        .querySelector(".appearance-preview .painted-master")
        ?.getAttribute("src"),
    ).toContain("/painted-hero/classic-master.webp");
    expect(saved()).toEqual(original);
    await click("Отмена");
    expect(host.querySelector("[role=dialog]")).toBeNull();
    expect(saved()).toEqual(original);
    await click("Изменить образ");
    await click("Типаж: Переговорщик");
    await click("Современная классика");
    await click("Сохранить образ");
    expect(saved().appearance.face).toBe("negotiator");
    expect(
      host.querySelector(".profile-avatar image")?.getAttribute("href"),
    ).toContain("/faces/negotiator.webp");
    expect(
      host.querySelector('.profile-avatar [data-visual-asset="coat.charcoal"]'),
    ).not.toBeNull();
    await act(async () => root.unmount());
    root = createRoot(host);
    await act(async () => root.render(<App />));
    expect(saved().appearance.face).toBe("negotiator");
    await route("inventory");
    expect(
      host.querySelector(".equipment-preview image")?.getAttribute("href"),
    ).toContain("/faces/negotiator.webp");
    await click("Снять Городское пальто");
    expect(
      host.querySelector('[data-visual-asset="coat.charcoal"]'),
    ).toBeNull();
    expect(host.querySelector('[data-base-clothing="chest"]')).not.toBeNull();
  });
});

describe("Главный герой по референсу", () => {
  it("показывает новый основной образ без ручного выбора и сохраняет снятие вещи после перезагрузки", async () => {
    await act(async () => root.unmount());
    localStorage.clear();
    root = createRoot(host);
    await act(async () => root.render(<App />));
    expect(
      host.querySelector(".profile-avatar .painted-master"),
    ).not.toBeNull();
    expect(saved().appearance.face).toBe("veteran");
    await route("inventory");
    expect(
      host.querySelector(".equipment-preview .painted-master"),
    ).not.toBeNull();
    await click("Снять Городское пальто");
    expect(host.querySelector(".painted-master")).toBeNull();
    expect(host.querySelector(".painted-avatar")).not.toBeNull();
    expect(host.querySelector('[data-slot="chest"]')).toBeNull();
    await act(async () => root.unmount());
    root = createRoot(host);
    await act(async () => root.render(<App />));
    expect(saved().loadout.equipment.chest).toBeNull();
    await click("Городское пальто");
    expect(
      host.querySelector(".equipment-preview .painted-master"),
    ).not.toBeNull();
  });
});

describe("Спокойная карта", () => {
  it("различает закрытый и текущий районы; после перехода обновляет метку и сохраняет энергию", async () => {
    await route("map");
    expect(
      host.querySelectorAll('.district-pin[aria-current="location"]'),
    ).toHaveLength(1);
    expect(
      host
        .querySelector('.district-pin[aria-current="location"]')
        ?.getAttribute("aria-label"),
    ).toBe("Район: Сити-центр");
    await click("Район: Кингс-дистрикт");
    expect(host.querySelector('[role="dialog"]')?.textContent).toContain(
      "Откроется после завершения главы I",
    );
    expect(host.querySelector(".map-info .game-button")).toBeNull();
    await act(async () =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })),
    );
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    await click("Район: Сити-центр");
    await click("Войти в район");
    expect(saved().energy).toBe(100);
    await route("map");
    await click("Район: Старый город");
    await click("Отправиться · −5 энергии");
    expect(saved().energy).toBe(95);
    await route("map");
    expect(
      host
        .querySelector('.district-pin[aria-current="location"]')
        ?.getAttribute("aria-label"),
    ).toBe("Район: Старый город");
    const before = saved();
    await act(async () => root.unmount());
    root = createRoot(host);
    await act(async () => root.render(<App />));
    expect(saved()).toEqual(before);
    expect(
      host
        .querySelector('.district-pin[aria-current="location"]')
        ?.getAttribute("aria-label"),
    ).toBe("Район: Старый город");
  });
});
describe("Диалоги", () => {
  it("не отнимают фокус у поля ввода при перерисовке игры", async () => {
    await route("profile");
    await click("Изменить образ");
    const input = host.querySelector<HTMLInputElement>(
      ".profile-name-field input",
    )!;
    input.focus();
    // Отдых за окном перерисовывает всё приложение (новое состояние и тост).
    await act(async () => {
      button("Отдохнуть").click();
    });
    expect(document.activeElement).toBe(input);
    await click("Закрыть окно");
    expect(host.querySelector("[role=dialog]")).toBeNull();
  });
});
