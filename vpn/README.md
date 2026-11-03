# ShadowVPN

Собственный VPN на [WireGuard](https://www.wireguard.com/): сервер в Docker и консольный клиент на Python.

```
vpn/
├── server/   # WireGuard-сервер в Docker (docker compose)
└── client/   # CLI-клиент shadowvpn (Python 3.9+, без зависимостей)
```

## 1. Сервер

Нужен Linux-сервер с публичным IP, Docker и открытым UDP-портом (по умолчанию 51820).

```bash
cd vpn/server
cp .env.example .env      # укажите WG_HOST = публичный IP или домен сервера
docker compose up -d --build
docker compose logs -f
```

При первом запуске создаются ключи сервера и клиенты из `PEERS`.
Всё хранится в `server/data/` — **это секретные ключи, не коммитьте их и делайте бэкап**.

Управление клиентами:

```bash
docker compose exec vpn list-peers              # список и последнее рукопожатие
docker compose exec vpn add-peer phone          # новый клиент: конфиг + QR-код в терминале
docker compose exec vpn show-peer phone         # вывести конфиг
docker compose exec vpn show-peer phone --qr    # QR для приложения WireGuard на телефоне
docker compose exec vpn remove-peer phone       # отозвать доступ
```

Изменения применяются на лету (`wg syncconf`), без разрыва соединений других клиентов.
Файлы конфигов лежат в `data/peers/<имя>/<имя>.conf` (там же PNG с QR-кодом).

## 2. Клиент

Требуется установленный WireGuard (`wireguard-tools`):
Linux — `sudo apt install wireguard-tools`, macOS — `brew install wireguard-tools`,
Windows — установщик с wireguard.com.

```bash
cd vpn/client
pip install .            # появится команда shadowvpn

# скопируйте конфиг с сервера
scp server:shadow-world-game/vpn/server/data/peers/laptop/laptop.conf .

shadowvpn import laptop.conf    # сохранить профиль (~/.config/shadowvpn, права 600)
shadowvpn list                  # профили; ● — подключён
sudo shadowvpn up laptop        # подключиться
sudo shadowvpn status           # сервер, рукопожатие, трафик
sudo shadowvpn down laptop      # отключиться
shadowvpn show laptop           # профиль со скрытыми ключами (--reveal — показать)
shadowvpn remove laptop
```

Клиент проверяет конфиг при импорте (ключи, адреса, Endpoint) и отказывается
импортировать профили с `PostUp`/`PreDown` и т.п. без явного `--allow-hooks`,
потому что эти команды выполняются от root.

На телефоне проще всего использовать официальное приложение WireGuard и отсканировать QR (`show-peer <имя> --qr`).

## Тесты

```bash
cd vpn/client && python3 -m unittest discover -s tests -v
```

## Настройки сервера (`.env`)

| Переменная | По умолчанию | Описание |
|---|---|---|
| `WG_HOST` | — (обязательно) | Публичный IP/домен, попадает в `Endpoint` клиентов |
| `WG_PORT` | `51820` | Внешний UDP-порт |
| `WG_SUBNET` | `10.13.13` | Подсеть VPN `/24`, сервер — `.1` |
| `WG_DNS` | `1.1.1.1` | DNS для клиентов |
| `WG_ALLOWED_IPS` | `0.0.0.0/0` | Что заворачивать в VPN (весь трафик по умолчанию) |
| `PEERS` | — | Клиенты, создаваемые при старте, через запятую |

Если вы измените `WG_HOST`/`WG_PORT`/`WG_DNS` после создания клиентов, удалите и пересоздайте их.
