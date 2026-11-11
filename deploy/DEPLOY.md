# Deploy Kantor Virtual ke server Hostinger (`/srv/ozami`)

Untuk Claude di server ("Ozami Hostinger", Remote Control) atau Owner. Semua langkah di host `/srv/ozami`.
Ikuti aturan proyek: port hanya `127.0.0.1`, tidak mount docker.sock, rahasia hanya di `apps-env/` (chmod 600), jangan cetak token.

## Yang dibangun
Satu kotak `ozami-kantor-virtual` (Node 20):
- **Login** pakai akun CRM Ozami: email + password dicek ke `ozami_crm.tbl_users` (bcrypt), lewat akun MySQL khusus baca.
- **Halaman kantor** (`index.html`) + `/data.json` (token MiniMax) + `/status-tim.json` (absen), semuanya hanya setelah login.
- **Bot Discord** `/masuk` `/istirahat` `/pulang` `/status`, menulis `/data/status-tim.json`.

## Langkah

1. **Ambil kode**
   ```bash
   cd /srv/ozami/apps && git clone https://github.com/zamisyakoby/kantor-agen.git || (cd kantor-agen && git pull)
   mkdir -p /srv/ozami/data/kantor-virtual && chown 1000:1000 /srv/ozami/data/kantor-virtual
   ```

2. **Daftar tim** `/srv/ozami/data/kantor-virtual/tim.json` (chown 1000). ID Discord Eva, Rahma, Clara ada di
   `alat/crm-laporan/ozami-crm-laporan.py` (daftar `ORANG`). Oby = `"pemilik"` (bot mengambil pemilik server Discord).
   Format: lihat `server/tim.contoh.json`. Urutan: oby, eva, rahma, clara.

3. **Akun MySQL khusus baca**: buat password acak, ganti `GANTI_PASSWORD` di salinan `deploy/buat-akun-db.sql`
   (jangan commit), lalu jalankan sesuai komentar di file itu. Cek kolom `id, name, email, password` memang ada di `tbl_users`
   (`DESCRIBE tbl_users`); kalau nama kolom beda, sesuaikan query di `server/server.js` (fungsi `cekLogin`).

4. **Rahasia** `apps-env/kantor-virtual.env` dari `deploy/kantor-virtual.env.contoh` (chmod 600):
   - `SESSION_SECRET`: `openssl rand -base64 36`
   - `CRM_DB_PASS`: password langkah 3
   - `DISCORD_TOKEN`: token bot Ozami HQ dari `data/hermes-home/.hermes/.env` (salin tanpa mencetak), atau bot baru kalau Owner membuatnya.
     Bot mendaftarkan perintahnya dengan POST satu per satu, jadi perintah Hermes tidak terhapus.
     Kalau muncul `Missing Access` saat mendaftar perintah: bot perlu diundang ulang dengan scope `bot applications.commands`; kirim tautan undangan ke Owner.
   - `GUILD_ID`: ID server Discord (cara ambil seperti di `alat/discord/*.py`: `GET /users/@me/guilds`).

5. **Compose**: tempel isi `deploy/compose-kantor-virtual.yml` ke `docker-compose.yml`, lalu
   ```bash
   docker compose up -d --build kantor-virtual
   docker logs ozami-kantor-virtual --tail 30     # harus ada "[server] ... port 8080" dan "[bot] siap sebagai ..."
   ```

6. **Data MiniMax**: jalankan `deploy/perbarui-minimax.sh` sekali (harus mencetak JSON berisi angka), lalu cron host tiap jam:
   `7 * * * * /srv/ozami/apps/kantor-agen/deploy/perbarui-minimax.sh >/dev/null 2>&1`

7. **Domain**: aaPanel > Website > `kantor.ozami.co.id` (+ SSL) dengan `deploy/nginx-kantor.conf`.
   Kalau DNS `kantor.ozami.co.id` belum ada, minta Owner menambah A record ke IP server (sama dengan `crm.ozami.co.id`);
   sementara itu bisa lewat tailscale serve.

8. **Uji** (semua harus lolos sebelum lapor selesai):
   - `curl -s 127.0.0.1:8491/sehat` → `ok`; `curl -sI 127.0.0.1:8491/` → 302 ke `/login`; `curl -s -o /dev/null -w '%{http_code}' 127.0.0.1:8491/status-tim.json` → 401
   - Login salah → pesan "Email atau password salah"; login benar (Owner yang coba) → halaman kantor, nama tampil di kanan atas.
   - Di Discord: `/status` dibalas bot; Owner `/masuk` → di halaman Oby duduk di mejanya dalam ≤1 menit.
   - Bagian "Pemakaian AI" menampilkan angka MiniMax terbaru.

9. **GitHub Pages**: halaman lama di `zamisyakoby.github.io/kantor-agen` masih terbuka tanpa login (tanpa status nyata).
   Tanyakan Owner apakah Pages dimatikan / repo dijadikan private.
