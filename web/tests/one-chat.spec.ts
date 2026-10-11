import { expect, test } from '@playwright/test'
import { enterDemo, nav, patchState } from './helpers'

test('чаты: с одним человеком — одна строка и одна общая переписка', async ({ page }) => {
  await enterDemo(page)
  await patchState(page, (s) => {
    const c = s.capsules[0]
    const now = Date.now()
    s.capsules.unshift({ ...c, id: 'dup-1', activityId: undefined, unread: 1, createdAt: now, messages: [{ id: 'dm1', from: 'them', text: 'Второй чат с тем же человеком', at: now }] })
  })
  await nav(page, /^Чаты/)
  const name = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('iskra-state')!); return s.people.find((p: { id: string }) => p.id === s.capsules[0].personId).name as string })
  await expect(page.locator('main ul > li').filter({ hasText: name })).toHaveCount(1)
  await page.locator('main ul > li > button:not([aria-hidden])').first().click()
  await expect(page.getByText('Второй чат с тем же человеком')).toBeVisible()
  const old = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('iskra-state')!); return (s.capsules.find((c: { id: string }) => c.id !== 'dup-1').messages as { from: string; text: string }[]).find((m) => m.from !== 'system')!.text })
  await expect(page.getByText(old).first()).toBeVisible()
})
