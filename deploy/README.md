# VPS deploy (okayselling)

Isolated stack on host port **3080** only — do not touch printwithzwe 80/443.

```bash
cd /opt/okayselling
git pull --ff-only
export ADMIN_TOKEN='…strong ≥16 chars…'
docker compose -f deploy/docker-compose.yml build
docker compose -f deploy/docker-compose.yml up -d --force-recreate
```

- `YBS_DATA_ROOT=/repo` + bind mount `/opt/okayselling:/repo` keeps admin PUT durable.
- Quick tunnel (optional): `cloudflared tunnel --url http://127.0.0.1:3080`
