import type { DistrictId } from "./data";
export type Job = {
  id: string;
  title: string;
  district: DistrictId;
  npc: string;
  intro: string;
  minLevel: number;
  requires?: string;
  choices: {
    id: string;
    label: string;
    outcome: string;
    energy: number;
    money: number;
    xp: number;
    reputation: number;
    relation: number;
    gear?: string;
  }[];
};
export const jobs: Job[] = [
  {
    id: "delivery-app",
    title: "Последний заказ",
    district: "center",
    npc: "mark",
    minLevel: 1,
    intro:
      "Марк просит подменить курьера: клиент ждёт документы у метро, а приложение снова построило странный маршрут.",
    choices: [
      {
        id: "metro",
        label: "Доставить на метро",
        outcome: "Документы у клиента. Марк оценил пунктуальность.",
        energy: 12,
        money: 45,
        xp: 20,
        reputation: 1,
        relation: 3,
      },
      {
        id: "walk",
        label: "Проверить адрес и пройти пешком",
        outcome:
          "Адрес оказался новым входом в бизнес-центр. Ты избежал путаницы.",
        energy: 18,
        money: 60,
        xp: 25,
        reputation: 2,
        relation: 4,
      },
    ],
  },
  {
    id: "lost-phone",
    title: "Чужой смартфон",
    district: "center",
    npc: "emma",
    minLevel: 1,
    intro:
      "У банкомата найден телефон с рабочими документами. Эмма помогает установить владельца.",
    choices: [
      {
        id: "call",
        label: "Позвонить экстренному контакту",
        outcome: "Владелец забрал телефон и оставил благодарность.",
        energy: 10,
        money: 35,
        xp: 20,
        reputation: 2,
        relation: 4,
      },
      {
        id: "desk",
        label: "Передать телефон в бюро находок",
        outcome: "Передача зарегистрирована. Эмма запомнила твою аккуратность.",
        energy: 8,
        money: 20,
        xp: 20,
        reputation: 3,
        relation: 5,
      },
    ],
  },
  {
    id: "bar-audit",
    title: "Ночная инвентаризация",
    district: "old",
    npc: "tommy",
    minLevel: 1,
    intro:
      "В баре Томми расходятся остатки в системе и на складе. Нужно найти ошибку до следующей поставки.",
    choices: [
      {
        id: "receipts",
        label: "Сверить электронные накладные",
        outcome:
          "Одна поставка была посчитана дважды. Томми отдал тебе новое худи.",
        energy: 18,
        money: 65,
        xp: 35,
        reputation: 2,
        relation: 7,
        gear: "gear.hoodie",
      },
      {
        id: "count",
        label: "Пересчитать склад вместе с персоналом",
        outcome:
          "Команда навела порядок и нашла ошибку учёта. Худи — подарок от бара.",
        energy: 22,
        money: 80,
        xp: 40,
        reputation: 3,
        relation: 8,
        gear: "gear.hoodie",
      },
    ],
  },
  {
    id: "cafe-network",
    title: "Нет связи",
    district: "old",
    npc: "luca",
    minLevel: 1,
    intro:
      "В квартале пропал интернет. Заказы кафе зависли, а провайдер просит проверить оборудование.",
    choices: [
      {
        id: "router",
        label: "Помочь проверить роутеры",
        outcome: "Сеть восстановлена после замены неисправного блока питания.",
        energy: 14,
        money: 50,
        xp: 25,
        reputation: 2,
        relation: 4,
      },
      {
        id: "hotspot",
        label: "Организовать временную мобильную сеть",
        outcome: "Кафе продолжили принимать заказы, пока инженер чинил линию.",
        energy: 20,
        money: 75,
        xp: 30,
        reputation: 3,
        relation: 5,
      },
    ],
  },
  {
    id: "financial-trace",
    title: "Цифровой след",
    district: "center",
    npc: "emma",
    minLevel: 2,
    requires: "lost-phone",
    intro:
      "В документах владельца телефона нашлись повторные платежи. Эмма предлагает официально помочь с таблицей переводов.",
    choices: [
      {
        id: "sort",
        label: "Сопоставить номера транзакций",
        outcome:
          "Выявлены три ошибочных списания. Деньги вернут законным владельцам.",
        energy: 20,
        money: 100,
        xp: 45,
        reputation: 4,
        relation: 8,
      },
      {
        id: "report",
        label: "Подготовить полный отчёт",
        outcome: "Твой отчёт принят в дело. Эмма поручится за твою точность.",
        energy: 26,
        money: 125,
        xp: 55,
        reputation: 5,
        relation: 10,
      },
    ],
  },
  {
    id: "guest-list",
    title: "Список гостей",
    district: "kings",
    npc: "alex",
    minLevel: 2,
    intro:
      "На деловом вечере Харриганов появились дубликаты QR-пропусков. Александр просит проверить список.",
    choices: [
      {
        id: "verify",
        label: "Сверить пропуска с регистрацией",
        outcome: "Ошибка выгрузки исправлена, гости прошли без задержек.",
        energy: 20,
        money: 110,
        xp: 45,
        reputation: 3,
        relation: 7,
      },
      {
        id: "call",
        label: "Лично подтвердить спорные приглашения",
        outcome:
          "Выяснилось, кому действительно нужен доступ. Александр доволен.",
        energy: 25,
        money: 140,
        xp: 50,
        reputation: 4,
        relation: 9,
      },
    ],
  },
  {
    id: "warehouse",
    title: "Поставка под контролем",
    district: "industrial",
    npc: "miguel",
    minLevel: 2,
    intro:
      "На складе не читается маркировка нескольких коробок. Мигель предлагает сверить груз до приёмки.",
    choices: [
      {
        id: "scan",
        label: "Сопоставить штрихкоды и фото",
        outcome: "Коробки найдены в системе. Мигель выдал рабочие брюки карго.",
        energy: 24,
        money: 130,
        xp: 50,
        reputation: 3,
        relation: 7,
        gear: "gear.cargo",
      },
      {
        id: "manifest",
        label: "Проверить весь манифест",
        outcome:
          "Кроме маркировки обнаружена ошибка в количестве. Карго — твоя рабочая награда.",
        energy: 30,
        money: 165,
        xp: 60,
        reputation: 4,
        relation: 10,
        gear: "gear.cargo",
      },
    ],
  },
  {
    id: "restaurant",
    title: "Перед открытием",
    district: "west",
    npc: "sofia",
    minLevel: 2,
    intro:
      "София открывает новый ресторан. В системе бронирования несколько столиков назначены одновременно.",
    choices: [
      {
        id: "schedule",
        label: "Перестроить расписание бронирований",
        outcome: "Каждому гостю нашлось место. Первый вечер прошёл спокойно.",
        energy: 20,
        money: 115,
        xp: 45,
        reputation: 3,
        relation: 8,
      },
      {
        id: "guests",
        label: "Позвонить гостям и предложить варианты",
        outcome:
          "Гости оценили внимание. София хочет снова с тобой поработать.",
        energy: 25,
        money: 140,
        xp: 55,
        reputation: 4,
        relation: 10,
      },
    ],
  },
  {
    id: "neighborhood",
    title: "Общий двор",
    district: "old",
    npc: "antonio",
    minLevel: 1,
    requires: "cafe-network",
    intro:
      "Антонио собирает жителей на встречу по благоустройству. Нужна помощь с заявками и фотографиями двора.",
    choices: [
      {
        id: "forms",
        label: "Оформить коллективную заявку",
        outcome:
          "Заявка принята городским сервисом. Жители запомнили твою помощь.",
        energy: 16,
        money: 55,
        xp: 30,
        reputation: 4,
        relation: 7,
      },
      {
        id: "photos",
        label: "Подготовить фотоотчёт и смету",
        outcome: "Подробный отчёт ускорил рассмотрение. Антонио благодарен.",
        energy: 22,
        money: 80,
        xp: 40,
        reputation: 5,
        relation: 9,
      },
    ],
  },
  {
    id: "office-access",
    title: "Новый доступ",
    district: "west",
    npc: "nicholas",
    minLevel: 2,
    requires: "restaurant",
    intro:
      "Николас переезжает в новый офис. Временные пропуска сотрудников нужно перенести в новую систему.",
    choices: [
      {
        id: "batch",
        label: "Проверить список и импортировать пакет",
        outcome: "Доступы перенесены, лишние записи удалены.",
        energy: 22,
        money: 150,
        xp: 55,
        reputation: 3,
        relation: 7,
      },
      {
        id: "audit",
        label: "Провести поимённую проверку",
        outcome:
          "Ты обнаружил два устаревших пропуска. Николас оценил надёжность.",
        energy: 28,
        money: 180,
        xp: 65,
        reputation: 4,
        relation: 10,
      },
    ],
  },
];
export type ArenaFight = {
  opponentId: string;
  enemyHealth: number;
  turn: number;
  finished: boolean;
  result: "won" | "lost" | null;
  log: string[];
};
export const opponents = [
  {
    id: "rookie",
    name: "Артём «Ритм»",
    level: 1,
    health: 45,
    attack: 6,
    defense: 1,
    money: 60,
    xp: 30,
  },
  {
    id: "trainer",
    name: "Денис «Опора»",
    level: 2,
    health: 75,
    attack: 10,
    defense: 3,
    money: 100,
    xp: 50,
  },
  {
    id: "champion",
    name: "Алина «Вектор»",
    level: 3,
    health: 110,
    attack: 14,
    defense: 5,
    money: 180,
    xp: 80,
  },
];
