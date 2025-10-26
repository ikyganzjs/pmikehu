const fetch = require("node-fetch");

// === Telegram Monitor ===
const TELEGRAM_BOT_TOKEN = "8490105100:AAGbLVP4o7IZapzg3-aLzmZmlft61mYaas4";
const TELEGRAM_CHAT_ID = "5995543569";

// === Fungsi kirim pesan ke Telegram ===
async function sendToTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: `🎨 *Brat Text Generator*\n\n${message}`,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("Gagal kirim ke Telegram:", err.message);
  }
}

async function getBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal ambil buffer dari ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

module.exports = {
  name: "Brat",
  desc: "Brat text generator",
  category: "Imagecreator",
  path: "/imagecreator/bratv?apikey=&text=",

  async run(req, res) {
    const { apikey, text } = req.query;

    try {
      // Validasi apikey
      if (!global.apikey.includes(apikey)) {
        await sendToTelegram(`🚫 *Apikey invalid:* ${apikey || '(none)'}\n📝 Text: ${text || '(kosong)'}`);
        return res.json({ status: false, error: "Apikey invalid" });
      }

      // Validasi teks
      if (!text) {
        await sendToTelegram(`⚠️ *Request tanpa teks*\nApikey: ${apikey}`);
        return res.json({ status: false, error: "Missing text" });
      }

      const url = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=false&delay=500`;
      const buffer = await getBuffer(url);

      if (!buffer || !buffer.length) {
        await sendToTelegram(`❌ *Gagal hasilkan gambar Brat*\nApikey: ${apikey}\n📝 Text: ${text}`);
        return res.json({ status: false, error: "Gagal mengambil hasil dari API" });
      }

      // Kirim notifikasi sukses
      await sendToTelegram(`✅ *Berhasil generate Brat!*\n\n🧑‍💻 Apikey: ${apikey}\n📝 Text: ${text}\n🌐 URL API:\n${url}`);

      res.writeHead(200, {
        "Content-Type": "image/gif",
        "Content-Length": buffer.length,
      });
      res.end(buffer);

    } catch (err) {
      await sendToTelegram(`💥 *Error saat generate Brat*\n\n${err.message}`);
      res.json({ status: false, error: err.message });
    }
  },
};
