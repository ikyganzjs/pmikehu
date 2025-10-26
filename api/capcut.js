// api/download/capcut.js
const axios = require("axios");
const cheerio = require("cheerio");
const fetch = require("node-fetch");

// === Telegram Log ===
const TELEGRAM_BOT_TOKEN = "8490105100:AAGbLVP4o7IZapzg3-aLzmZmlft61mYaas4";
const TELEGRAM_CHAT_ID = "5995543569";

async function sendToTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: `🎬 *CapCut Downloader Log*\n\n${message}`,
        parse_mode: "Markdown"
      })
    });
  } catch (err) {
    console.error("Gagal kirim ke Telegram:", err.message);
  }
}

async function capcutdl(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; Chrome/120.0)",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8"
      },
      timeout: 20000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const videoSrc = $("video.player-o3g3Ag").attr("src");
    const posterSrc = $("video.player-o3g3Ag").attr("poster");
    const title = $("h1.template-title").text().trim();
    const actionsDetail = $("p.actions-detail").text().trim();
    const [date, uses, likes] = actionsDetail.split(",").map(i => i.trim());
    const authorAvatar = $("span.lv-avatar-image img").attr("src");
    const authorName = $("span.lv-avatar-image img").attr("alt");

    if (!videoSrc) throw new Error("Video URL tidak ditemukan di halaman.");

    return {
      title: title || "Unknown Title",
      date: date || "Unknown Date",
      pengguna: uses || "Unknown Uses",
      likes: likes || "Unknown Likes",
      author: {
        name: authorName || "Unknown Author",
        avatarUrl: authorAvatar || null
      },
      videoUrl: videoSrc,
      posterUrl: posterSrc || null
    };
  } catch (error) {
    throw new Error(`Gagal mengambil data CapCut: ${error.message}`);
  }
}

module.exports = {
  name: "Capcut",
  desc: "Downloader template video CapCut",
  category: "Downloader",
  path: "/download/capcut?apikey=&url=",

  async run(req, res) {
    try {
      const { apikey, url } = req.query;

      // Validasi API key
      if (!apikey || !global.apikey.includes(apikey)) {
        await sendToTelegram(`🚫 *Apikey invalid:* ${apikey || "(none)"}\n🔗 URL: ${url || "(none)"}`);
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!url) {
        return res.json({ status: false, error: "Parameter 'url' wajib diisi" });
      }

      // Ambil data CapCut
      const result = await capcutdl(url);

      // Log ke Telegram
      await sendToTelegram(`✅ *Download request berhasil*\n\n🔗 URL: ${url}\n🎞️ Judul: ${result.title}\n👤 Author: ${result.author.name}`);

      // Kirim hasil ke user
      res.status(200).json({
        status: true,
        creator: "IkyJs",
        source: "capcut.com",
        result
      });
    } catch (error) {
      await sendToTelegram(`💥 *Error CapCut API:*\n${error.message}`);

      res.status(500).json({
        status: false,
        error: error.message || "Terjadi kesalahan tak terduga."
      });
    }
  }
};
