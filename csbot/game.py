"""Чистая игровая логика: выпадение предметов из кейса (без Telegram и БД)."""
import random
from dataclasses import dataclass

from .catalog import RARITIES, STATTRAK_CHANCE, STATTRAK_MULT, WEARS, Case, Skin, Wear


@dataclass(frozen=True)
class Drop:
    skin: Skin
    wear: Wear
    float_value: float
    stattrak: bool
    price: int

    @property
    def full_name(self) -> str:
        prefix = "StatTrak™ " if self.stattrak else ""
        return f"{prefix}{self.skin.name} ({self.wear.title})"


def item_price(skin: Skin, wear: Wear, stattrak: bool) -> int:
    price = skin.base_price * wear.price_mult
    if stattrak:
        price *= STATTRAK_MULT
    return max(1, round(price))


def roll_rarity(case: Case, rng: random.Random) -> str:
    available = [r for r in RARITIES.values() if case.by_rarity(r.key)]
    return rng.choices([r.key for r in available], weights=[r.weight for r in available])[0]


def roll_wear(rng: random.Random) -> tuple[Wear, float]:
    wear = rng.choices(WEARS, weights=[w.weight for w in WEARS])[0]
    return wear, round(rng.uniform(wear.float_min, wear.float_max), 6)


def open_case(case: Case, rng: random.Random | None = None) -> Drop:
    rng = rng or random.Random()
    skin = rng.choice(case.by_rarity(roll_rarity(case, rng)))
    wear, float_value = roll_wear(rng)
    stattrak = rng.random() < STATTRAK_CHANCE
    return Drop(skin, wear, float_value, stattrak, item_price(skin, wear, stattrak))


def expected_value(case: Case) -> float:
    """Математическое ожидание стоимости дропа — для баланса экономики."""
    present = [r for r in RARITIES.values() if case.by_rarity(r.key)]
    total_weight = sum(r.weight for r in present)
    wear_total = sum(w.weight for w in WEARS)
    ev = 0.0
    for r in present:
        skins = case.by_rarity(r.key)
        for skin in skins:
            for wear in WEARS:
                for st, p_st in ((True, STATTRAK_CHANCE), (False, 1 - STATTRAK_CHANCE)):
                    p = (r.weight / total_weight) / len(skins) * (wear.weight / wear_total) * p_st
                    ev += p * item_price(skin, wear, st)
    return ev
