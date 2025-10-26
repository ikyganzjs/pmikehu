// api/tools/emojimix.js
const fetch = require("node-fetch");

// === Telegram Notif ===
const TELEGRAM_BOT_TOKEN = "8490105100:AAGbLVP4o7IZapzg3-aLzmZmlft61mYaas4";
const TELEGRAM_CHAT_ID = "5995543569";

// Fungsi kirim pesan ke Telegram
async function sendToTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: `😄 *Emoji Mix Generator*\n\n${message}`,
        parse_mode: "Markdown"
      })
    });
  } catch (err) {
    console.error("Gagal kirim ke Telegram:", err.message);
  }
}

// Fungsi ambil buffer gambar
async function getBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal ambil buffer dari ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

module.exports = {
  name: "Emoji Mix",
  desc: "Mixed emoji generator (Emoji Kitchen by Google)",
  category: "Tools",
  path: "/tools/emojimix?apikey=&emoji1=&emoji2=&mode=",

  async run(req, res) {
    const { apikey, emoji1, emoji2, mode } = req.query;

    // 🔒 Validasi API key
    if (!apikey || !global.apikey.includes(apikey)) {
      await sendToTelegram(`🚫 *Apikey invalid:* ${apikey || "(none)"}\nEmoji1: ${emoji1 || "(none)"}\nEmoji2: ${emoji2 || "(none)"}`);
      return res.json({ status: false, error: "Apikey invalid" });
    }

    // 🧾 Validasi parameter
    if (!emoji1 || !emoji2) {
      return res.json({ status: false, error: "Parameter 'emoji1' dan 'emoji2' wajib diisi" });
    }

    try {
      // 🔍 Ambil hasil dari Tenor Emoji Kitchen
      const apiURL = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`;
      const json = await fetch(apiURL).then(res => res.json());

      const img = json?.results?.[0]?.url || json?.results?.[0]?.media_formats?.png_transparent?.url;
      if (!img) throw new Error("Gagal mendapatkan hasil emoji mix dari Tenor");

      // 📩 Kirim log ke Telegram
      await sendToTelegram(`✅ *Emoji Mix berhasil dibuat!*\n\n🔹 Emoji1: ${emoji1}\n🔹 Emoji2: ${emoji2}\n🖼️ [Lihat Hasil](${img})`);

      // 🎨 Mode JSON
      if (mode === "json") {
        return res.json({
          status: true,
          creator: "IkyJs",
          result: {
            emoji1,
            emoji2,
            imageUrl: img
          }
        });
      }

      // 🖼️ Mode default → kirim langsung gambar PNG
      const buffer = await getBuffer(img);
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": buffer.length
      });
      res.end(buffer);

    } catch (error) {
      console.error("EmojiMix error:", error.message);
      await sendToTelegram(`💥 *Error Emoji Mix:*\n${error.message}`);

      res.status(500).json({
        status: false,
        error: error.message || "Gagal memproses Emoji Mix"
      });
    }
  }
};
