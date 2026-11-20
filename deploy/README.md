# VPS deploy (okayselling)

App listens on host **3080**. Public HTTPS for `okayselling.shop` is handled by
**/opt/vps-edge** (Caddy), which also fronts `printwithzwe.com` — printwithzwe
containers stay intact; only host port publish is localhost-bound.

```bash
cd /opt/okayselling
git pull --ff-only
export ADMIN_TOKEN='…strong ≥16 chars…'
docker compose -f deploy/docker-compose.yml build
docker compose -f deploy/docker-compose.yml up -d --force-recreate
```

- `YBS_DATA_ROOT=/repo` + bind mount `/opt/okayselling:/repo` keeps admin PUT durable.
- Public URLs: https://okayselling.shop · https://printwithzwe.com
- Edge: `/opt/vps-edge` (do not bind okayselling to host 80/443 directly)
- Ops: see `EDGE_RUNBOOK.md`, `reload-certs.sh`, `smoke_public.sh`
- Admin UI: set `ADMIN_UI_ENABLED=true` only when you need `/admin` (APIs stay token-gated)
