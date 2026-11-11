// Logika status tim (tanpa Discord), supaya bisa dites sendiri.
// Status: belum (belum masuk), bekerja, istirahat, pulang.
const fs = require('fs');

const tanggalWIB = (d = new Date()) => d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
const jamWIB = iso => (iso ? new Date(iso).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) : '-');

function kosong(tim, now = new Date()) {
  const t = {};
  tim.forEach(o => { t[o.id] = { status: 'belum', sejak: null, masuk: null, pulang: null }; });
  return { diperbarui: now.toISOString(), tanggal: tanggalWIB(now), tim: t };
}

function muat(file, tim, now = new Date()) {
  let d;
  try { d = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { d = null; }
  if (!d || !d.tim) d = kosong(tim, now);
  tim.forEach(o => { if (!d.tim[o.id]) d.tim[o.id] = { status: 'belum', sejak: null, masuk: null, pulang: null }; });
  return d;
}

// Ganti hari (WIB): semua kembali "belum". Mengembalikan daftar id yang lupa /pulang.
function gantiHari(d, tim, now = new Date()) {
  if (d.tanggal === tanggalWIB(now)) return null;
  const lupa = tim.filter(o => ['bekerja', 'istirahat'].includes(d.tim[o.id]?.status)).map(o => o.id);
  const baru = kosong(tim, now);
  d.tanggal = baru.tanggal; d.tim = baru.tim; d.diperbarui = baru.diperbarui;
  return lupa;
}

// Ubah status satu orang. Mengembalikan pesan kesalahan (string) atau null kalau berhasil.
function ubah(d, id, ke, now = new Date()) {
  const o = d.tim[id], iso = now.toISOString();
  if (!o) return 'Nama tidak dikenal.';
  if (ke === 'bekerja') {
    if (o.status === 'bekerja') return `Kamu sudah tercatat bekerja sejak ${jamWIB(o.sejak)}.`;
    if (!o.masuk || o.status === 'pulang') { o.masuk = o.masuk || iso; o.pulang = null; }
  } else if (ke === 'istirahat') {
    if (o.status !== 'bekerja') return 'Kamu belum /masuk, jadi belum bisa istirahat.';
  } else if (ke === 'pulang') {
    if (o.status === 'belum') return 'Kamu belum /masuk hari ini.';
    if (o.status === 'pulang') return `Kamu sudah pulang jam ${jamWIB(o.pulang)}.`;
    o.pulang = iso;
  } else return 'Status tidak dikenal.';
  o.status = ke; o.sejak = iso; d.diperbarui = iso;
  return null;
}

const IKON = { bekerja: '🟢', istirahat: '☕', pulang: '🏠', belum: '⚪' };
function kalimat(o) {
  if (o.status === 'bekerja') return `bekerja sejak ${jamWIB(o.sejak)}`;
  if (o.status === 'istirahat') return `istirahat sejak ${jamWIB(o.sejak)}`;
  if (o.status === 'pulang') return `pulang ${jamWIB(o.pulang)} (masuk ${jamWIB(o.masuk)})`;
  return 'belum masuk';
}
function ringkasan(d, tim) {
  return tim.map(p => `${IKON[d.tim[p.id].status]} **${p.nama}**: ${kalimat(d.tim[p.id])}`).join('\n');
}

module.exports = { tanggalWIB, jamWIB, kosong, muat, gantiHari, ubah, kalimat, ringkasan, IKON };
