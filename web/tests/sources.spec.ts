import { expect, test } from '@playwright/test'
import { blockExternal } from './helpers'

const src = (page: import('@playwright/test').Page) => page.evaluate(() => localStorage.getItem('komeeta-src'))

test('источник: метка из ссылки запоминается первой, «напрямую» уступает метке', async ({ page }) => {
  await blockExternal(page)
  await page.goto('./')
  expect(await src(page)).toBe('direct')
  await page.goto('./?src=TikTok')
  expect(await src(page)).toBe('tiktok')
  await page.goto('./?src=vk')
  expect(await src(page)).toBe('tiktok')
})

test('источник: приглашение друга', async ({ page }) => {
  await blockExternal(page)
  await page.goto('./#ref=11111111-2222-3333-4444-555555555555')
  expect(await src(page)).toBe('invite')
})
