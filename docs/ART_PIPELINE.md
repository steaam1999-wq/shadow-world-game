# ARCANE SURVIVORS — конвейер 3D-моделей (Stylized AAA для браузера)

Игра работает в браузере на WebGL (Three.js), в том числе на iPhone. Поэтому классическое ТЗ под Unreal или Unity
нужно адаптировать: одна 4K-текстура в видеопамяти занимает около 64 МБ, а сотни скелетных мобов
на телефоне не потянуть без особого подхода. Ниже то, что реально встаёт в игру и работает плавно.

Игра уже умеет принимать готовые модели. Положи файл в `assets/models/`, пропиши его в `assets/manifest.js`,
и персонаж заменит процедурного. Всё, что не заполнено, остаётся процедурным.

---

## 1. Что поменять в исходном ТЗ

| Пункт исходного ТЗ | Для браузера | Почему |
|---|---|---|
| Герой 30–45k треугольников | **12–25k** | На экране один, но играем и на телефоне |
| Оружие отдельно 8–15k | **2–5k**, привязано к кости `RightHand` или внутри модели героя | Оружие всегда в кадре вместе с героем |
| Мобы (в ТЗ не указаны) | **1.5–4k**, 1 материал, текстура 512–1024 | Их сотни: игра «запекает» анимацию в позы и рисует инстансингом |
| Босс 60–90k | **20–40k** | Один на экране, но с тенями и эффектами |
| Текстуры героя 2K | **2K** (оставляем) | — |
| Текстуры босса 4K, два сета | **2K, один-два сета** | 4K на iPhone быстро съедает память |
| `.FBX`, Z-up | **`.glb` (glTF 2.0 binary)**, Y-up | Стандарт веба: меньше, быстрее, материалы PBR сразу. FBX игра тоже читает, но хуже |
| PNG 16-bit | **PNG/JPEG 8-bit или WebP** | 16 бит нужны только картам высот, а мы их не используем |
| ORM: R=AO, G=Roughness, B=Metallic | **Оставляем как есть** | glTF использует ровно такую упаковку |
| LOD0–LOD3 | Нужен только **LOD0** | Толпа рисуется запечёнными позами, лоды для мобов пока не используются |
| Скелет Epic/Mixamo | **Mixamo-совместимый** (оставляем) | Загрузчик распознаёт клипы по именам |

**Экспорт из Blender:** File → Export → glTF 2.0 (.glb), включить «+Y Up», Animations, Skinning, Apply Modifiers.
Масштаб: 1 единица = 1 метр, опорная точка в ногах, персонаж смотрит вперёд по +Z (если нет — поправь `yaw` в манифесте).

**Сжатие перед добавлением в игру** (уменьшает файл в 3–10 раз):

```
npx @gltf-transform/cli optimize hero.glb hero.min.glb --texture-compress webp --compress meshopt
```

**Свечение (руны, кристаллы, глаза):** используй emissive-карту. Чтобы свечение «расцветало» под bloom,
выставь Emissive Strength 2–5 (в Blender: Emission Strength; в glTF это `KHR_materials_emissive_strength`).

---

## 2. Состав и требования

### Анимации

Имена клипов могут быть любыми, ниже перечислены стандартные. Нестандартные имена указываются в манифесте через `clips`.

| Роль | Обязательные клипы | Желательные |
|---|---|---|
| Герой | `Idle`, `Run`, `Cast` (или `Attack`) | `Hit`, `Death` |
| Моб | `Walk` или `Run` (цикл), `Attack` | — |
| Босс | `Walk`, `Attack` | `Charge` (рывок), `Cast`, `Death` |

Циклы должны быть бесшовными. У мобов анимация запекается в 10 кадров ходьбы и 6 кадров атаки,
поэтому движения стоит делать крупными и читаемыми сверху.

### Состав персонажей

| id (манифест) | Кто | Рост, м | Треугольники | Особенности силуэта (вид сверху!) |
|---|---|---|---|---|
| `hero` | Каэль, последний Арканист | 1.9 | 12–25k | Фиолетовая мантия с золотой каймой, капюшон, посох с кристаллом Сердца Эфира (emissive) |
| `ghost` | Призрак | 1.6 | 1.5–3k | Полупрозрачная рваная мантия, светящиеся глаза, парит |
| `ghoul` | Гуль | 1.4 | 2–3k | Сгорбленный, длинные руки с когтями, красные глаза |
| `cknight` | Проклятый рыцарь | 2.0 | 3–4k | Щит, меч, красная щель визора, рваный плащ |
| `wolf` | Мутант-волк | 1.1 | 2–3k | Фиолетовые кристаллы-шипы на хребте, жёлтые глаза |
| `wisp` | Древний дух | 1.5 | 1–2k | Светящееся ядро с орбитой огоньков |
| `treant` | Древень | 2.4 | 3–4k | Ствол-тело, руки-ветви, крона, светящиеся глаза |
| `skeleton` | Скелет-воин | 1.8 | 2–3k | Ржавый меч, синие огни в глазницах |
| `deadmage` | Павший маг | 1.9 | 2–3k | Капюшон, посох со сферой (стреляет) |
| `golem` | Костяной голем | 2.5 | 3–4k | Массивный, кулаки-валуны, синее ядро в груди |
| `spawn` | Порождение Бездны | 1.0 | 1.5–2.5k | Сгусток с щупальцами и множеством глаз (взрывается) |
| `voideye` | Око Бездны | 1.8 | 2–3k | Огромный глаз с щупальцами, парит |
| `horror` | Безликий ужас | 2.3 | 3–4k | Шипастая масса, щупальца, светящиеся прорези |
| `fallen_knight` | Падший рыцарь (босс I) | 5.2 | 20–35k | Рогатый шлем, рваный плащ, двуручник с фиолетовым пламенем |
| `devourer` | Древний пожиратель (босс II) | 4.6 | 20–35k | Четвероногий, шипы, рога, пасть со светящимся эфиром |
| `soulless_king` | Король без души (босс III) | 5.6 | 20–35k | Парящий скелет в чёрной мантии, корона, рога, посох |
| `abyss_lord` | Владыка Бездны (босс IV) | 6.5 | 25–40k | Крылатая тень, сияющее ядро в груди, ореол осколков |

Читаемость сверху важнее мелких деталей: крупные наплечники, оружие, светящиеся элементы и
контрастные цвета. Детали на лице с камеры почти не видны.

---

## 3. Промпты для концептов (Midjourney / DALL·E / Flux и т. п.)

Общий стиль. Добавляй его в конец каждого промпта, чтобы все персонажи вышли из одного мира:

```
stylized AAA dark fantasy game character concept, hand-painted textures combined with PBR materials,
readable silhouette from isometric top-down camera, dramatic purple rim lighting, volumetric arcane particles,
violet and gold color palette with deep shadows, clean turnaround-friendly pose, full body, neutral background,
game asset concept sheet, sharp focus --ar 16:9
```

Для моделирования удобнее просить развороты: `character turnaround sheet, front, side, back view, T-pose`.

| Персонаж | Промпт (начало) |
|---|---|
| Герой | `young hooded arcanist mage, flowing violet robe with ornate gold trim, layered shoulder pieces, tall staff crowned by a glowing purple crystal heart, faint corruption cracks on one hand,` |
| Призрак | `wailing ghost of a fallen citizen, translucent tattered blue-white shroud, hollow face with glowing cyan eyes, reaching spectral arms, floating,` |
| Гуль | `hunched ghoul, grey-green leathery skin, elongated arms with black claws, glowing red eyes, ragged loincloth,` |
| Проклятый рыцарь | `cursed royal knight, dented dark steel plate armor, glowing red visor slit, round shield, broken longsword, torn crimson tabard,` |
| Мутант-волк | `mutated dire wolf, brown matted fur, violet crystal spikes erupting along its spine, glowing yellow eyes, lean predatory pose,` |
| Древний дух | `ancient forest spirit wisp, bright green energy core, orbiting firefly motes, translucent trailing tendrils,` |
| Древень | `corrupted treant, thick bark body, branch arms, mossy leaf crown, glowing yellow-green eyes, root legs,` |
| Скелет-воин | `undead skeleton warrior, bleached bones, rusty sword, blue soul-fire in the eye sockets, scraps of armor,` |
| Павший маг | `undead royal battle mage, dark blue hooded robe, shadowed face with glowing blue eyes, staff topped with a blue orb,` |
| Костяной голем | `massive bone golem, fused skeletons forming a hulking body, boulder fists, glowing blue soul core in the chest,` |
| Порождение Бездны | `abyss spawn, small purple flesh blob, many glowing pink eyes, writhing tentacles, unstable glowing veins,` |
| Око Бездны | `floating giant eyeball, pale pink sclera with magenta iris and slit pupil, dangling purple tentacles,` |
| Безликий ужас | `faceless horror, spiky dark violet mass, glowing purple slits, long tentacle arms, menacing hunched silhouette,` |
| Падший рыцарь | `colossal fallen knight boss, spiked dark plate armor with violet runes, horned great helm with glowing visor, tattered cape, huge greatsword wreathed in violet flame,` |
| Древний пожиратель | `ancient devourer boss, enormous four-legged beast, spiked hide, curved horns, gaping maw glowing with stolen purple magic, red eyes,` |
| Король без души | `soulless king boss, floating crowned skeleton in a tattered black royal robe, curved horns, golden crown, staff with a pale blue orb, violet soul light pouring from the ribcage,` |
| Владыка Бездны | `abyss lord final boss, towering winged shadow in a hooded shroud, glowing blue-white core in the chest with light veins, halo of floating violet crystal shards, membranous wings,` |

Из концепта в 3D:
- Генераторы image-to-3D (Meshy, Tripo, Rodin) дают черновую модель за минуты. Её стоит почистить: снизить полигонаж, поправить текстуры.
- Mixamo (бесплатно) автоматически риггит гуманоидов и даёт готовые анимации: Idle, Run, Attack, Death.
- Негуманоидам (волк, пожиратель, око) нужен ручной риг в Blender или художник-аниматор.
- Для настоящего уровня AAA модели должен делать художник: генераторы пока не выдерживают чистоту силуэта и топологии.

---

## 4. Как добавить модель в игру

1. Положи файл, например `hero.glb`, в `assets/models/`.
2. В `assets/manifest.js` раскомментируй строку героя и укажи файл и рост:
   ```js
   hero: { file: 'hero.glb', height: 1.9, staffBone: 'RightHand' },
   ```
3. Модели загружаются по сети, поэтому открывать игру нужно через веб-сервер, а не двойным кликом по файлу:
   ```
   npx serve .        # или: python3 -m http.server
   ```
4. Если модель не появилась, загляни в консоль браузера: там будет строка `[assets]` с причиной.
   Пересобирать бандл не нужно, манифест читается при запуске.

Параметры манифеста:

| Параметр | Смысл |
|---|---|
| `file` | Имя файла в `assets/models/` (`.glb`, `.gltf`, `.fbx`) |
| `height` | Рост в метрах: модель масштабируется под него автоматически |
| `scale` | Дополнительный множитель масштаба |
| `yaw` | Поворот в градусах, если модель смотрит не вперёд (+Z) |
| `clips` | Имена клипов, если они нестандартные: `{ run: 'Sprint_Loop', attack: 'Slash_01' }` |
| `frames` | Сколько кадров запекать для толпы (по умолчанию 10) |
| `float` | Для парящих врагов |
| `staffBone`, `orbBone` | Кости, к которым крепится свечение посоха и руки героя |

Технические детали:
- Герой и боссы анимируются полноценным скелетом через AnimationMixer, клипы плавно смешиваются.
- Рядовые враги при загрузке запекаются в позы: 10 кадров движения и 6 кадров атаки. Затем каждая поза рисуется одним инстансным вызовом на сотни врагов, поэтому толпа из скелетных моделей не роняет FPS.
- Конвейер проверен на тестовом скелетном гуманоиде с костями в именах Mixamo, двумя материалами и клипами Idle, Run и Attack. Он заменил героя, гулей и Падшего рыцаря.
