const art = (name: string) => `${import.meta.env.BASE_URL}art/${name}.webp`;

/** One cached portrait atlas; each equal square is an original character. */
export function Portrait({ look = 13 }: { look?: number }) {
  return (
    <span
      className="portrait-art"
      role="img"
      aria-label="Иллюстрированный портрет персонажа"
      style={{
        backgroundImage: `url(${art("residents")})`,
        backgroundPosition: `${((look % 4) * 100) / 3}% ${(Math.floor(look / 4) * 100) / 3}%`,
      }}
    />
  );
}
export function PlayerPortrait() {
  return (
    <img
      className="player-art"
      src={art("player")}
      alt="Молодой житель Empire City в зелёной куртке"
    />
  );
}
export function CityArt({ variant = 0 }: { variant?: number }) {
  return variant === 0 ? (
    <img
      className="city-art"
      src={art("city")}
      alt="Иллюстрированный Empire City: огни баров, осенние улицы и небоскрёбы на закате"
      fetchPriority="high"
    />
  ) : (
    <div
      className={`city-art district-scene district-scene-${variant}`}
      role="img"
      aria-label={
        [
          "",
          "Особняк семьи Харриган",
          "Улица Старого города",
          "Порт и промышленные доки",
          "Рестораны Вест-сайда",
        ][variant]
      }
      style={{
        backgroundImage: `url(${art("districts")})`,
        backgroundPosition: `${((variant - 1) % 2) * 100}% ${Math.floor((variant - 1) / 2) * 100}%`,
      }}
    />
  );
}

export function Medallion({ index }: { index: number }) {
  return (
    <span
      className="medallion"
      aria-hidden="true"
      style={{
        backgroundImage: `url(${art("medallions")})`,
        backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`,
      }}
    />
  );
}
export function CharacterScene() {
  return (
    <img
      className="character-image"
      src={art("character")}
      alt="Персонаж в полный рост: зелёное пальто, жилет и кожаные ботинки, ночная улица Empire City"
      fetchPriority="high"
    />
  );
}
