import { expect, test } from '@playwright/test'
import { enterDemo, nav } from './helpers'

test('чат: после отправки поле ввода остаётся в фокусе (клавиатура не закрывается)', async ({ page }) => {
  await enterDemo(page)
  await nav(page, /^Чаты/)
  await page.locator('main ul > li > button:not([aria-hidden])').first().click()
  const box = page.locator('#chat-input')
  await box.click()
  await box.fill('первое')
  await page.getByRole('button', { name: 'Отправить', exact: true }).click()
  await expect(page.getByText('первое')).toBeVisible()
  await expect(box).toBeFocused()
})

test('главная: карточка плана открывается нажатием', async ({ page }) => {
  await enterDemo(page)
  const panel = page.locator('article[data-plan] .glass-panel[role="button"]').first()
  await panel.scrollIntoViewIfNeeded()
  await panel.click({ position: { x: 20, y: 20 } })
  await expect(page.locator('#chat-input, [role="dialog"]').first()).toBeVisible()
})

test('главная: «Скоро встреча» открывает чат нажатием на карточку', async ({ page }) => {
  await enterDemo(page)
  const soon = page.getByRole('region', { name: 'Скоро встреча' })
  test.skip(!(await soon.isVisible()), 'в демо нет встречи в ближайшие полтора часа')
  await soon.locator('span').first().click()
  await expect(page.locator('#chat-input')).toBeVisible()
})
