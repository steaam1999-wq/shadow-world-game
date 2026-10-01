import time
from dataclasses import dataclass

import aiosqlite

from .game import Drop

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    balance     INTEGER NOT NULL,
    last_bonus  INTEGER NOT NULL DEFAULT 0,
    opened      INTEGER NOT NULL DEFAULT 0,
    best_drop   TEXT,
    best_price  INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    name        TEXT NOT NULL,
    rarity      TEXT NOT NULL,
    wear        TEXT NOT NULL,
    float_value REAL NOT NULL,
    stattrak    INTEGER NOT NULL,
    price       INTEGER NOT NULL,
    created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS items_user ON items(user_id);
"""


@dataclass(frozen=True)
class User:
    id: int
    name: str
    balance: int
    last_bonus: int
    opened: int
    best_drop: str | None
    best_price: int


@dataclass(frozen=True)
class Item:
    id: int
    name: str
    rarity: str
    wear: str
    float_value: float
    stattrak: bool
    price: int


class Database:
    def __init__(self, path: str):
        self.path = path
        self.conn: aiosqlite.Connection | None = None

    async def connect(self) -> None:
        self.conn = await aiosqlite.connect(self.path)
        await self.conn.executescript(SCHEMA)
        await self.conn.commit()

    async def close(self) -> None:
        if self.conn:
            await self.conn.close()

    async def get_or_create_user(self, user_id: int, name: str, start_balance: int) -> User:
        await self.conn.execute(
            "INSERT INTO users (id, name, balance) VALUES (?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET name = excluded.name",
            (user_id, name, start_balance),
        )
        await self.conn.commit()
        return await self.get_user(user_id)

    async def get_user(self, user_id: int) -> User | None:
        cur = await self.conn.execute(
            "SELECT id, name, balance, last_bonus, opened, best_drop, best_price FROM users WHERE id = ?",
            (user_id,),
        )
        row = await cur.fetchone()
        return User(*row) if row else None

    async def charge(self, user_id: int, amount: int) -> bool:
        """Атомарно списывает монеты; False, если не хватает баланса."""
        cur = await self.conn.execute(
            "UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?",
            (amount, user_id, amount),
        )
        await self.conn.commit()
        return cur.rowcount == 1

    async def add_drop(self, user_id: int, drop: Drop) -> int:
        cur = await self.conn.execute(
            "INSERT INTO items (user_id, name, rarity, wear, float_value, stattrak, price, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (user_id, drop.full_name, drop.skin.rarity, drop.wear.key, drop.float_value,
             int(drop.stattrak), drop.price, int(time.time())),
        )
        await self.conn.execute(
            "UPDATE users SET opened = opened + 1, "
            "best_drop = CASE WHEN ? > best_price THEN ? ELSE best_drop END, "
            "best_price = MAX(best_price, ?) WHERE id = ?",
            (drop.price, drop.full_name, drop.price, user_id),
        )
        await self.conn.commit()
        return cur.lastrowid

    async def count_items(self, user_id: int) -> tuple[int, int]:
        cur = await self.conn.execute(
            "SELECT COUNT(*), COALESCE(SUM(price), 0) FROM items WHERE user_id = ?", (user_id,)
        )
        return await cur.fetchone()

    async def list_items(self, user_id: int, limit: int, offset: int) -> list[Item]:
        cur = await self.conn.execute(
            "SELECT id, name, rarity, wear, float_value, stattrak, price FROM items "
            "WHERE user_id = ? ORDER BY price DESC, id DESC LIMIT ? OFFSET ?",
            (user_id, limit, offset),
        )
        return [Item(r[0], r[1], r[2], r[3], r[4], bool(r[5]), r[6]) for r in await cur.fetchall()]

    async def get_item(self, user_id: int, item_id: int) -> Item | None:
        cur = await self.conn.execute(
            "SELECT id, name, rarity, wear, float_value, stattrak, price FROM items WHERE id = ? AND user_id = ?",
            (item_id, user_id),
        )
        r = await cur.fetchone()
        return Item(r[0], r[1], r[2], r[3], r[4], bool(r[5]), r[6]) if r else None

    async def sell_item(self, user_id: int, item_id: int) -> int | None:
        """Продаёт предмет; возвращает выручку или None, если предмета уже нет."""
        cur = await self.conn.execute(
            "DELETE FROM items WHERE id = ? AND user_id = ? RETURNING price", (item_id, user_id)
        )
        row = await cur.fetchone()
        if row is None:
            await self.conn.commit()
            return None
        await self.conn.execute("UPDATE users SET balance = balance + ? WHERE id = ?", (row[0], user_id))
        await self.conn.commit()
        return row[0]

    async def sell_all(self, user_id: int) -> tuple[int, int]:
        cur = await self.conn.execute("DELETE FROM items WHERE user_id = ? RETURNING price", (user_id,))
        prices = [r[0] for r in await cur.fetchall()]
        total = sum(prices)
        await self.conn.execute("UPDATE users SET balance = balance + ? WHERE id = ?", (total, user_id))
        await self.conn.commit()
        return len(prices), total

    async def claim_bonus(self, user_id: int, amount: int, cooldown_s: int) -> int:
        """Выдаёт бонус. Возвращает 0 при успехе, иначе сколько секунд ждать."""
        now = int(time.time())
        cur = await self.conn.execute(
            "UPDATE users SET balance = balance + ?, last_bonus = ? WHERE id = ? AND last_bonus <= ?",
            (amount, now, user_id, now - cooldown_s),
        )
        await self.conn.commit()
        if cur.rowcount == 1:
            return 0
        user = await self.get_user(user_id)
        return max(1, user.last_bonus + cooldown_s - now)

    async def top(self, limit: int = 10) -> list[tuple[str, int]]:
        cur = await self.conn.execute(
            "SELECT u.name, u.balance + COALESCE(SUM(i.price), 0) AS worth FROM users u "
            "LEFT JOIN items i ON i.user_id = u.id GROUP BY u.id ORDER BY worth DESC LIMIT ?",
            (limit,),
        )
        return await cur.fetchall()
