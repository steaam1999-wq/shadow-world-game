// Готовые фото для планов: реалистичные кадры по категориям. Файлы лежат в public/plan-photos/:
// <id>.jpg — полный размер (1080×1350), <id>-t.jpg — маленькая превьюшка для списка.
// Чтобы добавить фото, положите оба файла в эту папку и впишите id в нужную категорию.
export const PLAN_PHOTOS: Record<string, string[]> = {
  'Кофе': ['coffee-1', 'coffee-2', 'coffee-3'],
}

const base = () => import.meta.env.BASE_URL || './'
export const planPhotoUrl = (id: string, thumb = false) => `${base()}plan-photos/${id}${thumb ? '-t' : ''}.jpg`
export const planPhotosOf = (category: string) => PLAN_PHOTOS[category] ?? []
export const stockCategory = (id: string) => Object.keys(PLAN_PHOTOS).find((c) => PLAN_PHOTOS[c].includes(id))

/** Скачать готовое фото и отдать как data-URL: дальше план сохраняется так же, как со своим фото. */
export async function loadPlanPhoto(id: string): Promise<string> {
  const res = await fetch(planPhotoUrl(id))
  if (!res.ok) throw new Error('photo')
  const blob = await res.blob()
  return await new Promise<string>((ok, fail) => {
    const r = new FileReader()
    r.onload = () => ok(r.result as string)
    r.onerror = () => fail(r.error)
    r.readAsDataURL(blob)
  })
}
