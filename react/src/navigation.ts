export const pages = [
  "profile",
  "map",
  "city",
  "quests",
  "contacts",
  "orgs",
  "inventory",
  "settings",
  "jobs",
  "fights",
  "raids",
  "turf",
  "business",
  "shop",
  "home",
  "crew",
  "bank",
] as const;
export type Page = (typeof pages)[number];
export function readPage(hash: string): Page {
  const value = hash.replace(/^#\/?/, "");
  return pages.includes(value as Page) ? (value as Page) : "profile";
}
export const pageNames: Record<Page, string> = {
  profile: "Профиль",
  map: "Карта города",
  city: "Город",
  quests: "Задания",
  contacts: "Жители",
  orgs: "Организации",
  inventory: "Вещи",
  settings: "Настройки",
  jobs: "Движухи",
  fights: "Бои",
  raids: "Рейды",
  turf: "Районы",
  business: "Точки",
  shop: "Барыга",
  home: "Хата",
  crew: "Бригада",
  bank: "Сейф",
};
