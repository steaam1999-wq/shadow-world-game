import { useEffect, useState } from "react";
import {
  newGame,
  upgradeHeroAppearance,
  localRepository,
  type GameState,
} from "./game";
export function useGame() {
  const [initial] = useState(() => {
    try {
      return { state: localRepository.load() ?? newGame(), error: "" };
    } catch {
      return {
        state: newGame(),
        error:
          "Сохранение недоступно или повреждено. Сначала загрузите копию или подтвердите новую игру в настройках.",
      };
    }
  });
  const [game, setGame] = useState<GameState>(initial.state);
  const [saveBlocked, setSaveBlocked] = useState(!!initial.error);
  const [error, setError] = useState(initial.error);
  const [toast, setToast] = useState("");
  useEffect(() => {
    setGame((current) => upgradeHeroAppearance(current));
  }, [game.portraitRevision, game.arena?.finished]);
  useEffect(() => {
    if (saveBlocked) return;
    try {
      localRepository.save(game);
      setError("");
    } catch {
      setError(
        "Автосохранение недоступно. Скачайте копию прогресса в настройках.",
      );
    }
  }, [game, saveBlocked]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  const replaceGame = (state: GameState) => {
    setSaveBlocked(false);
    setGame(state);
  };
  return { game, setGame, error, toast, setToast, replaceGame };
}
