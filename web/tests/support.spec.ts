import { expect, test } from '@playwright/test'
import { enterDemo, nav } from './helpers'

test('поддержка: чат с ботом открывается из «Чатов», отвечает на частый вопрос', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await enterDemo(page)
  await nav(page, /^Чаты/)
  await page.getByRole('button', { name: 'Чат с поддержкой' }).click()
  const dlg = page.getByRole('dialog', { name: 'Поддержка Komeeta' })
  await expect(dlg).toBeVisible()
  await dlg.getByRole('button', { name: 'Не приходят уведомления' }).click()
  await expect(dlg.getByText(/Настройки телефона → Приложения → Komeeta/)).toBeVisible()
  await dlg.getByLabel('Вопрос в поддержку').fill('Как создать план?')
  await dlg.getByRole('button', { name: 'Отправить вопрос' }).click()
  await expect(dlg.getByText(/«План на встречу»/)).toBeVisible()
  await expect(dlg.getByLabel('Вопрос в поддержку')).toBeFocused()
  await page.screenshot({ path: test.info().outputPath('support.png') })
  await dlg.getByRole('button', { name: 'Закрыть поддержку' }).click()
  await expect(dlg).toBeHidden()
})
