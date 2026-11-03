"""Управление туннелем через системные утилиты WireGuard."""

from __future__ import annotations

import os
import platform
import shutil
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path


class BackendError(RuntimeError):
    pass


@dataclass
class PeerStatus:
    public_key: str
    endpoint: str
    latest_handshake: int
    rx: int
    tx: int


@dataclass
class TunnelStatus:
    interface: str
    peers: list[PeerStatus]


def _run(cmd: list[str], *, capture: bool = False) -> str:
    if shutil.which(cmd[0]) is None:
        raise BackendError(
            f"не найдена утилита '{cmd[0]}'. Установите WireGuard: https://www.wireguard.com/install/"
        )
    try:
        res = subprocess.run(cmd, check=True, text=True,
                             capture_output=capture)
    except subprocess.CalledProcessError as e:
        msg = (e.stderr or "").strip() if capture else ""
        raise BackendError(f"команда завершилась с ошибкой: {' '.join(cmd)} {msg}") from None
    return res.stdout or ""


def _need_root() -> None:
    if os.name == "posix" and os.geteuid() != 0:
        raise BackendError("нужны права администратора: запустите через sudo")


class Backend:
    def up(self, name: str, path: Path) -> None: ...
    def down(self, name: str, path: Path) -> None: ...
    def active(self) -> list[str]: ...
    def status(self, name: str) -> TunnelStatus | None: ...


class WgQuickBackend(Backend):
    """Linux и macOS: wg-quick + wg."""

    def up(self, name: str, path: Path) -> None:
        _need_root()
        _run(["wg-quick", "up", str(path)])

    def down(self, name: str, path: Path) -> None:
        _need_root()
        _run(["wg-quick", "down", str(path)])

    def active(self) -> list[str]:
        _need_root()
        return _run(["wg", "show", "interfaces"], capture=True).split()

    def status(self, name: str) -> TunnelStatus | None:
        _need_root()
        if platform.system() == "Darwin":
            # На macOS интерфейс называется utunN; соответствие хранит wg-quick.
            name_file = Path("/var/run/wireguard") / f"{name}.name"
            if not name_file.exists():
                return None
            iface = name_file.read_text().strip()
        else:
            iface = name
            if iface not in self.active():
                return None
        return parse_dump(name, _run(["wg", "show", iface, "dump"], capture=True))


class WindowsBackend(Backend):
    """Windows: служба туннеля через wireguard.exe."""

    EXE = r"C:\Program Files\WireGuard\wireguard.exe"

    def _exe(self) -> str:
        return shutil.which("wireguard") or self.EXE

    def up(self, name: str, path: Path) -> None:
        _run([self._exe(), "/installtunnelservice", str(path)])

    def down(self, name: str, path: Path) -> None:
        _run([self._exe(), "/uninstalltunnelservice", name])

    def active(self) -> list[str]:
        return _run(["wg", "show", "interfaces"], capture=True).split()

    def status(self, name: str) -> TunnelStatus | None:
        if name not in self.active():
            return None
        return parse_dump(name, _run(["wg", "show", name, "dump"], capture=True))


def parse_dump(name: str, dump: str) -> TunnelStatus:
    """Разобрать вывод `wg show <iface> dump`."""
    lines = [l for l in dump.splitlines() if l.strip()]
    peers = []
    for line in lines[1:]:  # первая строка — сам интерфейс
        f = line.split("\t")
        if len(f) < 7:
            continue
        peers.append(PeerStatus(public_key=f[0], endpoint=f[2],
                                latest_handshake=int(f[4]), rx=int(f[5]), tx=int(f[6])))
    return TunnelStatus(interface=name, peers=peers)


def get_backend() -> Backend:
    return WindowsBackend() if platform.system() == "Windows" else WgQuickBackend()


def human_bytes(n: int) -> str:
    size = float(n)
    for unit in ("Б", "КиБ", "МиБ", "ГиБ"):
        if size < 1024:
            return f"{size:.1f} {unit}" if unit != "Б" else f"{int(size)} {unit}"
        size /= 1024
    return f"{size:.1f} ТиБ"


def human_ago(ts: int, now: float | None = None) -> str:
    if ts == 0:
        return "ещё не было"
    sec = int((now or time.time()) - ts)
    if sec < 60:
        return f"{sec} с назад"
    if sec < 3600:
        return f"{sec // 60} мин назад"
    return f"{sec // 3600} ч назад"
