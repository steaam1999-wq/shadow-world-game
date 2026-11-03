"""Разбор и проверка конфигураций WireGuard."""

from __future__ import annotations

import base64
import ipaddress
import re
from dataclasses import dataclass, field

PROFILE_NAME_RE = re.compile(r"^[a-zA-Z0-9_=+.-]{1,15}$")

_INTERFACE_KEYS = {"privatekey", "address", "dns", "listenport", "mtu", "table",
                   "fwmark", "preup", "postup", "predown", "postdown", "saveconfig"}
_PEER_KEYS = {"publickey", "presharedkey", "endpoint", "allowedips", "persistentkeepalive"}
_HOOK_KEYS = {"preup", "postup", "predown", "postdown"}


class ConfigError(ValueError):
    """Конфигурация некорректна."""


@dataclass
class Section:
    name: str
    values: dict[str, list[str]] = field(default_factory=dict)

    def get(self, key: str) -> str | None:
        items = self.values.get(key.lower())
        return items[0] if items else None

    def get_list(self, key: str) -> list[str]:
        out: list[str] = []
        for raw in self.values.get(key.lower(), []):
            out.extend(p.strip() for p in raw.split(",") if p.strip())
        return out


@dataclass
class WireGuardConfig:
    interface: Section
    peers: list[Section]

    @property
    def addresses(self) -> list[str]:
        return self.interface.get_list("Address")

    @property
    def endpoints(self) -> list[str]:
        return [p.get("Endpoint") or "-" for p in self.peers]

    @property
    def has_hooks(self) -> bool:
        return any(k in self.interface.values for k in _HOOK_KEYS)


def parse(text: str) -> WireGuardConfig:
    interface: Section | None = None
    peers: list[Section] = []
    current: Section | None = None
    for lineno, line in enumerate(text.splitlines(), 1):
        line = line.split("#", 1)[0].strip()
        if not line:
            continue
        if line.startswith("[") and line.endswith("]"):
            name = line[1:-1].strip().lower()
            if name == "interface":
                if interface is not None:
                    raise ConfigError(f"строка {lineno}: повторная секция [Interface]")
                interface = current = Section("Interface")
            elif name == "peer":
                current = Section("Peer")
                peers.append(current)
            else:
                raise ConfigError(f"строка {lineno}: неизвестная секция [{line[1:-1]}]")
            continue
        if current is None:
            raise ConfigError(f"строка {lineno}: параметр вне секции")
        if "=" not in line:
            raise ConfigError(f"строка {lineno}: ожидается 'Ключ = значение'")
        key, value = (p.strip() for p in line.split("=", 1))
        current.values.setdefault(key.lower(), []).append(value)
    if interface is None:
        raise ConfigError("нет секции [Interface]")
    cfg = WireGuardConfig(interface, peers)
    validate(cfg)
    return cfg


def _check_key(value: str | None, what: str) -> None:
    if not value:
        raise ConfigError(f"отсутствует {what}")
    try:
        raw = base64.b64decode(value, validate=True)
    except ValueError:
        raise ConfigError(f"{what}: не base64") from None
    if len(raw) != 32:
        raise ConfigError(f"{what}: ключ должен быть 32 байта")


def validate(cfg: WireGuardConfig) -> None:
    unknown = set(cfg.interface.values) - _INTERFACE_KEYS
    if unknown:
        raise ConfigError(f"[Interface]: неизвестные параметры {sorted(unknown)}")
    _check_key(cfg.interface.get("PrivateKey"), "[Interface] PrivateKey")
    if not cfg.addresses:
        raise ConfigError("[Interface]: не указан Address")
    for addr in cfg.addresses:
        try:
            ipaddress.ip_interface(addr)
        except ValueError:
            raise ConfigError(f"[Interface]: некорректный Address '{addr}'") from None
    if not cfg.peers:
        raise ConfigError("нет ни одной секции [Peer]")
    for i, peer in enumerate(cfg.peers, 1):
        unknown = set(peer.values) - _PEER_KEYS
        if unknown:
            raise ConfigError(f"[Peer] #{i}: неизвестные параметры {sorted(unknown)}")
        _check_key(peer.get("PublicKey"), f"[Peer] #{i} PublicKey")
        if peer.get("PresharedKey"):
            _check_key(peer.get("PresharedKey"), f"[Peer] #{i} PresharedKey")
        allowed = peer.get_list("AllowedIPs")
        if not allowed:
            raise ConfigError(f"[Peer] #{i}: не указан AllowedIPs")
        for net in allowed:
            try:
                ipaddress.ip_network(net, strict=False)
            except ValueError:
                raise ConfigError(f"[Peer] #{i}: некорректный AllowedIPs '{net}'") from None
        endpoint = peer.get("Endpoint")
        if endpoint:
            host, sep, port = endpoint.rpartition(":")
            if not sep or not host or not port.isdigit() or not 0 < int(port) < 65536:
                raise ConfigError(f"[Peer] #{i}: некорректный Endpoint '{endpoint}'")


def redact(text: str) -> str:
    """Скрыть приватные ключи при выводе."""
    return re.sub(r"(?im)^(\s*(?:PrivateKey|PresharedKey)\s*=\s*).+$", r"\1(скрыто)", text)


def validate_profile_name(name: str) -> None:
    if not PROFILE_NAME_RE.match(name):
        raise ConfigError(
            "имя профиля: 1–15 символов из латиницы, цифр и _=+.- "
            "(ограничение имени сетевого интерфейса)"
        )
