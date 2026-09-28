import { useStore } from '../store'
import { Avatar, Button, Icon, Logo, Pill } from '../components/ui'
import { countdown, whenLabel } from '../lib'

const STORIES = [
  { names: 'Лена и Паша', hue: 20, text: 'Он откликнулся на мой «кофе на Покровке» в 11 утра, в 13:00 мы уже спорили про обжарку. Через полгода съехались.', meta: '4 встречи до первого «мы»' },
  { names: 'Ника и Рома', hue: 200, text: 'Мне нравится, что капсула сгорает. Не было этой переписки на месяц: за два дня договорились и пошли на каток.', meta: 'Капсула закрыта за 31 час' },
  { names: 'Аня и Дима', hue: 300, text: 'Пошла на выставку одна и выложила активность. Пришёл человек, который знал про художника больше экскурсовода.', meta: 'Совместимость 91%' },
]

export function Landing({ onStart, onAdmin }: { onStart: () => void; onAdmin: () => void }) {
  const { state } = useStore()
  const now = Date.now()
  const demo = state.activities.slice(0, 3).map((a) => ({ a, p: state.people.find((p) => p.id === a.authorId)! }))

  return (
    <div className="min-h-full bg-bg">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-20 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Logo className="text-xl" />
          <nav className="hidden md:flex items-center gap-6 text-[14px] font-medium text-muted">
            <a href="#how" className="hover:text-fg">Как это работает</a>
            <a href="#safety" className="hover:text-fg">Безопасность</a>
            <a href="#stories" className="hover:text-fg">Истории</a>
          </nav>
          <Button onClick={onStart} className="h-10 px-4">Войти</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 sm:pt-16 pb-14 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div className="flex flex-col gap-6 min-w-0">
          <Pill tone="spark" className="self-start"><span className="anim-flick">●</span> {state.activities.length} активностей в Москве прямо сейчас</Pill>
          <h1 className="font-display font-semibold leading-[1.05] tracking-[-0.02em] text-[40px] sm:text-[60px] lg:text-[68px]">
            Хватит просто свайпать. <span className="text-brand">Время встречаться.</span>
          </h1>
          <p className="text-[17px] sm:text-lg text-muted max-w-[34em]">
            В «Искре» нет бесконечных анкет. Каждый профиль — это конкретный план на ближайшие 48 часов:
            выставка, кофе, скалодром. Откликаетесь на план, а не на фото, и у вас 72 часа, чтобы договориться.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onStart} className="h-13 px-7 text-[16px]">
              Найти встречу <Icon name="arrow" size={18} />
            </Button>
            <a href="#how" className="inline-flex items-center h-13 px-6 rounded-full border border-line font-semibold hover:bg-surface">Как это работает</a>
          </div>
          <dl className="grid grid-cols-3 gap-4 pt-2 max-w-lg">
            {[['68%', 'капсул заканчиваются встречей'], ['31 ч', 'в среднем до договорённости'], ['0', 'сообщений «привет, как дела»']].map(([v, l]) => (
              <div key={l}>
                <dt className="font-display font-bold text-2xl tnum">{v}</dt>
                <dd className="text-[13px] text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Анимированные карточки встреч */}
        <div className="relative h-[540px] max-w-md w-full mx-auto" aria-label="Примеры активностей">
          {demo.map(({ a, p }, i) => (
            <article
              key={a.id}
              className="anim-float absolute w-[88%] rounded-[28px] bg-surface p-5 shadow-[0_24px_60px_-28px_rgba(17,17,20,.35)] ring-1 ring-line"
              style={{
                top: 8 + i * 175,
                left: i === 1 ? '12%' : 0,
                ['--r' as string]: `${[-3, 2.5, -1.5][i]}deg`,
                animationDelay: `${i * -2}s`,
                zIndex: 3 - i,
              }}
            >
              <div className="flex items-center gap-3">
                <Avatar name={p.name} hue={p.hue} size={40} verified={p.verified} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{p.name}, {p.age}</div>
                  <div className="text-[12px] text-muted flex items-center gap-1"><Icon name="pin" size={12} /> {a.area}</div>
                </div>
                <Pill tone="cobalt">{a.category}</Pill>
              </div>
              <p className="mt-3 font-display font-bold text-[16px] leading-snug">{a.title}</p>
              <div className="mt-3 flex items-center justify-between text-[13px]">
                <span className="text-muted">{whenLabel(a.startsAt, now)}</span>
                <span className="font-mono text-spark tnum">{countdown(72 * 3600_000 - i * 9_000_000)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Как это работает — реальная последовательность, поэтому с номерами */}
      <section id="how" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 flex flex-col gap-10">
          <div className="flex flex-col gap-3 max-w-2xl">
            <span className="eyebrow">Как это работает</span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl">От идеи до встречи — за три шага</h2>
          </div>
          <ol className="grid md:grid-cols-3 gap-8">
            {[
              ['Пройдите вайб-тест', 'Шесть быстрых экранов про музыку, кофе и выходные. По ответам считаем совместимость, а не по фото.'],
              ['Выберите или предложите план', 'Лента активностей на ближайшие 24–48 часов: «иду на выставку», «пью кофе на Мясницкой». Отклик — сразу на дело.'],
              ['Договоритесь за 72 часа', 'Откроется капсула — чат с обратным отсчётом. Договорились или обменялись контактами — таймер останавливается.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex flex-col gap-3">
                <span className="font-mono text-spark text-sm font-bold">шаг {i + 1} / 3</span>
                <h3 className="font-display font-bold text-xl">{t}</h3>
                <p className="text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Безопасность и геймификация */}
      <section id="safety" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 grid md:grid-cols-2 gap-6">
        <div className="rounded-[32px] bg-surface shadow-soft p-7 sm:p-9 flex flex-col gap-4">
          <Icon name="shield" size={32} className="text-spark" />
          <h2 className="font-display font-bold text-2xl">Встречи с живыми людьми</h2>
          <ul className="flex flex-col gap-2.5 text-muted">
            <li>Вход через Telegram, Google или номер телефона — никаких анонимных ботов.</li>
            <li>Верификация селфи с жестом: синяя галочка у проверенных.</li>
            <li>До мэтча видно только район. Точное место открывается в капсуле.</li>
            <li>Жалоба в два тапа, модерация отвечает в течение часа.</li>
          </ul>
        </div>
        <div className="rounded-[32px] bg-surface shadow-soft p-7 sm:p-9 flex flex-col gap-5">
          <Icon name="spark" size={32} className="text-spark" fill />
          <h2 className="font-display font-bold text-2xl">Уровни за реальные встречи</h2>
          <p className="text-muted">Не за лайки и не за время в приложении. Уровень растёт, только когда оба отметили, что встреча состоялась.</p>
          <div className="flex flex-wrap gap-2">
            {['Искра', 'Огонёк', 'Костёр', 'Маяк', 'Фейерверк'].map((l, i) => (
              <Pill key={l} tone={i < 3 ? 'spark' : 'muted'}>{i + 1}. {l}</Pill>
            ))}
          </div>
        </div>
      </section>

      {/* Истории */}
      <section id="stories" className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 flex flex-col gap-8">
        <h2 className="font-display font-bold text-3xl sm:text-4xl">Они уже встретились</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {STORIES.map((s) => (
            <figure key={s.names} className="rounded-[28px] bg-surface shadow-soft p-6 flex flex-col gap-4">
              <blockquote className="text-[15px] leading-relaxed flex-1">«{s.text}»</blockquote>
              <figcaption className="flex items-center gap-3">
                <Avatar name={s.names} hue={s.hue} size={36} />
                <div>
                  <div className="font-semibold">{s.names}</div>
                  <div className="text-[12px] text-muted">{s.meta}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="rounded-[32px] bg-brand text-white px-6 py-12 sm:p-14 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h2 className="font-display font-bold text-3xl sm:text-4xl max-w-xl">Ближайшая встреча может начаться через час</h2>
          <Button variant="dark" onClick={onStart} className="h-13 px-7 text-[16px] shrink-0">Войти через Telegram</Button>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-[13px] text-muted">
          <span>© 2026 «Искра». Демо-версия, все профили вымышлены.</span>
          <button onClick={onAdmin} className="underline underline-offset-4 hover:text-fg cursor-pointer">Админ-панель (демо)</button>
        </div>
      </footer>
    </div>
  )
}
