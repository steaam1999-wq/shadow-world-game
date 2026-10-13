import { expect, test } from '@playwright/test'
import { enterDemo, nav } from './helpers'

// Готовые фото в плане: список по категории, выбор одним касанием, план публикуется с этим фото.
test('план: готовое фото по категории и публикация с ним', async ({ page }) => {
  await enterDemo(page)
  await nav(page, /^Создать/)
  await page.getByRole('button', { name: /План на встречу/ }).click()
  await page.fill('#act-title', 'Кофе у Октябрьской')
  await page.getByRole('button', { name: 'Кофе', exact: true }).click()
  const picker = page.getByRole('radiogroup', { name: 'Фото к плану' })
  const tiles = picker.getByRole('radio')
  await expect(tiles.first()).toBeVisible()
  expect(await tiles.count()).toBeGreaterThanOrEqual(2)
  await tiles.first().click()
  await expect(tiles.first()).toHaveAttribute('aria-checked', 'true')
  // смена категории сбрасывает выбранное готовое фото
  await page.getByRole('button', { name: 'Прогулка', exact: true }).click()
  await expect(picker.getByRole('radio', { checked: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Кофе', exact: true }).click()
  await tiles.first().click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: '/tmp/claude-0/-home-user-shadow-world-game/231da3f2-bcfd-569e-b782-782d7ad97860/scratchpad/plan-picker.png' })
  await page.getByRole('button', { name: 'Опубликовать на 48 часов' }).click()
  await expect(page.getByText('Кофе у Октябрьской').first()).toBeVisible()
  const saved = await page.evaluate(() => localStorage.getItem('iskra-state') ?? '')
  expect(saved).toContain('data:image/jpeg')
})
