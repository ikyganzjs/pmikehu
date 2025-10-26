const axios = require("axios");
const cheerio = require("cheerio");
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
        text: `🔍 *Bstation Search Monitor*\n\n${message}`,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("Gagal kirim ke Telegram:", err.message);
  }
}

// === Fungsi Scraper Bilibili ===
async function bilibili(q) {
  try {
    const response = await axios.get(`https://www.bilibili.tv/id/search-result?q=${encodeURIComponent(q)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 8.1.0; CPH1803; Build/OPM1.171019.026) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.4280.141 Mobile Safari/537.36 KiToBrowser/124.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "id-ID",
        referer: "https://www.bilibili.tv/id/search",
        "upgrade-insecure-requests": "1",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);
    let results = [];

    $(".section__list__item").each((index, element) => {
      let title = $(element).find(".highlights").text().trim();
      let url = "https://www.bilibili.tv" + ($(element).find(".bstar-video-card__text a").attr("href") || "");
      let thumbnail = $(element).find(".bstar-video-card__cover-img img").attr("src") || "";
      let duration = $(element).find(".bstar-video-card__cover-mask-text").text().trim();
      let uploader = $(element).find(".bstar-video-card__nickname span").text().trim();
      let uploaderUrl = "https://www.bilibili.tv" + ($(element).find(".bstar-video-card__nickname").attr("href") || "");
      let views = $(element).find(".bstar-video-card__desc").text().trim().replace(" · ", "");

      if (title) {
        results.push({
          title,
          url,
          thumbnail,
          duration,
          uploader,
          uploaderUrl,
          views,
        });
      }
    });

    return results;
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return [];
  }
}

// === Export Modul ===
module.exports = {
  name: "Bstation Search",
  desc: "Search Bstation (Bilibili) videos",
  category: "Search",
  path: "/search/bstation?apikey=&q=",

  async run(req, res) {
    try {
      const { apikey, q } = req.query;

      // Validasi apikey
      if (!apikey || !global.apikey.includes(apikey)) {
        await sendToTelegram(`🚫 *Apikey invalid:* ${apikey || "(none)"}\n🕵️ Query: ${q || "(kosong)"}`);
        return res.json({ status: false, error: "Apikey invalid" });
      }

      // Validasi query
      if (!q) {
        await sendToTelegram(`⚠️ *Request tanpa query*\nApikey: ${apikey}`);
        return res.json({ status: false, error: "Query is required" });
      }

      // Ambil hasil pencarian
      const results = await bilibili(q);

      // Kirim log hasil ke Telegram
      await sendToTelegram(
        `✅ *Berhasil melakukan pencarian!*\n\n🧑‍💻 Apikey: ${apikey}\n🔎 Query: ${q}\n📺 Hasil ditemukan: ${results.length}`
      );

      // Kirim response JSON ke client
      res.status(200).json({
        status: true,
        creator: "IkyJs",
        query: q,
        result: results,
      });
    } catch (error) {
      await sendToTelegram(`💥 *Error saat Bstation Search*\n\n${error.message}`);
      res.status(500).json({ status: false, error: error.message });
    }
  },
};
