// Настоящие 3D-медали (Three.js): металл с отражениями окружения, переливающийся обод-«бублик» с толщиной,
// выпуклая чеканка (рельеф строится из того же рисунка), лак поверх эмали.
// Загружается лениво — только когда на экране есть медали.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

export interface CoinSpec {
  key: string
  field: string[] // цвета поля от центра блика к краю
  fieldAt: [number, number] // где блик на поле (0..1)
  metal: number // насколько поле металлическое (0 — эмаль, 1 — металл)
  rim: string // базовый цвет обода (поверх — радужная плёнка)
  art: string // SVG-разметка рисунка (viewBox 0 0 100 100)
  artScale: number // доля рисунка от поля
  fullBleed?: boolean // рисунок закрывает всё поле (комета)
  relief?: boolean // выпуклый рисунок
}

const R = 1
const T = 0.17
const TEX = 1024

function loadSvg(svg: string): Promise<HTMLImageElement> {
  return new Promise((ok, fail) => {
    const img = new Image()
    img.onload = () => ok(img)
    img.onerror = fail
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

const faceCache = new Map<string, Promise<{ map: THREE.CanvasTexture; bump: THREE.CanvasTexture }>>()
function faceTextures(s: CoinSpec) {
  let p = faceCache.get(s.key)
  if (!p) {
    p = (async () => {
      const img = await loadSvg(s.art)
      const c = document.createElement('canvas')
      c.width = c.height = TEX
      const g = c.getContext('2d')!
      const grad = g.createRadialGradient(TEX * s.fieldAt[0], TEX * s.fieldAt[1], 0, TEX / 2, TEX / 2, TEX * 0.62)
      s.field.forEach((col, i) => grad.addColorStop(i / Math.max(1, s.field.length - 1), col))
      g.fillStyle = grad
      g.fillRect(0, 0, TEX, TEX)
      const a = TEX * s.artScale
      if (s.fullBleed) g.drawImage(img, 0, 0, TEX, TEX)
      else g.drawImage(img, (TEX - a) / 2, (TEX - a) / 2, a, a)

      // Рельеф: рисунок белым по чёрному, размытый — края мягко поднимаются, как у чеканки
      const b = document.createElement('canvas')
      b.width = b.height = TEX
      const h = b.getContext('2d')!
      h.fillStyle = '#000'
      h.fillRect(0, 0, TEX, TEX)
      if (s.relief !== false && !s.fullBleed) {
        const stamp = (blur: number, alpha: number) => {
          h.globalAlpha = alpha
          h.filter = `brightness(0) invert(1) blur(${blur}px)`
          h.drawImage(img, (TEX - a) / 2, (TEX - a) / 2, a, a)
        }
        stamp(14, 1)
        stamp(4, 0.7)
        h.filter = 'none'
        h.globalAlpha = 1
      }
      const map = new THREE.CanvasTexture(c)
      map.colorSpace = THREE.SRGBColorSpace
      map.anisotropy = 4
      return { map, bump: new THREE.CanvasTexture(b) }
    })()
    faceCache.set(s.key, p)
  }
  return p
}

function envFor(r: THREE.WebGLRenderer) {
  const pm = new THREE.PMREMGenerator(r)
  const env = pm.fromScene(new RoomEnvironment(), 0.04).texture
  pm.dispose()
  return env
}

async function buildCoin(s: CoinSpec) {
  const { map, bump } = await faceTextures(s)
  const coin = new THREE.Group()
  // Обод: сплюснутый тор — одновременно ребро монеты и выпуклая рамка с обеих сторон
  const rimMat = new THREE.MeshPhysicalMaterial({
    color: s.rim, metalness: 1, roughness: 0.16,
    iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [250, 900],
    clearcoat: 1, clearcoatRoughness: 0.08,
  })
  const tube = 0.085
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R - tube, tube, 40, 180), rimMat)
  rim.scale.z = (T / 2 + 0.035) / tube
  coin.add(rim)
  // Тело между сторонами — чтобы на ребре не было просвета
  const core = new THREE.Mesh(new THREE.CylinderGeometry(R - tube, R - tube, T, 96, 1), new THREE.MeshStandardMaterial({ color: s.rim, metalness: 1, roughness: 0.3 }))
  core.rotation.x = Math.PI / 2
  coin.add(core)
  // Лицевая и обратная стороны: эмаль/металл + лак + рельеф
  const faceMat = new THREE.MeshPhysicalMaterial({
    map, bumpMap: bump, bumpScale: 6, metalness: s.metal, roughness: s.metal > 0.6 ? 0.22 : 0.38,
    clearcoat: 1, clearcoatRoughness: 0.12,
  })
  const faceGeo = new THREE.CircleGeometry(R - tube * 1.15, 128)
  const front = new THREE.Mesh(faceGeo, faceMat)
  front.position.z = T / 2 + 0.002
  const back = new THREE.Mesh(faceGeo, faceMat)
  back.position.z = -T / 2 - 0.002
  back.rotation.y = Math.PI
  coin.add(front, back)
  return coin
}

function makeScene(renderer: THREE.WebGLRenderer, dist = 4.7) {
  const scene = new THREE.Scene()
  scene.environment = envFor(renderer)
  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(-2, 3, 4)
  const rimLight = new THREE.DirectionalLight(0xbfd8ff, 1.1)
  rimLight.position.set(3, -1, 2)
  scene.add(key, rimLight)
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20)
  camera.position.set(0, 0, dist)
  return { scene, camera, key }
}

function newRenderer(canvas?: HTMLCanvasElement, keep = false) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: keep })
  r.setClearColor(0x000000, 0)
  r.toneMapping = THREE.ACESFilmicToneMapping
  r.toneMappingExposure = 1.05
  r.outputColorSpace = THREE.SRGBColorSpace
  return r
}

// ——— Статичный 3D-кадр для маленьких медалей (один общий рендерер на все) ———
let shot: { r: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera } | null = null
const shots = new Map<string, Promise<string>>()
let queue: Promise<unknown> = Promise.resolve()

export function snapshotCoin(s: CoinSpec, px: number): Promise<string> {
  const k = `${s.key}:${px}`
  let p = shots.get(k)
  if (!p) {
    p = queue.then(async () => {
      if (!shot) {
        const r = newRenderer(undefined, true)
        const { scene, camera } = makeScene(r, 4.25)
        shot = { r, scene, camera }
      }
      const coin = await buildCoin(s)
      coin.rotation.set(0.16, -0.42, 0.04)
      shot.scene.add(coin)
      shot.r.setPixelRatio(1)
      shot.r.setSize(px, px, false)
      shot.r.render(shot.scene, shot.camera)
      const url = shot.r.domElement.toDataURL('image/png')
      shot.scene.remove(coin)
      return url
    })
    queue = p.catch(() => {})
    shots.set(k, p)
  }
  return p
}

// ——— Живая медаль в карточке: вращается на ребре, пальцем можно раскрутить ———
export async function mountCoin(canvas: HTMLCanvasElement, s: CoinSpec, size: number) {
  const r = newRenderer(canvas)
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5))
  r.setSize(size, size, false)
  const { scene, camera, key } = makeScene(r)
  const coin = await buildCoin(s)
  scene.add(coin)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

  let angle = 0, vel = 0, drag: number | null = null, lastX = 0, idleAt = 0
  const PERIOD = 5000
  const onDown = (e: PointerEvent) => { drag = e.pointerId; lastX = e.clientX; vel = 0; canvas.setPointerCapture(e.pointerId) }
  const onMove = (e: PointerEvent) => { if (drag !== e.pointerId) return; const dx = e.clientX - lastX; lastX = e.clientX; angle += dx * 0.02; vel = dx * 0.02 }
  const onUp = (e: PointerEvent) => { if (drag === e.pointerId) { drag = null; idleAt = performance.now() } }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)

  let raf = 0
  let prev = performance.now()
  let phase = 0
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2)
  const tick = (now: number) => {
    const dt = Math.min(50, now - prev)
    prev = now
    if (drag === null) {
      if (Math.abs(vel) > 0.0005) { angle += vel; vel *= 0.95 }
      else if (!reduce && now - idleAt > 1200) {
        // Оборот за 65% периода, потом пауза — как монета, крутящаяся на ребре
        phase += dt / PERIOD
        if (phase >= 1) phase -= 1
      }
    }
    const auto = phase < 0.65 ? ease(phase / 0.65) * Math.PI * 2 : Math.PI * 2
    coin.rotation.set(0.14 + Math.sin(now / 1800) * 0.03, angle + auto, 0)
    key.position.set(Math.sin(now / 2600) * 3, 3, 4)
    r.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(raf)
    canvas.removeEventListener('pointerdown', onDown)
    canvas.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('pointerup', onUp)
    canvas.removeEventListener('pointercancel', onUp)
    scene.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose() } })
    r.dispose()
    r.forceContextLoss()
  }
}
