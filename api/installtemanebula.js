const { Client } = require('ssh2');
const stream = require("stream");
const fetch = require("node-fetch");

// Konfigurasi Telegram
const TELEGRAM_BOT_TOKEN = "8490105100:AAGbLVP4o7IZapzg3-aLzmZmlft61mYaas4";
const TELEGRAM_CHAT_ID = "5995543569";

async function sendTelegram(message) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown"
      })
    });
  } catch (e) {
    console.error("[Telegram Error]", e.message);
  }
}

module.exports = {
  name: "Install Tema Nebula",
  desc: "Menginstall tema Nebula Pterodactyl di VPS melalui SSH",
  category: "Install Panel",
  path: "/installpanel/installnebula?apikey=&ip=&password=",

  async run(req, res) {
    const { apikey, ip, password } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(403).json({ status: false, error: "Apikey invalid" });
    }
    if (!ip || !password) {
      return res.status(400).json({ status: false, error: "Parameter ip & password wajib diisi" });
    }

    const connSettings = { host: ip, port: 22, username: "root", password };
    const command = `bash <(curl -s https://raw.githubusercontent.com/KiwamiXq1031/installer-premium/refs/heads/main/zero.sh)`;
    const conn = new Client();

    const animasi = [
      "🎨 Menyiapkan pemasangan tema Nebula...",
      "🪶 Mengunduh file tema...",
      "⚙️ Menginstall depend yang diperlukan...",
      "🔧 Menerapkan tema pada panel...",
      "💫 Menyelesaikan proses instalasi..."
    ];
    let i = 0;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    const send = (msg) => {
      console.log(msg);
      res.write(msg + "\n");
    };

    const animInterval = setInterval(() => {
      if (i < animasi.length) {
        send(animasi[i]);
        i++;
      } else {
        clearInterval(animInterval);
      }
    }, 4000);

    try {
      conn.on("ready", () => {
        send(`🚀 [SSH] Terhubung ke ${ip} — memulai instalasi tema Nebula...\n`);

        conn.exec(command, (err, stream) => {
          if (err) {
            clearInterval(animInterval);
            send("❌ Gagal menjalankan perintah SSH");
            sendTelegram(`❌ Gagal menjalankan instalasi tema Nebula di VPS ${ip}\nError: ${err.message}`);
            return res.end();
          }

          stream.on("data", async (data) => {
            const log = data.toString();
            console.log(`[SSH ${ip}] ${log}`);

            if (log.includes("Masukkan pilihan:")) stream.write("2\n");
            if (log.includes("Tekan Enter")) stream.write("\n");
          });

          stream.on("close", () => {
            clearInterval(animInterval);
            send("✅ Tema Nebula berhasil diinstal pada panel kamu!\n");
            sendTelegram(`✅ Tema Nebula berhasil diinstal di VPS ${ip}`);
            conn.end();
            res.end("Selesai ✅\n");
          });

          stream.stderr.on("data", (data) => {
            send("[⚠️ STDERR] " + data.toString());
          });
        });
      });

      conn.on("error", (err) => {
        clearInterval(animInterval);
        console.error("[SSH ERROR]", err);
        send("❌ Gagal terhubung ke VPS! Cek IP / Password kamu.");
        sendTelegram(`❌ Gagal koneksi SSH ke VPS ${ip}\nError: ${err.message}`);
        res.end();
      });

      conn.connect(connSettings);

    } catch (error) {
      clearInterval(animInterval);
      console.error("Error:", error);
      sendTelegram(`❌ Error tak terduga saat instalasi tema Nebula di VPS ${ip}\n${error.message}`);
      res.status(500).json({ status: false, error: error.message });
    }
  }
};
