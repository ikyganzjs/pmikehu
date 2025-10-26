const fetch = require("node-fetch");

// === Konfigurasi Telegram ===
const TELEGRAM_BOT_TOKEN = "8490105100:AAGbLVP4o7IZapzg3-aLzmZmlft61mYaas4";
const TELEGRAM_CHAT_ID = "5995543569";

// Fungsi kirim pesan ke Telegram
async function sendToTelegram(message) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: `🎨 *Emoji To GIF Log*\n\n${message}`,
        parse_mode: "Markdown"
      })
    });
  } catch (err) {
    console.error("Gagal kirim ke Telegram:", err.message);
  }
}

// Fungsi encode emoji ke format codepoint
function encodeEmoji(emoji) {
  return [...emoji].map(char => char.codePointAt(0).toString(16)).join('-');
}

// Fungsi ambil buffer dari URL
async function getBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal mengambil buffer dari ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

module.exports = {
  name: "Emoji To Gif",
  desc: "Convert emoji to gif",
  category: "Tools",
  path: "/tools/emojitogif?apikey=&emoji=",
  async run(req, res) {
    const { apikey, emoji } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      await sendToTelegram(`🚫 *Apikey invalid:* ${apikey || '(none)'}\nEmoji: ${emoji || '(none)'}`);
      return res.json({ status: false, error: 'Apikey invalid' });
    }

    if (!emoji) {
      return res.json({ status: false, error: 'Emoji is required' });
    }

    try {
      const code = encodeEmoji(emoji);
      const imageUrl = `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.webp`;
      const buffer = await getBuffer(imageUrl);

      await sendToTelegram(`✅ *Emoji To GIF Success!*\n\n🔹 Emoji: ${emoji}\n🖼️ URL: ${imageUrl}`);

      res.writeHead(200, {
        'Content-Type': 'image/webp',
        'Content-Length': buffer.length
      });
      res.end(buffer);
    } catch (error) {
      await sendToTelegram(`💥 *Error EmojiToGif:*\n${error.message}\nEmoji: ${emoji}`);
      res.status(500).json({ status: false, error: error.message });
    }
  }
};
