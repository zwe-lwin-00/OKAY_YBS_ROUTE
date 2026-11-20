#!/usr/bin/env bash
# Reload Caddy after Let's Encrypt files are renewed on the host.
set -euo pipefail
EDGE_DIR="${EDGE_DIR:-/opt/vps-edge}"
cd "$EDGE_DIR"
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile 2>/dev/null \
  || docker compose up -d --force-recreate
echo "Caddy reloaded ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
