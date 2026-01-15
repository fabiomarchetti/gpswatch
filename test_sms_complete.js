#!/usr/bin/env node

/**
 * 🧪 TEST COMPLETO COMANDI SMS PER GPS WATCH
 *
 * Script per testare sistematicamente tutti i comandi SMS
 * e verificare le risposte dell'orologio C405_KYS_S5_V1.3_2025
 */

const twilio = require("twilio");
const readline = require("readline");
const { Pool } = require("pg");

// ---------------------------------------------------
// 1. CONFIGURAZIONE
// ---------------------------------------------------

// Configurazione Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "your_account_sid";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "your_auth_token";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+393123456789";

// Configurazione Orologio
const WATCH_PHONE_NUMBER = process.env.WATCH_PHONE_NUMBER || "+393987654321";
const WATCH_PASSWORD = process.env.WATCH_PASSWORD || "123456";

// Database per logging
const pool = new Pool({
  host: "localhost",
  database: "gpswatch",
  user: "gpsuser",
  password: "GpsWatch2025!",
  port: 5432,
});

// Client Twilio
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Interface per input utente
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ---------------------------------------------------
// 2. CATALOGO COMANDI SMS
// ---------------------------------------------------

const COMMANDS = {
  // Comandi base
  position: {
    command: `pw,${WATCH_PASSWORD},ts#`,
    description: "Richiesta posizione GPS",
    expected: "lat:45.123456,lng:9.123456,time:2024-12-24 10:30:00",
    category: "base",
  },

  health: {
    command: `pw,${WATCH_PASSWORD},health#`,
    description: "Richiesta dati sanitari completi",
    expected: "hr:72,bp:120/80,spo2:98,temp:36.5",
    category: "health",
  },

  battery: {
    command: `pw,${WATCH_PASSWORD},bat#`,
    description: "Stato batteria",
    expected: "battery:85%,charging:no",
    category: "base",
  },

  status: {
    command: `pw,${WATCH_PASSWORD},status#`,
    description: "Status generale dispositivo",
    expected: "imei:863737078055392,signal:4,gps:yes",
    category: "base",
  },

  // Comandi salute specifici
  heartrate: {
    command: `pw,${WATCH_PASSWORD},hrt#`,
    description: "Solo frequenza cardiaca",
    expected: "hr:72",
    category: "health",
  },

  bloodpressure: {
    command: `pw,${WATCH_PASSWORD},bp#`,
    description: "Solo pressione sanguigna",
    expected: "bp:120/80",
    category: "health",
  },

  oxygen: {
    command: `pw,${WATCH_PASSWORD},spo2#`,
    description: "Solo saturazione ossigeno",
    expected: "spo2:98",
    category: "health",
  },

  temperature: {
    command: `pw,${WATCH_PASSWORD},temp#`,
    description: "Solo temperatura corporea",
    expected: "temp:36.5",
    category: "health",
  },

  // Comandi alternativi
  locate: {
    command: `pw,${WATCH_PASSWORD},locate#`,
    description: "Posizione alternativa",
    expected: "lat:45.123456,lng:9.123456",
    category: "alternative",
  },

  info: {
    command: `pw,${WATCH_PASSWORD},info#`,
    description: "Informazioni dispositivo",
    expected: "model:C405,version:V1.3",
    category: "alternative",
  },

  version: {
    command: `pw,${WATCH_PASSWORD},ver#`,
    description: "Versione firmware",
    expected: "ver:V1.3_2025",
    category: "alternative",
  },

  // Comandi senza password
  simple_pos: {
    command: "ts#",
    description: "Posizione senza password",
    expected: "lat:45.123456,lng:9.123456",
    category: "simple",
  },

  simple_health: {
    command: "health#",
    description: "Salute senza password",
    expected: "hr:72,bp:120/80,spo2:98,temp:36.5",
    category: "simple",
  },

  // Comandi specifici produttore
  wonlex_health: {
    command: `pw,${WATCH_PASSWORD},bphrt#`,
    description: "Wonlex health completo",
    expected: "bp:120/80,hr:72",
    category: "manufacturer",
  },

  setracker_pos: {
    command: `pw,${WATCH_PASSWORD},cr#`,
    description: "SeTracker position",
    expected: "lat:45.123456,lng:9.123456",
    category: "manufacturer",
  },
};

// ---------------------------------------------------
// 3. FUNZIONI DI TEST
// ---------------------------------------------------

/**
 * 📤 Invia comando SMS e logga risultato
 */
async function sendCommandTest(commandName, commandData) {
  try {
    console.log(
      `\n📤 [${commandName.toUpperCase()}] ${commandData.description}`
    );
    console.log(`📱 Comando: ${commandData.command}`);
    console.log(`📞 Destinazione: ${WATCH_PHONE_NUMBER}`);
    console.log(`🎯 Atteso: ${commandData.expected}`);

    const startTime = Date.now();

    const message = await twilioClient.messages.create({
      body: commandData.command,
      from: TWILIO_PHONE_NUMBER,
      to: WATCH_PHONE_NUMBER,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Salva test nel database
    await pool.query(
      `INSERT INTO sms_test_results 
       (test_name, command, description, expected, message_sid, duration_ms, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        commandName,
        commandData.command,
        commandData.description,
        commandData.expected,
        message.sid,
        duration,
      ]
    );

    console.log(`✅ SMS inviato in ${duration}ms`);
    console.log(`🆔 Message SID: ${message.sid}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

    return {
      success: true,
      sid: message.sid,
      duration: duration,
      command: commandData.command,
    };
  } catch (error) {
    console.error(`❌ Errore invio [${commandName}]:`, error.message);

    // Salva errore nel database
    await pool.query(
      `INSERT INTO sms_test_results 
       (test_name, command, description, expected, error_message, timestamp)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        commandName,
        commandData.command,
        commandData.description,
        commandData.expected,
        error.message,
      ]
    );

    return {
      success: false,
      error: error.message,
      command: commandData.command,
    };
  }
}

/**
 * 🧪 Esegue test per categoria specifica
 */
async function testCategory(category) {
  console.log(`\n🧪 TEST CATEGORIA: ${category.toUpperCase()}`);
  console.log("=".repeat(50));

  const categoryCommands = Object.entries(COMMANDS).filter(
    ([_, data]) => data.category === category
  );

  for (const [name, data] of categoryCommands) {
    await sendCommandTest(name, data);

    // Attesa tra comandi per evitare flooding
    console.log(`⏳ Attesa 15 secondi...`);
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
}

/**
 * 🔄 Test automatico completo
 */
async function runFullTest() {
  console.log(`\n🚀 TEST AUTOMATICO COMPLETO`);
  console.log("=".repeat(50));
  console.log(`📱 Target: ${WATCH_PHONE_NUMBER}`);
  console.log(`🔐 Password: ${WATCH_PASSWORD}`);
  console.log(`📊 Comandi totali: ${Object.keys(COMMANDS).length}`);

  const categories = [
    "base",
    "health",
    "alternative",
    "simple",
    "manufacturer",
  ];

  for (const category of categories) {
    await testCategory(category);

    // Pausa più lunga tra categorie
    console.log(`\n⏳ Pausa 30 secondi prima prossima categoria...`);
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }

  console.log(`\n✅ Test completo terminato!`);
  console.log(`📊 Controlla i risultati nel database e i log SMS.`);
}

/**
 * 📋 Menu interattivo
 */
async function showMenu() {
  console.log(`\n🎮 MENU TEST SMS`);
  console.log(`==================`);
  console.log(`📱 Orologio: ${WATCH_PHONE_NUMBER}`);
  console.log(`🔐 Password: ${WATCH_PASSWORD}`);
  console.log(``);

  const categories = [
    "base",
    "health",
    "alternative",
    "simple",
    "manufacturer",
  ];

  categories.forEach((cat, index) => {
    const count = Object.values(COMMANDS).filter(
      (c) => c.category === cat
    ).length;
    console.log(`${index + 1}. Test ${cat.toUpperCase()} (${count} comandi)`);
  });

  console.log(`${categories.length + 1}. Test COMPLETO (tutte le categorie)`);
  console.log(`${categories.length + 2}. Test comando singolo`);
  console.log(`${categories.length + 3}. Mostra risultati test`);
  console.log(`${categories.length + 4}. Pulisci risultati test`);
  console.log(`0. Esci`);

  return new Promise((resolve) => {
    rl.question("\n🔢 Scegli opzione (numero): ", async (answer) => {
      const choice = parseInt(answer);

      if (choice === 0) {
        console.log("👋 Arrivederci!");
        rl.close();
        process.exit(0);
      } else if (choice >= 1 && choice <= categories.length) {
        resolve({ action: "category", category: categories[choice - 1] });
      } else if (choice === categories.length + 1) {
        resolve({ action: "full" });
      } else if (choice === categories.length + 2) {
        resolve({ action: "single" });
      } else if (choice === categories.length + 3) {
        resolve({ action: "results" });
      } else if (choice === categories.length + 4) {
        resolve({ action: "clear" });
      } else {
        console.log("❌ Scelta non valida");
        resolve({ action: "invalid" });
      }
    });
  });
}

/**
 * 📊 Mostra risultati dei test
 */
async function showResults() {
  try {
    console.log("\\n📊 RISULTATI TEST RECENTI");
    console.log("=".repeat(50));

    const result = await pool.query(
      "SELECT test_name, description, success, message_sid, error_message, " +
        "duration_ms, timestamp " +
        "FROM sms_test_results " +
        "ORDER BY timestamp DESC " +
        "LIMIT 20"
    );

    if (result.rows.length === 0) {
      console.log("📭 Nessun risultato trovato");
      return;
    }

    result.rows.forEach((row, index) => {
      console.log("\\n" + (index + 1) + ". " + row.test_name.toUpperCase());
      console.log("   📝 " + row.description);
      console.log("   ✅ Successo: " + (row.success ? "SÌ" : "NO"));
      if (row.success) {
        console.log("   🆔 SID: " + row.message_sid);
        console.log("   ⏱️  Durata: " + row.duration_ms + "ms");
      } else {
        console.log("   ❌ Errore: " + row.error_message);
      }
      console.log("   🕐 " + new Date(row.timestamp).toLocaleString("it-IT"));
    });
  } catch (error) {
    console.error("❌ Errore recupero risultati:", error.message);
  }
}

/**
 * 🗑️ Pulisce risultati test
 */
async function clearResults() {
  try {
    const result = await pool.query("DELETE FROM sms_test_results");
    console.log("🗑️ Cancellati " + result.rowCount + " risultati test");
  } catch (error) {
    console.error("❌ Errore cancellazione risultati:", error.message);
  }
}

/**
 * 🎯 Test comando singolo
 */
async function testSingleCommand() {
  console.log("\\n🎯 SCELTA COMANDO SINGOLO");
  console.log("=".repeat(30));

  const commands = Object.entries(COMMANDS);
  commands.forEach(([name, data], index) => {
    console.log(`${index + 1}. ${name} - ${data.description}`);
  });

  return new Promise((resolve) => {
    rl.question("\n🔢 Scegli comando (numero): ", async (answer) => {
      const choice = parseInt(answer);

      if (choice >= 1 && choice <= commands.length) {
        const [name, data] = commands[choice - 1];
        await sendCommandTest(name, data);
        resolve();
      } else {
        console.log("❌ Scelta non valida");
        resolve();
      }
    });
  });
}

/**
 * 🗄️ Inizializza database per test
 */
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sms_test_results (
        id SERIAL PRIMARY KEY,
        test_name VARCHAR(50),
        command TEXT,
        description TEXT,
        expected TEXT,
        message_sid VARCHAR(100),
        success BOOLEAN,
        error_message TEXT,
        duration_ms INTEGER,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✅ Database test inizializzato");
  } catch (error) {
    console.error("❌ Errore inizializzazione database:", error.message);
  }
}

/**
 * ⚙️ Verifica configurazione
 */
function checkConfiguration() {
  console.log(`\n⚙️ VERIFICA CONFIGURAZIONE`);
  console.log("=".repeat(30));

  const config = {
    "Twilio Account SID": TWILIO_ACCOUNT_SID,
    "Twilio Auth Token": TWILIO_AUTH_TOKEN
      ? "***configurato***"
      : "❌ MANCANTE",
    "Numero Twilio": TWILIO_PHONE_NUMBER,
    "Numero Orologio": WATCH_PHONE_NUMBER,
    "Password Orologio": WATCH_PASSWORD,
  };

  for (const [key, value] of Object.entries(config)) {
    console.log(`${key}: ${value}`);
  }

  if (TWILIO_ACCOUNT_SID === "your_account_sid") {
    console.log(`\n❌ CONFIGURAZIONE TWILIO MANCANTE!`);
    console.log(`📋 Configura le variabili d'ambiente:`);
    console.log(`   export TWILIO_ACCOUNT_SID="your_actual_sid"`);
    console.log(`   export TWILIO_AUTH_TOKEN="your_actual_token"`);
    console.log(`   export TWILIO_PHONE_NUMBER="+393123456789"`);
    console.log(`   export WATCH_PHONE_NUMBER="+393987654321"`);
    console.log(`   export WATCH_PASSWORD="123456"`);
    return false;
  }

  return true;
}

// ---------------------------------------------------
// 6. MAIN
// ---------------------------------------------------

async function main() {
  console.log(`\n🧪 SMS TEST COMPLETE`);
  console.log(`===================`);
  console.log(`🎯 Target: Orologio C405_KYS_S5_V1.3_2025`);
  console.log(`📋 IMEI: 863737078055392`);

  if (!checkConfiguration()) {
    process.exit(1);
  }

  await initializeDatabase();

  while (true) {
    const choice = await showMenu();

    if (choice.action === "invalid") {
      continue;
    } else if (choice.action === "category") {
      await testCategory(choice.category);
    } else if (choice.action === "full") {
      await runFullTest();
    } else if (choice.action === "single") {
      await testSingleCommand();
    } else if (choice.action === "results") {
      await showResults();
    } else if (choice.action === "clear") {
      await clearResults();
    }

    if (choice.action !== "results" && choice.action !== "clear") {
      console.log(`\n⏳ Premi ENTER per continuare...`);
      await new Promise((resolve) => {
        rl.question("", () => resolve());
      });
    }
  }
}

// Gestisce l'interruzione con CTRL+C
process.on("SIGINT", () => {
  console.log("\n👋 Interruzione ricevuta. Chiusura...");
  rl.close();
  process.exit(0);
});

// Avvia il programma
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { sendCommandTest, COMMANDS };
