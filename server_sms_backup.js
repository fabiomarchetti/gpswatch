/**
 * 📱 SERVER SMS BACKUP PER GPS WATCH
 *
 * Versione semplificata per emergenze e backup solo.
 * Dati principali arrivano via TCP (server.js)
 */

const express = require("express");
const twilio = require("twilio");
const { Pool } = require("pg");
const bodyParser = require("body-parser");

// ---------------------------------------------------
// 1. CONFIGURAZIONE MINIMA
// ---------------------------------------------------
const app = express();

// Configurazione Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "your_account_sid";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "your_auth_token";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+393123456789";

// Configurazione Orologio
const WATCH_PHONE_NUMBER = process.env.WATCH_PHONE_NUMBER || "+393987654321";
const WATCH_PASSWORD = process.env.WATCH_PASSWORD || "123456";

// Database
const pool = new Pool({
  host: "localhost",
  database: "gpswatch",
  user: "gpsuser",
  password: "GpsWatch2025!",
  port: 5432,
});

// Client Twilio
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ---------------------------------------------------
// 2. COMANDI EMERGENZA
// ---------------------------------------------------
const EMERGENCY_COMMANDS = {
  position: `pw,${WATCH_PASSWORD},ts#`,
  battery: `pw,${WATCH_PASSWORD},bat#`,
  sos: `pw,${WATCH_PASSWORD},sos#`,
  reboot: `pw,${WATCH_PASSWORD},reboot#`,
  status: `pw,${WATCH_PASSWORD},status#`,
};

// ---------------------------------------------------
// 3. FUNZIONI MINIME
// ---------------------------------------------------

/**
 * 📤 Invia comando di emergenza
 */
async function sendEmergencyCommand(commandType) {
  try {
    const command = EMERGENCY_COMMANDS[commandType];
    if (!command) {
      throw new Error(`Comando non valido: ${commandType}`);
    }

    console.log(
      `\n🚨 INVIATA EMERGENZA [${commandType.toUpperCase()}]: ${command}`
    );
    console.log(`📱 A: ${WATCH_PHONE_NUMBER}`);

    const message = await twilioClient.messages.create({
      body: command,
      from: TWILIO_PHONE_NUMBER,
      to: WATCH_PHONE_NUMBER,
    });

    // Salva log emergenza
    await pool.query(
      `INSERT INTO sms_emergency (command_type, message_sid, timestamp) 
       VALUES ($1, $2, NOW())`,
      [commandType, message.sid]
    );

    console.log(`✅ Emergenza inviata! SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(`❌ Errore emergenza:`, error.message);
    return null;
  }
}

/**
 * 🔍 Analizza risposta SMS
 */
function parseEmergencyResponse(smsBody) {
  const data = {
    timestamp: new Date(),
    raw: smsBody,
    parsed: {},
  };

  // Pattern posizione
  const posMatch = smsBody.match(/lat:([\d.-]+),lng:([\d.-]+)/i);
  if (posMatch) {
    data.parsed.position = {
      latitude: parseFloat(posMatch[1]),
      longitude: parseFloat(posMatch[2]),
    };
  }

  // Pattern batteria
  const batMatch = smsBody.match(/bat(?:tery)?:(\d+)%?/i);
  if (batMatch) {
    data.parsed.battery = parseInt(batMatch[1]);
  }

  // Pattern stato
  const statusMatch = smsBody.match(/signal:(\d+)/i);
  if (statusMatch) {
    data.parsed.signal = parseInt(statusMatch[1]);
  }

  return data;
}

/**
 * 💾 Salva risposta emergenza
 */
async function saveEmergencyResponse(responseData) {
  try {
    await pool.query(
      `INSERT INTO sms_emergency (command_type, response_data, timestamp) 
       VALUES ($1, $2, NOW())`,
      ["response", JSON.stringify(responseData)]
    );

    console.log(`💾 Risposta emergenza salvata`);
  } catch (error) {
    console.error(`❌ Errore salvataggio risposta:`, error.message);
  }
}

// ---------------------------------------------------
// 4. ENDPOINTS MINIMI
// ---------------------------------------------------

/**
 * 📥 Webhook per SMS emergenza
 */
app.post("/sms/webhook", async (req, res) => {
  try {
    const { From, Body, MessageSid } = req.body;

    console.log(`\n📥 SMS EMERGENZA RICEVUTO!`);
    console.log(`📱 Da: ${From}`);
    console.log(`📋 Messaggio: ${Body}`);
    console.log(`🆔 SID: ${MessageSid}`);

    // Salva log SMS
    await pool.query(
      `INSERT INTO sms_logs (message_sid, from_number, to_number, body, direction, timestamp) 
       VALUES ($1, $2, $3, $4, 'inbound', NOW())`,
      [MessageSid, From, TWILIO_PHONE_NUMBER, Body]
    );

    // Analizza risposta
    const responseData = parseEmergencyResponse(Body);
    if (Object.keys(responseData.parsed).length > 0) {
      await saveEmergencyResponse(responseData);
      console.log(`🔍 Dati emergenza:`, responseData.parsed);
    }

    // Salva risposta completa
    const fs = require("fs");
    const logEntry = `${new Date().toISOString()}: EMERGENCY - ${From} -> ${Body}\n`;
    fs.appendFileSync("emergency_sms.log", logEntry);

    res.status(200).send("OK");
  } catch (error) {
    console.error(`❌ Errore webhook emergenza:`, error.message);
    res.status(500).send("Error");
  }
});

/**
 * 🚨 Endpoint per inviare emergenza
 */
app.post("/emergency/:type", async (req, res) => {
  try {
    const { type } = req.params;

    if (!EMERGENCY_COMMANDS[type]) {
      return res.status(400).json({
        error: "Comando non valido",
        commands: Object.keys(EMERGENCY_COMMANDS),
      });
    }

    const result = await sendEmergencyCommand(type);

    if (result) {
      res.json({
        success: true,
        messageSid: result.sid,
        command: EMERGENCY_COMMANDS[type],
      });
    } else {
      res.status(500).json({ error: "Errore invio emergenza" });
    }
  } catch (error) {
    console.error(`❌ Errore endpoint emergenza:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📊 Status server emergenza
 */
app.get("/status", (req, res) => {
  res.json({
    status: "SMS BACKUP SERVER",
    mode: "emergency_only",
    watch_phone: WATCH_PHONE_NUMBER,
    twilio_phone: TWILIO_PHONE_NUMBER,
    available_commands: Object.keys(EMERGENCY_COMMANDS),
    timestamp: new Date().toISOString(),
  });
});

/**
 * 📋 Logs emergenza recenti
 */
app.get("/emergency-logs", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(
      `SELECT * FROM sms_emergency 
       ORDER BY timestamp DESC 
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(`❌ Errore recupero logs:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------
// 5. INIZIALIZZAZIONE MINIMA
// ---------------------------------------------------

/**
 * 🗄️ Crea tabelle minime
 */
async function initializeDatabase() {
  try {
    console.log("🗄️ Inizializzazione database SMS backup...");

    // Tabella logs SMS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id SERIAL PRIMARY KEY,
        message_sid VARCHAR(100) UNIQUE,
        from_number VARCHAR(20),
        to_number VARCHAR(20),
        body TEXT,
        direction VARCHAR(10),
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);

    // Tabella emergenze
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sms_emergency (
        id SERIAL PRIMARY KEY,
        command_type VARCHAR(20),
        message_sid VARCHAR(100),
        response_data TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("✅ Database SMS backup inizializzato");
  } catch (error) {
    console.error("❌ Errore inizializzazione database:", error.message);
  }
}

/**
 * 🚀 Avvio server emergenza
 */
async function startServer() {
  const PORT = process.env.PORT || 3001; // Porta diversa da server principale

  await initializeDatabase();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║   📱 SMS BACKUP SERVER - EMERGENZA ONLY             ║
║   Porta: ${PORT}                                        ║
║   Orologio: ${WATCH_PHONE_NUMBER}                      ║
║   Twilio: ${TWILIO_PHONE_NUMBER}                       ║
║   Modalità: SOLO EMERGENZE                           ║
╚══════════════════════════════════════════════════════╝
    `);

    console.log("🚨 Comandi emergenza disponibili:");
    Object.keys(EMERGENCY_COMMANDS).forEach((cmd) => {
      console.log(`   /emergency/${cmd} - ${EMERGENCY_COMMANDS[cmd]}`);
    });
  });
}

// Avvia il server
startServer().catch(console.error);

module.exports = {
  app,
  sendEmergencyCommand,
  EMERGENCY_COMMANDS,
};
