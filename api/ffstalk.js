const axios = require("axios");
const cheerio = require("cheerio");

// ==== KONFIG TELEGRAM ====
const TELEGRAM_BOT_TOKEN = "8490105100:AAGbLVP4o7IZapzg3-aLzmZmlft61mYaas4";
const TELEGRAM_CHAT_ID = "5995543569";

async function sendToTelegram(text) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text,
      parse_mode: "Markdown"
    });
  } catch (err) {
    console.error("Gagal kirim ke Telegram:", err.message);
  }
}

// ==== FUNGSI FF STALK ====
async function ffstalk(id) {
  let data = JSON.stringify({
    "app_id": 100067,
    "login_id": id
  });

  let config = {
    method: 'POST',
    url: 'https://kiosgamer.co.id/api/auth/player_id_login',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'sec-ch-ua-platform': '"Android"',
      'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
      'sec-ch-ua-mobile': '?1',
      'Origin': 'https://kiosgamer.co.id',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'Referer': 'https://kiosgamer.co.id/',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cookie': 'source=mb; region=CO.ID; language=id'
    },
    data: data
  };

  const api = await axios.request(config);
  return api.data;
}

// ==== MODULE EKSPOR ====
module.exports = {
  name: "FF Stalk",
  desc: "Stalking free fire account",
  category: "Stalker",
  path: "/stalk/ff?apikey=&id=",
  async run(req, res) {
    const { apikey, id } = req.query;

    if (!apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" });

    if (!id)
      return res.json({ status: false, error: "Id is required" });

    try {
      const result = await ffstalk(id);

      // Kirim ke Telegram
      const message = `📱 *FF Stalk Request*\n\n🆔 ID: \`${id}\`\n👤 Nickname: *${result.nickname || "Unknown"}*\n🌍 Server: ${result.zone_id || "Unknown"}\n\n_Status: ${result.error_msg ? "❌ Gagal" : "✅ Berhasil"}_`;
      await sendToTelegram(message);

      // Kirim response ke client
      res.status(200).json({
        status: true,
        result
      });

    } catch (error) {
      await sendToTelegram(`⚠️ *FF Stalk Error*\n\n🆔 ID: \`${id}\`\n❌ Error: ${error.message}`);
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  }
};
