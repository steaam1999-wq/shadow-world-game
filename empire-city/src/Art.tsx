import { faces, type FaceId } from "./appearance";
export const districtArtNames = [
  "center",
  "kings",
  "old",
  "industrial",
  "west",
  "ring",
] as const;
const art = (name: string) => `${import.meta.env.BASE_URL}art/${name}.webp`;
export function Portrait({ look = 13 }: { look?: number }) {
  return (
    <span
      className="portrait-art"
      role="img"
      aria-label="Портрет жителя Empire City"
      style={{
        backgroundImage: `url(${art("residents-atelier")})`,
        backgroundPosition: `${((look % 4) * 100) / 3}% ${(Math.floor(look / 4) * 100) / 3}%`,
      }}
    />
  );
}
export function CityArt({ variant = 0 }: { variant?: number }) {
  return (
    <div
      className="city-art modern-city"
      role="img"
      aria-label={
        [
          "Современный деловой центр",
          "Жилой район Кингс",
          "Обновлённый Старый город",
          "Логистический район",
          "Деловой Вест-сайд",
          "Спортивный клуб",
        ][variant]
      }
      style={{
        backgroundImage: `url(${art("districts/" + districtArtNames[Math.max(0, Math.min(5, variant))])})`,
      }}
    />
  );
}
/** Rich original icons use individual square frames so their proportions stay fixed. */
export function Medallion({
  index,
  faceId = "street",
}: {
  index: number;
  faceId?: FaceId;
}) {
  return (
    <span
      className={`medallion game-icon ${index === 2 ? "player-medallion" : ""}`}
      aria-hidden="true"
    >
      <img
        src={
          index === 2
            ? `${import.meta.env.BASE_URL}art/faces/${faces[faceId].asset}.webp`
            : `${import.meta.env.BASE_URL}art/emblems/${index}.webp`
        }
        alt=""
        draggable={false}
      />
    </span>
  );
}
export function OpponentPortrait({ id }: { id: string }) {
  const index = ["rookie", "trainer", "champion"].indexOf(id);
  return (
    <div
      className="fighter-portrait"
      role="img"
      aria-label={
        id === "champion"
          ? "Алина «Вектор» крупным планом"
          : id === "trainer"
            ? "Денис «Опора» крупным планом"
            : "Артём «Ритм» крупным планом"
      }
      style={{
        backgroundImage: `url(${art("fighters-ink")})`,
        backgroundPosition: `${Math.max(index, 0) * 50}% 0%`,
      }}
    />
  );
}
