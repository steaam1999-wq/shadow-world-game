import { expect, type Page } from '@playwright/test'

/** Внешние сервисы в тестах не нужны: шрифты и музыкальные API отключены. */
export async function blockExternal(page: Page) {
  await page.route(/fonts\.g|api\.audius|itunes|radio-browser|rss\.apple|lrclib|soundcloud|sndcdn/, (r) => r.abort())
}

/** Вход в демо-аккаунт «без регистрации» — главная с лентой. */
export async function enterDemo(page: Page) {
  await blockExternal(page)
  // Памятку перед встречей видели — иначе она закрывает чат (её проверяет отдельный тест).
  await page.addInitScript(() => { try { if (!sessionStorage.getItem('keep-memo')) localStorage.setItem('safety-memo-seen', '1') } catch { /* ignore */ } })
  await page.goto('./')
  await page.locator('button', { hasText: 'без регистрации' }).last().click()
  await expect(page.getByRole('button', { name: /^Главная/ }).last()).toBeVisible()
}

/** Изменить демо-состояние и перезагрузить страницу. */
export async function patchState(page: Page, fn: (s: Record<string, any>) => void) { // eslint-disable-line @typescript-eslint/no-explicit-any
  await page.evaluate((src) => {
    const s = JSON.parse(localStorage.getItem('iskra-state') ?? '{}')
    new Function('s', `(${src})(s)`)(s)
    localStorage.setItem('iskra-state', JSON.stringify(s))
  }, fn.toString())
  await page.reload()
}

export const nav = (page: Page, name: RegExp) => page.getByRole('button', { name }).last().click()
