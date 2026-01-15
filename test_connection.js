const net = require("net");

/**
 * SCRIPT DI TEST PER VERIFICARE CONNESSIONE OROLOGIO GPS
 *
 * Questo script simula una connessione all'orologio per verificare:
 * 1. Se il server riceve dati
 * 2. Che tipo di dati arrivano (chiaro vs AQSH+)
 * 3. Se la decrittazione funziona
 */

const SERVER_IP = "91.99.141.225";
const SERVER_PORT = 8001;

console.log("🧪 TEST CONNESSIONE GPS WATCH");
console.log("=".repeat(50));
console.log(`📡 Connessione a: ${SERVER_IP}:${SERVER_PORT}`);

// Test 1: Invio dati in chiaro (formato standard)
function testClearProtocol() {
  return new Promise((resolve) => {
    console.log("\n📤 Test 1: Invio dati in chiaro...");

    const client = net.createConnection(SERVER_PORT, SERVER_IP, () => {
      console.log("✅ Connesso al server");

      // Simula heartbeat standard
      const heartbeat = "[3G*863737078055392*000D*LK,100,50,85]";
      client.write(heartbeat);
      console.log(`📨 Inviato: ${heartbeat}`);

      setTimeout(() => {
        client.end();
        resolve();
      }, 2000);
    });

    client.on("data", (data) => {
      console.log(`📥 Risposta server: ${data.toString()}`);
    });

    client.on("error", (err) => {
      console.log(`❌ Errore: ${err.message}`);
      resolve();
    });

    client.on("close", () => {
      console.log("🔌 Connessione chiusa");
    });
  });
}

// Test 2: Invio dati AQSH+ simulati
function testAQSHProtocol() {
  return new Promise((resolve) => {
    console.log("\n📤 Test 2: Invio dati AQSH+ simulati...");

    const client = net.createConnection(SERVER_PORT, SERVER_IP, () => {
      console.log("✅ Connesso al server");

      // Simula pacchetto AQSH+ dal documento
      const aqshData = Buffer.from("ff41515348002b0100000027b6b5d4fc", "hex");
      client.write(aqshData);
      console.log(`📨 Inviato AQSH+: ${aqshData.toString("hex")}`);

      setTimeout(() => {
        client.end();
        resolve();
      }, 2000);
    });

    client.on("data", (data) => {
      console.log(`📥 Risposta server: ${data.toString()}`);
    });

    client.on("error", (err) => {
      console.log(`❌ Errore: ${err.message}`);
      resolve();
    });

    client.on("close", () => {
      console.log("🔌 Connessione chiusa");
    });
  });
}

// Test 3: Verifica se l'orologio è già connesso
function testExistingConnection() {
  return new Promise((resolve) => {
    console.log("\n📤 Test 3: Verifica connessioni esistenti...");

    const client = net.createConnection(SERVER_PORT, SERVER_IP, () => {
      console.log("✅ Server raggiungibile");
      console.log(
        "💡 Se l'orologio è connesso, dovresti vedere i suoi dati nei log del server"
      );

      client.end();
      resolve();
    });

    client.on("error", (err) => {
      console.log(`❌ Server non raggiungibile: ${err.message}`);
      console.log("💡 Verifica che il server sia avviato con: pm2 status");
      resolve();
    });
  });
}

// Esegui tutti i test
async function runAllTests() {
  try {
    await testExistingConnection();
    await testClearProtocol();
    await testAQSHProtocol();

    console.log("\n🎯 RISULTATI TEST:");
    console.log("=".repeat(50));
    console.log("✅ Se vedi risposte dal server, la connessione funziona");
    console.log(
      "🔐 Se l'orologio invia AQSH+, vedrai tentativi di decrittazione"
    );
    console.log("📞 Se la decrittazione fallisce, contatta il produttore");
    console.log("\n💡 PROSSIMI PASSI:");
    console.log("1. Controlla i log del server: pm2 logs gps-server");
    console.log("2. Verifica se l'orologio si connette automaticamente");
    console.log("3. Se necessario, richiedi FOTA al produttore");
  } catch (err) {
    console.error("❌ Errore durante i test:", err.message);
  }
}

// Avvia i test
runAllTests();
