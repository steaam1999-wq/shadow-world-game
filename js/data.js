// EMPIRE CITY — игровые данные (баланс, предметы, районы, сюжет)
"use strict";

const DATA = {
  // Движухи: работа за энергию
  jobs: [
    { id: "port",    icon: "📦", name: "Разгрузить фуры в порту", lvl: 1,  en: 5,  cash: [120, 200],     xp: 6,   side: "law",    risk: 0.05 },
    { id: "courier", icon: "🛵", name: "Курьерская смена",        lvl: 1,  en: 8,  cash: [250, 400],     xp: 10,  side: "law",    risk: 0.05 },
    { id: "car",     icon: "🚗", name: "Перегнать машину без вопросов", lvl: 3, en: 12, cash: [500, 800], xp: 16,  side: "street", risk: 0.12 },
    { id: "club",    icon: "🕺", name: "Фейсконтроль в клубе",    lvl: 5,  en: 15, cash: [900, 1300],    xp: 22,  side: "law",    risk: 0.10 },
    { id: "debt",    icon: "💼", name: "Вернуть старый долг",     lvl: 8,  en: 20, cash: [1500, 2400],   xp: 30,  side: "street", risk: 0.18 },
    { id: "convoy",  icon: "🚚", name: "Сопроводить груз",        lvl: 12, en: 25, cash: [2800, 4200],   xp: 42,  side: "law",    risk: 0.15 },
    { id: "deal",    icon: "🤝", name: "Ночная сделка в порту",   lvl: 18, en: 35, cash: [6000, 9000],   xp: 60,  side: "street", risk: 0.22 },
    { id: "auction", icon: "🖼️", name: "Подпольный аукцион",      lvl: 25, en: 45, cash: [14000, 20000], xp: 85,  side: "street", risk: 0.25 },
    { id: "tower",   icon: "🏗️", name: "Тендер на стройку в центре", lvl: 32, en: 60, cash: [30000, 45000], xp: 120, side: "law", risk: 0.20 }
  ],

  // Барыга: экипировка
  items: [
    { id: "knuckle", slot: "weapon", icon: "👊", name: "Кастет",         lvl: 1,  price: 300,    atk: 4 },
    { id: "bat",     slot: "weapon", icon: "🏏", name: "Бита",           lvl: 3,  price: 900,    atk: 8 },
    { id: "knife",   slot: "weapon", icon: "🔪", name: "Нож-бабочка",    lvl: 5,  price: 2500,   atk: 14 },
    { id: "sawoff",  slot: "weapon", icon: "🔫", name: "Обрез",          lvl: 9,  price: 7000,   atk: 24 },
    { id: "pistol",  slot: "weapon", icon: "🔫", name: "Пистолет",       lvl: 14, price: 18000,  atk: 38 },
    { id: "rifle",   slot: "weapon", icon: "🪖", name: "Автомат",        lvl: 20, price: 50000,  atk: 60 },
    { id: "sniper",  slot: "weapon", icon: "🎯", name: "Снайперка",      lvl: 28, price: 140000, atk: 90 },

    { id: "leather", slot: "armor", icon: "🧥", name: "Кожанка",            lvl: 1,  price: 300,   def: 4 },
    { id: "track",   slot: "armor", icon: "🥋", name: "Олимпийка",          lvl: 3,  price: 900,   def: 8 },
    { id: "vest",    slot: "armor", icon: "🦺", name: "Лёгкий бронежилет",  lvl: 6,  price: 3000,  def: 15 },
    { id: "kevlar",  slot: "armor", icon: "🛡️", name: "Кевлар",             lvl: 10, price: 9000,  def: 26 },
    { id: "heavy",   slot: "armor", icon: "🛡️", name: "Тяжёлый бронежилет", lvl: 16, price: 25000, def: 40 },
    { id: "tactic",  slot: "armor", icon: "🪖", name: "Тактический комплект", lvl: 22, price: 70000, def: 60 },

    { id: "cap",     slot: "extra", icon: "🧢", name: "Кепка",          lvl: 1,  price: 200,   agi: 2 },
    { id: "chain",   slot: "extra", icon: "📿", name: "Золотая цепь",   lvl: 4,  price: 1500,  agi: 4,  auth: 5 },
    { id: "watch",   slot: "extra", icon: "⌚", name: "Часы с гравировкой", lvl: 8, price: 6000, agi: 7, auth: 10 },
    { id: "shades",  slot: "extra", icon: "🕶️", name: "Тёмные очки",    lvl: 12, price: 15000, agi: 11, auth: 15 },
    { id: "ring",    slot: "extra", icon: "💍", name: "Перстень",       lvl: 18, price: 40000, agi: 16, auth: 25 }
  ],

  // Точки: бизнесы с пассивным доходом
  biz: [
    { id: "kiosk",   icon: "🏪", name: "Ларёк у остановки", lvl: 1,  price: 1500,    inc: 60 },
    { id: "wash",    icon: "🧽", name: "Автомойка",         lvl: 4,  price: 8000,    inc: 280 },
    { id: "shawa",   icon: "🌯", name: "Шаурмичная",        lvl: 7,  price: 25000,   inc: 800 },
    { id: "service", icon: "🔧", name: "Автосервис",        lvl: 11, price: 80000,   inc: 2300 },
    { id: "club",    icon: "🎶", name: "Ночной клуб",       lvl: 16, price: 250000,  inc: 6500 },
    { id: "storage", icon: "🏭", name: "Склад в порту",     lvl: 22, price: 800000,  inc: 19000 },
    { id: "hotel",   icon: "🏨", name: "Отель в центре",    lvl: 30, price: 3000000, inc: 65000 }
  ],

  // Недвижимость — меняет хату
  homes: [
    { name: "Комната в общаге",          price: 0,       lvl: 1,  en: 0,  safe: 5000,     wall: ["#b9b18b", "#8d8a5d"], floor: "#7d4935" },
    { name: "Однушка на окраине",         price: 15000,   lvl: 3,  en: 10, safe: 25000,    wall: ["#c7b98e", "#9a7d55"], floor: "#8a5a3c" },
    { name: "Двушка в Старом городе",     price: 60000,   lvl: 8,  en: 20, safe: 100000,   wall: ["#a9b8a0", "#6f8a6a"], floor: "#91603f" },
    { name: "Лофт в Промзоне",            price: 200000,  lvl: 14, en: 35, safe: 400000,   wall: ["#b5655a", "#7c3d35"], floor: "#5a4a40" },
    { name: "Пентхаус в Центре",          price: 750000,  lvl: 20, en: 55, safe: 1500000,  wall: ["#d9d4c8", "#a7a197"], floor: "#3d3a38" },
    { name: "Особняк в Kings District",   price: 3000000, lvl: 28, en: 80, safe: 6000000,  wall: ["#5d4a7a", "#3b2c55"], floor: "#6b3e26" }
  ],

  // Хата: обстановка
  furniture: [
    { id: "weights", icon: "🏋️", name: "Штанга",         price: 2000,  text: "+3 к силе" ,           str: 3 },
    { id: "bag",     icon: "🥊", name: "Боксёрская груша", price: 3500, text: "+3 к ловкости",        agi: 3 },
    { id: "sofa",    icon: "🛋️", name: "Диван",           price: 5000,  text: "Здоровье восстанавливается вдвое быстрее" },
    { id: "fridge",  icon: "🧊", name: "Холодильник",     price: 6000,  text: "+10 к макс. энергии", en: 10 },
    { id: "tv",      icon: "📺", name: "Телевизор",       price: 9000,  text: "+10% опыта за движухи" },
    { id: "safe",    icon: "🔐", name: "Сейф",            price: 12000, text: "Вместимость сейфа ×2" }
  ],

  // Районы города
  districts: [
    { id: "west",  name: "West Side",       icon: "🏘️", lvl: 2,  boss: "Банда Рыжего",      hp: 230, atk: 21, def: 21,  inc: 150,   auth: 20 },
    { id: "prom",  name: "Промзона",        icon: "🏭", lvl: 6,  boss: "Бригада Штыря",     hp: 270, atk: 44, def: 44,  inc: 600,   auth: 50 },
    { id: "old",   name: "Старый город",    icon: "🏚️", lvl: 11, boss: "Люди Седого",       hp: 340, atk: 72, def: 72,  inc: 1800,  auth: 120 },
    { id: "port",  name: "Порт",            icon: "⚓", lvl: 17, boss: "Портовые",          hp: 450, atk: 110, def: 110,  inc: 5000,  auth: 250 },
    { id: "kings", name: "Kings District",  icon: "👑", lvl: 24, boss: "Охрана Барона",     hp: 520, atk: 148, def: 148, inc: 14000, auth: 500 },
    { id: "city",  name: "City Center",     icon: "🏙️", lvl: 32, boss: "Совет Пятерых",     hp: 620, atk: 195, def: 175, inc: 40000, auth: 1000 }
  ],

  // Рейды: боссы с общим запасом здоровья
  bosses: [
    { id: "boar",   icon: "🐗", name: "Кабан с рынка",   lvl: 3,  hp: 700, atk: 35, def: 16,   cash: 3000,   xp: 60,   gold: 2 },
    { id: "shtyr",  icon: "⛓️", name: "Бригадир Штырь",  lvl: 8,  hp: 1300, atk: 54, def: 28,  cash: 15000,  xp: 200,  gold: 4 },
    { id: "baron",  icon: "🎩", name: "Барон Порта",     lvl: 15, hp: 2600, atk: 84, def: 54,  cash: 60000,  xp: 600,  gold: 8 },
    { id: "sedoy",  icon: "🐺", name: "Седой",           lvl: 25, hp: 3800, atk: 137, def: 84, cash: 250000, xp: 1800, gold: 15 }
  ],

  // Связи: сюжетная цепочка
  story: [
    { who: "Марк", icon: "🧑🏻‍💼", title: "Кафе на West Side",
      text: "«Ты новенький? Город любит тех, кто работает. Возьми пару движух — посмотрим, на что ты годишься».",
      goal: "Ответить Марку", check: s => true, reward: { cash: 500, xp: 20 } },
    { who: "Марк", icon: "🧑🏻‍💼", title: "Первые деньги",
      text: "«Сделай пять движух. Без суеты, без шума».",
      goal: "Выполни 5 движух", check: s => s.jobsTotal >= 5, reward: { cash: 1000, xp: 30 } },
    { who: "Лёха-механик", icon: "🧔🏻", title: "Проверка на прочность",
      text: "«Марк говорит, ты толковый. Но на улице толковых бьют первыми. Выиграй три драки — и я тебе помогу».",
      goal: "Выиграй 3 боя", check: s => s.wins >= 3, reward: { cash: 1500, xp: 40, gold: 2 } },
    { who: "Марк", icon: "🧑🏻‍💼", title: "Своя точка",
      text: "«Деньги должны работать. Купи себе хоть ларёк».",
      goal: "Купи любую точку", check: s => Object.values(s.biz).some(n => n > 0), reward: { cash: 2500, xp: 50 } },
    { who: "Капитан Орлов", icon: "👮🏻‍♂️", title: "Знакомство с законом",
      text: "«Я за тобой присматриваю. Хочешь, чтобы тебя уважали — набери вес в городе».",
      goal: "Набери 100 авторитета", check: s => authority(s) >= 100, reward: { cash: 3000, xp: 60 } },
    { who: "Марк", icon: "🧑🏻‍💼", title: "West Side",
      text: "«Рыжий держит наш район и тянет со всех. Пора это закончить».",
      goal: "Захвати West Side", check: s => !!s.districts.west, reward: { cash: 5000, xp: 90, gold: 3 } },
    { who: "Лёха-механик", icon: "🧔🏻", title: "Своя крыша",
      text: "«Хватит жить в общаге. Человеку с весом нужна нормальная хата».",
      goal: "Купи однушку или лучше", check: s => s.home >= 1, reward: { cash: 6000, xp: 120 } },
    { who: "Капитан Орлов", icon: "👮🏻‍♂️", title: "Кабан",
      text: "«На рынке беспредельничает Кабан. Официально я ничего не говорил».",
      goal: "Победи Кабана в рейде", check: s => (s.bossKills.boar || 0) > 0, reward: { cash: 8000, xp: 150, gold: 3 } },
    { who: "Марк", icon: "🧑🏻‍💼", title: "Промзона",
      text: "«Бригада Штыря контролирует все склады. Нам нужны эти склады».",
      goal: "Захвати Промзону", check: s => !!s.districts.prom, reward: { cash: 20000, xp: 300, gold: 5 } },
    { who: "Незнакомец", icon: "🕴️", title: "Конец главы I",
      text: "«Ты быстро растёшь. Слишком быстро. В Старом городе тобой уже интересуются. До встречи, Империя».",
      goal: "Достигни 12 уровня", check: s => s.level >= 12, reward: { cash: 50000, xp: 500, gold: 10 } }
  ],

  // Клички для противников
  nicks: ["Шрам", "Бульдог", "Кастет", "Тихий", "Хромой", "Сиплый", "Кирпич", "Гвоздь", "Рыжий",
          "Штырь", "Кабан", "Малой", "Чиж", "Жила", "Балу", "Танкист", "Сварщик", "Дизель", "Лом", "Буря"],

  wheel: [
    { label: "$500",       give: { cash: 500 } },
    { label: "$2 000",     give: { cash: 2000 } },
    { label: "💎 1",       give: { gold: 1 } },
    { label: "⚡ полная",  give: { energyFull: true } },
    { label: "$5 000",     give: { cash: 5000 } },
    { label: "💎 3",       give: { gold: 3 } },
    { label: "⭐ 100",     give: { xp: 100 } },
    { label: "$1 000",     give: { cash: 1000 } }
  ]
};
