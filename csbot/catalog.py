"""Каталог кейсов и скинов. Все цены — во внутриигровых монетах (🪙), не в реальных деньгах."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Rarity:
    key: str
    title: str
    emoji: str
    weight: float  # шанс выпадения в процентах


RARITIES: dict[str, Rarity] = {
    r.key: r
    for r in (
        Rarity("milspec", "Армейское качество", "🟦", 79.92),
        Rarity("restricted", "Запрещённое", "🟪", 15.98),
        Rarity("classified", "Засекреченное", "🩷", 3.20),
        Rarity("covert", "Тайное", "🟥", 0.64),
        Rarity("gold", "Редкий особый предмет", "🟨", 0.26),
    )
}


@dataclass(frozen=True)
class Wear:
    key: str
    title: str
    float_min: float
    float_max: float
    weight: float
    price_mult: float


WEARS: tuple[Wear, ...] = (
    Wear("FN", "Прямо с завода", 0.00, 0.07, 10, 1.6),
    Wear("MW", "Немного поношенное", 0.07, 0.15, 25, 1.2),
    Wear("FT", "После полевых испытаний", 0.15, 0.38, 40, 1.0),
    Wear("WW", "Поношенное", 0.38, 0.45, 10, 0.85),
    Wear("BS", "Закалённое в боях", 0.45, 1.00, 15, 0.7),
)

STATTRAK_CHANCE = 0.10
STATTRAK_MULT = 1.5


@dataclass(frozen=True)
class Skin:
    name: str
    rarity: str
    base_price: int


@dataclass(frozen=True)
class Case:
    key: str
    title: str
    price: int
    skins: tuple[Skin, ...]

    def by_rarity(self, rarity: str) -> list[Skin]:
        return [s for s in self.skins if s.rarity == rarity]


def _skins(rarity: str, items: list[tuple[str, int]]) -> list[Skin]:
    return [Skin(name, rarity, price) for name, price in items]


CASES: dict[str, Case] = {
    c.key: c
    for c in (
        Case(
            "revolution",
            "Кейс «Революция»",
            80,
            tuple(
                _skins("milspec", [
                    ("SCAR-20 | Fragments", 6), ("P250 | Re.built", 8), ("MP5-SD | Liquidation", 7),
                    ("SG 553 | Cyberforce", 9), ("Tec-9 | Rebel", 8), ("MAG-7 | Insomnia", 7),
                    ("MP9 | Featherweight", 10),
                ])
                + _skins("restricted", [
                    ("P90 | Neoqueen", 45), ("R8 Revolver | Banana Cannon", 35), ("MAC-10 | Sakkaku", 40),
                    ("Glock-18 | Umbral Rabbit", 55), ("M4A1-S | Emphorosaur-S", 60),
                ])
                + _skins("classified", [
                    ("AWP | Duality", 260), ("UMP-45 | Wild Child", 180), ("P2000 | Wicked Sick", 200),
                ])
                + _skins("covert", [("AK-47 | Head Shot", 1700), ("M4A4 | Temukau", 1500)])
                + _skins("gold", [
                    ("★ Sport Gloves | Vice", 18000), ("★ Specialist Gloves | Fade", 14000),
                    ("★ Driver Gloves | Snow Leopard", 9000), ("★ Hand Wraps | Cobalt Skulls", 7000),
                ])
            ),
        ),
        Case(
            "dreams",
            "Кейс «Грёзы и кошмары»",
            65,
            tuple(
                _skins("milspec", [
                    ("Five-SeveN | Scrawl", 5), ("MAC-10 | Ensnared", 6), ("MAG-7 | Foresight", 5),
                    ("MP5-SD | Necro Jr.", 7), ("P2000 | Lifted Spirits", 6), ("SCAR-20 | Poultrygeist", 5),
                    ("Sawed-Off | Spirit Board", 6),
                ])
                + _skins("restricted", [
                    ("M4A1-S | Night Terror", 50), ("XM1014 | Zombie Offensive", 35),
                    ("G3SG1 | Dream Glade", 30), ("USP-S | Ticket to Hell", 55), ("PP-Bizon | Space Cat", 40),
                ])
                + _skins("classified", [
                    ("Dual Berettas | Melondrama", 170), ("FAMAS | Rapid Eye Movement", 190),
                    ("MP7 | Abyssal Apparition", 230),
                ])
                + _skins("covert", [("AK-47 | Nightwish", 1400), ("MP9 | Starlight Protector", 1100)])
                + _skins("gold", [
                    ("★ Butterfly Knife | Doppler", 16000), ("★ Huntsman Knife | Gamma Doppler", 8000),
                    ("★ Bowie Knife | Lore", 6500), ("★ Falchion Knife | Autotronic", 6000),
                ])
            ),
        ),
        Case(
            "fracture",
            "Кейс «Разлом»",
            78,
            tuple(
                _skins("milspec", [
                    ("P250 | Cassette", 6), ("SG 553 | Ol' Rusty", 5), ("P2000 | Gnarled", 6),
                    ("PP-Bizon | Runic", 5), ("Negev | Ultralight", 7), ("P90 | Freight", 6),
                    ("SSG 08 | Mainframe 001", 9),
                ])
                + _skins("restricted", [
                    ("MAC-10 | Allure", 40), ("Tec-9 | Brother", 35), ("MAG-7 | Monster Call", 30),
                    ("Galil AR | Connexion", 38), ("MP5-SD | Kitbash", 42),
                ])
                + _skins("classified", [
                    ("AK-47 | Legion of Anubis", 260), ("XM1014 | Entombed", 160), ("M4A4 | Tooth Fairy", 210),
                ])
                + _skins("covert", [("Desert Eagle | Printstream", 1600), ("Glock-18 | Vogue", 1000)])
                + _skins("gold", [
                    ("★ Karambit | Fade", 20000), ("★ M9 Bayonet | Lore", 15000),
                    ("★ Skeleton Knife | Crimson Web", 9000), ("★ Stiletto Knife | Slaughter", 8000),
                ])
            ),
        ),
    )
}
