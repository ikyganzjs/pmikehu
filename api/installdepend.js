const { Client } = require('ssh2');
const stream = require("stream");
const axios = require("axios");

// === KONFIG TELEGRAM ===
const TELEGRAM_BOT_TOKEN = "8490105100:AAGbLVP4o7IZapzg3-aLzmZmlft61mYaas4";
const TELEGRAM_CHAT_ID = "5995543569";

// === Fungsi kirim log ke Telegram ===
async function sendToTelegram(message) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown"
    });
  } catch (err) {
    console.error("Gagal kirim Telegram:", err.message);
  }
}

module.exports = {
  name: "Install Depend Pterodactyl",
  desc: "Menginstall depend server pterodactyl di VPS melalui SSH",
  category: "Install Panel",
  path: "/installpanel/installdepend?apikey=&ip=&password=",
  
  async run(req, res) {
    const { apikey, ip, password } = req.query;

    // 🔐 Validasi apikey
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(403).json({ status: false, error: "Apikey invalid" });
    }

    if (!ip || !password) {
      return res.status(400).json({ status: false, error: "Parameter ip & password wajib diisi" });
    }

    const conn = new Client();
    const command = `bash <(curl -s https://raw.githubusercontent.com/KiwamiXq1031/installer-premium/refs/heads/main/zero.sh)`;

    const connSettings = {
      host: ip,
      port: 22,
      username: "root",
      password: password,
      readyTimeout: 20000
    };

    try {
      conn.on("ready", () => {
        console.log(`[SSH] Terhubung ke ${ip} — mulai instalasi depend...`);
        sendToTelegram(`🚀 *Install Depend Pterodactyl*\n\n🖥️ Host: \`${ip}\`\n📦 Status: *Terhubung ke VPS...*`);

        let output = "";

        conn.exec(command, (err, stream) => {
          if (err) {
            sendToTelegram(`❌ *Gagal Menjalankan Perintah di VPS*\n\n🖥️ Host: \`${ip}\`\n💬 Error: \`${err.message}\``);
            return res.status(500).json({ status: false, error: err.message });
          }

          stream.on("data", (data) => {
            const log = data.toString();
            output += log;
            console.log(`[SSH ${ip}] ${log}`);

            // Input otomatis sesuai script installer
            if (log.includes("Masukkan angka:")) stream.write("11\n");
            if (log.includes("Ketik huruf:")) stream.write("A\n");
            if (log.includes("(Y/n)")) stream.write("Y\n");
          });

          stream.stderr.on("data", (data) => {
            console.log(`[SSH STDERR ${ip}] ${data.toString()}`);
          });

          stream.on("close", async (code, signal) => {
            console.log(`[SSH] Instalasi selesai di ${ip}`);
            conn.end();

            const lastLog = output.slice(-500); // ambil 500 karakter terakhir log
            await sendToTelegram(
              `✅ *Instalasi Depend Berhasil*\n\n🖥️ Host: \`${ip}\`\n📦 Status: *Selesai*\n\n\`\`\`\n${lastLog}\n\`\`\``
            );

            return res.status(200).json({
              status: true,
              message: "Berhasil install depend Pterodactyl ✅",
              ip,
              output: lastLog
            });
          });
        });
      });

      conn.on("error", async (err) => {
        const msg = err.message.includes("authentication")
          ? "Password VPS salah"
          : err.message.includes("timed out")
          ? "Koneksi SSH timeout"
          : err.message;

        console.error("[SSH ERROR]", err.message);
        await sendToTelegram(`⚠️ *Instalasi Gagal*\n\n🖥️ Host: \`${ip}\`\n❌ Error: \`${msg}\``);

        return res.status(500).json({ status: false, error: msg });
      });

      conn.connect(connSettings);
    } catch (error) {
      console.error("Error installdepend:", error);
      await sendToTelegram(`🚨 *Internal Error*\n\n🖥️ Host: \`${ip}\`\n❌ ${error.message}`);
      return res.status(500).json({ status: false, error: error.message });
    }
  }
};
