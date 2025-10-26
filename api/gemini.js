const fetch = require("node-fetch");
const axios = require("axios");

// === GROC API KEY ROTATOR ===
const Apis = [
  "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",
  "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"
];
const GROQ_API_KEY = Apis[Math.floor(Math.random() * Apis.length)];

// === TELEGRAM CONFIG ===
const TELEGRAM_BOT_TOKEN = "8490105100:AAGbLVP4o7IZapzg3-aLzmZmlft61mYaas4";
const TELEGRAM_CHAT_ID = "5995543569";

// === Fungsi kirim pesan ke Telegram ===
async function sendToTelegram({ text, imageUrl = null }) {
  try {
    if (imageUrl) {
      // Kirim foto + caption
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        chat_id: TELEGRAM_CHAT_ID,
        photo: imageUrl,
        caption: text,
        parse_mode: "Markdown"
      });
    } else {
      // Kirim teks biasa
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "Markdown"
      });
    }
  } catch (err) {
    console.error("Gagal kirim ke Telegram:", err.message);
  }
}

// === Fungsi utama ===
async function askGroqWithImage(prompt, imageUrl, model = "meta-llama/llama-4-scout-17b-16e-instruct") {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        temperature: 1,
        max_completion_tokens: 1024
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response from model.";
  } catch (error) {
    console.error("Error:", error);
    return "Error while fetching response.";
  }
}

module.exports = {
  name: "Ai With Image",
  desc: "AI with image input (Groq + Telegram log)",
  category: "Openai",
  path: "/ai/gemini?apikey=&prompt=&imageUrl=",

  async run(req, res) {
    const { prompt, imageUrl, apikey } = req.query;

    if (!prompt) return res.json({ status: false, error: "Prompt is required" });
    if (!imageUrl) return res.json({ status: false, error: "Image URL is required" });
    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Invalid API key" });
    }

    try {
      const result = await askGroqWithImage(prompt, imageUrl);

      // === Kirim hasil ke Telegram ===
      await sendToTelegram({
        text: `🤖 *AI With Image Request*\n\n📝 *Prompt:* ${prompt}\n📷 *Image:* ${imageUrl}\n\n💬 *Result:*\n${result}`,
        imageUrl
      });

      res.json({ status: true, result });
    } catch (err) {
      await sendToTelegram({
        text: `⚠️ *AI With Image Error*\n\n📝 *Prompt:* ${prompt}\n📷 *Image:* ${imageUrl}\n❌ *Error:* ${err.message}`
      });
      res.status(500).json({ status: false, error: err.message });
    }
  }
};
