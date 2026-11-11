# Kantor Virtual Ozami

Halaman statis satu berkas (`index.html`): kantor pixel-art isometrik berisi agen Ozami (Claude VPS, Hermes, Anak Sosmed, Pintu Web) + daftar status + catatan kegiatan.
Kegiatan agen **disimulasikan**; yang nyata: nama & peran tim (dari catatan Discord/CRM: Oby Owner; Eva, Rahma, Clara Staff) dan pemakaian token MiniMax (`data.json`, dari `hermes insights`). **Status tim nyata dari Discord** (v3.3): tim absen lewat `/masuk`, `/istirahat`, `/pulang` di bot Discord (`bot/`), bot menulis `status-tim.json`. Hanya status + jam, tanpa angka kinerja. Sisa kuota Claude & MiniMax tidak ditampilkan (tidak terbaca dari VPS; Owner memutuskan tidak disambungkan). Tidak ada rahasia, tidak ada data pelanggan/angka kinerja per orang. Rilis: https://zamisyakoby.github.io/kantor-agen/

## Keputusan desain (v4) dan alasannya
- **Logo & palet CRM Ozami** (crm.ozami.co.id): logo `aset/ozami-logo.png` (diambil dari CRM), biru primer `#2453C9`, navy `#121521`/`#1A1F2E`, krem `#FAF8F4`, font Outfit. Supaya kantor terasa satu keluarga dengan CRM.
- **Gelap & terang**: ikut pengaturan HP/laptop, bisa diganti lewat tombol di kanan atas (diingat di browser). Mode gelap = kantor malam, mode terang = kantor siang. Logo jadi putih di mode gelap seperti di CRM.
- **4 ruangan bersekat kaca**: Ruang Agen AI, Ruang Staff, Ruang Rapat, Pantry. Penghuni berjalan antar-ruangan lewat pintu (jalur dicari otomatis), mampir ke pantry, rapat, atau meja rekan.
- **Status tim nyata**: staff yang belum masuk/sudah pulang tidak ada di kursinya; yang masuk datang dari pintu depan, yang pulang berjalan keluar; yang istirahat ke pantry.
- **Pixel art sungguhan**: kanvas 400x244 digambar piksel demi piksel lalu diperbesar tanpa penghalusan. Di HP kantornya bisa digeser ke samping.
- **Papan tempelan** di dinding Ruang Agen AI: tiap tempelan = satu pekerjaan agen terbaru, warnanya milik agen itu.
- `prefers-reduced-motion` mematikan jalan-jalan dan kedip (penghuni langsung pindah tempat).
- Tidak memuat data pelanggan; semua teks kegiatan agen karangan.

Status: dirilis di GitHub Pages. Rencana: pindah ke Cloudflare Pages + repo private setelah token Pages tersedia.

## Menjalankan
Produksi: server Hostinger (`/srv/ozami`), kotak `ozami-kantor-virtual` di balik login akun CRM. Langkah lengkap: `deploy/DEPLOY.md`.
- `server/server.js`: login (akun CRM, bcrypt, akun MySQL khusus baca), sesi cookie, halaman + data.
- `server/bot.js`: bot Discord `/masuk`, `/istirahat`, `/pulang`, `/kantor` → `status-tim.json`.
- `deploy/perbarui-minimax.sh`: `data.json` dari `hermes insights` (cron tiap jam).
Halaman publik di GitHub Pages hanya pajangan tanpa status nyata.

Versi: v4.1 (11 Nov 2026): nama Kantor Virtual, login akun CRM, tombol Discord & CRM, pantry 3 zona (PS5, bar kopi, mini soccer), Eva & Rahma berjilbab, Clara rambut panjang.
