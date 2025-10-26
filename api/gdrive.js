const api = require('ab-downloader');
const axios = require('axios');

// === TELEGRAM CONFIG ===
const TELEGRAM_BOT_TOKEN = "8490105100:AAGbLVP4o7IZapzg3-aLzmZmlft61mYaas4";
const TELEGRAM_CHAT_ID = "5995543569";

// === Fungsi kirim pesan ke Telegram ===
async function sendToTelegram(text) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "Markdown"
    });
  } catch (err) {
    console.error("Gagal kirim ke Telegram:", err.message);
  }
}

module.exports = {
  name: "Gdrive",
  desc: "Google Drive downloader",
  category: "Downloader",
  path: "/download/gdrive?apikey=&url=",

  async run(req, res) {
    try {
      const { apikey, url } = req.query;
      if (!apikey || !global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });
      if (!url)
        return res.json({ status: false, error: "Url is required" });

      const results = await api.gdrive(url);
      const result = results.result;

      // === Kirim hasil ke Telegram ===
      const message = `📂 *GDrive Downloader*\n\n🔗 *URL:* ${url}\n📁 *Filename:* ${result?.filename || "Unknown"}\n📦 *Size:* ${result?.filesize || "Unknown"}\n📥 *Download:* [Klik di sini](${result?.downloadUrl || url})`;
      await sendToTelegram(message);

      // === Kirim response ke client ===
      res.status(200).json({
        status: true,
        result
      });

    } catch (error) {
      // Kirim error juga ke Telegram
      await sendToTelegram(`⚠️ *GDrive Downloader Error*\n\n🔗 *URL:* ${req.query.url}\n❌ Error: ${error.message}`);
      res.status(500).json({ status: false, error: error.message });
    }
  }
};
