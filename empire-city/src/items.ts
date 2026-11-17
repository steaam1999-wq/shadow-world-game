import type { ItemId } from "./game";
/** Non-wearable quest items also carry a slot and asset reference. Their IDs
 * remain normalized in GameState.inventory for backward-compatible stories. */
export const storyItemCatalog: Record<
  ItemId,
  {
    id: ItemId;
    name: string;
    description: string;
    slot: "quest";
    visualAssetId: string;
    icon: number;
  }
> = {
  phone: {
    id: "phone",
    name: "Смартфон",
    description:
      "Контакты жителей, сообщения и рабочие приложения. Открой список жителей, чтобы найти знакомого.",
    slot: "quest",
    visualAssetId: "ui.smartphone",
    icon: 6,
  },
  ticket: {
    id: "ticket",
    name: "Билет в Empire City",
    description:
      "Электронный билет, с которого началась твоя новая жизнь. Открой карту, чтобы исследовать город.",
    slot: "quest",
    visualAssetId: "ui.ticket",
    icon: 7,
  },
  envelope: {
    id: "envelope",
    name: "Конверт Марка",
    description:
      "Поручение Марка Рида. Передай документы Томми Бруксу в Старом городе.",
    slot: "quest",
    visualAssetId: "ui.mail",
    icon: 5,
  },
  card: {
    id: "card",
    name: "Контакт «Тихой гавани»",
    description:
      "Томми Брукс, бар в Старом городе. Он сохранил твой номер. Здесь тебя знают.",
    slot: "quest",
    visualAssetId: "ui.contact",
    icon: 5,
  },
};
