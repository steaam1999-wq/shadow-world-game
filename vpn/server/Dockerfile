FROM alpine:3.20

RUN apk add --no-cache bash wireguard-tools iptables ip6tables iproute2 qrencode python3

COPY scripts/ /usr/local/bin/
RUN chmod +x /usr/local/bin/*
COPY web/ /app/web/

VOLUME /config
EXPOSE 51820/udp 51821/tcp

HEALTHCHECK --interval=30s --timeout=5s CMD wg show wg0 >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
