#!/usr/bin/env bash
# Public HTTPS smoke for dual-domain VPS edge.
set -euo pipefail
PZW_URL="${PZW_URL:-https://printwithzwe.com}"
YBS_URL="${YBS_URL:-https://okayselling.shop}"

check() {
  local name="$1" url="$2" expect="$3"
  local code
  code=$(curl -sk -o /dev/null -w '%{http_code}' --connect-timeout 15 --max-time 30 "$url" || echo 000)
  if [[ "$code" != "$expect" ]]; then
    echo "FAIL $name $url → $code (want $expect)"
    exit 1
  fi
  echo "OK   $name $code"
}

check pzw_home "$PZW_URL/" 200
check ybs_home "$YBS_URL/" 200
check ybs_plan "$YBS_URL/plan" 200
check ybs_sw "$YBS_URL/sw.js" 200
check ybs_plan_api "$YBS_URL/api/plan" 400
title=$(curl -sk --max-time 30 "$YBS_URL/" | tr '\n' ' ' | grep -oE '<title>[^<]+</title>' | head -1 || true)
echo "OK   ybs_title ${title:-unknown}"
echo "SMOKE_PASS"
