// Server Kantor Virtual Ozami.
// - Login memakai akun CRM Ozami (tabel users Concord CRM, password bcrypt). Hanya SELECT.
// - Setelah login: halaman kantor, data.json (pemakaian MiniMax) dan status-tim.json (dari bot Discord).
// - Menjalankan bot Discord absen di proses yang sama.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const E = process.env;
const PORT = +(E.PORT || 8080);
const SITE = path.resolve(E.SITE_DIR || path.join(__dirname, '..'));
const DATA = path.resolve(E.DATA_DIR || path.join(__dirname, 'data'));
const SECRET = E.SESSION_SECRET || '';
const SECURE = E.COOKIE_SECURE !== '0';
const SESI_JAM = +(E.SESSION_HOURS || 168);
const CRM_URL = E.CRM_URL || 'https://crm.ozami.co.id';
const DISCORD_URL = E.DISCORD_URL || (E.GUILD_ID ? `https://discord.com/channels/${E.GUILD_ID}` : 'https://discord.com/app');
const USERS_TABLE = (E.CRM_USERS_TABLE || 'tbl_users').replace(/[^a-z0-9_]/gi, '');
if (SECRET.length < 32) { console.error('SESSION_SECRET minimal 32 karakter'); process.exit(1); }
fs.mkdirSync(DATA, { recursive: true });

/* ---------- akun CRM ---------- */
let pool = null;
function db() {
  if (!pool) pool = require('mysql2/promise').createPool({ host: E.CRM_DB_HOST || 'crm-db', port: +(E.CRM_DB_PORT || 3306),
    user: E.CRM_DB_USER, password: E.CRM_DB_PASS, database: E.CRM_DB_NAME || 'ozami_crm', connectionLimit: 3, connectTimeout: 5000 });
  return pool;
}
// Hash palsu supaya waktu jawab sama walau email tidak ada (tidak membocorkan email terdaftar).
const HASH_PALSU = bcrypt.hashSync('tidak-ada-akun-ini', 10);
async function cekLogin(email, pass) {
  const [rows] = await db().query(`SELECT id, name, email, password FROM \`${USERS_TABLE}\` WHERE email = ? LIMIT 1`, [email]);
  const u = rows[0];
  const hash = String(u?.password || HASH_PALSU).replace(/^\$2y\$/, '$2b$');   // Laravel pakai $2y$
  const cocok = await bcrypt.compare(pass, hash);
  return cocok && u ? { id: u.id, nama: u.name } : null;
}

/* ---------- sesi (cookie bertanda tangan HMAC) ---------- */
const b64 = s => Buffer.from(s).toString('base64url');
const tanda = s => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
function buatSesi(u) { const isi = b64(JSON.stringify({ id: u.id, n: u.nama, x: Date.now() + SESI_JAM * 36e5 })); return isi + '.' + tanda(isi); }
function bacaSesi(req) {
  const m = /(?:^|;\s*)kv_sesi=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  const [isi, sig] = m[1].split('.');
  if (!isi || !sig) return null;
  const a = Buffer.from(sig), b = Buffer.from(tanda(isi));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const s = JSON.parse(Buffer.from(isi, 'base64url').toString()); return s.x > Date.now() ? s : null; } catch { return null; }
}
const cookie = (v, umur) => `kv_sesi=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${umur}${SECURE ? '; Secure' : ''}`;

/* ---------- batas percobaan login: 8 gagal per 15 menit per IP ---------- */
const gagal = new Map();
const ipDari = req => (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
function terblokir(ip) { const g = gagal.get(ip); if (!g) return false; if (Date.now() > g.sampai) { gagal.delete(ip); return false; } return g.n >= 8; }
function catatGagal(ip) { const g = gagal.get(ip) || { n: 0, sampai: Date.now() + 15 * 60e3 }; g.n++; gagal.set(ip, g); }

/* ---------- halaman ---------- */
const HEAD = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY' };
const TIPE = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.js': 'text/javascript', '.css': 'text/css' };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LOGIN = fs.readFileSync(path.join(__dirname, 'login.html'), 'utf8');
function kirim(res, kode, isi, tipe = 'text/html; charset=utf-8', extra = {}) { res.writeHead(kode, { ...HEAD, 'Content-Type': tipe, 'Cache-Control': 'no-store', ...extra }); res.end(isi); }
function halamanLogin(res, pesan = '', email = '') {
  kirim(res, pesan ? 401 : 200, LOGIN.replace('{{PESAN}}', pesan ? `<p class="err" role="alert">${esc(pesan)}</p>` : '').replace('{{EMAIL}}', esc(email)).replace('{{CRM}}', esc(CRM_URL)));
}
function bacaBody(req) { return new Promise((ok, no) => { let b = ''; req.on('data', c => { b += c; if (b.length > 4096) { no(new Error('besar')); req.destroy(); } }); req.on('end', () => ok(b)); }); }
function kirimFile(res, file, tipe) {
  fs.readFile(file, (e, isi) => e ? kirim(res, 404, 'Tidak ada', 'text/plain') : kirim(res, 200, isi, tipe || TIPE[path.extname(file)] || 'application/octet-stream'));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    if (p === '/sehat') return kirim(res, 200, 'ok', 'text/plain');
    if (p.startsWith('/aset/')) {   // logo dipakai juga di halaman login
      const f = path.join(SITE, 'aset', path.basename(p));
      return kirimFile(res, f);
    }
    if (p === '/login' && req.method === 'GET') return bacaSesi(req) ? kirim(res, 302, '', 'text/plain', { Location: '/' }) : halamanLogin(res);
    if (p === '/login' && req.method === 'POST') {
      const ip = ipDari(req);
      if (terblokir(ip)) return halamanLogin(res, 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.');
      const f = new URLSearchParams(await bacaBody(req));
      const email = (f.get('email') || '').trim().toLowerCase(), pass = f.get('password') || '';
      if (!email || !pass) return halamanLogin(res, 'Isi email dan password akun CRM.', email);
      let u = null;
      try { u = await cekLogin(email, pass); } catch (e) { console.error('[login] database CRM:', e.message); return halamanLogin(res, 'Database CRM sedang tidak bisa dihubungi. Coba lagi sebentar.', email); }
      if (!u) { catatGagal(ip); return halamanLogin(res, 'Email atau password salah. Pakai akun yang sama dengan CRM Ozami.', email); }
      gagal.delete(ip);
      console.log(`[login] ${u.nama} (#${u.id}) masuk`);
      return kirim(res, 303, '', 'text/plain', { Location: '/', 'Set-Cookie': cookie(buatSesi(u), SESI_JAM * 3600) });
    }
    if (p === '/keluar') return kirim(res, 303, '', 'text/plain', { Location: '/login', 'Set-Cookie': cookie('', 0) });

    const s = bacaSesi(req);
    if (!s) return p === '/' || p.endsWith('.html') ? kirim(res, 302, '', 'text/plain', { Location: '/login' }) : kirim(res, 401, '{"error":"login"}', TIPE['.json']);

    if (p === '/' || p === '/index.html') return kirimFile(res, path.join(SITE, 'index.html'));
    if (p === '/saya') return kirim(res, 200, JSON.stringify({ nama: s.n, crm: CRM_URL, discord: DISCORD_URL }), TIPE['.json']);
    if (p === '/data.json') return kirimFile(res, fs.existsSync(path.join(DATA, 'data.json')) ? path.join(DATA, 'data.json') : path.join(SITE, 'data.json'));
    if (p === '/status-tim.json') return kirimFile(res, path.join(DATA, 'status-tim.json'));
    return kirim(res, 404, 'Tidak ada', 'text/plain');
  } catch (e) {
    console.error('[server]', e);
    if (!res.headersSent) kirim(res, 500, 'Ada masalah di server', 'text/plain');
  }
});
server.listen(PORT, () => console.log(`[server] Kantor Virtual di port ${PORT}`));

/* ---------- bot Discord ---------- */
if (E.DISCORD_TOKEN && E.GUILD_ID) {
  require('./bot').mulai({ token: E.DISCORD_TOKEN, guildId: E.GUILD_ID, channelId: E.CHANNEL_ID, dataDir: DATA,
    timFile: E.TIM_FILE || path.join(DATA, 'tim.json') });
} else console.log('[bot] DISCORD_TOKEN/GUILD_ID kosong: bot tidak dijalankan');
