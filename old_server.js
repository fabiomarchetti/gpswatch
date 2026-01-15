const net = require("net");
const { Pool } = require("pg");

// ---------------------------------------------------
// 1. CONFIGURAZIONE DATABASE
// ---------------------------------------------------
const pool = new Pool({
  host: "localhost",
  database: "gpswatch",
  user: "gpsuser",
  password: "GpsWatch2025!",
  port: 5432,
});

// ---------------------------------------------------
// 2. FUNZIONE DI SUPPORTO PER TROVARE L'IMEI
// ---------------------------------------------------
// Cerca nel DB se l'ID in arrivo è un IMEI o un Registration Code
// e restituisce sempre l'IMEI "canonico" salvato nel DB.
async function findRealImei(idFromPacket) {
  try {
    const query = `
      SELECT imei 
      FROM devices 
      WHERE imei = $1 OR registration_code = $1
      LIMIT 1
    `;
    const res = await pool.query(query, [idFromPacket]);

    if (res.rows.length > 0) {
      return res.rows[0].imei;
    }
    return null;
  } catch (err) {
    console.error("Errore ricerca IMEI:", err);
    return null;
  }
}

// Mappa per tenere i socket attivi: ID_Device -> Socket
const clients = new Map();

// ---------------------------------------------------
// 3. CREAZIONE SERVER TCP
// ---------------------------------------------------
const server = net.createServer((socket) => {
  console.log(
    `Nuova connessione da: ${socket.remoteAddress}:${socket.remotePort}`
  );

  // Creiamo un buffer per ogni connessione per gestire pacchetti frammentati
  socket.buffer = "";

  socket.on("data", async (data) => {
    // Aggiungi nuovi dati al buffer esistente
    socket.buffer += data.toString();

    // Ciclo finché ci sono pacchetti completi (iniziano con [ e finiscono con ])
    while (socket.buffer.includes("[") && socket.buffer.includes("]")) {
      const start = socket.buffer.indexOf("[");
      const end = socket.buffer.indexOf("]") + 1;
      const packet = socket.buffer.substring(start, end);

      // Rimuovi il pacchetto processato dal buffer
      socket.buffer = socket.buffer.substring(end);

      await processPacket(packet, socket);
    }
  });

  socket.on("end", () => {
    console.log("Client disconnesso");
    // Pulizia opzionale della mappa clients qui
  });

  socket.on("error", (err) => {
    console.error("Errore Socket:", err);
  });
});

// ---------------------------------------------------
// 4. ELABORAZIONE PACCHETTI
// ---------------------------------------------------
async function processPacket(packet, socket) {
  try {
    if (!packet.startsWith("[") || !packet.includes("]")) return;

    // Pulisce e divide: 3G*IMEI/ID*LEN*CONTENT
    const cleanMsg = packet.slice(1, -1);
    const parts = cleanMsg.split("*");

    if (parts.length < 4) return;

    const protocol = parts[0]; // Es. '3G'
    const deviceId = parts[1]; // IMEI o Registration Code (es. 'l50e5et0eq')
    const content = parts[3];
    const args = content.split(",");

    // Salva il socket nella mappa usando il device ID
    clients.set(deviceId, socket);

    // --- COMANDO LK (Heartbeat) ---
    if (args[0] === "LK") {
      // 1. Risposta richiesta dal protocollo per mantenere connessione aperta
      const response = `[${protocol}*${deviceId}*0002*LK]`;
      socket.write(response);

      console.log(`Heartbeat da ${deviceId}`);

      // 2. Aggiorniamo l'ultimo accesso nel DB
      const realImei = await findRealImei(deviceId);
      if (realImei) {
        await pool.query(
          "UPDATE devices SET updated_at = NOW() WHERE imei = $1",
          [realImei]
        );
      }
    }

    // --- COMANDO UD / UD2 (Location Data) ---
    else if (args[0] === "UD" || args[0] === "UD2") {
      const realImei = await findRealImei(deviceId);

      if (!realImei) {
        console.log(`GPS Sconosciuto: ${deviceId}`);
        return;
      }

      // Parsing Dati (in base al documento tecnico)
      // args[1]=Data, args[2]=Ora, args[4]=Lat, args[6]=Lon, args[11]=Batteria (stimato)
      const lat = parseFloat(args[4]) || 0;
      const lon = parseFloat(args[6]) || 0;
      const battery = parseInt(args[11]) || 0;
      const altitude = parseFloat(args[8]) || 0;
      const speed = parseFloat(args[7]) || 0;
      const satellites = parseInt(args[9]) || 0;
      const gsmSignal = parseInt(args[10]) || 0;

      // Salva in 'locations'
      await pool.query(
        `
        INSERT INTO locations (imei, latitude, longitude, altitude, speed, battery, satellites, gsm_signal, recorded_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `,
        [realImei, lat, lon, altitude, speed, battery, satellites, gsmSignal]
      );

      console.log(
        `GPS Salvato [${realImei}]: ${lat}, ${lon} (Batt: ${battery}%)`
      );
    }

    // --- COMANDO AL (Allarmi) ---
    else if (args[0] === "AL") {
      const realImei = await findRealImei(deviceId);
      if (!realImei) return;

      const lat = parseFloat(args[4]) || 0;
      const lon = parseFloat(args[6]) || 0;
      // L'allarme potrebbe essere definito nei bit di stato (args[12]),
      // qui usiamo un generico "MANUAL_SOS" se non riusciamo a decodificare i bit
      const alarmType = "SOS_ALARM";

      await pool.query(
        `
        INSERT INTO alarms (imei, alarm_type, latitude, longitude, recorded_at)
        VALUES ($1, $2, $3, $4, NOW())
      `,
        [realImei, alarmType, lat, lon]
      );

      console.log(`ALLARME Ricevuto da [${realImei}]`);
    }

    // --- COMANDO bphrt (Pressione e Battito) ---
    else if (args[0] === "bphrt") {
      const realImei = await findRealImei(deviceId);
      if (!realImei) return;

      // args[1]=Sistolica, args[2]=Diastolica, args[3]=Battito
      const sys = parseInt(args[1]);
      const dia = parseInt(args[2]);
      const hr = parseInt(args[3]);

      if (hr > 0 || sys > 0) {
        await pool.query(
          `
          INSERT INTO health_data (imei, heart_rate, systolic_bp, diastolic_bp, recorded_at)
          VALUES ($1, $2, $3, $4, NOW())
        `,
          [realImei, hr, sys, dia]
        );
        console.log(`Salute BP/HR [${realImei}]: ${sys}/${dia}, HR: ${hr}`);
      }
    }

    // --- COMANDO oxygen (SpO2) ---
    else if (args[0] === "oxygen") {
      const realImei = await findRealImei(deviceId);
      if (!realImei) return;

      // args[2]=SpO2 value
      const spo2 = parseInt(args[2]);

      await pool.query(
        `
        INSERT INTO health_data (imei, spo2, recorded_at)
        VALUES ($1, $2, NOW())
      `,
        [realImei, spo2]
      );
      console.log(`Salute SpO2 [${realImei}]: ${spo2}%`);
    }

    // --- COMANDO btemp2 (Temperatura) ---
    else if (args[0] === "btemp2") {
      const realImei = await findRealImei(deviceId);
      if (!realImei) return;

      // args[2]=Temp value
      const temp = parseFloat(args[2]);
      const mode = args[1]; // 0=Forehead, 1=Wrist

      await pool.query(
        `
        INSERT INTO health_data (imei, temperature, temperature_mode, recorded_at)
        VALUES ($1, $2, $3, NOW())
      `,
        [realImei, temp, mode]
      );
      console.log(`Salute Temp [${realImei}]: ${temp}`);
    }
  } catch (err) {
    console.error("Errore elaborazione pacchetto:", err);
  }
}

// ---------------------------------------------------
// 5. AVVIO DEL SERVER
// ---------------------------------------------------
const PORT = 8001; // Porta standard per protocolli SeTracker

server.listen(PORT, "0.0.0.0", () => {
  console.log(`---------------------------------------------------`);
  console.log(` Server TCP GPS AVVIATO su porta ${PORT}`);
  console.log(` In attesa di connessioni dagli orologi...`);
  console.log(`---------------------------------------------------`);
});
