// Аверс памятной монеты, нарисованный на canvas (без WebGL):
// зеркальное поле с гильоше (тонкая гравировка лучами и кольцами), выпуклая матовая эмблема,
// надпись по кругу, бусинный бортик. Выдаёт три карты: цвет, высоту (рельеф) и шероховатость
// (поле — зеркало, рельеф — мат, как у монет «пруф»).

export interface FaceSpec {
  key: string
  metal: [string, string, string] // светлый, основной, тёмный тон металла
  title: string // надпись по верхней дуге
  emblem?: string // SVG эмблемы (белый = выше, серый = ниже), viewBox 0 0 100 100
  sky?: string // SVG-картинка в центре вместо эмблемы (комета)
  emblemScale?: number
}

export const FACE = 1024
const C = FACE / 2

function loadSvg(svg: string): Promise<HTMLImageElement> {
  return new Promise((ok, fail) => {
    const img = new Image()
    img.onload = () => ok(img)
    img.onerror = fail
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

function canvas() {
  const c = document.createElement('canvas')
  c.width = c.height = FACE
  return [c, c.getContext('2d')!] as const
}

/** Текст по дуге: сверху — по часовой, снизу — буквы стоят прямо и читаются слева направо. */
function arcText(g: CanvasRenderingContext2D, text: string, r: number, bottom: boolean, px: number) {
  g.save()
  g.font = `600 ${px}px Georgia, 'Times New Roman', 'PT Serif', serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const chars = [...text]
  const widths = chars.map((ch) => g.measureText(ch).width + px * 0.16)
  const total = widths.reduce((s, w) => s + w, 0)
  let a = (bottom ? Math.PI / 2 : -Math.PI / 2) + (bottom ? 1 : -1) * (total / r) / 2
  chars.forEach((ch, i) => {
    const step = widths[i] / r
    a += (bottom ? -1 : 1) * step / 2
    g.save()
    g.translate(C + r * Math.cos(a), C + r * Math.sin(a))
    g.rotate(a + (bottom ? -Math.PI / 2 : Math.PI / 2))
    g.fillText(ch, 0, 0)
    g.restore()
    a += (bottom ? -1 : 1) * step / 2
  })
  g.restore()
}

export interface FaceMaps { map: HTMLCanvasElement; height: HTMLCanvasElement; rough: HTMLCanvasElement }
const cache = new Map<string, Promise<FaceMaps>>()

export function faceMaps(s: FaceSpec): Promise<FaceMaps> {
  let p = cache.get(s.key)
  if (!p) {
    p = (async () => {
      const [emblem, sky] = await Promise.all([s.emblem ? loadSvg(s.emblem) : null, s.sky ? loadSvg(s.sky) : null])
      const FIELD = C * 0.64, TEXT = C * 0.79, BEADS = C * 0.93

      // ——— Высота ———
      const [h, hg] = canvas()
      hg.fillStyle = '#000'
      hg.fillRect(0, 0, FACE, FACE)
      // гильоше на поле: лучи и кольца (очень низкие)
      hg.save()
      hg.beginPath(); hg.arc(C, C, FIELD, 0, Math.PI * 2); hg.clip()
      hg.strokeStyle = 'rgb(40 40 40)'
      hg.lineWidth = 2
      for (let i = 0; i < 240; i++) {
        const a = (i / 240) * Math.PI * 2
        hg.beginPath(); hg.moveTo(C, C); hg.lineTo(C + Math.cos(a) * FIELD, C + Math.sin(a) * FIELD); hg.stroke()
      }
      hg.strokeStyle = 'rgb(26 26 26)'
      for (let r = 14; r < FIELD; r += 14) { hg.beginPath(); hg.arc(C, C, r, 0, Math.PI * 2); hg.stroke() }
      hg.restore()
      // кольцо-граница поля и надписи
      hg.filter = 'blur(2px)'
      hg.strokeStyle = '#d0d0d0'
      hg.lineWidth = 7
      hg.beginPath(); hg.arc(C, C, FIELD + 10, 0, Math.PI * 2); hg.stroke()
      // надпись и бусины
      hg.fillStyle = '#e8e8e8'
      arcText(hg, s.title.toUpperCase(), TEXT, false, 64)
      arcText(hg, 'KOMEETA', TEXT, true, 58)
      for (const a of [Math.PI * 0.86, Math.PI * 0.14]) { hg.beginPath(); hg.arc(C + TEXT * Math.cos(a), C + TEXT * Math.sin(a), 8, 0, Math.PI * 2); hg.fill() }
      for (let i = 0; i < 90; i++) {
        const a = (i / 90) * Math.PI * 2
        hg.beginPath(); hg.arc(C + BEADS * Math.cos(a), C + BEADS * Math.sin(a), 9, 0, Math.PI * 2); hg.fill()
      }
      hg.filter = 'none'
      // эмблема: мягкий подъём + чёткая вершина
      if (emblem) {
        const e = FACE * (s.emblemScale ?? 0.56)
        const stamp = (blur: number, alpha: number) => {
          hg.globalAlpha = alpha
          hg.filter = `grayscale(1) blur(${blur}px)`
          hg.drawImage(emblem, C - e / 2, C - e / 2, e, e)
        }
        stamp(12, 1)
        stamp(3, 0.85)
        hg.globalAlpha = 1
        hg.filter = 'none'
      }

      // ——— Шероховатость: поле — зеркало, всё выпуклое — мат ———
      const [r, rg] = canvas()
      rg.fillStyle = 'rgb(36 36 36)'
      rg.fillRect(0, 0, FACE, FACE)
      rg.globalAlpha = 0.75
      rg.globalCompositeOperation = 'lighter'
      rg.drawImage(h, 0, 0)
      rg.globalCompositeOperation = 'source-over'
      rg.globalAlpha = 1

      // ——— Цвет: металл с лёгким градиентом, рельеф чуть светлее, углубления темнее ———
      const [m, mg] = canvas()
      const [light, base, dark] = s.metal
      const grad = mg.createRadialGradient(C * 0.7, C * 0.6, 0, C, C, C * 1.05)
      grad.addColorStop(0, light)
      grad.addColorStop(0.45, base)
      grad.addColorStop(1, dark)
      mg.fillStyle = grad
      mg.fillRect(0, 0, FACE, FACE)
      mg.globalCompositeOperation = 'soft-light'
      mg.globalAlpha = 0.55
      mg.drawImage(h, 0, 0)
      mg.globalCompositeOperation = 'source-over'
      mg.globalAlpha = 1
      if (sky) {
        mg.save()
        mg.beginPath(); mg.arc(C, C, FIELD, 0, Math.PI * 2); mg.clip()
        mg.drawImage(sky, C - FIELD, C - FIELD, FIELD * 2, FIELD * 2)
        mg.restore()
        // небо — под стеклом: гладкое
        rg.save(); rg.beginPath(); rg.arc(C, C, FIELD, 0, Math.PI * 2); rg.clip(); rg.fillStyle = 'rgb(20 20 20)'; rg.fillRect(0, 0, FACE, FACE); rg.restore()
        hg.save(); hg.beginPath(); hg.arc(C, C, FIELD, 0, Math.PI * 2); hg.clip(); hg.fillStyle = '#000'; hg.fillRect(0, 0, FACE, FACE); hg.restore()
      }
      return { map: m, height: h, rough: r }
    })()
    cache.set(s.key, p)
  }
  return p
}

/** Плоская картинка аверса — когда 3D недоступно, и как заглушка, пока 3D готовится. */
export async function faceImage(s: FaceSpec, px: number) {
  const { map, height } = await faceMaps(s)
  const c = document.createElement('canvas')
  c.width = c.height = px
  const g = c.getContext('2d')!
  g.beginPath(); g.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2); g.clip()
  g.drawImage(map, 0, 0, px, px)
  // имитация света сверху-слева на рельефе
  g.globalCompositeOperation = 'overlay'
  g.globalAlpha = 0.5
  g.drawImage(height, -px * 0.004, -px * 0.004, px, px)
  return c.toDataURL('image/png')
}
