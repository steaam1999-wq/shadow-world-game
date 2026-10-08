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

test('голосовое: запись, отмена, отправка и проигрыватель', async ({ page }) => {
  await enterDemo(page)
  await nav(page, /^Чаты/)
  await page.locator('main ul > li > button:not([aria-hidden])').first().click()
  const players = page.getByRole('button', { name: 'Слушать голосовое' })
  const before = await players.count()
  // Запись и отмена — ничего не отправляется
  await page.getByRole('button', { name: 'Записать голосовое' }).click()
  await expect(page.getByRole('status', { name: /^Запись / })).toBeVisible()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'Удалить запись' }).click()
  await expect(page.getByRole('button', { name: 'Записать голосовое' })).toBeVisible()
  await expect(players).toHaveCount(before)
  // Запись и отправка
  await page.getByRole('button', { name: 'Записать голосовое' }).click()
  await page.waitForTimeout(1600)
  await page.getByRole('button', { name: 'Отправить голосовое' }).click()
  await expect(players).toHaveCount(before + 1)
  await expect(page.getByText(/^0:0[12]$/).last()).toBeVisible()
  // Есть текст — кнопка снова «Отправить»
  await page.fill('#chat-input', 'привет')
  await expect(page.getByRole('button', { name: 'Записать голосовое' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Отправить', exact: true })).toBeEnabled()
})
