import { expect, test } from '@playwright/test'
import { enterDemo, nav, patchState } from './helpers'

// Главные сценарии Match. Каждый тест — с чистого листа, на демо-данных.

test('вход в демо и главная', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await enterDemo(page)
  await expect(page.getByRole('button', { name: /^Чаты/ }).last()).toBeVisible()
  for (const tab of [/^Поиск/, /^Чаты/, /^Профиль/, /^Главная/]) {
    await nav(page, tab)
    await expect(page.getByRole('status', { name: 'Загрузка' })).toHaveCount(0)
  }
  expect(errors).toEqual([])
})

test('создать план — он появляется в ленте', async ({ page }) => {
  await enterDemo(page)
  await nav(page, /^Создать/)
  await page.getByRole('button', { name: /План на встречу/ }).click()
  await page.fill('#act-title', 'Тестовый план: кофе у Октябрьской')
  await page.getByRole('button', { name: 'Опубликовать на 48 часов' }).click()
  await expect(page.getByText('Тестовый план: кофе у Октябрьской').first()).toBeVisible()
})

test('чат: сообщение отправляется и сохраняется', async ({ page }) => {
  await enterDemo(page)
  await nav(page, /^Чаты/)
  await page.locator('main ul > li > button:not([aria-hidden])').first().click()
  const box = page.getByPlaceholder('Сообщение…')
  await box.fill('Привет из автотеста')
  await box.press('Enter')
  await expect(page.getByText('Привет из автотеста')).toBeVisible()
  await page.reload()
  const saved = await page.evaluate(() => localStorage.getItem('iskra-state') ?? '')
  expect(saved).toContain('Привет из автотеста')
})

test('удаление чата свайпом и «Вернуть»', async ({ page }) => {
  await enterDemo(page)
  await nav(page, /^Чаты/)
  const rows = page.locator('main ul > li')
  const before = await rows.count()
  await page.locator('main ul > li button[aria-label^="Удалить чат"]').first().evaluate((b: HTMLButtonElement) => b.click())
  await expect(rows).toHaveCount(before - 1)
  await page.getByRole('button', { name: 'Вернуть' }).click()
  await expect(rows).toHaveCount(before)
  // Удаление без отмены — чат скрывается насовсем.
  await page.locator('main ul > li button[aria-label^="Удалить чат"]').first().evaluate((b: HTMLButtonElement) => b.click())
  await expect(page.getByRole('button', { name: 'Вернуть' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Вернуть' })).toBeHidden({ timeout: 8000 })
  const hidden = await page.evaluate(() => JSON.parse(localStorage.getItem('iskra-state')!).capsules.filter((c: { hidden?: boolean }) => c.hidden).length)
  expect(hidden).toBe(1)
})

test('история открывается ровно на экран', async ({ page }) => {
  await enterDemo(page)
  await patchState(page, (s) => {
    const now = Date.now()
    s.stories = [{ id: 'st1', authorId: 'me', kind: 'text', caption: 'Моя тестовая история', hue: 200, at: now, expiresAt: now + 86_400_000, views: [] }]
  })
  await page.mouse.wheel(0, 400)
  await page.getByRole('button', { name: 'Моя история' }).first().click()
  const viewer = page.getByRole('dialog', { name: /Истории/ })
  await expect(viewer.getByText('Моя тестовая история')).toBeVisible()
  const box = (await viewer.boundingBox())!
  const vp = page.viewportSize()!
  expect(Math.round(box.height)).toBe(vp.height)
  expect(Math.round(box.y)).toBe(0)
})

test('окно подтверждения поверх всего (удаление группы)', async ({ page }) => {
  await enterDemo(page)
  await patchState(page, (s) => {
    s.groups = [{ id: 'g1', title: 'Кофе в субботу', ownerId: 'me', members: s.people.slice(0, 3).map((x: { id: string }) => x.id), createdAt: Date.now(), unread: 0, messages: [] }]
  })
  await nav(page, /^Чаты/)
  await page.locator('button[aria-label="Удалить группу Кофе в субботу"]').evaluate((b: HTMLButtonElement) => b.click())
  const dlg = page.getByRole('alertdialog')
  await expect(dlg).toBeVisible()
  const box = (await dlg.boundingBox())!
  expect(box.height).toBeGreaterThan(300)
  await dlg.getByRole('button', { name: 'Удалить группу' }).click()
  await expect(page.locator('button[aria-label="Удалить группу Кофе в субботу"]')).toHaveCount(0)
})

test('карта: место по GPS, я и люди рядом', async ({ page, context }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 53.93, longitude: 27.61 })
  await enterDemo(page)
  await patchState(page, (s) => { s.me.district = '' })
  await nav(page, /^Поиск/)
  await page.getByRole('tab', { name: /Карта/ }).click()
  await page.getByRole('button', { name: 'Определить по GPS' }).last().click()
  await expect(page.getByRole('img', { name: /^Вы: Минск, Советский/ })).toBeVisible()
  expect(await page.locator('button[aria-label*="р-н"]').count()).toBeGreaterThan(3)
  // Приближение увеличивает аватарки.
  const avatar = page.locator('button[aria-label*="р-н"]').first()
  const small = (await avatar.boundingBox())!.width
  await page.getByRole('button', { name: 'Приблизить' }).click()
  await page.waitForTimeout(600)
  expect((await avatar.boundingBox())!.width).toBeGreaterThan(small)
})

test('самолётик: веер из 5 человек и отправка плана', async ({ page }) => {
  await enterDemo(page)
  const plane = page.getByRole('button', { name: 'Поделиться планом' }).first()
  await plane.scrollIntoViewIfNeeded()
  await plane.click()
  const fan = page.getByRole('dialog', { name: 'Кому отправить' })
  await expect(fan.locator('[data-share-person]')).toHaveCount(5)
  await fan.locator('[data-share-person]').first().click()
  await expect(page.getByRole('status').filter({ hasText: 'Отправлено' })).toBeVisible()
  await expect(fan).toBeHidden()
})

test('«Сообщить об ошибке»: окно открывается, в демо не отправляет', async ({ page }) => {
  await enterDemo(page)
  await nav(page, /^Профиль/)
  await page.getByRole('tab', { name: /Настройки/ }).click()
  await page.getByRole('button', { name: /Сообщить об ошибке/ }).click()
  const dlg = page.getByRole('dialog', { name: 'Сообщить об ошибке' })
  await dlg.getByLabel('Описание ошибки').fill('Тестовая ошибка')
  await dlg.getByRole('button', { name: 'Отправить' }).click()
  await expect(page.getByRole('dialog', { name: 'Спасибо!' })).toContainText('демо-режим')
})

test('без галочки 18+ и согласия регистрация не начинается', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Продолжить с почтой' }).click()
  await expect(page.getByText('Отметьте, что вам есть 18')).toBeVisible()
  await page.getByRole('checkbox').check({ force: true })
  await page.getByRole('button', { name: 'Продолжить с почтой' }).click()
  await expect(page.getByText('Отметьте, что вам есть 18')).toBeHidden()
  expect(await page.evaluate(() => Number(localStorage.getItem('match-consent')))).toBeGreaterThan(0)
})

test('документы открываются по ссылке из согласия', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'политику конфиденциальности' }).click()
  const docs = page.getByRole('dialog', { name: 'Документы Match' })
  await expect(docs.getByRole('tab', { name: 'Конфиденциальность' })).toHaveAttribute('aria-selected', 'true')
  await expect(docs.getByText('Геопозиция')).toBeVisible()
  await docs.getByRole('tab', { name: 'Согласие' }).click()
  await expect(docs.getByText('О защите персональных данных')).toBeVisible()
})

test('повторный запуск без интернета', async ({ page, context }) => {
  await page.goto('./')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload() // теперь страницу обслуживает воркер и кладёт в кэш
  await page.waitForTimeout(500)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText('Встречи рядом.')).toBeVisible()
})
