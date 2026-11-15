import { test, expect } from "@playwright/test";
const screens = {
  profile: "Профиль",
  map: "Карта города",
  city: "Город",
  quests: "Задания",
  contacts: "Жители",
  orgs: "Организации",
  inventory: "Вещи",
  settings: "Настройки",
};
test("восемь отдельных экранов без переполнения и выходов меню за границы", async ({
  page,
}) => {
  for (const [hash, title] of Object.entries(screens)) {
    await page.goto("/#" + hash);
    await expect(page.locator("h1")).toHaveText(title);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".screen-scroll")
        .evaluate((e) => e.scrollWidth <= e.clientWidth),
    ).toBe(true);
    await expect(page.locator(".bottom-nav")).toBeVisible();
  }
  await page.goto("/#profile");
  await expect(page.locator(".character-image")).toBeVisible();
  const envelope = await page
    .locator(".quest-ribbon > .medallion")
    .boundingBox();
  expect(envelope).not.toBeNull();
  expect(Math.abs(envelope!.width / envelope!.height - 1)).toBeLessThan(0.02);
  expect(envelope!.width).toBeLessThanOrEqual(45);
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Карта", exact: true })
    .click();
  await expect(page).toHaveURL(/#map$/);
  await page.goBack();
  await expect(page.locator("h1")).toHaveText("Профиль");
});
test("первая глава, перезагрузка и отмена сброса", async ({ page }) => {
  await page.goto("/#quests");
  const story = page.locator(".story");
  for (const label of [
    "Что внутри конверта?",
    "Хорошо. Доставлю письмо",
    "Отправиться · −5 энергии",
    "Передать запечатанный конверт",
    "Остаться и выслушать",
    "Отправиться · −5 энергии",
    "Спросить, как можно помочь законно",
    "Завершить первую главу",
  ])
    await story.getByRole("button", { name: label, exact: false }).click();
  await expect(story).toContainText("Глава I завершена");
  await page.reload();
  await expect(story).toContainText("Глава I завершена");
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await page.getByRole("button", { name: "Новая игра", exact: true }).click();
  await page
    .getByRole("button", { name: "Продолжить историю", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("empire-city:save")!).stage,
    ),
  ).toBe("complete");
});
test("житель, знакомство, сохранение и окно предмета", async ({ page }) => {
  await page.goto("/#contacts");
  await page.getByRole("textbox", { name: "Найти жителя" }).fill("Эмма");
  await expect(page.locator(".resident-card")).toHaveCount(1);
  await page.locator(".resident-card").click();
  await page
    .getByRole("button", { name: "Представиться", exact: true })
    .click();
  await expect(page.locator(".npc-profile blockquote")).toContainText(
    "Эмма Уилсон",
  );
  await page.getByRole("button", { name: "Закрыть окно", exact: true }).click();
  await page.reload();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("empire-city:save")!).decisions.some(
        (d: { id: string }) => d.id === "meet:emma",
      ),
    ),
  ).toBe(true);
  await page.goto("/#profile");
  await page
    .getByRole("button", { name: "Старый телефон", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Старый телефон");
});
