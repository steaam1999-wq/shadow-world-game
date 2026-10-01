import { Suspense, lazy, type ComponentProps } from 'react'

// Редактор публикации (камера, фильтры, обрезка) тяжёлый — грузим его, только когда его открыли.
const Composer = lazy(() => import('./Composer').then((m) => ({ default: m.NewPublication })))

export function NewPublication(props: ComponentProps<typeof Composer>) {
  if (!props.open) return null
  return <Suspense fallback={null}><Composer {...props} /></Suspense>
}
