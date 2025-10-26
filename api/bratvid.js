const fetch = require("node-fetch");
const { getBuffer } = require("../lib/functions");

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
        text: `🎬 *Brat Video Generator*\n\n${message}`,
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
  name: "Bratvid",
  desc: "Brat video generator",
  category: "Imagecreator",
  path: "/imagecreator/bratvid?apikey=&text=",

  async run(req, res) {
    try {
      const { apikey, text } = req.query;

      // === Validasi API key ===
      if (!apikey || !global.apikey.includes(apikey)) {
        await sendToTelegram(`🚫 *Apikey invalid:* ${apikey || '(none)'}\n📝 Text: ${text || '(kosong)'}`);
        return res.json({ status: false, error: "Apikey invalid" });
      }

      // === Validasi teks ===
      if (!text) {
        await sendToTelegram(`⚠️ *Request tanpa teks*\nApikey: ${apikey}`);
        return res.json({ status: false, error: "Text parameter is required" });
      }

      // === Ambil video Brat ===
      const url = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=true&delay=500`;
      const buffer = await getBuffer(url);

      if (!buffer || !buffer.length) {
        await sendToTelegram(`❌ *Gagal hasilkan video Brat*\nApikey: ${apikey}\n📝 Text: ${text}`);
        return res.json({ status: false, error: "Gagal mengambil hasil dari API" });
      }

      // === Kirim log sukses ke Telegram ===
      await sendToTelegram(`✅ *Berhasil generate Brat Video!*\n\n🧑‍💻 Apikey: ${apikey}\n📝 Text: ${text}\n🌐 URL API:\n${url}`);

      // === Kirim hasil ke client ===
      res.writeHead(200, {
        "Content-Type": "image/gif",
        "Content-Length": buffer.length,
      });
      res.end(buffer);

    } catch (error) {
      await sendToTelegram(`💥 *Error saat generate Brat Video*\n\n${error.message}`);
      res.status(500).send({ status: false, error: error.message });
    }
  },
};
