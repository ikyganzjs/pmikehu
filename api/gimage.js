const fetch = require("node-fetch");
const axios = require("axios");

// === TELEGRAM CONFIG ===
const TELEGRAM_BOT_TOKEN = "8490105100:AAGbLVP4o7IZapzg3-aLzmZmlft61mYaas4";
const TELEGRAM_CHAT_ID = "5995543569";

// === Kirim ke Telegram ===
async function sendToTelegram(text, imageUrl = null) {
  try {
    if (imageUrl) {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        chat_id: TELEGRAM_CHAT_ID,
        photo: imageUrl,
        caption: text,
        parse_mode: "Markdown"
      });
    } else {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "Markdown"
      });
    }
  } catch (e) {
    console.error("Gagal kirim Telegram:", e.message);
  }
}

// === Fungsi utama ===
const googleSearchImage = async (query) => {
  if (!query) throw Error(`kata pencarian tidak boleh kosong`);
  
  const usp = {
    "as_st": "y",
    "as_q": query,
    "as_epq": "",
    "as_oq": "",
    "as_eq": "",
    "imgsz": "l", // ukuran besar
    "imgar": "",
    "imgcolor": "",
    "imgtype": "jpg",
    "cr": "",
    "as_sitesearch": "",
    "as_filetype": "",
    "tbs": "",
    "udm": "2"
  };

  const headers = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
  };

  const response = await fetch("https://www.google.com/search?" + new URLSearchParams(usp).toString(), { headers });
  if (!response.ok)
    throw Error(`Gagal mengakses API ${response.status} ${response.statusText}`);

  const html = await response.text();
  const match = html.match(/var m=(.*?);var a=m/)?.[1];
  if (!match) throw Error("Data hasil tidak ditemukan!");

  const json = JSON.parse(match);
  const images = Object.entries(json)
    .filter(v => v[1]?.[1]?.[3]?.[0])
    .map(v => ({
      title: v[1]?.[1]?.[25]?.[2003]?.[3] || null,
      imageUrl: v[1][1][3][0] || null,
      height: v[1][1][3][1] || null,
      width: v[1][1][3][2] || null,
      imageSize: v[1]?.[1]?.[25]?.[2000]?.[2] || null,
      referer: v[1]?.[1]?.[25]?.[2003]?.[2] || null,
      aboutUrl: v[1]?.[1]?.[25]?.[2003]?.[33] || null
    }));

  if (!images.length) throw Error(`hasil pencarian "${query}" kosong`);
  images.pop(); // buang elemen akhir
  return { total: images.length, images };
};

module.exports = {
  name: "Gimage",
  desc: "Search google image",
  category: "Search",
  path: "/search/gimage?apikey=&q=",

  async run(req, res) {
    const { apikey, q } = req.query;

    if (!global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!q) {
      return res.json({ status: false, error: "Query is required" });
    }

    try {
      const results = await googleSearchImage(q);
      const first = results.images[0]?.imageUrl || null;

      // === Kirim ke Telegram ===
      await sendToTelegram(
        `🔍 *Google Image Search*\n\n🧠 *Query:* ${q}\n📸 *Total:* ${results.total}`,
        first
      );

      res.status(200).json({
        status: true,
        result: results
      });
    } catch (error) {
      await sendToTelegram(`⚠️ *Gimage Error*\n\n🧠 *Query:* ${q}\n❌ *Error:* ${error.message}`);
      res.status(500).json({ status: false, error: error.message });
    }
  }
};
