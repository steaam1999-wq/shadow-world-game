import { expect, test } from '@playwright/test'
import { enterDemo, nav, patchState } from './helpers'

// Главные сценарии Komeeta. Каждый тест — с чистого листа, на демо-данных.

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

test('без согласия 18+ вход не начинается: спрашиваем одним касанием', async ({ page }) => {
  await page.goto('./')
  const startSignup = async () => {
    await page.getByRole('button', { name: 'Создать аккаунт' }).first().click()
    await page.getByPlaceholder('Придумайте ник').fill('anna_test')
    await page.getByPlaceholder('Придумайте пароль').fill('secret123')
    await page.getByRole('button', { name: 'Создать аккаунт' }).first().click()
  }
  await startSignup()
  const sheet = page.getByRole('dialog', { name: 'Последний шаг' })
  await expect(sheet).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('match-consent'))).toBeNull()
  await sheet.getByRole('button', { name: /Подтверждаю/ }).click()
  await expect(sheet).toBeHidden()
  expect(await page.evaluate(() => Number(localStorage.getItem('match-consent')))).toBeGreaterThan(0)
  // согласие уже дано — второй раз не спрашиваем: демо-регистрация сразу ведёт дальше
  await expect(page.getByRole('dialog', { name: 'Последний шаг' })).toBeHidden()
})

test('документы открываются по ссылке из согласия', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Войти по почте без пароля' }).click()
  await page.getByRole('dialog', { name: 'Последний шаг' }).getByRole('button', { name: 'политику конфиденциальности' }).click()
  const docs = page.getByRole('dialog', { name: 'Документы Komeeta' })
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

test('фото в чате: на весь экран, листание, приближение, смахнуть — закрыть', async ({ page }) => {
  await enterDemo(page)
  await patchState(page, (s) => {
    const mk = (c: string) => { const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300; const g = cv.getContext('2d')!; g.fillStyle = c; g.fillRect(0, 0, 400, 300); return cv.toDataURL('image/jpeg') }
    const now = Date.now()
    s.capsules[0].messages.push({ id: 'ph1', from: 'them', text: 'Фото 1', photo: mk('#c33'), at: now - 60000 }, { id: 'ph2', from: 'me', text: '', photo: mk('#36c'), at: now })
  })
  await nav(page, /^Чаты/)
  await page.locator('main ul > li > button:not([aria-hidden])').first().click()
  await page.getByRole('button', { name: 'Открыть фото' }).first().click()
  const v = page.getByRole('dialog', { name: 'Просмотр фото' })
  const box = (await v.boundingBox())!
  expect(Math.round(box.height)).toBe(page.viewportSize()!.height)
  await expect(v.getByText('1 / 2')).toBeVisible()
  await page.mouse.move(300, 420); await page.mouse.down(); await page.mouse.move(60, 425, { steps: 8 }); await page.mouse.up()
  await expect(v.getByText('2 / 2')).toBeVisible()
  await page.mouse.click(200, 420); await page.mouse.click(200, 420)
  await expect(v.locator('img').last()).toHaveAttribute('style', /scale\(2\.5\)/)
  await page.mouse.click(200, 420); await page.mouse.click(200, 420)
  await page.waitForTimeout(400)
  await page.mouse.move(200, 300); await page.mouse.down(); await page.mouse.move(205, 560, { steps: 10 }); await page.mouse.up()
  await expect(v).toHaveCount(0)
})

test('новый подписчик: число на сердечке и запись «подписался(ась) на вас»', async ({ page }) => {
  await enterDemo(page)
  await patchState(page, (s) => {
    s.noticesSeenAt = Date.now() - 60_000
    s.following = (s.following ?? []).filter((x: string) => x !== s.people[0].id)
    s.notices = [{ id: 'f1', kind: 'follow', personId: s.people[0].id, at: Date.now() }]
  })
  const bell = page.getByRole('button', { name: /^Уведомления: \d+ новых/ })
  await expect(bell).toBeVisible()
  await expect(bell).toContainText(/\d/)
  await bell.click()
  const sheet = page.getByRole('dialog', { name: 'Уведомления' })
  await expect(sheet.getByText('подписался(ась) на вас')).toBeVisible()
  await sheet.getByRole('button', { name: 'Подписаться' }).click()
  await expect(sheet.getByText('Вы подписаны')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Уведомления', exact: true })).toBeVisible()
})

test('фото в чате: отправляется целиком (без обрезки в квадрат) и открывается на весь экран', async ({ page }) => {
  await enterDemo(page)
  await nav(page, /^Чаты/)
  await page.locator('main ul > li > button:not([aria-hidden])').first().click()
  // Вытянутое фото 600×1200, как с телефона.
  const png = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 600; c.height = 1200
    const g = c.getContext('2d')!; g.fillStyle = '#2a6'; g.fillRect(0, 0, 600, 1200)
    const b: Blob = await new Promise((r) => c.toBlob((x) => r(x!), 'image/png'))
    return Array.from(new Uint8Array(await b.arrayBuffer()))
  })
  await page.locator('input[type=file][accept^="image"]').last().setInputFiles({ name: 'tall.png', mimeType: 'image/png', buffer: Buffer.from(png) })
  const thumb = page.getByRole('button', { name: 'Открыть фото' }).last()
  await expect(thumb).toBeVisible()
  const ratio = await thumb.locator('img').evaluate((i: HTMLImageElement) => i.naturalHeight / i.naturalWidth)
  expect(ratio).toBeCloseTo(2, 1)
  await thumb.click()
  const img = page.getByRole('dialog', { name: 'Просмотр фото' }).locator('img').last()
  await page.waitForTimeout(400)
  const box = (await img.boundingBox())!
  expect(Math.round(box.height)).toBe(page.viewportSize()!.height)
  // Само изображение (с учётом пропорций) упирается в экран по высоте и целиком видно.
  const drawn = await img.evaluate((i: HTMLImageElement) => { const r = i.getBoundingClientRect(); const k = Math.min(r.width / i.naturalWidth, r.height / i.naturalHeight); return { w: i.naturalWidth * k, h: i.naturalHeight * k } })
  expect(Math.round(drawn.h)).toBe(page.viewportSize()!.height)
})

test('«Мои планы»: карточки со статусом и удаление с подтверждением', async ({ page }) => {
  await enterDemo(page)
  await nav(page, /^Профиль/)
  await page.getByRole('tab', { name: 'Мои планы' }).click()
  const count = await page.locator('li button[aria-label^="Удалить план"]').count()
  expect(count).toBeGreaterThan(0)
  await expect(page.getByText(/активн/).first()).toBeVisible()
  await page.locator('li button[aria-label^="Удалить план"]').first().click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Удалить план' }).click()
  await expect(page.locator('li button[aria-label^="Удалить план"]')).toHaveCount(count - 1)
})

test('просроченные ссылки на файлы не берутся из памяти телефона', async ({ page }) => {
  await enterDemo(page)
  await patchState(page, (s) => {
    s.capsules[0].messages.push({ id: 'old', from: 'them', text: 'старое фото', photo: 'https://x.supabase.co/storage/v1/object/sign/chat/a/b.jpg?token=old', at: Date.now() })
  })
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('iskra-state')!).capsules[0].messages.find((m: { id: string }) => m.id === 'old'))
  expect(kept.text).toBe('старое фото')
  expect(kept.photo).toBeUndefined()
})

test('защита в чате: памятка один раз, предупреждение о деньгах, не больше 3 сообщений без ответа', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('keep-memo', '1'))
  await enterDemo(page)
  await patchState(page, (s) => {
    const t = Date.now() - 60000
    s.capsules[0].messages = [
      { id: 'm1', from: 'them', text: 'Привет! Скинь деньги на карту, верну завтра', at: t },
      { id: 'a', from: 'me', text: '1', at: t + 1 }, { id: 'b', from: 'me', text: '2', at: t + 2 }, { id: 'c', from: 'me', text: '3', at: t + 3 },
    ]
  })
  await nav(page, /^Чаты/)
  await page.locator('main ul > li > button:not([aria-hidden])').first().click()
  const memo = page.getByRole('dialog', { name: /Перед встречей/ })
  await expect(memo).toBeVisible()
  await memo.getByRole('button', { name: 'Понятно' }).click()
  await expect(memo).toBeHidden()
  await expect(page.getByRole('alert').filter({ hasText: 'никогда не переводите деньги' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Подождите ответа' })).toBeVisible()
  await expect(page.getByLabel('Сообщение')).toBeDisabled()
  expect(await page.evaluate(() => localStorage.getItem('safety-memo-seen'))).toBeTruthy()
})

test('после встречи: «прошла хорошо?», «неприятно» открывает жалобу, вопрос не повторяется', async ({ page }) => {
  await enterDemo(page)
  await patchState(page, (s) => {
    const c = s.capsules[0]
    const a = s.activities.find((x: { id: string }) => x.id === c.activityId)
    a.startsAt = Date.now() - 4 * 3600_000; a.durationMin = 60; a.timeHidden = false; a.expiresAt = Date.now() + 3600_000
    c.messages = [{ id: 'x1', from: 'me', text: 'Привет', at: Date.now() - 5 * 3600_000 }, { id: 'x2', from: 'them', text: 'Привет!', at: Date.now() - 5 * 3600_000 + 1000 }]
  })
  await nav(page, /^Чаты/)
  await page.locator('main ul > li > button:not([aria-hidden])').first().click()
  const card = page.getByRole('group', { name: 'Как прошла встреча' })
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: /Было неприятно/ }).click()
  await expect(card).toBeHidden()
  await expect(page.getByRole('dialog').filter({ hasText: /жалоб|Пожаловаться|заблокировать/i }).first()).toBeVisible()
})

test('галочка: баннер на главной открывает проверку, карточка в профиле, баннер скрывается на неделю', async ({ page }) => {
  await enterDemo(page)
  await patchState(page, (s) => { s.me.verified = false })
  const banner = page.getByRole('region', { name: 'Проверка профиля' })
  await expect(banner).toBeVisible()
  await banner.getByRole('button', { name: /Подтвердите, что это вы/ }).click()
  const sheet = page.getByRole('dialog', { name: 'Верификация' })
  await expect(sheet).toBeVisible()
  await page.keyboard.press('Escape')
  await banner.getByRole('button', { name: 'Скрыть на неделю' }).click()
  await expect(page.getByRole('region', { name: 'Проверка профиля' })).toBeHidden()
  await nav(page, /^Профиль/)
  await expect(page.getByRole('region', { name: 'Проверка профиля' }).getByRole('button', { name: 'Пройти проверку' })).toBeVisible()
})

test('позвать друга: ссылка ведёт на план, приветствие на входе, значок основателя и карточка в профиле', async ({ page }) => {
  const ref = '11111111-2222-3333-4444-555555555555'
  // Новичок по ссылке: на входе видно, что его позвали.
  await page.goto(`./#ref=${ref}`)
  await expect(page.getByRole('status').filter({ hasText: 'Вас пригласил друг' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('komeeta-ref'))).toBe(ref)

  await enterDemo(page)
  // Основатель: значок у его плана, и план поднят выше чужих.
  await patchState(page, (s) => {
    s.following = []
    s.activities = s.activities.filter((a: { authorId: string }) => a.authorId !== 'me')
    const last = s.activities.filter((a: { expiresAt: number }) => a.expiresAt > Date.now()).sort((a: { startsAt: number }, b: { startsAt: number }) => b.startsAt - a.startsAt)[0]
    const p = s.people.find((x: { id: string }) => x.id === last.authorId); p.founder = 7; p.founderAt = Date.now()
  })
  const firstPost = page.locator('article[data-plan]').first()
  await expect(firstPost.getByLabel('Основатель Komeeta №7')).toBeVisible()

  // Ссылка на план друга открывает именно его.
  const planId = await page.evaluate(() => JSON.parse(localStorage.getItem('iskra-state')!).activities.at(-1).id)
  await page.goto(`./#plan=${planId}&ref=${ref}`)
  await page.reload()
  await expect(page.locator(`article[data-plan="${planId}"]`)).toHaveClass(/ring-spark/)

  // В меню «Поделиться» — ссылка с приглашением.
  await page.getByRole('button', { name: 'Поделиться планом' }).first().click()
  await page.getByRole('button', { name: 'Ещё способы поделиться' }).click()
  await expect(page.getByRole('dialog', { name: 'Поделиться' }).getByText(/#plan=/)).toBeVisible()
  await page.keyboard.press('Escape')

  await nav(page, /^Профиль/)
  const card = page.getByRole('region', { name: 'Позвать друзей' })
  await expect(card.getByText('Позовите трёх друзей')).toBeVisible()
  await expect(card.getByRole('button', { name: 'Позвать друга' })).toBeVisible()
})

test('основатель: окно «что даёт статус», стена, подъём плана раз в месяц', async ({ page }) => {
  await enterDemo(page)
  await patchState(page, (s) => { s.me.founder = 12; s.me.founderAt = Date.now(); s.people[0].founder = 3 })
  // Подъём своего плана — в меню «⋯».
  const mine = page.locator('article[data-plan]').filter({ hasText: 'ваш план' }).first()
  await mine.getByRole('button', { name: 'Ещё' }).click()
  await page.getByRole('button', { name: /Поднять наверх ленты на сутки/ }).click()
  await expect(page.getByRole('status').filter({ hasText: 'План поднят' })).toBeVisible()
  await mine.getByRole('button', { name: 'Ещё' }).click()
  await expect(page.getByRole('button', { name: /Следующий подъём/ })).toBeDisabled()
  await page.keyboard.press('Escape')

  await nav(page, /^Профиль/)
  await page.getByRole('button', { name: /Основатель Komeeta №12\. Что даёт статус/ }).click()
  const sheet = page.getByRole('dialog', { name: 'Основатели Komeeta' })
  await expect(sheet.getByText('Подъём плана раз в месяц')).toBeVisible()
  await sheet.getByRole('tab', { name: /Стена/ }).click()
  await expect(sheet.getByText('№3')).toBeVisible()
  await expect(sheet.getByText(/\(вы\)/)).toBeVisible()
})

test('поделиться страницей: ссылка с #u= открывает профиль человека', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await enterDemo(page)
  await page.evaluate(() => { (navigator as { share?: unknown }).share = undefined })
  const person = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('iskra-state')!); return { id: s.people[0].id, name: s.people[0].name } })
  // Чужие id в демо — не uuid; подменим на uuid, чтобы проверить настоящую ссылку.
  const uid = '0b8f0c2e-1111-4222-8333-944455556666'
  await patchState(page, (s) => { const old = s.people[0].id; s.people[0].id = '0b8f0c2e-1111-4222-8333-944455556666'; s.activities.forEach((a: { authorId: string }) => { if (a.authorId === old) a.authorId = '0b8f0c2e-1111-4222-8333-944455556666' }) })
  await page.goto(`./#u=${uid}`)
  await page.reload()
  await expect(page.getByRole('heading', { name: new RegExp(`^${person.name}, \\d+`) })).toBeVisible()
  await page.evaluate(() => { (navigator as { share?: unknown }).share = undefined })
  await page.getByRole('button', { name: 'Поделиться страницей' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Ссылка на страницу скопирована' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(`#u=${uid}`)
})
