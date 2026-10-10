import { expect, test } from '@playwright/test'
import { enterDemo, nav } from './helpers'

test('оформление чата: фон, цвет сообщений и размер текста сохраняются', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await enterDemo(page)
  await nav(page, /^Чаты/)
  await page.locator('main ul > li > button:not([aria-hidden])').first().click()
  const box = page.getByPlaceholder('Сообщение…')
  await box.fill('Проверка темы')
  await box.press('Enter')
  await page.getByRole('button', { name: 'Встреча и безопасность' }).click()
  await page.getByRole('button', { name: 'Оформление чата' }).click()
  await page.getByRole('button', { name: 'Фон: Космос' }).click()
  await page.getByRole('button', { name: 'Цвет сообщений: Бирюза' }).click()
  await page.getByRole('button', { name: 'Крупнее' }).click()
  await page.screenshot({ path: test.info().outputPath('sheet.png') })
  await page.getByRole('button', { name: 'Готово' }).click()
  const bubble = page.locator('.bubble-me').filter({ hasText: 'Проверка темы' })
  await expect(bubble).toHaveCSS('font-size', '17.5px', { timeout: 3000 }).catch(async () => {
    await expect(bubble.locator('p')).toHaveCSS('font-size', '17.5px')
  })
  expect(await bubble.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain('44, 197, 176')
  await page.screenshot({ path: test.info().outputPath('chat.png') })
  const saved = await page.evaluate(() => localStorage.getItem('komeeta-chat-look') ?? '')
  expect(saved).toContain('cosmos')
})

test('оформление чата: своё фото на фон', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await enterDemo(page)
  await nav(page, /^Чаты/)
  await page.locator('main ul > li > button:not([aria-hidden])').first().click()
  await page.getByRole('button', { name: 'Встреча и безопасность' }).click()
  await page.getByRole('button', { name: 'Оформление чата' }).click()
  await page.getByLabel('Выбрать фото для фона').setInputFiles('public/og.jpg')
  await expect(page.getByLabel('Затемнение фона')).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('photo-sheet.png') })
  await page.getByRole('button', { name: 'Готово' }).click()
  await expect(page.locator('div.fixed.inset-0 img')).toHaveCount(1)
  await page.reload()
  if (!(await page.getByPlaceholder('Сообщение…').isVisible())) {
    await nav(page, /^Чаты/)
    await page.locator('main ul > li > button:not([aria-hidden])').first().click()
  }
  await expect(page.locator('div.fixed.inset-0 img')).toHaveCount(1)
  await page.screenshot({ path: test.info().outputPath('photo-chat.png') })
})
