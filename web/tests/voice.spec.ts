import { expect, test } from '@playwright/test'
import { enterDemo, nav } from './helpers'

// Голосовые: запись с поддельного микрофона Chromium, отправка, проигрыватель в пузыре.
test.use({
  permissions: ['microphone'],
  launchOptions: {
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
})

test('голосовое: запись только пока кнопка зажата, отмена свайпом, короткое нажатие', async ({ page }) => {
  await enterDemo(page)
  await nav(page, /^Чаты/)
  await page.locator('main ul > li > button:not([aria-hidden])').first().click()
  const players = page.getByRole('button', { name: 'Слушать голосовое' })
  const before = await players.count()
  const mic = page.getByRole('button', { name: 'Удерживайте, чтобы записать голосовое' })
  const box = (await mic.boundingBox())!
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2
  // Короткое нажатие — не отправляется, подсказка
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.waitForTimeout(150); await page.mouse.up()
  await expect(page.getByText('Удерживайте кнопку, пока говорите')).toBeVisible()
  await expect(players).toHaveCount(before)
  // Зажали, увели влево — отмена
  await page.mouse.move(cx, cy); await page.mouse.down()
  await expect(page.getByRole('status', { name: /^Запись / })).toBeVisible()
  await page.waitForTimeout(900)
  await page.mouse.move(cx - 60, cy, { steps: 4 }); await page.mouse.move(cx - 140, cy, { steps: 4 })
  await expect(page.getByRole('status', { name: /^Запись / })).toHaveCount(0)
  await page.mouse.up()
  await page.waitForTimeout(400)
  await expect(players).toHaveCount(before)
  // Зажали и держим — пока держим, идёт запись; отпустили — отправилось
  await page.mouse.move(cx, cy); await page.mouse.down()
  await page.waitForTimeout(1700)
  await expect(page.getByRole('status', { name: /^Запись 0:0[12]/ })).toBeVisible()
  await page.mouse.up()
  await expect(players).toHaveCount(before + 1)
  await expect(page.getByRole('status', { name: /^Запись / })).toHaveCount(0)
  // Есть текст — кнопка снова «Отправить»
  await page.fill('#chat-input', 'привет')
  await expect(mic).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Отправить', exact: true })).toBeEnabled()
})
