#!/usr/bin/env bash
# Общие функции и настройки сервера ShadowVPN.
set -euo pipefail

CONFIG_DIR=${CONFIG_DIR:-/config}
SERVER_DIR="$CONFIG_DIR/server"
PEERS_DIR="$CONFIG_DIR/peers"
WG_IFACE=wg0
WG_CONF="${WG_CONF_DIR:-/etc/wireguard}/$WG_IFACE.conf"

WG_PORT=${WG_PORT:-51820}
WG_SUBNET=${WG_SUBNET:-10.13.13}
WG_DNS=${WG_DNS:-1.1.1.1}
WG_ALLOWED_IPS=${WG_ALLOWED_IPS:-0.0.0.0/0}
WG_INTERNAL_PORT=51820

log() { echo "[shadowvpn] $*" >&2; }

valid_name() { [[ "$1" =~ ^[a-zA-Z0-9_-]{1,32}$ ]]; }

ensure_server_keys() {
  mkdir -p "$SERVER_DIR"
  umask 077
  if [[ ! -f "$SERVER_DIR/private.key" ]]; then
    log "Генерирую ключи сервера"
    wg genkey > "$SERVER_DIR/private.key"
    wg pubkey < "$SERVER_DIR/private.key" > "$SERVER_DIR/public.key"
  fi
}

next_free_ip() {
  local used=" " f n
  for f in "$PEERS_DIR"/*/ip; do
    [[ -f "$f" ]] && used+="$(cat "$f") "
  done
  for n in $(seq 2 254); do
    if [[ "$used" != *" $WG_SUBNET.$n "* ]]; then
      echo "$WG_SUBNET.$n"; return 0
    fi
  done
  log "Свободные адреса в подсети $WG_SUBNET.0/24 закончились"; return 1
}

create_peer() {
  local name=$1 dir="$PEERS_DIR/$1" ip
  valid_name "$name" || { log "Недопустимое имя клиента: '$name'"; return 1; }
  if [[ -d "$dir" ]]; then log "Клиент '$name' уже существует"; return 0; fi
  : "${WG_HOST:?Переменная WG_HOST (публичный адрес сервера) не задана}"
  ip=$(next_free_ip)
  umask 077
  mkdir -p "$dir"
  wg genkey > "$dir/private.key"
  wg pubkey < "$dir/private.key" > "$dir/public.key"
  wg genpsk > "$dir/preshared.key"
  echo "$ip" > "$dir/ip"
  cat > "$dir/$name.conf" <<CONF
[Interface]
PrivateKey = $(cat "$dir/private.key")
Address = $ip/32
DNS = $WG_DNS

[Peer]
PublicKey = $(cat "$SERVER_DIR/public.key")
PresharedKey = $(cat "$dir/preshared.key")
Endpoint = $WG_HOST:$WG_PORT
AllowedIPs = $WG_ALLOWED_IPS
PersistentKeepalive = 25
CONF
  qrencode -t PNG -o "$dir/$name.png" < "$dir/$name.conf" || true
  log "Создан клиент '$name' ($ip): $dir/$name.conf"
}

render_server_conf() {
  local dir name
  mkdir -p "${WG_CONF_DIR:-/etc/wireguard}"
  umask 077
  {
    cat <<CONF
[Interface]
Address = $WG_SUBNET.1/24
ListenPort = $WG_INTERNAL_PORT
PrivateKey = $(cat "$SERVER_DIR/private.key")
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -s $WG_SUBNET.0/24 -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -s $WG_SUBNET.0/24 -o eth0 -j MASQUERADE
CONF
    for dir in "$PEERS_DIR"/*/; do
      [[ -f "$dir/public.key" ]] || continue
      [[ -f "$dir/disabled" ]] && continue
      name=$(basename "$dir")
      cat <<CONF

# $name
[Peer]
PublicKey = $(cat "$dir/public.key")
PresharedKey = $(cat "$dir/preshared.key")
AllowedIPs = $(cat "$dir/ip")/32
CONF
    done
  } > "$WG_CONF"
}

reload_wg() {
  render_server_conf
  if ip link show "$WG_IFACE" >/dev/null 2>&1; then
    local tmp; tmp=$(mktemp)
    wg-quick strip "$WG_IFACE" > "$tmp"
    wg syncconf "$WG_IFACE" "$tmp"
    rm -f "$tmp"
  fi
}
