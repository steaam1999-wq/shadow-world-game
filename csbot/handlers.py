import asyncio
import random
from contextlib import suppress
from html import escape

from aiogram import F, Router
from aiogram.exceptions import TelegramBadRequest
from aiogram.filters import Command, CommandStart
from aiogram.types import CallbackQuery, Message

from . import keyboards as kb
from .catalog import CASES, RARITIES, WEARS
from .config import Config
from .db import Database, Item, User
from .game import open_case

router = Router()

WEAR_TITLES = {w.key: w.title for w in WEARS}
SPIN_FRAMES = 4
SPIN_DELAY = 0.7


def fmt_time(seconds: int) -> str:
    h, rem = divmod(seconds, 3600)
    m = rem // 60
    return f"{h} ч {m} мин" if h else f"{max(m, 1)} мин"


def case_text(key: str) -> str:
    case = CASES[key]
    lines = [f"<b>{escape(case.title)}</b>", f"Цена: <b>{case.price} 🪙</b>", ""]
    for rarity in RARITIES.values():
        skins = case.by_rarity(rarity.key)
        if not skins:
            continue
        lines.append(f"{rarity.emoji} <b>{rarity.title}</b> — {rarity.weight}%")
        if rarity.key == "gold":
            lines.append("   ★ Редкий нож или перчатки")
        else:
            lines.extend(f"   • {escape(s.name)}" for s in skins)
    return "\n".join(lines)


def item_text(item: Item) -> str:
    r = RARITIES[item.rarity]
    return (
        f"{r.emoji} <b>{escape(item.name)}</b>\n"
        f"Редкость: {r.title}\n"
        f"Износ: {WEAR_TITLES[item.wear]} · float <code>{item.float_value:.6f}</code>\n"
        f"Цена: <b>{item.price} 🪙</b>"
    )


async def ensure_user(db: Database, config: Config, tg_user) -> User:
    return await db.get_or_create_user(tg_user.id, tg_user.full_name, config.start_balance)


@router.message(CommandStart())
async def cmd_start(message: Message, db: Database, config: Config):
    user = await ensure_user(db, config, message.from_user)
    await message.answer(
        f"Привет, <b>{escape(user.name)}</b>! 👋\n\n"
        "Это симулятор открытия кейсов CS2. Открывай кейсы, собирай скины и продавай их "
        "за внутриигровые монеты 🪙.\n\n"
        f"Твой баланс: <b>{user.balance} 🪙</b>\n"
        f"Каждые {config.bonus_cooldown_hours} ч можно забрать бонус {config.daily_bonus} 🪙.\n\n"
        "<i>Монеты виртуальные: их нельзя купить или вывести.</i>",
        reply_markup=kb.main_menu(),
    )


@router.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "/cases — кейсы\n/inventory — инвентарь\n/profile — профиль\n/bonus — бонус\n/top — топ игроков",
        reply_markup=kb.main_menu(),
    )


# ---------- Кейсы ----------

@router.message(Command("cases"))
@router.message(F.text == kb.BTN_CASES)
async def show_cases(message: Message, db: Database, config: Config):
    user = await ensure_user(db, config, message.from_user)
    await message.answer(f"Выбери кейс. Баланс: <b>{user.balance} 🪙</b>", reply_markup=kb.cases_list())


@router.callback_query(kb.CaseCb.filter(F.action == "list"))
async def cb_cases(call: CallbackQuery, db: Database, config: Config):
    user = await ensure_user(db, config, call.from_user)
    await call.message.edit_text(f"Выбери кейс. Баланс: <b>{user.balance} 🪙</b>", reply_markup=kb.cases_list())
    await call.answer()


@router.callback_query(kb.CaseCb.filter(F.action == "view"))
async def cb_case_view(call: CallbackQuery, callback_data: kb.CaseCb):
    if callback_data.key not in CASES:
        return await call.answer("Кейс не найден", show_alert=True)
    await call.message.edit_text(case_text(callback_data.key), reply_markup=kb.case_view(callback_data.key))
    await call.answer()


@router.callback_query(kb.CaseCb.filter(F.action == "open"))
async def cb_case_open(call: CallbackQuery, callback_data: kb.CaseCb, db: Database, config: Config):
    case = CASES.get(callback_data.key)
    if case is None:
        return await call.answer("Кейс не найден", show_alert=True)
    user = await ensure_user(db, config, call.from_user)
    if not await db.charge(user.id, case.price):
        return await call.answer(
            f"Недостаточно монет: нужно {case.price} 🪙, у тебя {user.balance} 🪙. Забери бонус или продай скины.",
            show_alert=True,
        )
    await call.answer()

    drop = open_case(case)
    item_id = await db.add_drop(user.id, drop)

    msg = await call.message.answer(f"🎰 Открываем {escape(case.title)}...")
    for _ in range(SPIN_FRAMES):
        await asyncio.sleep(SPIN_DELAY)
        fake = random.choice(case.skins)
        with suppress(TelegramBadRequest):
            await msg.edit_text(f"🎰 Крутим...\n\n{RARITIES[fake.rarity].emoji} {escape(fake.name)}")
    await asyncio.sleep(SPIN_DELAY)

    rarity = RARITIES[drop.skin.rarity]
    balance = (await db.get_user(user.id)).balance
    header = "🔥🔥🔥 НЕВЕРОЯТНО! 🔥🔥🔥\n\n" if rarity.key in ("covert", "gold") else ""
    await msg.edit_text(
        f"{header}Тебе выпало:\n\n{rarity.emoji} <b>{escape(drop.full_name)}</b>\n"
        f"Редкость: {rarity.title}\n"
        f"Float: <code>{drop.float_value:.6f}</code>\n"
        f"Цена: <b>{drop.price} 🪙</b>\n\n"
        f"Баланс: {balance} 🪙",
        reply_markup=kb.after_open(case.key, item_id, drop.price),
    )


# ---------- Инвентарь ----------

async def render_inventory(db: Database, user_id: int, page: int) -> tuple[str, object]:
    count, worth = await db.count_items(user_id)
    pages = max(1, (count + kb.PAGE_SIZE - 1) // kb.PAGE_SIZE)
    page = min(max(page, 0), pages - 1)
    items = await db.list_items(user_id, kb.PAGE_SIZE, page * kb.PAGE_SIZE)
    if count:
        text = f"🎒 <b>Инвентарь</b>\nПредметов: {count} · стоимость: <b>{worth} 🪙</b>"
    else:
        text = "🎒 Инвентарь пуст. Открой кейс!"
    return text, kb.inventory_page(items, page, count)


@router.message(Command("inventory"))
@router.message(F.text == kb.BTN_INVENTORY)
async def show_inventory(message: Message, db: Database, config: Config):
    user = await ensure_user(db, config, message.from_user)
    text, markup = await render_inventory(db, user.id, 0)
    await message.answer(text, reply_markup=markup)


@router.callback_query(kb.InvCb.filter(F.action == "show"))
async def cb_inv_show(call: CallbackQuery, db: Database, config: Config):
    user = await ensure_user(db, config, call.from_user)
    text, markup = await render_inventory(db, user.id, 0)
    await call.message.answer(text, reply_markup=markup)
    await call.answer()


@router.callback_query(kb.InvCb.filter(F.action == "page"))
async def cb_inv_page(call: CallbackQuery, callback_data: kb.InvCb, db: Database, config: Config):
    user = await ensure_user(db, config, call.from_user)
    text, markup = await render_inventory(db, user.id, callback_data.page)
    with suppress(TelegramBadRequest):
        await call.message.edit_text(text, reply_markup=markup)
    await call.answer()


@router.callback_query(kb.InvCb.filter(F.action == "item"))
async def cb_inv_item(call: CallbackQuery, callback_data: kb.InvCb, db: Database, config: Config):
    user = await ensure_user(db, config, call.from_user)
    item = await db.get_item(user.id, callback_data.item_id)
    if item is None:
        return await call.answer("Предмет уже продан", show_alert=True)
    await call.message.edit_text(item_text(item), reply_markup=kb.item_view(item, callback_data.page))
    await call.answer()


@router.callback_query(kb.InvCb.filter(F.action == "sell"))
async def cb_sell(call: CallbackQuery, callback_data: kb.InvCb, db: Database, config: Config):
    user = await ensure_user(db, config, call.from_user)
    price = await db.sell_item(user.id, callback_data.item_id)
    if price is None:
        return await call.answer("Предмет уже продан", show_alert=True)
    balance = (await db.get_user(user.id)).balance
    await call.answer(f"Продано за {price} 🪙. Баланс: {balance} 🪙")
    if callback_data.case:
        with suppress(TelegramBadRequest):
            await call.message.edit_text(
                f"{call.message.html_text}\n\n💸 Продано за {price} 🪙 · баланс: {balance} 🪙",
                reply_markup=kb.after_sell(callback_data.case) if callback_data.case in CASES else None,
            )
        return
    text, markup = await render_inventory(db, user.id, callback_data.page)
    with suppress(TelegramBadRequest):
        await call.message.edit_text(text, reply_markup=markup)


@router.callback_query(kb.InvCb.filter(F.action == "sellall"))
async def cb_sell_all(call: CallbackQuery, db: Database, config: Config):
    user = await ensure_user(db, config, call.from_user)
    count, worth = await db.count_items(user.id)
    if not count:
        return await call.answer("Инвентарь пуст", show_alert=True)
    await call.message.edit_text(
        f"Продать все предметы ({count} шт.) за <b>{worth} 🪙</b>?", reply_markup=kb.confirm_sell_all()
    )
    await call.answer()


@router.callback_query(kb.InvCb.filter(F.action == "sellall_ok"))
async def cb_sell_all_ok(call: CallbackQuery, db: Database, config: Config):
    user = await ensure_user(db, config, call.from_user)
    count, total = await db.sell_all(user.id)
    balance = (await db.get_user(user.id)).balance
    await call.message.edit_text(f"💰 Продано предметов: {count} за <b>{total} 🪙</b>\nБаланс: {balance} 🪙")
    await call.answer()


# ---------- Профиль, бонус, топ ----------

@router.message(Command("profile"))
@router.message(F.text == kb.BTN_PROFILE)
async def show_profile(message: Message, db: Database, config: Config):
    user = await ensure_user(db, config, message.from_user)
    count, worth = await db.count_items(user.id)
    best = f"{escape(user.best_drop)} ({user.best_price} 🪙)" if user.best_drop else "—"
    await message.answer(
        f"👤 <b>{escape(user.name)}</b>\n\n"
        f"Баланс: <b>{user.balance} 🪙</b>\n"
        f"Инвентарь: {count} шт. на {worth} 🪙\n"
        f"Открыто кейсов: {user.opened}\n"
        f"Лучший дроп: {best}"
    )


@router.message(Command("bonus"))
@router.message(F.text == kb.BTN_BONUS)
async def claim_bonus(message: Message, db: Database, config: Config):
    user = await ensure_user(db, config, message.from_user)
    wait = await db.claim_bonus(user.id, config.daily_bonus, config.bonus_cooldown_hours * 3600)
    if wait:
        await message.answer(f"⏳ Бонус уже получен. Следующий через {fmt_time(wait)}.")
    else:
        balance = (await db.get_user(user.id)).balance
        await message.answer(f"💰 +{config.daily_bonus} 🪙! Баланс: <b>{balance} 🪙</b>")


@router.message(Command("top"))
@router.message(F.text == kb.BTN_TOP)
async def show_top(message: Message, db: Database, config: Config):
    await ensure_user(db, config, message.from_user)
    rows = await db.top(10)
    medals = ["🥇", "🥈", "🥉"]
    lines = [
        f"{medals[i] if i < 3 else f'{i + 1}.'} {escape(name)} — {worth} 🪙" for i, (name, worth) in enumerate(rows)
    ]
    await message.answer("🏆 <b>Топ игроков</b> (баланс + инвентарь)\n\n" + "\n".join(lines))
