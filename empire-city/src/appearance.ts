/** Cosmetic identity is independent of quests, factions and combat stats. */
export const faces = {
  street: {
    label: "Горожанин",
    age: 32,
    detail: "Короткая стрижка, шрам на щеке",
    asset: "street",
    skin: ["#f2c19c", "#dfa27a", "#b7785d"],
  },
  veteran: {
    label: "Ветеран",
    age: 58,
    detail: "Седина, выразительные серебряные усы",
    asset: "veteran",
    skin: ["#edbd98", "#dca17b", "#b37760"],
  },
  negotiator: {
    label: "Переговорщик",
    age: 34,
    detail: "Короткий фейд, аккуратная борода",
    asset: "negotiator",
    skin: ["#b5805c", "#946343", "#68442f"],
  },
  strategist: {
    label: "Стратег",
    age: 40,
    detail: "Тёмное каре, уверенный взгляд",
    asset: "strategist",
    skin: ["#f2c4a2", "#e0aa88", "#b87d64"],
  },
} as const;
export const backdrops = {
  office: { label: "Кабинет", description: "Тёплый свет, дождь за окнами" },
  city: { label: "Ночной город", description: "Неон и огни мегаполиса" },
  club: {
    label: "Спортивный клуб",
    description: "Место для подготовки к арене",
  },
} as const;
export type FaceId = keyof typeof faces;
export type BackdropId = keyof typeof backdrops;
export type Appearance = { face: FaceId; backdrop: BackdropId };
export const defaultAppearance = (): Appearance => ({
  face: "street",
  backdrop: "office",
});
export function validAppearance(value: unknown): value is Appearance {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const a = value as Record<string, unknown>;
  return (
    typeof a.face === "string" &&
    Object.hasOwn(faces, a.face) &&
    typeof a.backdrop === "string" &&
    Object.hasOwn(backdrops, a.backdrop)
  );
}
export const classicOutfit = [
  "gear.coat",
  "gear.tailored",
  "gear.oxfords",
  "gear.fedora",
] as const;
