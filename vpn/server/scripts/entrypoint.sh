#!/usr/bin/env bash
source /usr/local/bin/common.sh

mkdir -p "$PEERS_DIR"
ensure_server_keys

IFS=',' read -ra initial <<< "${PEERS:-}"
for name in "${initial[@]}"; do
  name=$(echo "$name" | xargs)
  [[ -n "$name" ]] && create_peer "$name"
done

render_server_conf

shutdown() { log "Останавливаю $WG_IFACE"; wg-quick down "$WG_IFACE" || true; exit 0; }
trap shutdown SIGTERM SIGINT

wg-quick up "$WG_IFACE"
log "Сервер запущен на UDP $WG_PORT, подсеть $WG_SUBNET.0/24"
sleep infinity &
wait $!
