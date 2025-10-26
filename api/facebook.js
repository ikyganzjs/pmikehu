const axios = require('axios');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

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
        text: `📥 *Facebook Downloader Log*\n\n${message}`,
        parse_mode: "Markdown"
      })
    });
  } catch (err) {
    console.error("Gagal kirim ke Telegram:", err.message);
  }
}

// === Fungsi utama Facebook downloader ===
async function facebook(url) {
  if (!/facebook\.\w+\/(reel|watch|share)/gi.test(url)) {
    throw new Error("Invalid URL, Enter A Valid Facebook Video URL");
  }

  try {
    const response = await axios.get("https://fdownloader.net/id", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      },
    });

    const html = response.data;
    const exMatch = html.match(/k_exp ?= ?"(\d+)"/i);
    const toMatch = html.match(/k_token ?= ?"([a-f0-9]+)"/i);
    const ex = exMatch ? exMatch[1] : null;
    const to = toMatch ? toMatch[1] : null;

    if (!ex || !to) {
      throw new Error("Error Extracting Exp And Token");
    }

    const searchResponse = await axios.post(
      "https://v3.fdownloader.net/api/ajaxSearch?lang=id",
      new URLSearchParams({
        k_exp: ex,
        k_token: to,
        q: url,
        lang: "id",
        web: "fdownloader.net",
        v: "v2",
        w: "",
      }),
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
          origin: "https://fdownloader.net",
        },
      }
    );

    const data = searchResponse.data;
    if (data.status !== "ok") {
      throw new Error("Failed Doing Ajax Search");
    }

    const $ = cheerio.load(data.data);
    const details = {
      title: $(".thumbnail > .content > .clearfix > h3").text().trim(),
      duration: $(".thumbnail > .content > .clearfix > p").text().trim(),
      thumbnail: $(".thumbnail > .image-fb > img").attr("src") || "",
      media: $("#popup_play > .popup-body > .popup-content > #vid").attr("src") || "",
      video: $("#fbdownloader").find(".tab__content").eq(0).find("tr").map((i, el) => {
        const quality = $(el).find(".video-quality").text().trim();
        const url = $(el).find("a").attr("href") || $(el).find("button").attr("data-videourl") || null;
        return url && url !== "#note_convert" ? { quality, url } : null;
      }).get().filter(Boolean),
      music: $("#fbdownloader").find("#audioUrl").attr("value") || "",
    };

    return details;
  } catch (error) {
    throw error;
  }
}

// === Handler utama ===
module.exports = {
  name: "Facebook",
  desc: "Facebook downloader",
  category: "Downloader",
  path: "/download/facebook?apikey=&url=",
  async run(req, res) {
    const { apikey, url } = req.query;
    if (!apikey || !global.apikey.includes(apikey)) {
      await sendToTelegram(`🚫 *Apikey invalid:* ${apikey || '(none)'}\nURL: ${url || '(none)'}`);
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!url) {
      return res.json({ status: false, error: "Url is required" });
    }

    try {
      const results = await facebook(url);

      // Kirim notifikasi sukses ke Telegram
      await sendToTelegram(
        `✅ *Facebook Download Success!*\n\n🎬 *Judul:* ${results.title || 'Unknown'}\n📺 *Kualitas:* ${results.video?.map(v => v.quality).join(', ') || '-'}\n🔗 *URL:* ${url}`
      );

      res.status(200).json({
        status: true,
        result: results,
      });
    } catch (error) {
      // Kirim notifikasi error ke Telegram
      await sendToTelegram(`💥 *Facebook Downloader Error:*\n${error.message}\n🔗 URL: ${url}`);
      res.status(500).json({ status: false, error: error.message });
    }
  }
};
