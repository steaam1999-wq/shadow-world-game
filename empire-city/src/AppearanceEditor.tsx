import { profileBackdrop } from "./profileArt";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { faces, backdrops, type FaceId, type BackdropId } from "./appearance";
import { profileOutfit, updateProfile, type GameState } from "./game";
import type { Dispatch, SetStateAction } from "react";
export function AppearanceEditor({
  game,
  setGame,
  onClose,
}: {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
  onClose: () => void;
}) {
  const [name, setName] = useState(game.name);
  const [appearance, setAppearance] = useState({ ...game.appearance });
  const [classic, setClassic] = useState(false);
  const locked = !!game.arena && !game.arena.finished;
  const loadout = profileOutfit(game.loadout, classic);
  const commit = () => {
    setGame((current) => updateProfile(current, name, appearance, classic));
    onClose();
  };
  return (
    <div className="appearance-editor">
      <div
        className="appearance-preview"
        style={{
          backgroundImage: `url(${profileBackdrop(appearance, game.district)})`,
        }}
        data-backdrop={appearance.backdrop}
      >
        <Avatar equipment={loadout.equipment} appearance={appearance} />
        <span className="preview-caption">
          {faces[appearance.face].label} · {faces[appearance.face].age}
        </span>
      </div>
      <p className="appearance-intro">
        Твой образ в Empire City. Внешность и фон не меняют историю и отношения.
      </p>
      <label className="profile-name-field">
        Имя персонажа
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoComplete="off"
        />
      </label>
      <fieldset className="appearance-fieldset">
        <legend>Внешность</legend>
        <div className="face-options">
          {(Object.entries(faces) as [FaceId, (typeof faces)[FaceId]][]).map(
            ([id, face]) => (
              <button
                type="button"
                key={id}
                aria-label={`Типаж: ${face.label}`}
                aria-pressed={appearance.face === id}
                onClick={() => setAppearance({ ...appearance, face: id })}
              >
                <img
                  src={`${import.meta.env.BASE_URL}art/faces/${face.asset}.webp`}
                  alt=""
                />
                <span>
                  <b>{face.label}</b>
                  <small>{face.age} лет</small>
                </span>
              </button>
            ),
          )}
        </div>
        <p className="appearance-detail">{faces[appearance.face].detail}</p>
      </fieldset>
      <fieldset className="appearance-fieldset">
        <legend>Фон портрета</legend>
        <div className="backdrop-options">
          {(
            Object.entries(backdrops) as [
              BackdropId,
              (typeof backdrops)[BackdropId],
            ][]
          ).map(([id, backdrop]) => (
            <button
              type="button"
              key={id}
              aria-pressed={appearance.backdrop === id}
              onClick={() => setAppearance({ ...appearance, backdrop: id })}
            >
              {backdrop.label}
            </button>
          ))}
        </div>
        <p className="appearance-detail">
          {backdrops[appearance.backdrop].description}. Игровой район остаётся
          прежним.
        </p>
      </fieldset>
      <fieldset className="appearance-fieldset">
        <legend>Одежда</legend>
        <div className="outfit-options">
          <button
            type="button"
            aria-pressed={!classic}
            onClick={() => setClassic(false)}
          >
            <b>Мои вещи</b>
            <small>Текущая экипировка</small>
          </button>
          <button
            type="button"
            aria-pressed={classic}
            onClick={() => setClassic(true)}
          >
            <b>Современная классика</b>
            <small>Пальто, брюки, туфли, шляпа · бесплатно</small>
          </button>
        </div>
        {classic && (
          <p className="appearance-detail">
            Комплект добавится в гардероб. Заменённые вещи останутся в сумке;
            перчатки сохранятся.
          </p>
        )}
      </fieldset>
      {locked && (
        <p className="screen-note">
          Смена образа доступна после завершения боя.
        </p>
      )}
      <div className="appearance-actions">
        <button
          className="game-button"
          disabled={locked || !name.trim()}
          onClick={commit}
        >
          Сохранить образ
        </button>
        <button className="compact-button" onClick={onClose}>
          Отмена
        </button>
      </div>
    </div>
  );
}
