"""Командная строка ShadowVPN."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from shadowvpn import __version__, backend, config
from shadowvpn.profiles import ProfileStore


def _store(args) -> ProfileStore:
    return ProfileStore(Path(args.home) if args.home else None)


def cmd_import(args) -> int:
    src = Path(args.file)
    text = sys.stdin.read() if args.file == "-" else src.read_text()
    name = args.name or (src.stem if args.file != "-" else None)
    if not name:
        raise config.ConfigError("при чтении из stdin укажите --name")
    cfg = config.parse(text)
    if cfg.has_hooks and not args.allow_hooks:
        raise config.ConfigError(
            "профиль содержит PreUp/PostUp/PreDown/PostDown — эти команды выполняются "
            "от root. Проверьте их и повторите с --allow-hooks"
        )
    path = _store(args).save(name, text, overwrite=args.force)
    print(f"Профиль '{name}' сохранён: {path}")
    return 0


def cmd_list(args) -> int:
    store = _store(args)
    names = store.names()
    if not names:
        print("Профилей нет. Добавьте: shadowvpn import <файл.conf>")
        return 0
    try:
        active = set(backend.get_backend().active())
    except backend.BackendError:
        active = set()
    for name in names:
        try:
            _, cfg = store.load(name)
            info = f"{', '.join(cfg.addresses)} -> {', '.join(cfg.endpoints)}"
        except config.ConfigError as e:
            info = f"ошибка: {e}"
        mark = "●" if name in active else "○"
        print(f"{mark} {name:<15} {info}")
    return 0


def cmd_show(args) -> int:
    text, _ = _store(args).load(args.name)
    print(text if args.reveal else config.redact(text), end="")
    return 0


def cmd_up(args) -> int:
    store = _store(args)
    store.load(args.name)  # проверка
    backend.get_backend().up(args.name, store.path(args.name))
    print(f"Туннель '{args.name}' поднят")
    return 0


def cmd_down(args) -> int:
    store = _store(args)
    backend.get_backend().down(args.name, store.path(args.name))
    print(f"Туннель '{args.name}' остановлен")
    return 0


def cmd_status(args) -> int:
    store = _store(args)
    be = backend.get_backend()
    names = [args.name] if args.name else store.names()
    any_up = False
    for name in names:
        st = be.status(name)
        if st is None:
            if args.name:
                print(f"○ {name}: не подключён")
            continue
        any_up = True
        print(f"● {name}: подключён")
        for p in st.peers:
            print(f"    сервер:       {p.endpoint}")
            print(f"    рукопожатие:  {backend.human_ago(p.latest_handshake)}")
            print(f"    принято:      {backend.human_bytes(p.rx)}")
            print(f"    отправлено:   {backend.human_bytes(p.tx)}")
    if not args.name and not any_up:
        print("Нет активных туннелей")
    return 0


def cmd_remove(args) -> int:
    _store(args).delete(args.name)
    print(f"Профиль '{args.name}' удалён")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="shadowvpn", description="Клиент ShadowVPN (WireGuard)")
    p.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    p.add_argument("--home", help="папка с данными клиента (по умолчанию ~/.config/shadowvpn)")
    sub = p.add_subparsers(dest="command", required=True)

    s = sub.add_parser("import", help="импортировать .conf с сервера")
    s.add_argument("file", help="путь к .conf или '-' для stdin")
    s.add_argument("--name", help="имя профиля (по умолчанию — имя файла)")
    s.add_argument("--force", action="store_true", help="перезаписать существующий")
    s.add_argument("--allow-hooks", action="store_true", help="разрешить PostUp/PreDown и т.п.")
    s.set_defaults(func=cmd_import)

    s = sub.add_parser("list", help="список профилей")
    s.set_defaults(func=cmd_list)

    s = sub.add_parser("show", help="показать профиль (ключи скрыты)")
    s.add_argument("name")
    s.add_argument("--reveal", action="store_true", help="показать ключи")
    s.set_defaults(func=cmd_show)

    for cmd, fn, hlp in (("up", cmd_up, "подключиться"), ("down", cmd_down, "отключиться"),
                         ("remove", cmd_remove, "удалить профиль")):
        s = sub.add_parser(cmd, help=hlp)
        s.add_argument("name")
        s.set_defaults(func=fn)

    s = sub.add_parser("status", help="состояние подключения")
    s.add_argument("name", nargs="?")
    s.set_defaults(func=cmd_status)
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return args.func(args)
    except (config.ConfigError, backend.BackendError, FileNotFoundError,
            FileExistsError) as e:
        print(f"Ошибка: {e}", file=sys.stderr)
        return 1
