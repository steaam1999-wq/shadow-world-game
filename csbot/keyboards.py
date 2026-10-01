from aiogram.filters.callback_data import CallbackData
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, KeyboardButton, ReplyKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

from .catalog import CASES, RARITIES
from .db import Item

BTN_CASES = "🎁 Кейсы"
BTN_INVENTORY = "🎒 Инвентарь"
BTN_PROFILE = "👤 Профиль"
BTN_BONUS = "💰 Бонус"
BTN_TOP = "🏆 Топ"

PAGE_SIZE = 8


class CaseCb(CallbackData, prefix="case"):
    action: str  # list | view | open
    key: str = ""


class InvCb(CallbackData, prefix="inv"):
    action: str  # show | page | item | sell | sellall | sellall_ok
    page: int = 0
    item_id: int = 0
    case: str = ""  # заполнено, если продаём прямо из сообщения с дропом


def main_menu() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=BTN_CASES), KeyboardButton(text=BTN_INVENTORY)],
            [KeyboardButton(text=BTN_PROFILE), KeyboardButton(text=BTN_BONUS), KeyboardButton(text=BTN_TOP)],
        ],
        resize_keyboard=True,
    )


def cases_list() -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    for case in CASES.values():
        kb.button(text=f"{case.title} — {case.price} 🪙", callback_data=CaseCb(action="view", key=case.key))
    kb.adjust(1)
    return kb.as_markup()


def case_view(key: str) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.button(text=f"🔓 Открыть за {CASES[key].price} 🪙", callback_data=CaseCb(action="open", key=key))
    kb.button(text="⬅️ К кейсам", callback_data=CaseCb(action="list"))
    kb.adjust(1)
    return kb.as_markup()


def after_open(key: str, item_id: int, price: int) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.button(text=f"💸 Продать за {price} 🪙", callback_data=InvCb(action="sell", item_id=item_id, case=key))
    kb.button(text="🔁 Открыть ещё", callback_data=CaseCb(action="open", key=key))
    kb.button(text="🎒 Инвентарь", callback_data=InvCb(action="show"))
    kb.adjust(1, 2)
    return kb.as_markup()


def inventory_page(items: list[Item], page: int, total: int) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    for it in items:
        kb.button(
            text=f"{RARITIES[it.rarity].emoji} {it.name} · {it.price} 🪙",
            callback_data=InvCb(action="item", page=page, item_id=it.id),
        )
    kb.adjust(1)
    pages = max(1, (total + PAGE_SIZE - 1) // PAGE_SIZE)
    nav = InlineKeyboardBuilder()
    if page > 0:
        nav.button(text="◀️", callback_data=InvCb(action="page", page=page - 1))
    nav.button(text=f"{page + 1}/{pages}", callback_data=InvCb(action="page", page=page))
    if page + 1 < pages:
        nav.button(text="▶️", callback_data=InvCb(action="page", page=page + 1))
    kb.attach(nav)
    if total:
        kb.row(InlineKeyboardButton(text="💰 Продать всё", callback_data=InvCb(action="sellall").pack()))
    return kb.as_markup()


def item_view(item: Item, page: int) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.button(text=f"💸 Продать за {item.price} 🪙", callback_data=InvCb(action="sell", page=page, item_id=item.id))
    kb.button(text="⬅️ Назад", callback_data=InvCb(action="page", page=page))
    kb.adjust(1)
    return kb.as_markup()


def confirm_sell_all() -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.button(text="✅ Да, продать всё", callback_data=InvCb(action="sellall_ok"))
    kb.button(text="❌ Отмена", callback_data=InvCb(action="page", page=0))
    kb.adjust(2)
    return kb.as_markup()


def after_sell(key: str) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.button(text="🔁 Открыть ещё", callback_data=CaseCb(action="open", key=key))
    kb.button(text="🎒 Инвентарь", callback_data=InvCb(action="show"))
    kb.adjust(2)
    return kb.as_markup()
