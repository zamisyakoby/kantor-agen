# Demo kantor agen Ozami

Halaman statis satu berkas (`index.html`): kantor pixel-art isometrik berisi agen Ozami (Claude VPS, Hermes, Zamisyak, Pintu Web) + daftar status + catatan kegiatan.
Kegiatan agen **disimulasikan**; yang nyata: nama & peran tim (dari catatan Discord/CRM: Oby Owner; Eva, Rahma, Clara CS) dan pemakaian token MiniMax (`data.json`, dari `hermes insights`). Status tim = "belum tersambung" (tidak dikarang). Sisa kuota Claude & MiniMax belum bisa dibaca dari VPS (ditulis jujur). Tidak ada rahasia, tidak ada data pelanggan/angka kinerja per orang. Rilis: https://zamisyakoby.github.io/kantor-agen/

## Keputusan desain (skill `webapp-design`) dan alasannya
- **Palet milik brand zamisyak** (`bg #17110E`, krem `#F1E9E1`, aksen mawar `#E8A49A`, ok/err `#8FD19E`/`#F2A0A0`) supaya dikenali sebagai halaman zamisyakoby, bukan biru-ungu SaaS. Tanpa kuning.
- **Font**: IBM Plex Sans Condensed (isi) + Caveat (balon ucapan), keduanya sudah dipakai di desain carousel.
- **Pixel art sungguhan**: kanvas 240x160 digambar piksel demi piksel lalu diperbesar tanpa penghalusan; bukan poligon halus. Alasannya: tampak seperti game kantor, bukan diagram.
- **Satu elemen yang diingat**: papan tempelan di dinding kiri. Tiap tempelan = satu pekerjaan terbaru, warnanya milik agen pengerjanya; terbaca sekilas tanpa membuka daftar.
- **Jendela senja** memakai warna mawar brand; tanpa dekorasi lain.
- **Daftar & catatan berupa baris bergaris tipis**, bukan kartu seragam; status ditulis dengan kata (bekerja/ngopi/putus), bukan hanya warna.
- **State nyata**: memuat (bilah "Menyambung ke kantor"), kosong ("Belum ada kegiatan"), error (Hermes putus: tanda seru di kepala, baris merah, status "putus").
- **HP dulu**: satu kolom di bawah 860px; dua kolom di layar lebar. `prefers-reduced-motion` mematikan jalan-jalan dan kedip.
- Daftar agen & tampilan **tidak memuat data pelanggan**; semua teks kegiatan karangan.

Status: dirilis di GitHub Pages. Rencana: pindah ke Cloudflare Pages + repo private setelah token Pages tersedia.

## Memperbarui data nyata
`./perbarui-data.sh` menulis ulang `data.json` dari `hermes insights --days 30`, lalu commit + push ke repo Pages. Halaman publik: jangan tambahkan angka kinerja/penjualan per orang.
