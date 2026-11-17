import type { Page } from "./navigation";
export const sceneNames = [
  "street",
  "bar",
  "ring",
  "office",
  "wardrobe",
  "desk",
] as const;
export type SceneName = (typeof sceneNames)[number];
export function SceneBanner({
  scene,
  title,
  eyebrow,
  caption,
}: {
  scene: SceneName;
  title: string;
  eyebrow: string;
  caption?: string;
}) {
  const artwork =
    scene === "ring"
      ? "districts/ring"
      : scene === "street"
        ? "districts/center"
        : "scenes/" + scene;
  return (
    <section className="scene-banner" data-scene={scene}>
      <img
        src={`${import.meta.env.BASE_URL}art/${artwork}.webp`}
        alt=""
        draggable={false}
      />
      <div className="scene-caption">
        <small>{eyebrow}</small>
        <h2>{title}</h2>
        {caption && <p>{caption}</p>}
      </div>
    </section>
  );
}
const pageArt: Partial<
  Record<
    Page,
    { scene: SceneName; title: string; eyebrow: string; caption: string }
  >
> = {
  quests: {
    scene: "bar",
    eyebrow: "ЦЕНА ВЛАСТИ · ГЛАВА I",
    title: "Новая жизнь",
    caption: "Город запомнит твои решения.",
  },
  contacts: {
    scene: "street",
    eyebrow: "ЖИТЕЛИ EMPIRE CITY",
    title: "Лица города",
    caption: "Знакомства, доверие и личные истории.",
  },
  orgs: {
    scene: "office",
    eyebrow: "ВЛИЯНИЕ",
    title: "За закрытыми дверями",
    caption: "Три семьи и закон. У каждого своя власть.",
  },
  inventory: {
    scene: "wardrobe",
    eyebrow: "ЛИЧНОЕ",
    title: "Твой комплект",
    caption: "Одежда, экипировка и важные мелочи.",
  },
  settings: {
    scene: "desk",
    eyebrow: "ЛИЧНОЕ ДЕЛО",
    title: "Твоя история",
    caption: "Имя, сохранения и принятые решения.",
  },
  progress: {
    scene: "office",
    eyebrow: "РЕПУТАЦИЯ",
    title: "Имя в городе",
    caption: "Каждый ранг подтверждён поступками.",
  },
};
export function PageArt({ page }: { page: Page }) {
  const art = pageArt[page];
  return art ? <SceneBanner {...art} /> : null;
}
