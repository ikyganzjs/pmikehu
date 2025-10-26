const fetch = require("node-fetch");
const axios = require("axios");

// === TELEGRAM CONFIG ===
const TELEGRAM_BOT_TOKEN = "8490105100:AAGbLVP4o7IZapzg3-aLzmZmlft61mYaas4";
const TELEGRAM_CHAT_ID = "5995543569";

// === Fungsi kirim log ke Telegram ===
async function sendToTelegram(text) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "Markdown"
    });
  } catch (err) {
    console.error("Gagal kirim Telegram:", err.message);
  }
}

// === Fungsi utama clone GitHub ===
async function gitClone(urls) {
  const regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;
  try {
    let [, user, repo] = urls.match(regex) || [];
    if (!user || !repo) throw new Error("Invalid GitHub URL format");

    repo = repo.replace(/\.git$/, '');
    const url = `https://api.github.com/repos/${user}/${repo}/zipball`;

    const headRes = await fetch(url, { method: 'HEAD' });
    const headers = headRes.headers;

    const filename = headers.get('content-disposition')?.match(/filename=(.+)/)?.[1] || `${repo}.zip`;
    const mimetype = headers.get('content-type') || 'application/zip';

    return {
      download: url,
      filename,
      mimetype
    };
  } catch (err) {
    throw err;
  }
}

module.exports = [
  {
    name: "Gitclone",
    desc: "Clone GitHub repository",
    category: "Downloader",
    path: "/download/github?apikey=&url=",

    async run(req, res) {
      const { apikey, url } = req.query;

      // === Validasi API key ===
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!url) {
        return res.json({ status: false, error: "Url is required" });
      }

      try {
        const results = await gitClone(url);

        // === Kirim notifikasi ke Telegram ===
        await sendToTelegram(
          `📦 *GitHub Clone*\n\n👤 *User:* ${req.ip}\n🔗 *Repo:* ${url}\n📁 *File:* ${results.filename}\n✅ *Status:* Sukses`
        );

        res.status(200).json({
          status: true,
          result: results
        });
      } catch (error) {
        await sendToTelegram(
          `⚠️ *GitHub Clone Failed*\n\n🔗 *Repo:* ${url}\n❌ *Error:* ${error.message}`
        );

        res.status(500).json({ status: false, error: error.message });
      }
    }
  }
];
