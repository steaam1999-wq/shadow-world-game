FROM alpine:3.20

RUN apk add --no-cache bash wireguard-tools iptables ip6tables iproute2 qrencode

COPY scripts/ /usr/local/bin/
RUN chmod +x /usr/local/bin/*

VOLUME /config
EXPOSE 51820/udp

HEALTHCHECK --interval=30s --timeout=5s CMD wg show wg0 >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
