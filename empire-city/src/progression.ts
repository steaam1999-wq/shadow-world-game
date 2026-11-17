import { hasMet, type GameState } from "./game";
import { npcs } from "./data";
import { equipmentSlots } from "./equipment";
export function progression(s: GameState) {
  const jobs = Object.values(s.questProgress).filter(
    (v) => v === "complete",
  ).length;
  const friends = npcs.filter((n) => hasMet(s, n.id)).length;
  const outfit = equipmentSlots.filter(
    (slot) => s.loadout.equipment[slot],
  ).length;
  const score = s.xp + s.reputation * 10 + jobs * 25 + s.arenaWins * 15;
  const ranks = [
    { name: "Новый житель", at: 0 },
    { name: "Свой в районе", at: 150 },
    { name: "Деловой партнёр", at: 500 },
    { name: "Городской авторитет", at: 1200 },
    { name: "Влиятельный игрок", at: 3000 },
  ];
  const index = ranks.reduce((best, r, i) => (score >= r.at ? i : best), 0),
    rank = ranks[index],
    next = ranks[index + 1];
  const achievements = [
    {
      id: "chapter",
      name: "Новая жизнь",
      description: "Завершить первую главу",
      value: s.stage === "complete" ? 1 : 0,
      target: 1,
      icon: 5,
    },
    {
      id: "outfit",
      name: "Городской стиль",
      description: "Надеть полный комплект из пяти вещей",
      value: s.decisions.some((d) => d.id === "achievement:outfit")
        ? 5
        : outfit,
      target: 5,
      icon: 12,
    },
    {
      id: "first-work",
      name: "Полезный человек",
      description: "Выполнить первое поручение",
      value: jobs,
      target: 1,
      icon: 15,
    },
    {
      id: "jobs",
      name: "Человек дела",
      description: "Выполнить все поручения города",
      value: jobs,
      target: 10,
      icon: 19,
    },
    {
      id: "fight",
      name: "Первый раунд",
      description: "Победить в спарринге",
      value: s.arenaWins,
      target: 1,
      icon: 9,
    },
    {
      id: "fighter",
      name: "Завсегдатай ринга",
      description: "Выиграть десять спаррингов",
      value: s.arenaWins,
      target: 10,
      icon: 14,
    },
    {
      id: "city",
      name: "Весь город открыт",
      description: "Открыть пять районов",
      value: s.unlocked.length,
      target: 5,
      icon: 0,
    },
    {
      id: "contacts",
      name: "Свои люди",
      description: "Познакомиться с пятью жителями",
      value: friends,
      target: 5,
      icon: 6,
    },
  ];
  return {
    rank,
    next,
    score,
    jobs,
    friends,
    outfit,
    progress: next
      ? Math.min(
          100,
          Math.floor(((score - rank.at) / (next.at - rank.at)) * 100),
        )
      : 100,
    achievements,
  };
}
