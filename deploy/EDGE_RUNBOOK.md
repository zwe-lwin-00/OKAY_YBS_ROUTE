# Edge runbook (Caddy + dual domain)

## Topology

- `vps-edge-caddy` (`/opt/vps-edge`, `network_mode: host`) owns **:80 / :443**
- `printwithzwe-web` → `127.0.0.1:18080` (HTTP) / `127.0.0.1:18443` (HTTPS)
- `okayselling-web` → host **:3080**

## Recreate printwithzwe web (ports must stay localhost)

```bash
cd /root/PrintWithZwe
docker compose -p printwithzwe-stack --env-file /etc/printwithzwe-docker.env \
  up -d --no-deps --force-recreate web
```

Confirm: `docker ps --filter name=printwithzwe-web` shows `127.0.0.1:18080` / `18443` only.

## Reload Caddy after certbot renew

```bash
bash /opt/vps-edge/reload-certs.sh
# or from repo checkout:
bash /opt/okayselling/deploy/reload-certs.sh
```

## Smoke both domains

```bash
bash /opt/okayselling/deploy/smoke_public.sh
```

## Rollback edge (emergency)

1. `cd /opt/vps-edge && docker compose down`
2. Restore `/root/PrintWithZwe/compose.yaml` from `compose.yaml.bak-before-edge-*`
3. Recreate printwithzwe web with project name `printwithzwe-stack` (ports 80/443 again)
