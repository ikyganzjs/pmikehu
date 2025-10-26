const fetch = require("node-fetch");

// Fungsi untuk fetch JSON
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

// Konfigurasi Telegram
const TELEGRAM_BOT_TOKEN = "8490105100:AAGbLVP4o7IZapzg3-aLzmZmlft61mYaas4";
const TELEGRAM_CHAT_ID = "5995543569";

async function sendTelegram(message) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown"
      })
    });
  } catch (e) {
    console.error("[Telegram Error]", e.message);
  }
}

module.exports = {
  name: "Ssweb",
  desc: "Screenshot website",
  category: "Tools",
  path: "/tools/ssweb?apikey=&url=",
  async run(req, res) {
    const { apikey, url } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' });
    }

    if (!url) {
      return res.json({ status: false, error: 'Url is required' });
    }

    try {
      const response = await fetchJson(`https://api.pikwy.com/?tkn=125&d=3000&u=${encodeURIComponent(url)}&fs=0&w=1280&h=1200&s=100&z=100&f=jpg&rt=jweb`);

      if (!response.iurl) {
        throw new Error('Failed to get screenshot image URL');
      }

      // Kirim notifikasi Telegram
      sendTelegram(`🖼 *Screenshot Website*\nURL: ${url}\nImage: ${response.iurl}`);

      res.status(200).json({
        status: true,
        result: response.iurl
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};
