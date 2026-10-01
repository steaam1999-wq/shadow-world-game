import os
from dataclasses import dataclass

from dotenv import load_dotenv


@dataclass(frozen=True)
class Config:
    bot_token: str
    db_path: str
    start_balance: int
    daily_bonus: int
    bonus_cooldown_hours: int


def load_config() -> Config:
    load_dotenv()
    token = os.getenv("BOT_TOKEN", "").strip()
    if not token:
        raise RuntimeError("BOT_TOKEN не задан. Скопируйте .env.example в .env и укажите токен от @BotFather.")
    return Config(
        bot_token=token,
        db_path=os.getenv("DB_PATH", "csbot.sqlite3"),
        start_balance=int(os.getenv("START_BALANCE", "1000")),
        daily_bonus=int(os.getenv("DAILY_BONUS", "250")),
        bonus_cooldown_hours=int(os.getenv("BONUS_COOLDOWN_HOURS", "24")),
    )
