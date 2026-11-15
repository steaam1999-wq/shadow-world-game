import { useEffect, useState } from "react";
import { freshGame, localRepository, type GameState } from "./game";
import { tick } from "./economy";
export function useGame() {
  const [initial] = useState(() => {
    try {
      return { state: localRepository.load() ?? freshGame(), error: "" };
    } catch {
      return {
        state: freshGame(),
        error:
          "Сохранение недоступно или повреждено. Сначала загрузите копию или подтвердите новую игру в настройках.",
      };
    }
  });
  const [game, setGame] = useState<GameState>(initial.state);
  const [saveBlocked, setSaveBlocked] = useState(!!initial.error);
  const [error, setError] = useState(initial.error);
  const [toast, setToast] = useState("");
  // энергия и здоровье восстанавливаются со временем (в том числе пока игра была закрыта)
  useEffect(() => {
    setGame((s) => tick(s, Date.now()));
    const timer = setInterval(() => setGame((s) => tick(s, Date.now())), 1000);
    return () => clearInterval(timer);
  }, []);
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
