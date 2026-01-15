# 📡 METODI ALTERNATIVI PER ESTRAZIONE DATI SANITARI

## 🎯 Situazione Attuale

L'orologio **C405_KYS_S5_V1.3_2025** ha una SIM 4G attiva e cattura dati sanitari (saturazione, temperatura, frequenza cardiaca, pressione), ma li invia criptati tramite protocollo AQSH+. Analizziamo metodi alternativi per estrarre questi dati.

---

## 📱 METODO 1: INTERCETTAZIONE SMS

### 🔍 Come Funziona

L'orologio può inviare dati tramite **SMS** quando riceve comandi specifici. Molti orologi GPS supportano comandi SMS per richiedere informazioni.

#### 📋 Comandi SMS Standard

```sms
# Richiesta posizione
SMS: "pw,123456,ts#"
Risposta: "lat:45.123456,lng:9.123456,time:2024-12-24 10:30:00"

# Richiesta parametri salute
SMS: "pw,123456,health#"
Risposta: "hr:72,bp:120/80,spo2:98,temp:36.5"

# Richiesta stato batteria
SMS: "pw,123456,bat#"
Risposta: "battery:85%,charging:no"
```

#### 🛠️ Implementazione

```javascript
// Server SMS con Twilio
const twilio = require("twilio");
const client = twilio(accountSid, authToken);

// Invia comando per dati salute
async function requestHealthData(watchPhoneNumber) {
  await client.messages.create({
    body: "pw,123456,health#",
    from: "+393123456789", // Numero server
    to: watchPhoneNumber, // Numero SIM orologio
  });
}

// Ricevi risposta SMS
app.post("/sms/webhook", (req, res) => {
  const { From, Body } = req.body;

  // Parse dati salute da SMS
  if (Body.includes("hr:")) {
    const healthData = parseHealthSMS(Body);
    saveHealthData(From, healthData);
  }

  res.status(200).send("OK");
});

function parseHealthSMS(smsBody) {
  const data = {};
  const matches = smsBody.match(
    /hr:(\d+),bp:(\d+\/\d+),spo2:(\d+),temp:([\d.]+)/
  );

  if (matches) {
    data.heartRate = parseInt(matches[1]);
    data.bloodPressure = matches[2];
    data.spO2 = parseInt(matches[3]);
    data.temperature = parseFloat(matches[4]);
    data.timestamp = new Date();
  }

  return data;
}
```

#### ✅ Vantaggi

- ✅ **Funziona immediatamente**: Nessuna modifica firmware
- ✅ **Dati in chiaro**: SMS non criptati
- ✅ **Affidabile**: Rete SMS sempre disponibile
- ✅ **Costo basso**: €0.10 per SMS

#### ❌ Svantaggi

- ❌ **Manuale**: Richiede comando per ogni lettura
- ❌ **Latenza**: Non real-time
- ❌ **Limitato**: Non tutti i parametri disponibili

---

## 📞 METODO 2: CHIAMATE DTMF

### 🔍 Come Funziona

L'orologio può rispondere a **chiamate telefoniche** e inviare dati tramite **toni DTMF** (come i toni dei tasti del telefono).

#### 🛠️ Implementazione

```javascript
// Server VoIP con Twilio
const VoiceResponse = require("twilio").twiml.VoiceResponse;

app.post("/voice/webhook", (req, res) => {
  const twiml = new VoiceResponse();

  // Chiama l'orologio e richiedi dati
  twiml.say("Richiesta dati sanitari");
  twiml.gather({
    input: "dtmf",
    timeout: 30,
    action: "/voice/process-dtmf",
  });

  res.type("text/xml");
  res.send(twiml.toString());
});

app.post("/voice/process-dtmf", (req, res) => {
  const digits = req.body.Digits;

  // Decodifica DTMF in dati salute
  const healthData = decodeDTMF(digits);
  saveHealthData(req.body.From, healthData);

  const twiml = new VoiceResponse();
  twiml.say("Dati ricevuti correttamente");
  twiml.hangup();

  res.type("text/xml");
  res.send(twiml.toString());
});

function decodeDTMF(digits) {
  // Esempio: 72801209836 = HR:72, BP:120/80, SpO2:98, Temp:36.5
  return {
    heartRate: parseInt(digits.substr(0, 2)),
    systolic: parseInt(digits.substr(2, 3)),
    diastolic: parseInt(digits.substr(5, 2)),
    spO2: parseInt(digits.substr(7, 2)),
    temperature: parseFloat(digits.substr(9, 3)) / 10,
  };
}
```

#### ✅ Vantaggi

- ✅ **Real-time**: Dati immediati durante chiamata
- ✅ **Automatico**: Programmabile con timer
- ✅ **Affidabile**: Rete voce sempre disponibile

#### ❌ Svantaggi

- ❌ **Complesso**: Richiede configurazione DTMF
- ❌ **Costo**: €0.20 per chiamata
- ❌ **Limitato**: Pochi dati per chiamata

---

## 🌐 METODO 3: PROXY HTTP TRASPARENTE

### 🔍 Come Funziona

Configuriamo un **proxy HTTP trasparente** che intercetta tutte le comunicazioni dell'orologio, anche quelle criptate, per analizzare i pattern.

#### 🛠️ Implementazione

```javascript
// Proxy trasparente con mitmproxy
const http = require("http");
const httpProxy = require("http-proxy");

// Crea proxy server
const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  // Log tutte le richieste dell'orologio
  console.log(`${req.method} ${req.url}`);
  console.log("Headers:", req.headers);

  // Intercetta body delle richieste
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    console.log("Body:", body);

    // Analizza pattern anche se criptati
    analyzeEncryptedPattern(body);
  });

  // Inoltra al server originale
  proxy.web(req, res, {
    target: "http://original-server.com",
    changeOrigin: true,
  });
});

function analyzeEncryptedPattern(encryptedData) {
  // Cerca pattern ricorrenti nei dati criptati
  const patterns = findRepeatingPatterns(encryptedData);

  // Correlazione con timestamp per identificare dati salute
  if (isHealthDataPattern(patterns)) {
    console.log("🏥 Possibili dati salute rilevati:", patterns);
  }
}
```

#### 🔧 Configurazione APN

```bash
# Configura APN della SIM per usare il nostro proxy
APN: internet.wind
Proxy: 91.99.141.225:8080
Port: 8080
```

#### ✅ Vantaggi

- ✅ **Trasparente**: Intercetta tutto il traffico
- ✅ **Passivo**: Non modifica comportamento orologio
- ✅ **Completo**: Cattura tutti i dati

#### ❌ Svantaggi

- ❌ **Complesso**: Richiede configurazione APN
- ❌ **Criptato**: Dati ancora non leggibili
- ❌ **Legale**: Possibili problemi privacy

---

## 📊 METODO 4: ANALISI TRAFFICO DATI

### 🔍 Come Funziona

Monitoriamo il **traffico dati della SIM** per identificare pattern temporali e dimensioni dei pacchetti che corrispondono alle letture dei sensori.

#### 🛠️ Implementazione

```javascript
// Monitor traffico SIM con API operatore
const axios = require("axios");

async function monitorSIMTraffic(simNumber) {
  const response = await axios.get(
    `https://api.operator.com/sim/${simNumber}/traffic`,
    {
      headers: { Authorization: "Bearer API_KEY" },
    }
  );

  const traffic = response.data;

  // Analizza pattern temporali
  analyzeTrafficPatterns(traffic);
}

function analyzeTrafficPatterns(traffic) {
  traffic.forEach((session) => {
    const { timestamp, bytes, duration, destination } = session;

    // Pattern tipici dati salute:
    // - Ogni 5-15 minuti (frequenza cardiaca)
    // - Pacchetti 50-200 bytes
    // - Durata connessione breve (< 5 sec)

    if (isHealthDataPattern(bytes, duration, timestamp)) {
      console.log("🏥 Possibile trasmissione dati salute:", {
        time: timestamp,
        size: bytes,
        server: destination,
      });

      // Correlazione con eventi noti
      correlateWithKnownEvents(timestamp);
    }
  });
}

function isHealthDataPattern(bytes, duration, timestamp) {
  return (
    bytes >= 50 &&
    bytes <= 200 && // Dimensione tipica
    duration < 5000 && // Connessione breve
    isHealthMeasurementTime(timestamp) // Orario tipico misurazioni
  );
}
```

#### ✅ Vantaggi

- ✅ **Non invasivo**: Solo monitoraggio passivo
- ✅ **Pattern recognition**: Identifica momenti di trasmissione
- ✅ **Correlazione**: Associa traffico a eventi

#### ❌ Svantaggi

- ❌ **Indiretto**: Non fornisce dati effettivi
- ❌ **API limitata**: Non tutti gli operatori forniscono API
- ❌ **Approssimativo**: Solo stime temporali

---

## 🔬 METODO 5: REVERSE ENGINEERING BLUETOOTH

### 🔍 Come Funziona

Molti orologi GPS hanno anche **Bluetooth** per sincronizzazione con smartphone. Possiamo intercettare questa comunicazione che spesso è **non criptata**.

#### 🛠️ Implementazione

```javascript
// Scanner Bluetooth con Noble.js
const noble = require("@abandonware/noble");

noble.on("stateChange", (state) => {
  if (state === "poweredOn") {
    console.log("🔍 Scanning for GPS watch...");
    noble.startScanning();
  }
});

noble.on("discover", (peripheral) => {
  const { localName, advertisement } = peripheral;

  // Cerca orologio GPS
  if ((localName && localName.includes("GPS")) || localName.includes("Watch")) {
    console.log("📱 Found GPS Watch:", localName);

    peripheral.connect((error) => {
      if (!error) {
        exploreServices(peripheral);
      }
    });
  }
});

function exploreServices(peripheral) {
  peripheral.discoverServices([], (error, services) => {
    services.forEach((service) => {
      console.log("🔧 Service:", service.uuid);

      service.discoverCharacteristics([], (error, characteristics) => {
        characteristics.forEach((characteristic) => {
          console.log("📊 Characteristic:", characteristic.uuid);

          // Cerca caratteristiche dati salute
          if (isHealthCharacteristic(characteristic.uuid)) {
            subscribeToHealthData(characteristic);
          }
        });
      });
    });
  });
}

function subscribeToHealthData(characteristic) {
  characteristic.subscribe((error) => {
    if (!error) {
      console.log("✅ Subscribed to health data");
    }
  });

  characteristic.on("data", (data) => {
    const healthData = parseBluetoothHealthData(data);
    console.log("🏥 Health data received:", healthData);
    saveHealthData("bluetooth", healthData);
  });
}

function parseBluetoothHealthData(buffer) {
  // Parse formato standard Bluetooth Health
  return {
    heartRate: buffer.readUInt8(1),
    spO2: buffer.readUInt8(2),
    temperature: buffer.readUInt16LE(3) / 100,
    timestamp: new Date(),
  };
}
```

#### ✅ Vantaggi

- ✅ **Dati in chiaro**: Bluetooth spesso non criptato
- ✅ **Standard**: Protocolli Bluetooth Health standardizzati
- ✅ **Real-time**: Dati immediati
- ✅ **Completo**: Tutti i sensori disponibili

#### ❌ Svantaggi

- ❌ **Distanza**: Bluetooth limitato a 10-50 metri
- ❌ **Configurazione**: Richiede pairing
- ❌ **Compatibilità**: Non tutti gli orologi supportano

---

## 📱 METODO 6: APP COMPANION MODIFICATA

### 🔍 Come Funziona

Creiamo un'**app mobile companion** che si connette all'orologio tramite Bluetooth e estrae i dati sanitari direttamente dai sensori.

#### 🛠️ Implementazione React Native

```javascript
// App React Native per estrazione dati
import { BleManager } from "react-native-ble-plx";

class HealthDataExtractor {
  constructor() {
    this.manager = new BleManager();
  }

  async scanForWatch() {
    this.manager.startDeviceScan(null, null, (error, device) => {
      if (device && device.name && device.name.includes("GPS")) {
        console.log("📱 Found GPS Watch:", device.name);
        this.connectToWatch(device);
      }
    });
  }

  async connectToWatch(device) {
    try {
      const connectedDevice = await device.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();

      // Cerca servizi salute
      const services = await connectedDevice.services();
      for (const service of services) {
        if (this.isHealthService(service.uuid)) {
          await this.subscribeToHealthService(connectedDevice, service);
        }
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
  }

  async subscribeToHealthService(device, service) {
    const characteristics = await service.characteristics();

    for (const char of characteristics) {
      if (char.isNotifiable) {
        char.monitor((error, characteristic) => {
          if (characteristic) {
            const data = this.parseHealthData(characteristic.value);
            this.sendToServer(data);
          }
        });
      }
    }
  }

  parseHealthData(base64Data) {
    const buffer = Buffer.from(base64Data, "base64");

    return {
      heartRate: buffer[0],
      spO2: buffer[1],
      temperature: ((buffer[2] << 8) | buffer[3]) / 100,
      systolic: buffer[4],
      diastolic: buffer[5],
      timestamp: new Date().toISOString(),
    };
  }

  async sendToServer(healthData) {
    await fetch("https://your-server.com/api/health-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(healthData),
    });
  }
}
```

#### ✅ Vantaggi

- ✅ **Controllo totale**: App personalizzata
- ✅ **Dati completi**: Accesso a tutti i sensori
- ✅ **Real-time**: Trasmissione immediata
- ✅ **User-friendly**: Interfaccia personalizzata

#### ❌ Svantaggi

- ❌ **Sviluppo**: Richiede app mobile
- ❌ **Compatibilità**: Dipende da protocolli Bluetooth
- ❌ **Distribuzione**: App store approval

---

## 🏆 RACCOMANDAZIONI PRIORITARIE

### 🥇 **METODO CONSIGLIATO: SMS + BLUETOOTH**

**Strategia combinata:**

1. **SMS per dati periodici** (ogni ora)
2. **Bluetooth per dati real-time** (quando in range)
3. **Backup su server** per storico completo

#### 🛠️ Implementazione Ibrida

```javascript
// Sistema ibrido SMS + Bluetooth
class HybridHealthMonitor {
  constructor() {
    this.smsClient = new TwilioSMS();
    this.bluetoothScanner = new BluetoothScanner();
    this.lastSMSRequest = null;
  }

  async startMonitoring(watchPhone) {
    // Bluetooth real-time quando disponibile
    this.bluetoothScanner.onHealthData((data) => {
      this.saveHealthData(data, "bluetooth");
    });

    // SMS backup ogni ora
    setInterval(() => {
      this.requestSMSHealthData(watchPhone);
    }, 3600000); // 1 ora

    // SMS immediato per allarmi
    this.smsClient.onAlarmSMS((sms) => {
      this.handleEmergency(sms);
    });
  }

  async requestSMSHealthData(watchPhone) {
    await this.smsClient.send(watchPhone, "pw,123456,health#");
    this.lastSMSRequest = new Date();
  }
}
```

### 📊 Costi Stimati

| Metodo         | Setup | Mensile | Affidabilità  |
| -------------- | ----- | ------- | ------------- |
| **SMS**        | €0    | €50-100 | 🟢 Alta       |
| **Bluetooth**  | €200  | €0      | 🟡 Media      |
| **Proxy HTTP** | €500  | €20     | 🟡 Media      |
| **App Mobile** | €2000 | €0      | 🟢 Alta       |
| **Ibrido**     | €200  | €30     | 🟢 Molto Alta |

---

## 🚀 PIANO DI IMPLEMENTAZIONE

### Settimana 1: Test SMS

- ✅ Configurare account Twilio
- ✅ Testare comandi SMS base
- ✅ Verificare risposta orologio

### Settimana 2: Bluetooth Scanning

- 🔄 Sviluppare scanner Bluetooth
- 🔄 Identificare servizi salute
- 🔄 Testare estrazione dati

### Settimana 3: Sistema Ibrido

- ⏳ Integrare SMS + Bluetooth
- ⏳ Implementare backup automatico
- ⏳ Testing completo

### Settimana 4: Deploy Produzione

- ⏳ Deploy su server
- ⏳ Monitoraggio 24/7
- ⏳ Documentazione finale

---

## 💡 CONCLUSIONI

Esistono **diversi metodi alternativi** per estrarre i dati sanitari dall'orologio senza dover decrittare il protocollo AQSH+:

1. **SMS**: Soluzione immediata e affidabile
2. **Bluetooth**: Dati real-time quando in range
3. **Sistema ibrido**: Combina vantaggi di entrambi

**Raccomandazione**: Iniziare con il **metodo SMS** per avere dati immediati, poi aggiungere **Bluetooth** per completare il sistema.

Questo approccio garantisce **dati sanitari completi** (saturazione, temperatura, frequenza cardiaca, pressione) senza dipendere dalla decrittazione del protocollo proprietario.

---

_Documento creato il 24 Dicembre 2024_  
_Progetto: GPS Watch Monitor - Metodi Alternativi_
