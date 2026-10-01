import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import BotCommand

from .config import load_config
from .db import Database
from .handlers import router


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    config = load_config()
    db = Database(config.db_path)
    await db.connect()

    bot = Bot(config.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher(db=db, config=config)
    dp.include_router(router)

    await bot.set_my_commands([
        BotCommand(command="start", description="Главное меню"),
        BotCommand(command="cases", description="Кейсы"),
        BotCommand(command="inventory", description="Инвентарь"),
        BotCommand(command="profile", description="Профиль"),
        BotCommand(command="bonus", description="Бонус"),
        BotCommand(command="top", description="Топ игроков"),
    ])
    try:
        await dp.start_polling(bot)
    finally:
        await db.close()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
