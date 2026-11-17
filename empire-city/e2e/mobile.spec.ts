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
  arena: "Арена",
  progress: "Ранги и достижения",
};
test("десять отдельных экранов без переполнения и выходов меню за границы", async ({
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
  await expect(page.locator(".avatar-renderer")).toBeVisible();
  const envelope = await page
    .locator(".profile-mission > .medallion")
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
  await page.goto("/#inventory");
  await page.getByRole("button", { name: "Смартфон", exact: false }).click();
  await expect(page.getByRole("dialog")).toContainText("Смартфон");
});

test("экипировка меняет слой аватара, арена выдаёт награду", async ({
  page,
}) => {
  await page.goto("/#inventory");
  await page
    .locator(".gear-card")
    .filter({ hasText: "Тренировочные перчатки" })
    .click();
  await expect(page.locator('[data-slot="weapon"]')).toHaveCount(1);
  await page.goto("/#profile");
  await expect(page.locator('[data-slot="weapon"]')).toHaveCount(1);
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Арена", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Начать спарринг", exact: true })
    .first()
    .click();
  while (await page.getByRole("button", { name: "Удар", exact: true }).count())
    await page.getByRole("button", { name: "Удар", exact: true }).click();
  await expect(page.locator(".fight-panel")).toContainText(
    "Победа. Награда зачислена.",
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("empire-city:save")!).arenaWins,
    ),
  ).toBe(1);
});

test("одетый герой, сцена города, карта и крупный портрет Алины", async ({
  page,
}) => {
  await page.goto("/#profile");
  for (const slot of ["Верх:", "Брюки:", "Обувь:"])
    await expect(
      page.getByRole("button", { name: new RegExp("^" + slot) }),
    ).toBeVisible();
  await page.goto("/#city");
  await expect(page.locator(".hub-action")).toHaveCount(6);
  await page.locator(".hub-action").filter({ hasText: "Арена" }).click();
  await expect(page.locator("h1")).toHaveText("Арена");
  await page
    .getByRole("button", { name: "Выбрать бойца: Алина «Вектор»", exact: true })
    .click();
  await expect(
    page.locator(".opponent-card .fighter-portrait"),
  ).toHaveAttribute("aria-label", "Алина «Вектор» крупным планом");
  await page.goto("/#map");
  await expect(page.locator(".district-pin")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Район: Старый город", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Отправиться · −5 энергии", exact: true })
    .click();
  await expect(page.locator(".hub-heading")).toContainText("Старый город");
});

test("компактный профиль и локация не растягиваются по высоте", async ({
  page,
}) => {
  await page.goto("/#profile");
  const figure = await page.locator(".profile-figure").boundingBox();
  const card = await page.locator(".profile-portrait-card").boundingBox();
  const location = await page.locator(".profile-location").boundingBox();
  const vitals = await page.locator(".profile-vitals").boundingBox();
  expect(figure).not.toBeNull();
  expect(card).not.toBeNull();
  expect(location).not.toBeNull();
  expect(vitals).not.toBeNull();
  expect(figure!.height).toBeGreaterThanOrEqual(180);
  expect(figure!.height).toBeLessThanOrEqual(280);
  expect(card!.height).toBeLessThanOrEqual(365);
  expect(location!.height).toBeLessThanOrEqual(48);
  expect(location!.y).toBeGreaterThanOrEqual(figure!.y + figure!.height - 1);
  expect(vitals!.y).toBeGreaterThanOrEqual(card!.y + card!.height);
  await expect(page.locator(".profile-avatar .painted-master")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".profile-avatar .painted-master")
        .evaluate((e: HTMLImageElement) => e.complete && e.naturalHeight > 0),
    )
    .toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
