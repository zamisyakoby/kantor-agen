#!/usr/bin/env bash
# Perbarui data.json dari `hermes insights` (angka nyata pemakaian MiniMax lewat Hermes, 30 hari terakhir).
# Tidak membuka .env/auth.json. Sisa kuota (MiniMax & Claude) tidak bisa dibaca dari VPS -> null.
set -euo pipefail
cd "$(dirname "$0")"
H=/home/ubuntu/.hermes/hermes-agent/.hermes/bin/hermes
T=$($H insights --days 30 2>&1)
num(){ echo "$T" | grep -m1 "$1" | sed -E "s/.*$1[: ]+([0-9,]+).*/\1/" | tr -d ,; }
TOTAL=$(echo "$T" | grep -m1 'Total tokens' | sed -E 's/.*Total tokens: +([0-9,]+).*/\1/' | tr -d ,)
IN=$(echo "$T" | grep -m1 'Input tokens' | sed -E 's/.*Input tokens: +([0-9,]+).*/\1/' | tr -d ,)
OUT=$(echo "$T" | grep -m1 'Output tokens' | sed -E 's/.*Output tokens: +([0-9,]+).*/\1/' | tr -d ,)
MM=$(echo "$T" | grep -m1 '^ *MiniMax' | awk '{print $NF}' | tr -d ,)
PER=$(echo "$T" | grep -m1 'Period:' | sed -E 's/.*Period: +//')
NOW=$(TZ=Asia/Jakarta date '+%Y-%m-%d %H:%M WIB')
cat > data.json <<J
{"diperbarui":"$NOW","periode":"$PER","minimax":{"model":"MiniMax-M3.1-Flash","token_total":$MM,"token_semua_model":$TOTAL,"input":$IN,"output":$OUT,"sisa_kuota":null},"claude":{"sisa_kuota":null}}
J
cat data.json
