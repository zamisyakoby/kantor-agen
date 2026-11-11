#!/usr/bin/env bash
# Tulis data.json (pemakaian token MiniMax 30 hari dari `hermes insights`) ke folder data Kantor Virtual.
# Pasang di cron host, mis. tiap jam:  7 * * * * /srv/ozami/apps/kantor-agen/deploy/perbarui-minimax.sh
# Tidak membuka .env/auth.json Hermes.
set -euo pipefail
OUT=${OUT:-/srv/ozami/data/kantor-virtual/data.json}
H=${HERMES_CMD:-"docker exec ozami-hermes /home/ubuntu/.hermes/hermes-agent/.hermes/bin/hermes"}
T=$($H insights --days 30 2>&1)
ambil(){ echo "$T" | grep -m1 "$1" | sed -E "s/.*$1:? +([0-9,]+).*/\1/" | tr -d , ; }
TOTAL=$(ambil 'Total tokens'); IN=$(ambil 'Input tokens'); OUTT=$(ambil 'Output tokens')
MM=$(echo "$T" | grep -m1 '^ *MiniMax' | awk '{print $NF}' | tr -d ,)
PER=$(echo "$T" | grep -m1 'Period:' | sed -E 's/.*Period: +//')
NOW=$(TZ=Asia/Jakarta date '+%Y-%m-%d %H:%M WIB')
[ -n "${TOTAL:-}" ] || { echo "hermes insights tidak mengembalikan angka:"; echo "$T" | head -20; exit 1; }
printf '{"diperbarui":"%s","periode":"%s","minimax":{"model":"MiniMax-M3.1-Flash","token_total":%s,"token_semua_model":%s,"input":%s,"output":%s,"sisa_kuota":null},"claude":{"sisa_kuota":null}}\n' \
  "$NOW" "$PER" "${MM:-$TOTAL}" "$TOTAL" "${IN:-0}" "${OUTT:-0}" > "$OUT.tmp"
mv "$OUT.tmp" "$OUT"; cat "$OUT"
