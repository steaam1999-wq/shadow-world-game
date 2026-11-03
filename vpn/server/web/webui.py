#!/usr/bin/env python3
"""Веб-панель ShadowVPN: управление клиентами WireGuard из браузера."""

from __future__ import annotations

import hmac
import json
import os
import re
import secrets
import subprocess
import sys
import threading
import time
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

CONFIG_DIR = Path(os.environ.get("CONFIG_DIR", "/config"))
PEERS_DIR = CONFIG_DIR / "peers"
SERVER_DIR = CONFIG_DIR / "server"
SCRIPTS_DIR = os.environ.get("SCRIPTS_DIR", "/usr/local/bin")
WG_IFACE = "wg0"
PASSWORD = os.environ.get("WEB_PASSWORD", "")
BIND = os.environ.get("WEB_BIND", "0.0.0.0")
PORT = int(os.environ.get("WEB_INTERNAL_PORT", "51821"))
SECURE_COOKIE = os.environ.get("WEB_SECURE_COOKIE", "false").lower() == "true"
SESSION_TTL = 12 * 3600
ONLINE_WINDOW = 180  # с момента последнего рукопожатия
NAME_RE = re.compile(r"^[a-zA-Z0-9_-]{1,32}$")
HTML = (Path(__file__).with_name("index.html")).read_bytes()

sessions: dict[str, float] = {}
lock = threading.Lock()


def log(msg: str) -> None:
    print(f"[shadowvpn-web] {msg}", file=sys.stderr, flush=True)


def run_common(code: str, *args: str) -> str:
    """Вызвать функции из common.sh; аргументы передаются позиционно, без подстановки в код."""
    res = subprocess.run(
        ["bash", "-c", f'source "{SCRIPTS_DIR}/common.sh" && {code}', "_", *args],
        capture_output=True, text=True, timeout=30,
    )
    if res.returncode != 0:
        raise RuntimeError((res.stderr or "ошибка").strip().splitlines()[-1].removeprefix("[shadowvpn] "))
    return res.stdout


def iface_up() -> bool:
    return subprocess.run(["ip", "link", "show", WG_IFACE], capture_output=True).returncode == 0


def wg_stats() -> dict[str, dict]:
    if not iface_up():
        return {}
    res = subprocess.run(["wg", "show", WG_IFACE, "dump"], capture_output=True, text=True)
    stats = {}
    for line in res.stdout.splitlines()[1:]:
        f = line.split("\t")
        if len(f) >= 7:
            stats[f[0]] = {"endpoint": None if f[2] == "(none)" else f[2],
                           "handshake": int(f[4]), "rx": int(f[5]), "tx": int(f[6])}
    return stats


def read(p: Path) -> str:
    return p.read_text().strip()


def list_peers() -> list[dict]:
    stats, now, out = wg_stats(), time.time(), []
    if not PEERS_DIR.exists():
        return out
    for d in sorted(PEERS_DIR.iterdir()):
        if not (d / "public.key").exists():
            continue
        pub = read(d / "public.key")
        st = stats.get(pub, {})
        hs = st.get("handshake", 0)
        out.append({
            "name": d.name,
            "ip": read(d / "ip"),
            "enabled": not (d / "disabled").exists(),
            "online": bool(hs) and now - hs < ONLINE_WINDOW,
            "handshake": hs,
            "endpoint": st.get("endpoint"),
            "rx": st.get("rx", 0),
            "tx": st.get("tx", 0),
            "created": int((d / "ip").stat().st_mtime),
        })
    return out


def peer_dir(name: str) -> Path:
    if not NAME_RE.match(name):
        raise ValueError("Недопустимое имя: латиница, цифры, _ и -, до 32 символов")
    d = PEERS_DIR / name
    if not d.is_dir():
        raise FileNotFoundError(f"Клиент «{name}» не найден")
    return d


class Handler(BaseHTTPRequestHandler):
    server_version = "ShadowVPN"
    sys_version = ""

    def log_message(self, fmt, *args):
        log(f"{self.address_string()} {fmt % args}")

    # --- ответы ---
    def send(self, status: int, body: bytes = b"", ctype: str = "application/json",
             headers: dict | None = None) -> None:
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy",
                         "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
                         "script-src 'self' 'unsafe-inline'; frame-ancestors 'none'")
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def json(self, data, status: int = 200, headers: dict | None = None) -> None:
        self.send(status, json.dumps(data, ensure_ascii=False).encode(), headers=headers)

    def error(self, status: int, msg: str) -> None:
        self.json({"error": msg}, status)

    # --- сессии ---
    def session(self) -> str | None:
        c = SimpleCookie(self.headers.get("Cookie", ""))
        token = c["svpn"].value if "svpn" in c else None
        with lock:
            exp = sessions.get(token or "")
            if exp and exp > time.time():
                return token
            sessions.pop(token or "", None)
        return None

    def cookie(self, token: str, max_age: int) -> str:
        return (f"svpn={token}; Path=/; HttpOnly; SameSite=Strict; Max-Age={max_age}"
                + ("; Secure" if SECURE_COOKIE else ""))

    def body(self) -> dict:
        n = int(self.headers.get("Content-Length") or 0)
        if n > 10_000:
            raise ValueError("Слишком большой запрос")
        try:
            return json.loads(self.rfile.read(n) or b"{}")
        except json.JSONDecodeError:
            raise ValueError("Некорректный JSON") from None

    # --- маршрутизация ---
    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path in ("/", "/index.html"):
            return self.send(200, HTML, "text/html; charset=utf-8")
        if path == "/healthz":
            return self.json({"ok": True})
        if not path.startswith("/api/"):
            return self.error(404, "Не найдено")
        if path == "/api/session":
            return self.json({"authenticated": bool(self.session())})
        if not self.session():
            return self.error(401, "Требуется вход")
        self.dispatch("GET", path)

    def do_POST(self):
        self.mutating("POST")

    def do_DELETE(self):
        self.mutating("DELETE")

    def mutating(self, method: str):
        path = self.path.split("?", 1)[0]
        # Защита от CSRF: браузер не пошлёт этот заголовок с чужого сайта без CORS.
        if self.headers.get("X-ShadowVPN") != "1":
            return self.error(403, "Запрос отклонён")
        if path == "/api/login" and method == "POST":
            return self.login()
        if path == "/api/logout" and method == "POST":
            token = self.session()
            with lock:
                sessions.pop(token or "", None)
            return self.json({"ok": True}, headers={"Set-Cookie": self.cookie("", 0)})
        if not self.session():
            return self.error(401, "Требуется вход")
        self.dispatch(method, path)

    def login(self):
        try:
            pw = str(self.body().get("password", ""))
        except ValueError as e:
            return self.error(400, str(e))
        if not hmac.compare_digest(pw.encode(), PASSWORD.encode()):
            time.sleep(1)  # замедляем перебор
            log(f"неудачный вход с {self.client_address[0]}")
            return self.error(401, "Неверный пароль")
        token = secrets.token_urlsafe(32)
        with lock:
            now = time.time()
            for t in [t for t, e in sessions.items() if e < now]:
                del sessions[t]
            sessions[token] = now + SESSION_TTL
        self.json({"ok": True}, headers={"Set-Cookie": self.cookie(token, SESSION_TTL)})

    def dispatch(self, method: str, path: str):
        parts = path.strip("/").split("/")[1:]  # без "api"
        try:
            if parts == ["server"] and method == "GET":
                return self.json({
                    "host": os.environ.get("WG_HOST", ""),
                    "port": os.environ.get("WG_PORT", "51820"),
                    "subnet": os.environ.get("WG_SUBNET", "10.13.13") + ".0/24",
                    "publicKey": read(SERVER_DIR / "public.key") if (SERVER_DIR / "public.key").exists() else "",
                    "up": iface_up(),
                })
            if parts == ["peers"] and method == "GET":
                return self.json(list_peers())
            if parts == ["peers"] and method == "POST":
                name = str(self.body().get("name", "")).strip()
                if not NAME_RE.match(name):
                    raise ValueError("Недопустимое имя: латиница, цифры, _ и -, до 32 символов")
                with lock:
                    if (PEERS_DIR / name).exists():
                        return self.error(409, f"Клиент «{name}» уже существует")
                    run_common('create_peer "$1" && reload_wg', name)
                log(f"создан клиент {name}")
                return self.json({"ok": True}, 201)
            if len(parts) >= 2 and parts[0] == "peers":
                d = peer_dir(parts[1])
                name = d.name
                action = parts[2] if len(parts) > 2 else None
                if method == "DELETE" and action is None:
                    with lock:
                        run_common('rm -rf -- "$PEERS_DIR/$1" && reload_wg', name)
                    log(f"удалён клиент {name}")
                    return self.json({"ok": True})
                if method == "POST" and action in ("enable", "disable"):
                    with lock:
                        flag = d / "disabled"
                        flag.touch() if action == "disable" else flag.unlink(missing_ok=True)
                        run_common("reload_wg")
                    return self.json({"ok": True})
                if method == "GET" and action == "config":
                    return self.send(200, (d / f"{name}.conf").read_bytes(), "text/plain; charset=utf-8",
                                     {"Content-Disposition": f'attachment; filename="{name}.conf"'})
                if method == "GET" and action == "qr.svg":
                    res = subprocess.run(["qrencode", "-t", "SVG", "-m", "2", "-o", "-"],
                                         input=(d / f"{name}.conf").read_bytes(), capture_output=True)
                    if res.returncode != 0:
                        raise RuntimeError("qrencode не смог создать QR-код")
                    return self.send(200, res.stdout, "image/svg+xml")
            return self.error(404, "Не найдено")
        except ValueError as e:
            return self.error(400, str(e))
        except FileNotFoundError as e:
            return self.error(404, str(e))
        except (RuntimeError, subprocess.TimeoutExpired) as e:
            log(f"ошибка: {e}")
            return self.error(500, str(e))


def main() -> None:
    if len(PASSWORD) < 8:
        log("WEB_PASSWORD не задан или короче 8 символов — веб-панель не запущена")
        return
    srv = ThreadingHTTPServer((BIND, PORT), Handler)
    log(f"веб-панель слушает http://{BIND}:{PORT}")
    srv.serve_forever()


if __name__ == "__main__":
    main()
