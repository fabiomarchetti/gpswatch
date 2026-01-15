const net = require("net");
const { Pool } = require("pg");
const AQSHDecoder = require("./aqsh_decoder");

// ---------------------------------------------------
// 1. CONFIGURAZIONE DATABASE
// ---------------------------------------------------
const pool = new Pool({
  host: "localhost",
  database: "gpswatch",
  user: "gpsuser",
  password: "GpsWatch2025",
  port: 5432,
});

// Test connessione DB
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Errore connessione DB:", err.message);
  } else {
    console.log("✅ Database connesso:", res.rows[0].now);
  }
});

// ---------------------------------------------------
// 2. FUNZIONE DI SUPPORTO PER TROVARE L'IMEI
// ---------------------------------------------------
async function findOrCreateDevice(deviceId) {
  try {
    // Prima cerca se esiste per device_id o imei
    let res = await pool.query(
      "SELECT imei FROM devices WHERE device_id = $1 OR imei = $1 LIMIT 1",
      [deviceId]
    );

    if (res.rows.length > 0) {
      return res.rows[0].imei;
    }

    // Se non esiste, crealo
    await pool.query(
      "INSERT INTO devices (device_id, imei, created_at, updated_at) VALUES ($1, $1, NOW(), NOW()) ON CONFLICT (device_id) DO NOTHING",
      [deviceId]
    );
    console.log(`📱 Nuovo dispositivo registrato: ${deviceId}`);
    return deviceId;
  } catch (err) {
    console.error("Errore DB dispositivo:", err.message);
    return deviceId;
  }
}

// Mappa per tenere i socket attivi
const clients = new Map();

// Mappa per tenere i socket per device ID
const devicesByDeviceId = new Map();

// Inizializza decoder AQSH+
const aqshDecoder = new AQSHDecoder();

// ---------------------------------------------------
// 3. CREAZIONE SERVER TCP
// ---------------------------------------------------
const server = net.createServer((socket) => {
  const clientInfo = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`\n✅ CONNESSIONE da: ${clientInfo}`);

  // Imposta timeout più lungo (5 minuti)
  socket.setTimeout(300000);

  // Abilita keep-alive
  socket.setKeepAlive(true, 60000);

  // Buffer per pacchetti frammentati
  socket.buffer = "";

  socket.on("data", async (data) => {
    const timestamp = new Date().toLocaleString("it-IT");

    // LOG RAW - Mostra TUTTO quello che arriva
    console.log(`\n📨 [${timestamp}] DATI RICEVUTI da ${clientInfo}:`);
    console.log(`   📊 Lunghezza: ${data.length} bytes`);
    console.log(`   📝 Testo: ${data.toString().substring(0, 200)}`);
    console.log(`   🔢 Hex: ${data.toString("hex").substring(0, 100)}`);

    // Controlla se sono dati binari/criptati (AQSH+)
    const dataStr = data.toString();

    // Verifica se è protocollo AQSH+ criptato
    if (data[0] === 0xff && data.slice(1, 5).toString("ascii") === "AQSH") {
      console.log(`   🔐 RILEVATO PROTOCOLLO AQSH+ CRIPTATO!`);

      // Tenta decrittazione
      const hexData = data.toString("hex");
      const decryptResult = aqshDecoder.decode(hexData);

      if (decryptResult && decryptResult.fullDecrypted) {
        console.log(`   ✅ DECRITTAZIONE RIUSCITA!`);
        console.log(
          `   🔑 Metodo: ${decryptResult.algorithm || decryptResult.method}`
        );
        console.log(`   📝 Dati: ${decryptResult.decrypted}`);

        // Sostituisci i dati con quelli decrittati
        socket.buffer += decryptResult.fullDecrypted.toString();
      } else {
        console.log(`   ❌ DECRITTAZIONE FALLITA - Dati ignorati`);
        console.log(
          `   💡 Contatta il produttore per la chiave di decrittazione`
        );
        return;
      }
    }
    // Controlla se sono dati in formato standard
    else if (!dataStr.includes("[") && !dataStr.includes("*")) {
      console.log(`   ⚠️ ATTENZIONE: Dati non in formato protocollo standard!`);
      console.log(`   ⚠️ Potrebbe essere TLS/SSL o formato diverso`);
      return;
    }
    // Dati in chiaro - processa normalmente
    else {
      // Aggiungi al buffer
      socket.buffer += dataStr;
    }

    // Processa pacchetti completi
    while (socket.buffer.includes("[") && socket.buffer.includes("]")) {
      const start = socket.buffer.indexOf("[");
      const end = socket.buffer.indexOf("]") + 1;
      const packet = socket.buffer.substring(start, end);

      socket.buffer = socket.buffer.substring(end);

      console.log(`   📦 Pacchetto completo: ${packet}`);
      await processPacket(packet, socket, clientInfo);
    }
  });

  socket.on("timeout", () => {
    console.log(`⏰ Timeout per ${clientInfo}`);
  });

  socket.on("end", () => {
    console.log(`\n🔌 Client ${clientInfo} ha chiuso la connessione`);
  });

  socket.on("close", () => {
    console.log(`❌ DISCONNESSO: ${clientInfo}`);

    // Rimuovi socket dalle mappe
    // Cerca quale deviceId era associato a questo socket
    for (const [deviceId, sock] of devicesByDeviceId.entries()) {
      if (sock === socket) {
        devicesByDeviceId.delete(deviceId);
        console.log(`   🗑️  Dispositivo ${deviceId} rimosso dalla mappa`);
        break;
      }
    }
  });

  socket.on("error", (err) => {
    console.error(`⚠️ ERRORE Socket ${clientInfo}:`, err.message);
  });
});

// ---------------------------------------------------
// 4. ELABORAZIONE PACCHETTI
// ---------------------------------------------------
async function processPacket(packet, socket, clientInfo) {
  try {
    if (!packet.startsWith("[") || !packet.endsWith("]")) {
      console.log(`   ⚠️ Pacchetto malformato: ${packet}`);
      return;
    }

    // Pulisce e divide: PROTOCOL*DEVICEID*LEN*COMMAND,args...
    const cleanMsg = packet.slice(1, -1);
    const parts = cleanMsg.split("*");

    if (parts.length < 4) {
      console.log(`   ⚠️ Pacchetto incompleto: ${cleanMsg}`);
      return;
    }

    const protocol = parts[0]; // Es. '3G', '4G', 'LTE'
    const deviceId = parts[1]; // IMEI o Registration Code
    const contentLen = parts[2]; // Lunghezza contenuto (hex)
    const content = parts.slice(3).join("*"); // Tutto il resto
    const args = content.split(",");
    const command = args[0];

    console.log(`   ├── Protocollo: ${protocol}`);
    console.log(`   ├── Device ID: ${deviceId}`);
    console.log(`   ├── Comando: ${command}`);
    console.log(`   └── Dati: ${args.slice(1).join(", ").substring(0, 100)}`);

    // Salva il socket nella mappa (per IP)
    clients.set(deviceId, socket);

    // Salva il socket per device ID (per invio comandi)
    devicesByDeviceId.set(deviceId, socket);

    console.log(
      `   📱 Dispositivo ${deviceId} connesso e registrato per invio comandi`
    );

    // --- COMANDO LK (Heartbeat) ---
    if (command === "LK") {
      // Risposta IMMEDIATA per mantenere connessione
      const response = `[${protocol}*${deviceId}*0002*LK]`;
      socket.write(response);
      console.log(`   📤 RISPOSTA: ${response}`);

      // Dati heartbeat: steps, rolls, battery
      const steps = args[1] || "0";
      const rolls = args[2] || "0";
      const battery = args[3] || "0";
      console.log(
        `   💓 Heartbeat - Passi: ${steps}, Rolls: ${rolls}, Batteria: ${battery}%`
      );

      // Aggiorna DB
      const realImei = await findOrCreateDevice(deviceId);
      console.log(`🔄 Aggiornamento dispositivo: ${realImei}`);
      const updateResult = await pool.query(
        "UPDATE devices SET updated_at = NOW() WHERE imei = $1",
        [realImei]
      );
      console.log(
        `✅ Dispositivo aggiornato: ${updateResult.rowCount} righe modificate`
      );
    }

    // --- COMANDO UD / UD2 (Location Data) ---
    else if (command === "UD" || command === "UD2") {
      console.log(`   🗺️ Dati posizione ricevuti`);

      const realImei = await findOrCreateDevice(deviceId);

      // Parsing secondo protocollo V3.2:
      // UD,date,time,valid,lat,N/S,lon,E/W,speed,direction,altitude,satellites,gsm,battery,steps,rolls,status,...
      const date = args[1] || "";
      const time = args[2] || "";
      const valid = args[3] || "V";
      const lat = parseFloat(args[4]) || 0;
      const latDir = args[5] || "N";
      const lon = parseFloat(args[6]) || 0;
      const lonDir = args[7] || "E";
      const speed = parseFloat(args[8]) || 0;
      const direction = parseFloat(args[9]) || 0;
      const altitude = parseFloat(args[10]) || 0;
      const satellites = parseInt(args[11]) || 0;
      const gsm = parseInt(args[12]) || 0;
      const battery = parseInt(args[13]) || 0;

      // Converti lat/lon con direzione
      const finalLat = latDir === "S" ? -lat : lat;
      const finalLon = lonDir === "W" ? -lon : lon;

      console.log(
        `   📍 Posizione: ${finalLat}, ${finalLon} (Valid: ${valid})`
      );
      console.log(
        `   🔋 Batteria: ${battery}% | 📡 Satelliti: ${satellites} | 📶 GSM: ${gsm}`
      );

      // Salva in DB
      await pool.query(
        `
        INSERT INTO locations (imei, latitude, longitude, altitude, speed, battery, satellites, gsm_signal, gps_valid, recorded_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `,
        [
          realImei,
          finalLat,
          finalLon,
          altitude,
          speed,
          battery,
          satellites,
          gsm,
          valid === "A",
        ]
      );

      console.log(`   💾 Posizione salvata nel database`);
    }

    // --- COMANDO AL (Allarmi) ---
    else if (command === "AL") {
      const response = `[${protocol}*${deviceId}*0002*AL]`;
      socket.write(response);
      console.log(`   📤 RISPOSTA ALLARME: ${response}`);

      const realImei = await findOrCreateDevice(deviceId);

      // Parsing allarme
      const lat = parseFloat(args[4]) || 0;
      const lon = parseFloat(args[6]) || 0;

      await pool.query(
        `
        INSERT INTO alarms (imei, alarm_type, latitude, longitude, recorded_at)
        VALUES ($1, $2, $3, $4, NOW())
      `,
        [realImei, "SOS", lat, lon]
      );

      console.log(`   🚨 ALLARME SOS salvato! Posizione: ${lat}, ${lon}`);
    }

    // --- COMANDO bphrt (Pressione e Battito) ---
    else if (command === "bphrt") {
      const realImei = await findOrCreateDevice(deviceId);

      // args: bphrt,systolic,diastolic,heart_rate
      const systolic = parseInt(args[1]) || 0;
      const diastolic = parseInt(args[2]) || 0;
      const heartRate = parseInt(args[3]) || 0;

      if (heartRate > 0 || systolic > 0) {
        await pool.query(
          `
          INSERT INTO health_data (imei, heart_rate, systolic_bp, diastolic_bp, recorded_at)
          VALUES ($1, $2, $3, $4, NOW())
        `,
          [realImei, heartRate, systolic, diastolic]
        );

        console.log(
          `   ❤️ Salute: Pressione ${systolic}/${diastolic}, Battito ${heartRate} bpm`
        );
      }
    }

    // --- COMANDO oxygen (SpO2) ---
    else if (command === "oxygen") {
      const realImei = await findOrCreateDevice(deviceId);
      const spo2 = parseInt(args[1]) || parseInt(args[2]) || 0;

      if (spo2 > 0) {
        await pool.query(
          `
          INSERT INTO health_data (imei, spo2, recorded_at)
          VALUES ($1, $2, NOW())
        `,
          [realImei, spo2]
        );

        console.log(`   🫁 SpO2: ${spo2}%`);
      }
    }

    // --- COMANDO btemp2 (Temperatura) ---
    else if (command === "btemp2") {
      const realImei = await findOrCreateDevice(deviceId);
      const mode = args[1] || "0";
      const temp = parseFloat(args[2]) || 0;

      if (temp > 0) {
        await pool.query(
          `
          INSERT INTO health_data (imei, temperature, temperature_mode, recorded_at)
          VALUES ($1, $2, $3, NOW())
        `,
          [realImei, temp, mode]
        );

        console.log(`   🌡️ Temperatura: ${temp}°C (Mode: ${mode})`);
      }
    }

    // --- COMANDO CONFIG ---
    else if (command === "CONFIG") {
      const realImei = await findOrCreateDevice(deviceId);

      // Parse configurazione
      const configData = {};
      args.forEach((arg) => {
        if (arg.includes(":")) {
          const [key, value] = arg.split(":");
          configData[key] = value;
        }
      });

      console.log(`   ⚙️ Configurazione dispositivo:`);
      console.log(`      📱 Tipo: ${configData.TY}`);
      console.log(`      ⏱️ Upload: ${configData.UL}ms`);
      console.log(`      ❤️ HR: ${configData.HR}`);
      console.log(`      🌡️ TB: ${configData.TB}`);
      console.log(`      🔋 BT: ${configData.BT}`);
      console.log(`      📶 TM: ${configData.TM}`);

      // Salva configurazione nel database
      await pool.query(
        `INSERT INTO device_config (imei, config_data, timestamp)
         VALUES ($1, $2, NOW())`,
        [realImei, JSON.stringify(configData)]
      );
    }

    // --- COMANDO ICCID ---
    else if (command === "ICCID") {
      const realImei = await findOrCreateDevice(deviceId);

      // Parse dati SIM
      const iccid = args[1] || "";
      const imei = args[2] || "";
      const operator = args[3] || "Unknown";

      console.log(`   📞 Informazioni SIM:`);
      console.log(`      📋 ICCID: ${iccid}`);
      console.log(`      📱 IMEI: ${imei}`);
      console.log(`      📡 Operatore: ${operator}`);

      // Salva informazioni SIM
      await pool.query(
        `UPDATE devices
         SET iccid = $1, updated_at = NOW()
         WHERE imei = $2`,
        [iccid, realImei]
      );
    }

    // --- COMANDO RYIMEI ---
    else if (command === "RYIMEI") {
      const realImei = await findOrCreateDevice(deviceId);
      const receivedImei = args[1] || "";

      console.log(`   🆔 Conferma IMEI: ${receivedImei}`);

      // Aggiorna database con conferma IMEI
      await pool.query(
        `UPDATE devices
         SET updated_at = NOW()
         WHERE imei = $1`,
        [realImei]
      );
    }

    // --- COMANDO APPANDFNREPORT ---
    else if (command === "APPANDFNREPORT") {
      const realImei = await findOrCreateDevice(deviceId);

      console.log(`   📱 Report funzioni app:`);

      // Parse funzioni abilitate
      const functions = {};
      let currentFunc = null;

      args.forEach((arg, index) => {
        if (index === 0) return; // Skip first number

        if (/^\d{2}$/.test(arg)) {
          currentFunc = arg;
        } else if (currentFunc && arg.length > 0) {
          // Converti hex Unicode a testo
          try {
            const hexText = arg.replace(/00/g, "");
            const decodedText = Buffer.from(hexText, "hex").toString("utf16le");
            functions[currentFunc] = decodedText;
            console.log(`      ${currentFunc}: ${decodedText}`);
          } catch (e) {
            functions[currentFunc] = arg;
            console.log(`      ${currentFunc}: ${arg}`);
          }
        }
      });

      // Salva funzioni nel database
      await pool.query(
        `INSERT INTO device_functions (imei, functions_data, timestamp)
         VALUES ($1, $2, NOW())`,
        [realImei, JSON.stringify(functions)]
      );

      // Controlla funzioni sanitarie
      const healthFunctions = ["hb15", "te16", "ox35", "sp14"];
      const enabledHealth = healthFunctions.filter((func) => functions[func]);

      if (enabledHealth.length > 0) {
        console.log(
          `   🏥 Funzioni sanitarie abilitate: ${enabledHealth.join(", ")}`
        );

        // Aggiorna stato funzioni sanitarie
        await pool.query(
          `UPDATE devices
           SET updated_at = NOW()
           WHERE imei = $1`,
          [realImei]
        );
      }
    }

    // --- COMANDO SMSREMINDSTATUSINFO ---
    else if (command === "SMSREMINDSTATUSINFO") {
      const realImei = await findOrCreateDevice(deviceId);

      console.log(`   📱 Status reminder SMS`);

      // Salva status reminder
      await pool.query(
        `INSERT INTO sms_reminder_status (imei, status_data, timestamp)
         VALUES ($1, $2, NOW())`,
        [realImei, args.join(",")]
      );
    }

    // --- ALTRI COMANDI ---
    else {
      console.log(`   ℹ️ Comando non gestito: ${command}`);
      console.log(`   📋 Dati completi: ${args.join(", ")}`);

      // Salva comandi non gestiti per analisi futura
      await pool.query(
        `INSERT INTO unknown_commands (imei, command, data, timestamp)
         VALUES ($1, $2, $3, NOW())`,
        [deviceId, command, args.join(",")]
      );
    }
  } catch (err) {
    console.error(`   ❌ Errore elaborazione:`, err.message);
  }
}

// ---------------------------------------------------
// 5. FUNZIONE PER INVIARE COMANDI TCP
// ---------------------------------------------------
/**
 * Invia un comando TCP a un dispositivo connesso
 * @param {string} deviceId - ID dispositivo (IMEI o Registration Code)
 * @param {string} command - Comando da inviare (es. "CR", "LK", "UD")
 * @param {string} protocol - Protocollo da usare (default "3G")
 * @returns {Object} - { success: boolean, message: string }
 */
function sendTCPCommand(deviceId, command, protocol = "3G") {
  return new Promise((resolve, reject) => {
    const socket = devicesByDeviceId.get(deviceId);

    if (!socket) {
      return resolve({
        success: false,
        message: `Dispositivo ${deviceId} non connesso`,
      });
    }

    if (socket.destroyed || !socket.writable) {
      return resolve({
        success: false,
        message: `Connessione al dispositivo ${deviceId} non valida`,
      });
    }

    // Costruisci pacchetto comando
    // Format: [3G*ID*LEN*COMMAND]
    const content = command;
    const contentLen = Buffer.byteLength(content, "utf8")
      .toString(16)
      .toUpperCase()
      .padStart(4, "0");
    const packet = `[${protocol}*${deviceId}*${contentLen}*${content}]`;

    console.log(`📤 Invio comando TCP a ${deviceId}: ${packet}`);

    // Invia comando
    socket.write(packet, (error) => {
      if (error) {
        console.error(`❌ Errore invio comando: ${error.message}`);
        resolve({
          success: false,
          message: `Errore invio: ${error.message}`,
        });
      } else {
        console.log(`✅ Comando inviato con successo a ${deviceId}`);
        resolve({
          success: true,
          message: `Comando inviato a ${deviceId}`,
        });
      }
    });

    // Timeout risposta (30 secondi)
    setTimeout(() => {
      resolve({
        success: false,
        message: `Timeout attesa risposta da ${deviceId}`,
      });
    }, 30000);
  });
}

/**
 * API HTTP per inviare comandi TCP
 * Aggiunge endpoint HTTP al server TCP esistente
 */
const http = require("http");
const httpServer = http.createServer((req, res) => {
  // Abilita CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/api/tcp/send") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const { deviceId, command, protocol } = data;

        if (!deviceId || !command) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: "Device ID e comando sono obbligatori",
            })
          );
          return;
        }

        const result = await sendTCPCommand(deviceId, command, protocol);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error("Errore elaborazione richiesta HTTP:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: error.message,
          })
        );
      }
    });
  } else if (req.method === "GET" && req.url === "/api/tcp/status") {
    // Ritorna stato connessioni
    const status = {
      totalConnections: devicesByDeviceId.size,
      connectedDevices: Array.from(devicesByDeviceId.keys()),
      timestamp: new Date().toISOString(),
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(status));
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint non trovato" }));
  }
});

// Avvia server HTTP su porta 3000 (diversa da TCP)
const HTTP_PORT = 3000;
httpServer.listen(HTTP_PORT, "0.0.0.0", () => {
  console.log(`\n🌐 Server HTTP in ascolto su porta ${HTTP_PORT}`);
  console.log(
    `📡 Endpoint invio comandi TCP: http://0.0.0.0:${HTTP_PORT}/api/tcp/send`
  );
  console.log(
    `📡 Endpoint stato connessioni: http://0.0.0.0:${HTTP_PORT}/api/tcp/status`
  );
});

// ---------------------------------------------------
// 6. AVVIO DEL SERVER
// ---------------------------------------------------
const PORT = 8001;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server in ascolto su tutte le intefaccie, porta ${PORT}
╔══════════════════════════════════════════════════════╗
║   🛰️  SERVER GPS WATCH - DEBUG MODE                  ║
║   IP: 91.99.141.225                                  ║
║   Porta: ${PORT}                                        ║
║   Database: gpswatch (PostgreSQL)                    ║
║   In attesa connessioni...                           ║
╚══════════════════════════════════════════════════════╝
  `);
});
