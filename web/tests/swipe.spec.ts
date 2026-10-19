import { expect, test, type Page } from '@playwright/test'
import { enterDemo, nav } from './helpers'

/** Свайп пальцем: настоящих touch-жестов у Playwright нет, поэтому шлём touchstart/touchend сами. */
async function swipe(page: Page, from: number, to: number, y = 420) {
  await page.evaluate(([a, b, yy]) => {
    const el = document.elementFromPoint(a, yy) ?? document.body
    const mk = (type: string, x: number) => {
      const t = new Touch({ identifier: 1, target: el, clientX: x, clientY: yy })
      return new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [t], changedTouches: [t] })
    }
    el.dispatchEvent(mk('touchstart', a))
    el.dispatchEvent(mk('touchend', b))
  }, [from, to, y])
}

test('свайп слева направо — назад, справа налево — вперёд', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  const page = await ctx.newPage()
  await enterDemo(page)
  await nav(page, /^Поиск/)
  await expect(page.getByRole('heading', { name: 'Поиск' })).toBeVisible()
  await swipe(page, 60, 300, 640) // назад — на главную
  await expect(page.getByRole('heading', { name: 'Поиск' })).toHaveCount(0)
  await swipe(page, 300, 60, 640) // вперёд — снова в поиск
  await expect(page.getByRole('heading', { name: 'Поиск' })).toBeVisible()
  await ctx.close()
})
