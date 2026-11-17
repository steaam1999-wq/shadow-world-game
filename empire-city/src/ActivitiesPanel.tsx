import { faces } from "./appearance";
import { SceneBanner } from "./SceneArt";
import { useState } from "react";
import { OpponentPortrait, Portrait } from "./Art";
import type { Dispatch, SetStateAction } from "react";
import { jobs, opponents } from "./activities";
import { districts, npcs } from "./data";
import {
  acceptJob,
  resolveJob,
  startFight,
  arenaAction,
  travel,
  REST_COST,
  type GameState,
} from "./game";
import { combatStats } from "./equipment";
export function JobsPanel({
  game,
  setGame,
}: {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
}) {
  return (
    <section className="jobs-panel">
      <h2 className="section-title">Поручения города · 10</h2>
      {jobs.map((q) => {
        const status = game.questProgress[q.id];
        const owner = npcs.find((n) => n.id === q.npc)!;
        const blocked =
          game.level < q.minLevel ||
          (q.requires && game.questProgress[q.requires] !== "complete");
        return (
          <article className="job-card game-panel" key={q.id}>
            <div className="job-meta">
              <span className="job-portrait">
                <Portrait look={owner.look} />
              </span>
              <span>
                <b>{owner.name}</b>
                <small>
                  {districts.find((d) => d.id === q.district)!.ru} · ур.{" "}
                  {q.minLevel}
                </small>
              </span>
              <span className={`job-state ${status ?? ""}`}>
                {status === "complete"
                  ? "Готово"
                  : status === "active"
                    ? "В работе"
                    : blocked
                      ? "Закрыто"
                      : "Поручение"}
              </span>
            </div>
            <h3>{q.title}</h3>
            <p>{q.intro}</p>
            {status === "complete" ? (
              <p className="job-done">Выполнено. Награда получена.</p>
            ) : blocked ? (
              <p className="development">
                {game.level < q.minLevel
                  ? "Нужен уровень " + q.minLevel
                  : "Сначала: " + jobs.find((j) => j.id === q.requires)?.title}
              </p>
            ) : game.district !== q.district ? (
              <button
                className="game-button secondary"
                disabled={
                  !game.unlocked.includes(q.district) ||
                  game.energy < 5 ||
                  (!!game.arena && !game.arena.finished)
                }
                onClick={() => setGame((s) => travel(s, q.district))}
              >
                {game.unlocked.includes(q.district)
                  ? "В район задания · −5 энергии"
                  : "Район ещё закрыт"}
              </button>
            ) : !status ? (
              <button
                className="game-button"
                disabled={!!game.arena && !game.arena.finished}
                onClick={() => setGame((s) => acceptJob(s, q.id))}
              >
                Взять поручение
              </button>
            ) : (
              <div className="job-choices">
                {q.choices.map((c) => (
                  <button
                    key={c.id}
                    className="choice-button"
                    disabled={
                      game.energy < c.energy ||
                      (!!game.arena && !game.arena.finished)
                    }
                    onClick={() => setGame((s) => resolveJob(s, q.id, c.id))}
                  >
                    <span>
                      <b>{c.label}</b>
                      <small>
                        −{c.energy} энергии · +${c.money} · +{c.xp} XP
                        {c.gear ? " · экипировка" : ""}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
export function ArenaPanel({
  game,
  setGame,
  onRest,
}: {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
  onRest: () => void;
}) {
  const [selectedId, setSelectedId] = useState("rookie");
  const fight = game.arena;
  const active = !!fight && !fight.finished;
  const selected = opponents.find(
    (o) => o.id === (active ? fight.opponentId : selectedId),
  )!;
  const stats = combatStats(game.loadout);
  return (
    <section className="arena-panel">
      <SceneBanner
        scene="ring"
        eyebrow="АРЕНА"
        title="Городской ринг"
        caption={`Одиночные спарринги · Побед: ${game.arenaWins}`}
      />
      <div className="arena-roster">
        {opponents.map((o) => (
          <button
            key={o.id}
            className={selected.id === o.id ? "selected" : ""}
            disabled={active}
            onClick={() => setSelectedId(o.id)}
            aria-label={"Выбрать бойца: " + o.name}
          >
            <OpponentPortrait id={o.id} />
            <b>{o.name.split(" ")[0]}</b>
            <small>Уровень {o.level}</small>
          </button>
        ))}
      </div>
      <p className="screen-note">
        Твоя атака: {stats.attack} · защита: {stats.defense}. Вход: 10 энергии.
        Здоровье от 25.
      </p>
      {game.district !== "center" && (
        <button
          className="game-button"
          disabled={game.energy < 5}
          onClick={() => setGame((s) => travel(s, "center"))}
        >
          В Сити-центр · −5 энергии
        </button>
      )}
      {active && fight ? (
        <section className="game-panel fight-panel">
          <div className="fight-lineup">
            <div className="player-fighter">
              <img
                src={`${import.meta.env.BASE_URL}art/faces/${faces[game.appearance.face].asset}.webp`}
                alt={game.name}
              />
              <b>{game.name}</b>
            </div>
            <span className="round-badge">
              <small>РАУНД</small>
              <b>{fight.turn + 1}</b>
            </span>
            <div className="fight-opponent">
              <OpponentPortrait id={fight.opponentId} />
              <h3>{selected.name}</h3>
            </div>
          </div>
          <div className="fight-bars">
            <span>Твоё здоровье: {game.health} / 100</span>
            <progress
              aria-label="Твоё здоровье"
              max={100}
              value={game.health}
            />
            <span>
              {selected.name}: {fight.enemyHealth} / {selected.health}
            </span>
            <progress
              aria-label={`Здоровье: ${selected.name}`}
              max={selected.health}
              value={fight.enemyHealth}
            />
          </div>
          <div className="fight-log" aria-live="polite">
            {fight.log.slice(-4).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <div className="fight-controls">
            <button
              className="game-button"
              onClick={() => setGame((s) => arenaAction(s, "attack"))}
            >
              Удар
            </button>
            <button
              className="game-button secondary"
              onClick={() => setGame((s) => arenaAction(s, "guard"))}
            >
              Защита
            </button>
            <button
              className="game-button secondary"
              disabled={game.energy < 5}
              onClick={() => setGame((s) => arenaAction(s, "recover"))}
            >
              Перевести дух · −5
            </button>
          </div>
          <button
            className="text-link"
            onClick={() => setGame((s) => arenaAction(s, "forfeit"))}
          >
            Завершить спарринг
          </button>
        </section>
      ) : (
        <>
          {fight && (
            <div className="game-panel fight-panel">
              <p className="job-done">
                {fight.result === "won"
                  ? "Победа. Награда зачислена."
                  : "Спарринг окончен."}
              </p>
              <div className="fight-log">
                {fight.log.slice(-2).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}
          <article className="game-panel opponent-card">
            <OpponentPortrait id={selected.id} />
            <div className="opponent-info">
              <h3>{selected.name}</h3>
              <p>
                Уровень {selected.level} · здоровье {selected.health}
                <br />
                Атака {selected.attack} · защита {selected.defense}
              </p>
              <p>
                Награда: $ {selected.money} · {selected.xp} XP
              </p>
            </div>
            <button
              className="game-button"
              disabled={
                game.district !== "center" ||
                game.energy < 10 ||
                game.health < 25 ||
                game.level < selected.level
              }
              onClick={() => setGame((s) => startFight(s, selected.id))}
            >
              {game.level < selected.level
                ? "Нужен уровень " + selected.level
                : "Начать спарринг"}
            </button>
          </article>
          <button className="game-button secondary" onClick={onRest}>
            {game.money >= REST_COST
              ? `Восстановить силы · −$${REST_COST}`
              : "Короткая передышка"}
          </button>
        </>
      )}
    </section>
  );
}
