// Bot Discord absen Kantor Virtual Ozami: /masuk, /istirahat, /pulang, /kantor (bukan /status: itu milik Hermes).
// Status ditulis ke DATA_DIR/status-tim.json; halaman membacanya lewat server (di balik login).
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const S = require('./status');

const PERINTAH = [
  new SlashCommandBuilder().setName('masuk').setDescription('Mulai kerja (atau lanjut kerja setelah istirahat)'),
  new SlashCommandBuilder().setName('istirahat').setDescription('Istirahat sebentar'),
  new SlashCommandBuilder().setName('pulang').setDescription('Selesai kerja hari ini'),
  new SlashCommandBuilder().setName('kantor').setDescription('Lihat siapa yang sedang kerja di Kantor Virtual'),
].map(c => c.toJSON());
const KE = { masuk: 'bekerja', istirahat: 'istirahat', pulang: 'pulang' };

function mulai({ token, guildId, channelId, dataDir, timFile }) {
  const FILE = path.join(dataDir, 'status-tim.json');
  // tim.json: [{"id":"eva","nama":"Eva","discord":"<ID akun Discord>"}]; "pemilik" = pemilik server Discord
  const TIM = JSON.parse(fs.readFileSync(timFile, 'utf8'));
  let byDiscord = {};
  const petakan = () => { byDiscord = Object.fromEntries(TIM.filter(o => /^\d+$/.test(String(o.discord))).map(o => [String(o.discord), o])); };
  petakan();
  let data = S.muat(FILE, TIM);
  const simpan = () => { const tmp = FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(data) + '\n'); fs.renameSync(tmp, FILE); };
  simpan();

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  async function cekHari() {
    const lupa = S.gantiHari(data, TIM);
    if (lupa === null) return;
    simpan();
    if (lupa.length && channelId) {
      const nama = lupa.map(id => TIM.find(o => o.id === id).nama).join(', ');
      const ch = await client.channels.fetch(channelId).catch(() => null);
      ch?.send(`Hari baru. Kemarin belum /pulang: ${nama}. Status direset.`).catch(() => null);
    }
  }

  client.once('ready', async () => {
    // Daftarkan perintah satu per satu (POST = tambah/perbarui), TIDAK menimpa perintah bot lain di server.
    const rest = new REST().setToken(token);
    for (const c of PERINTAH) await rest.post(Routes.applicationGuildCommands(client.user.id, guildId), { body: c });
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    TIM.forEach(o => { if (o.discord === 'pemilik' && guild) o.discord = guild.ownerId; });
    petakan();
    console.log(`[bot] siap sebagai ${client.user.tag}; terdaftar: ${TIM.map(o => o.nama + (byDiscord[o.discord] ? '' : ' (belum ada ID)')).join(', ')}`);
    await cekHari();
    setInterval(cekHari, 60 * 1000);
  });

  client.on('interactionCreate', async it => {
    if (!it.isChatInputCommand() || !(it.commandName in KE || it.commandName === 'kantor')) return;
    await cekHari();
    if (it.commandName === 'kantor') {
      return it.reply({ content: `**Kantor hari ini** (${data.tanggal})\n${S.ringkasan(data, TIM)}`, allowedMentions: { parse: [] } });
    }
    const orang = byDiscord[it.user.id];
    if (!orang) return it.reply({ content: `Akun Discord-mu belum terdaftar di Kantor Virtual. Kirim ID ini ke Owner: \`${it.user.id}\``, flags: MessageFlags.Ephemeral });
    const salah = S.ubah(data, orang.id, KE[it.commandName]);
    if (salah) return it.reply({ content: salah, flags: MessageFlags.Ephemeral });
    simpan();
    const o = data.tim[orang.id];
    const teks = { masuk: `${S.IKON.bekerja} **${orang.nama}** mulai kerja ${S.jamWIB(o.sejak)} WIB`,
      istirahat: `${S.IKON.istirahat} **${orang.nama}** istirahat ${S.jamWIB(o.sejak)} WIB`,
      pulang: `${S.IKON.pulang} **${orang.nama}** pulang ${S.jamWIB(o.pulang)} WIB (masuk ${S.jamWIB(o.masuk)})` }[it.commandName];
    return it.reply({ content: teks, allowedMentions: { parse: [] } });
  });

  client.on('error', e => console.error('[bot]', e.message));
  client.login(token).catch(e => console.error('[bot] gagal login Discord:', e.message));
}

module.exports = { mulai };
