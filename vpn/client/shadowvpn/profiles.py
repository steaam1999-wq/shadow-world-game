"""Хранилище профилей клиента."""

from __future__ import annotations

import os
import platform
from pathlib import Path

from shadowvpn import config


def default_dir() -> Path:
    env = os.environ.get("SHADOWVPN_HOME")
    if env:
        return Path(env)
    if platform.system() == "Windows":
        return Path(os.environ.get("APPDATA", Path.home())) / "ShadowVPN"
    # Под sudo храним профили в домашней папке исходного пользователя.
    sudo_user = os.environ.get("SUDO_USER")
    home = Path(os.path.expanduser(f"~{sudo_user}")) if sudo_user else Path.home()
    return home / ".config" / "shadowvpn"


class ProfileStore:
    def __init__(self, root: Path | None = None):
        self.root = (root or default_dir()) / "profiles"

    def path(self, name: str) -> Path:
        config.validate_profile_name(name)
        return self.root / f"{name}.conf"

    def names(self) -> list[str]:
        if not self.root.exists():
            return []
        return sorted(p.stem for p in self.root.glob("*.conf"))

    def load(self, name: str) -> tuple[str, config.WireGuardConfig]:
        p = self.path(name)
        if not p.exists():
            raise FileNotFoundError(f"профиль '{name}' не найден")
        text = p.read_text()
        return text, config.parse(text)

    def save(self, name: str, text: str, *, overwrite: bool = False) -> Path:
        config.parse(text)  # проверка до записи
        p = self.path(name)
        if p.exists() and not overwrite:
            raise FileExistsError(f"профиль '{name}' уже есть (используйте --force)")
        self.root.mkdir(parents=True, exist_ok=True)
        try:
            os.chmod(self.root.parent, 0o700)
            os.chmod(self.root, 0o700)
        except OSError:
            pass
        fd = os.open(p, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w") as f:
            f.write(text if text.endswith("\n") else text + "\n")
        os.chmod(p, 0o600)
        return p

    def delete(self, name: str) -> None:
        p = self.path(name)
        if not p.exists():
            raise FileNotFoundError(f"профиль '{name}' не найден")
        p.unlink()
