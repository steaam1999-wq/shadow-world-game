import asyncio
import random
from datetime import datetime

import pytest
from aiogram import Bot, Dispatcher
from aiogram.client.session.base import BaseSession
from aiogram.types import CallbackQuery, Chat, Message, Update, User as TgUser

from csbot import handlers
from csbot.catalog import CASES, RARITIES
from csbot.config import Config
from csbot.db import Database
from csbot.game import expected_value, open_case
from csbot.keyboards import CaseCb, InvCb


# ---------- игровая логика ----------

def test_rarity_distribution_roughly_matches_weights():
    rng = random.Random(42)
    case = CASES["revolution"]
    n = 50_000
    counts = {k: 0 for k in RARITIES}
    for _ in range(n):
        counts[open_case(case, rng).skin.rarity] += 1
    assert abs(counts["milspec"] / n - 0.7992) < 0.01
    assert abs(counts["restricted"] / n - 0.1598) < 0.01
    assert counts["gold"] > 0


def test_drop_is_consistent():
    rng = random.Random(1)
    for case in CASES.values():
        for _ in range(500):
            d = open_case(case, rng)
            assert d.skin in case.skins
            assert d.wear.float_min <= d.float_value <= d.wear.float_max
            assert d.price >= 1


@pytest.mark.parametrize("key", list(CASES))
def test_case_economy_slightly_negative(key):
    ratio = expected_value(CASES[key]) / CASES[key].price
    assert 0.75 < ratio < 0.95


# ---------- база данных ----------

def test_db_flow(tmp_path):
    async def run():
        db = Database(str(tmp_path / "t.sqlite3"))
        await db.connect()
        u = await db.get_or_create_user(1, "Alice", 100)
        assert u.balance == 100
        assert await db.charge(1, 80)
        assert not await db.charge(1, 80)  # не хватает
        drop = open_case(CASES["fracture"], random.Random(3))
        item_id = await db.add_drop(1, drop)
        assert (await db.get_user(1)).best_price == drop.price
        assert await db.sell_item(1, item_id) == drop.price
        assert await db.sell_item(1, item_id) is None  # повторная продажа
        assert (await db.get_user(1)).balance == 20 + drop.price
        assert await db.claim_bonus(1, 250, 3600) == 0
        assert await db.claim_bonus(1, 250, 3600) > 0
        await db.close()
    asyncio.run(run())


# ---------- сквозной сценарий через Dispatcher ----------

class FakeSession(BaseSession):
    def __init__(self):
        super().__init__()
        self.calls = []
        self._msg_id = 100

    async def make_request(self, bot, method, timeout=None):
        self.calls.append(method)
        name = type(method).__name__
        if name in ("SendMessage", "EditMessageText"):
            self._msg_id += 1
            return Message(
                message_id=self._msg_id, date=datetime.now(), chat=Chat(id=1, type="private"),
                text=method.text,
            ).as_(bot)
        return True

    async def stream_content(self, *a, **kw):
        yield b""

    async def close(self):
        pass


def texts(session):
    return [getattr(c, "text", None) for c in session.calls if getattr(c, "text", None)]


def test_end_to_end(tmp_path, monkeypatch):
    monkeypatch.setattr(handlers, "SPIN_DELAY", 0)

    async def run():
        session = FakeSession()
        bot = Bot("42:TEST", session=session)
        db = Database(str(tmp_path / "e2e.sqlite3"))
        await db.connect()
        config = Config("42:TEST", "", start_balance=1000, daily_bonus=250, bonus_cooldown_hours=24)
        dp = Dispatcher(db=db, config=config)
        dp.include_router(handlers.router)

        user = TgUser(id=7, is_bot=False, first_name="Bob")
        chat = Chat(id=7, type="private")
        uid = [0]

        def msg(text):
            uid[0] += 1
            return Update(update_id=uid[0], message=Message(
                message_id=uid[0], date=datetime.now(), chat=chat, from_user=user, text=text))

        def cb(data):
            uid[0] += 1
            return Update(update_id=uid[0], callback_query=CallbackQuery(
                id=str(uid[0]), from_user=user, chat_instance="x", data=data,
                message=Message(message_id=1, date=datetime.now(), chat=chat, text="old")))

        await dp.feed_update(bot, msg("/start"))
        assert "Привет" in texts(session)[-1]

        await dp.feed_update(bot, cb(CaseCb(action="view", key="dreams").pack()))
        assert "Грёзы и кошмары" in texts(session)[-1]

        await dp.feed_update(bot, cb(CaseCb(action="open", key="dreams").pack()))
        assert "Тебе выпало" in texts(session)[-1]
        assert (await db.get_user(7)).balance == 1000 - CASES["dreams"].price
        count, _ = await db.count_items(7)
        assert count == 1

        # продажа прямо из сообщения с дропом
        await dp.feed_update(bot, cb(CaseCb(action="open", key="dreams").pack()))
        item = (await db.list_items(7, 10, 0))[-1]
        await dp.feed_update(bot, cb(InvCb(action="sell", item_id=item.id, case="dreams").pack()))
        assert "Продано за" in texts(session)[-1]
        assert (await db.count_items(7))[0] == 1

        await dp.feed_update(bot, msg("🎒 Инвентарь"))
        assert "Предметов: 1" in texts(session)[-1]

        await dp.feed_update(bot, cb(InvCb(action="sellall").pack()))
        await dp.feed_update(bot, cb(InvCb(action="sellall_ok").pack()))
        assert "Продано предметов: 1" in texts(session)[-1]
        assert (await db.count_items(7))[0] == 0

        await dp.feed_update(bot, msg("💰 Бонус"))
        assert "+250" in texts(session)[-1]
        await dp.feed_update(bot, msg("💰 Бонус"))
        assert "уже получен" in texts(session)[-1]

        await dp.feed_update(bot, msg("🏆 Топ"))
        assert "Bob" in texts(session)[-1]
        await dp.feed_update(bot, msg("👤 Профиль"))
        assert "Открыто кейсов: 2" in texts(session)[-1]

        # недостаточно монет
        await db.conn.execute("UPDATE users SET balance = 0 WHERE id = 7")
        await db.conn.commit()
        await dp.feed_update(bot, cb(CaseCb(action="open", key="dreams").pack()))
        answers = [c for c in session.calls if type(c).__name__ == "AnswerCallbackQuery"]
        assert "Недостаточно монет" in answers[-1].text
        await db.close()

    asyncio.run(run())
