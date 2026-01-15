const express = require("express");
const twilio = require("twilio");
const { Pool } = require("pg");
const bodyParser = require("body-parser");

// ---------------------------------------------------
// 1. CONFIGURAZIONE
// ---------------------------------------------------
const app = express();

// Configurazione Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "your_account_sid";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "your_auth_token";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+393123456789";

// Configurazione Orologio
const WATCH_PHONE_NUMBER = process.env.WATCH_PHONE_NUMBER || "+393987654321";
const WATCH_PASSWORD = process.env.WATCH_PASSWORD || "123456";

// Configurazione Database
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
// 2. FUNZIONI DI SUPPORTO
// ---------------------------------------------------

/**
 * 📤 Invia comando SMS all'orologio
 */
async function sendSMSCommand(command, description = "") {
  try {
    console.log(`\n📤 Invio SMS: ${description}`);
    console.log(`📱 Comando: ${command}`);
    console.log(`📞 A: ${WATCH_PHONE_NUMBER}`);

    const message = await twilioClient.messages.create({
      body: command,
      from: TWILIO_PHONE_NUMBER,
      to: WATCH_PHONE_NUMBER,
    });

    // Salva log SMS uscente
    await pool.query(
      `INSERT INTO sms_logs (message_sid, from_number, to_number, body, direction, status) 
       VALUES ($1, $2, $3, $4, 'outbound', 'sent')`,
      [message.sid, TWILIO_PHONE_NUMBER, WATCH_PHONE_NUMBER, command]
    );

    console.log(`✅ SMS inviato! SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(`❌ Errore invio SMS:`, error.message);
    return null;
  }
}

/**
 * 🔍 Analizza risposta SMS dell'orologio
 */
function parseSMSResponse(smsBody) {
  const data = {
    timestamp: new Date(),
    raw: smsBody,
    parsed: {},
  };

  // Pattern per posizione
  const posMatch = smsBody.match(/lat:([\d.-]+),lng:([\d.-]+)/i);
  if (posMatch) {
    data.parsed.position = {
      latitude: parseFloat(posMatch[1]),
      longitude: parseFloat(posMatch[2]),
    };
  }

  // Pattern per data/ora
  const timeMatch = smsBody.match(/time:([\d\s:-]+)/i);
  if (timeMatch) {
    data.parsed.time = timeMatch[1];
  }

  // Pattern per dati salute
  const healthPatterns = {
    heartRate: /hr:(\d+)/i,
    bloodPressure: /bp:(\d+\/\d+)/i,
    spO2: /spo2:(\d+)/i,
    temperature: /temp:([\d.]+)/i,
    battery: /bat(?:tery)?:(\d+)%?/i,
    imei: /imei:(\d+)/i,
    signal: /signal:(\d+)/i,
    gps: /gps:(\w+)/i,
    charging: /charging:(\w+)/i,
  };

  for (const [param, pattern] of Object.entries(healthPatterns)) {
    const match = smsBody.match(pattern);
    if (match) {
      data.parsed[param] = match[1];
    }
  }

  return data;
}

/**
 * 💾 Salva dati salute nel database
 */
async function saveHealthData(parsedData) {
  try {
    const { heartRate, bloodPressure, spO2, temperature, battery } = parsedData;

    // Parse blood pressure se presente
    let systolic = null,
      diastolic = null;
    if (bloodPressure) {
      const bpParts = bloodPressure.split("/");
      systolic = parseInt(bpParts[0]) || null;
      diastolic = parseInt(bpParts[1]) || null;
    }

    await pool.query(
      `INSERT INTO health_data_sms 
       (watch_phone, heart_rate, systolic_bp, diastolic_bp, spo2, temperature, battery, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        WATCH_PHONE_NUMBER,
        heartRate ? parseInt(heartRate) : null,
        systolic,
        diastolic,
        spO2 ? parseInt(spO2) : null,
        temperature ? parseFloat(temperature) : null,
        battery ? parseInt(battery) : null,
      ]
    );

    console.log(`💾 Dati salute salvati nel database`);
  } catch (error) {
    console.error(`❌ Errore salvataggio dati salute:`, error.message);
  }
}

/**
 * 📊 Salva posizione nel database
 */
async function savePositionData(parsedData) {
  try {
    const { position, time } = parsedData;

    if (position) {
      await pool.query(
        `INSERT INTO locations_sms 
         (watch_phone, latitude, longitude, timestamp, recorded_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [WATCH_PHONE_NUMBER, position.latitude, position.longitude, time]
      );

      console.log(
        `📍 Posizione salvata: ${position.latitude}, ${position.longitude}`
      );
    }
  } catch (error) {
    console.error(`❌ Errore salvataggio posizione:`, error.message);
  }
}

// ---------------------------------------------------
// 3. ENDPOINTS API
// ---------------------------------------------------

/**
 * 📥 Webhook per ricevere SMS dall'orologio
 */
app.post("/sms/webhook", async (req, res) => {
  try {
    const { From, Body, MessageSid } = req.body;

    console.log(`\n📥 SMS RICEVUTO!`);
    console.log(`📱 Da: ${From}`);
    console.log(`📋 Messaggio: ${Body}`);
    console.log(`🆔 SID: ${MessageSid}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

    // Salva log SMS in entrata
    await pool.query(
      `INSERT INTO sms_logs (message_sid, from_number, to_number, body, direction, status) 
       VALUES ($1, $2, $3, $4, 'inbound', 'received')`,
      [MessageSid, From, TWILIO_PHONE_NUMBER, Body]
    );

    // Analizza risposta
    const parsedData = parseSMSResponse(Body);
    console.log(`🔍 Dati parsati:`, JSON.stringify(parsedData.parsed, null, 2));

    // Salva dati nel database
    if (Object.keys(parsedData.parsed).length > 0) {
      await saveHealthData(parsedData.parsed);
      await savePositionData(parsedData.parsed);
    }

    // Salva risposta completa per analisi
    const fs = require("fs");
    const logEntry = `${new Date().toISOString()}: ${From} -> ${Body}\n`;
    fs.appendFileSync("sms_responses.log", logEntry);

    res.status(200).send("OK");
  } catch (error) {
    console.error(`❌ Errore webhook SMS:`, error.message);
    res.status(500).send("Error");
  }
});

/**
 * 📤 Endpoint per inviare comandi SMS
 */
app.post("/sms/send", async (req, res) => {
  try {
    const { command, description } = req.body;

    if (!command) {
      return res.status(400).json({ error: "Comando richiesto" });
    }

    const result = await sendSMSCommand(command, description);

    if (result) {
      res.json({
        success: true,
        messageSid: result.sid,
        command: command,
      });
    } else {
      res.status(500).json({ error: "Errore invio SMS" });
    }
  } catch (error) {
    console.error(`❌ Errore endpoint send:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📊 Endpoint per ottenere dati recenti
 */
app.get("/api/health-data", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(
      `SELECT * FROM health_data_sms 
       WHERE watch_phone = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [WATCH_PHONE_NUMBER, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(`❌ Errore recupero dati:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📍 Endpoint per ottenere posizioni recenti
 */
app.get("/api/positions", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(
      `SELECT * FROM locations_sms 
       WHERE watch_phone = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [WATCH_PHONE_NUMBER, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(`❌ Errore recupero posizioni:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📋 Endpoint per logs SMS
 */
app.get("/api/sms-logs", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const result = await pool.query(
      `SELECT * FROM sms_logs 
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
// 4. COMANDI AUTOMATICI
// ---------------------------------------------------

/**
 * ⏰ Richiesta dati salute automatica
 */
async function requestHealthData() {
  const command = `pw,${WATCH_PASSWORD},health#`;
  await sendSMSCommand(command, "Richiesta dati salute");
}

/**
 * 📍 Richiesta posizione automatica
 */
async function requestPosition() {
  const command = `pw,${WATCH_PASSWORD},ts#`;
  await sendSMSCommand(command, "Richiesta posizione");
}

/**
 * 🔋 Richiesta stato batteria
 */
async function requestBattery() {
  const command = `pw,${WATCH_PASSWORD},bat#`;
  await sendSMSCommand(command, "Richiesta stato batteria");
}

// ---------------------------------------------------
// 5. INIZIALIZZAZIONE
// ---------------------------------------------------

/**
 * 🗄️ Crea tabelle database se non esistono
 */
async function initializeDatabase() {
  try {
    console.log("🗄️ Inizializzazione database...");

    // Tabella logs SMS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id SERIAL PRIMARY KEY,
        message_sid VARCHAR(100) UNIQUE,
        from_number VARCHAR(20),
        to_number VARCHAR(20),
        body TEXT,
        direction VARCHAR(10),
        status VARCHAR(20),
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);

    // Tabella dati salute SMS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS health_data_sms (
        id SERIAL PRIMARY KEY,
        watch_phone VARCHAR(20),
        heart_rate INTEGER,
        systolic_bp INTEGER,
        diastolic_bp INTEGER,
        spo2 INTEGER,
        temperature DECIMAL(4,1),
        battery INTEGER,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);

    // Tabella posizioni SMS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS locations_sms (
        id SERIAL PRIMARY KEY,
        watch_phone VARCHAR(20),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        timestamp VARCHAR(50),
        recorded_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("✅ Database inizializzato");
  } catch (error) {
    console.error("❌ Errore inizializzazione database:", error.message);
  }
}

/**
 * 🚀 Avvio server
 */
async function startServer() {
  const PORT = process.env.PORT || 3000;

  // Inizializza database
  await initializeDatabase();

  // Avvia server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║   📱 SERVER SMS GPS WATCH                            ║
║   Porta: ${PORT}                                       ║
║   Webhook: /sms/webhook                              ║
║   Orologio: ${WATCH_PHONE_NUMBER}                      ║
║   Twilio: ${TWILIO_PHONE_NUMBER}                       ║
╚══════════════════════════════════════════════════════╝
    `);

    // Imposta timer per richieste automatiche
    setInterval(requestHealthData, 3600000); // Ogni ora
    setInterval(requestPosition, 1800000); // Ogni 30 minuti
    setInterval(requestBattery, 7200000); // Ogni 2 ore

    console.log("⏰ Timer richieste automatiche configurati:");
    console.log("   🏥 Dati salute: ogni ora");
    console.log("   📍 Posizione: ogni 30 minuti");
    console.log("   🔋 Batteria: ogni 2 ore");
  });
}

// Avvia il server
startServer().catch(console.error);

module.exports = { app, sendSMSCommand, parseSMSResponse };
