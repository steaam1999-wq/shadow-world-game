import { expect, test } from '@playwright/test'
import { enterDemo, nav } from './helpers'

test('публикация: фото из галереи по умолчанию целиком («Оригинал»)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await enterDemo(page)
  await nav(page, /^Создать/)
  await page.getByRole('button', { name: /Публикация/ }).click()
  await page.getByLabel('Выбрать фото или видео из галереи').setInputFiles('public/og.jpg')
  await expect(page.getByRole('radio', { name: 'Оригинал' })).toHaveAttribute('aria-checked', 'true')
  await page.screenshot({ path: '/tmp/claude-0/-home-user-shadow-world-game/231da3f2-bcfd-569e-b782-782d7ad97860/scratchpad/up-editor.png' })
})
