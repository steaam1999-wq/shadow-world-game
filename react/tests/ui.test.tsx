// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import App from "../src/App";
import { pages, pageNames, type Page } from "../src/navigation";
import { SAVE_KEY } from "../src/game";
let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    value: vi.fn(),
    configurable: true,
  });
  localStorage.clear();
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
  it("показывает профиль с полноростовым героем и открывает восемь экранов без потери прогресса", async () => {
    expect(host.querySelector(".character-image")).not.toBeNull();
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
      "Отправиться · −5 энергии",
      "Спросить, как можно помочь законно",
      "Завершить первую главу",
    ])
      await click(text);
    expect(saved()).toMatchObject({
      stage: "complete",
      money: 270,
      xp: 105,
      level: 2,
      energy: 70,
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
