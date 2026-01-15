# 📱 Soluzioni per Invio/Ricezione SMS agli Orologi GPS

## Panoramica
Documento tecnico sulle soluzioni disponibili per inviare comandi SMS agli orologi GPS dal computer e ricevere automaticamente le risposte nei campi del database.

---

## 🎯 Soluzioni Disponibili

### 1. Gateway SMS API Cloud (Twilio, Vonage, MessageBird)

#### Come Funziona
```
Computer → API Cloud → SMS all'orologio
Orologio risponde → SMS a numero Cloud → Webhook al server → Database
```

#### Servizi Consigliati
- **Twilio** (https://www.twilio.com)
- **Vonage/Nexmo** (https://www.vonage.com)
- **MessageBird** (https://www.messagebird.com)

#### Pro
- ✅ Nessun hardware necessario
- ✅ Altamente scalabile (gestione 1000+ dispositivi)
- ✅ Affidabile con retry automatici
- ✅ Webhook HTTP per ricevere risposte in tempo reale
- ✅ API REST ben documentate
- ✅ Supporto per SMS, voice, WhatsApp

#### Contro
- ❌ Costo per SMS (circa €0.05-0.10 per SMS)
- ❌ Dipendenza da servizio esterno
- ❌ Richiede connessione internet costante

#### Costi Stimati (Twilio Italia)
- Invio SMS: €0.075/SMS
- Ricezione SMS: €0.0075/SMS
- Numero dedicato: €1/mese
- **Esempio**: 100 orologi x 10 SMS/mese = €75/mese

#### Implementazione Base (Node.js + Twilio)

```typescript
// 1. Installazione
npm install twilio

// 2. Configurazione
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// 3. Invio SMS all'orologio
async function sendCommandToWatch(phoneNumber: string, command: string) {
  try {
    const message = await client.messages.create({
      to: phoneNumber,           // +39123456789 (SIM orologio)
      from: process.env.TWILIO_PHONE, // +39987654321 (numero Twilio)
      body: command              // 'pw,123456,ts#'
    })

    console.log(`SMS inviato: ${message.sid}`)
    return { success: true, messageId: message.sid }
  } catch (error) {
    console.error('Errore invio SMS:', error)
    return { success: false, error }
  }
}

// 4. Webhook per ricevere risposte
// Route: POST /api/sms/webhook
export async function POST(request: Request) {
  const formData = await request.formData()

  const from = formData.get('From')     // Numero orologio
  const body = formData.get('Body')     // Risposta SMS

  // Parse della risposta
  const parsedData = parseWatchResponse(body)

  // Salva nel database
  await db.query(`
    UPDATE devices
    SET
      server_ip = $1,
      gps_zone = $2,
      battery_level = $3,
      last_sms_response = $4,
      updated_at = NOW()
    WHERE phone_number = $5
  `, [
    parsedData.ip,
    parsedData.zone,
    parsedData.battery,
    body,
    from
  ])

  // Twilio richiede risposta TwiML
  return new Response(
    '<Response></Response>',
    { headers: { 'Content-Type': 'text/xml' } }
  )
}

// 5. Parser esempio per risposta TS
function parseWatchResponse(response: string) {
  // Esempio: "TS:52.28.132.157,80,0#,12,0,0,0..."
  if (response.startsWith('TS:')) {
    const parts = response.substring(3).split(',')
    return {
      ip: parts[0],
      port: parts[1],
      zone: parts[3],
      battery: parseInt(parts[4]) || 0
    }
  }
  return null
}
```

#### Configurazione Webhook Twilio
1. Dashboard Twilio → Phone Numbers → Il tuo numero
2. Messaging → "A MESSAGE COMES IN" → Webhook URL
3. URL: `https://tuo-dominio.com/api/sms/webhook`
4. Method: `POST`

---

### 2. Modem GSM USB (Hardware Locale)

#### Hardware Consigliato
- **Huawei E3372** (~€40) - 4G/LTE
- **ZTE MF823** (~€35) - 4G/LTE
- **Modem industriali** (Teltonika, Cinterion) - per uso professionale

#### Come Funziona
```
Computer → Modem GSM (USB) → SMS all'orologio
Orologio risponde → Modem riceve → Software locale → Database
```

#### Pro
- ✅ Costo zero dopo acquisto hardware
- ✅ Controllo totale sui dati
- ✅ Nessuna dipendenza cloud
- ✅ Privacy completa
- ✅ Perfetto per installazioni locali

#### Contro
- ❌ Un modem = gestione seriale limitata (5-10 SMS/min)
- ❌ Richiede server fisico sempre acceso
- ❌ Gestione manuale di AT commands
- ❌ Configurazione più complessa

#### Implementazione con Gammu

```bash
# 1. Installazione Gammu (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install gammu gammu-smsd

# 2. Configurazione
sudo gammu-detect  # Rileva automaticamente modem

# File: /etc/gammu-smsdrc
[gammu]
device = /dev/ttyUSB0
connection = at

[smsd]
service = files
logfile = /var/log/gammu-smsd.log
inboxpath = /var/spool/gammu/inbox/
outboxpath = /var/spool/gammu/outbox/
sentsmspath = /var/spool/gammu/sent/
errorsmspath = /var/spool/gammu/error/

# 3. Avvio servizio
sudo systemctl start gammu-smsd
sudo systemctl enable gammu-smsd
```

#### Implementazione Node.js con Gammu

```typescript
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

// Invio SMS
async function sendSMS(phoneNumber: string, message: string) {
  try {
    const { stdout } = await execAsync(
      `gammu sendsms TEXT ${phoneNumber} -text "${message}"`
    )
    return { success: true, output: stdout }
  } catch (error) {
    return { success: false, error }
  }
}

// Monitoraggio inbox per risposte
import chokidar from 'chokidar'

const INBOX_PATH = '/var/spool/gammu/inbox'

const watcher = chokidar.watch(INBOX_PATH, {
  persistent: true,
  ignoreInitial: true
})

watcher.on('add', async (filePath) => {
  // Nuovo SMS ricevuto
  const content = await fs.readFile(filePath, 'utf-8')

  // Parse SMS (formato Gammu)
  const smsData = parseSMSFile(content)

  // Processa risposta
  await processWatchResponse(smsData.from, smsData.text)

  // Sposta in processed
  await fs.rename(
    filePath,
    path.join('/var/spool/gammu/processed', path.basename(filePath))
  )
})

function parseSMSFile(content: string) {
  const lines = content.split('\n')
  const data: any = {}

  lines.forEach(line => {
    if (line.startsWith('From: ')) data.from = line.substring(6)
    if (line.startsWith('Text: ')) data.text = line.substring(6)
  })

  return data
}
```

---

### 3. Smartphone Android come Gateway SMS (★ SOLUZIONE CONSIGLIATA PER INIZIARE)

#### App Consigliate

**A. SMS Gateway API** (https://smsgateway.me/)
- ✅ Gratuita per uso limitato
- ✅ API REST semplice
- ✅ App Android stabile
- ❌ Limite 100 SMS/giorno (versione free)

**B. Klinker SMS**
- ✅ Open source
- ✅ Nessun limite
- ✅ Supporto MMS
- ❌ Setup più complesso

**C. SMS Gateway for Android** (https://github.com/capcom6/android-sms-gateway)
- ✅ Open source
- ✅ API REST completa
- ✅ Webhook per ricezione
- ✅ Nessun limite
- ✅ Self-hosted

#### Come Funziona
```
Computer → HTTP POST → App Android → SMS all'orologio
Orologio risponde → App Android → HTTP POST (webhook) → Server → Database
```

#### Pro
- ✅ Praticamente gratis (telefono + SIM dati)
- ✅ Semplice da configurare
- ✅ App già pronte
- ✅ Ideale per testing e piccola scala
- ✅ Nessun costo mensile

#### Contro
- ❌ Telefono deve essere sempre acceso e connesso
- ❌ Meno affidabile di soluzioni professionali
- ❌ Dipende dalla stabilità Android
- ❌ Scalabilità limitata

#### Setup SMS Gateway for Android (CONSIGLIATA)

**Step 1: Installazione App**
1. Scarica app da GitHub: https://github.com/capcom6/android-sms-gateway/releases
2. Installa APK su Android
3. Apri app e annota l'indirizzo IP locale (es: 192.168.1.100:8080)

**Step 2: Configurazione**
1. Imposta password/token di sicurezza
2. Abilita "Auto-start on boot"
3. Disabilita risparmio energetico per l'app
4. Configura webhook URL per risposte in arrivo

**Step 3: Implementazione API**

```typescript
// File: /lib/sms-gateway.ts
import axios from 'axios'

const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL // http://192.168.1.100:8080
const SMS_GATEWAY_TOKEN = process.env.SMS_GATEWAY_TOKEN

interface SendSMSOptions {
  phoneNumber: string
  message: string
}

export async function sendSMSViaAndroid({ phoneNumber, message }: SendSMSOptions) {
  try {
    const response = await axios.post(
      `${SMS_GATEWAY_URL}/message`,
      {
        phone_numbers: [phoneNumber],
        message: message
      },
      {
        headers: {
          'Authorization': `Bearer ${SMS_GATEWAY_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    return {
      success: true,
      messageId: response.data.id,
      status: response.data.state
    }
  } catch (error: any) {
    console.error('Errore invio SMS:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// Webhook per ricevere SMS in arrivo
// Route: POST /api/sms/android-webhook
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Formato SMS Gateway for Android
    const {
      message,      // Testo SMS
      phoneNumber,  // Numero mittente
      receivedAt    // Timestamp
    } = data

    console.log(`SMS ricevuto da ${phoneNumber}: ${message}`)

    // Parse e salva risposta orologio
    const parsedData = parseWatchResponse(message)

    if (parsedData) {
      await db.query(`
        UPDATE devices
        SET
          server_ip = $1,
          gps_zone = $2,
          last_sms_response = $3,
          last_sms_received_at = $4,
          updated_at = NOW()
        WHERE phone_number = $5
      `, [
        parsedData.ip,
        parsedData.zone,
        message,
        new Date(receivedAt),
        phoneNumber
      ])
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Errore webhook:', error)
    return Response.json({ success: false }, { status: 500 })
  }
}
```

**Step 4: Configurazione Webhook nell'App**
1. Apri app SMS Gateway
2. Settings → Webhooks
3. URL: `https://tuo-dominio.com/api/sms/android-webhook`
4. Abilita "Send incoming messages to webhook"

**Step 5: Esporre Server al Telefono (se locale)**

Opzione A: ngrok (per testing)
```bash
ngrok http 3000
# Usa URL ngrok nell'app Android
```

Opzione B: Tailscale/ZeroTier (VPN locale)
```bash
# Installare Tailscale su server e Android
# Usare IP Tailscale nel webhook
```

Opzione C: Server VPS (produzione)
```bash
# Deploy su VPS con IP pubblico
# Configurare webhook direttamente
```

---

## 📊 Confronto Soluzioni

| Caratteristica | Twilio | Modem GSM | Android Gateway |
|---------------|--------|-----------|-----------------|
| **Costo Setup** | €0 | €40-50 | €0 |
| **Costo Mensile** | ~€75/mese | €0 | €0 (solo SIM) |
| **Scalabilità** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Affidabilità** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Facilità Setup** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Hardware** | No | Sì | Sì (telefono) |
| **Internet** | Richiesto | No | Sì (WiFi/4G) |
| **Ideale per** | Produzione | Locale/Privacy | Testing/Startup |

---

## 🎯 Raccomandazioni

### Per Iniziare / Testing
**→ Smartphone Android + SMS Gateway for Android**
- Costo: €0 (telefono esistente)
- Setup: 15 minuti
- Perfetto per: 1-50 orologi

### Per Piccola Scala (< 100 orologi)
**→ Smartphone Android + SIM dati economica**
- Costo: ~€5/mese (SIM)
- Affidabile se telefono sempre acceso

### Per Media Scala (100-500 orologi)
**→ Modem GSM USB + Server dedicato**
- Costo: €40 setup + €10/mese SIM
- Controllo totale

### Per Grande Scala (500+ orologi)
**→ Twilio API**
- Scalabilità illimitata
- Affidabilità enterprise
- Costo proporzionale all'uso

---

## 🔧 Comandi SMS Orologi GPS

### Comandi Principali

```bash
# Lettura configurazione completa
pw,123456,ts#

# Reset orologio
pw,123456,reset#

# Reboot
pw,123456,restart#

# Configurazione server
pw,123456,ip,52.28.132.157,80#

# Configurazione APN
pw,123456,apn,internet.wind,,,#

# Lettura posizione GPS
pw,123456,url#

# Configurazione zona GPS (Italia = 12)
pw,123456,lz,12#

# Configurazione intervallo upload (30 min)
pw,123456,upload,30#

# Configurazione SOS numbers
pw,123456,sos1,+393331234567#
pw,123456,sos2,+393337654321#
pw,123456,sos3,+393339876543#

# Configurazione centro SMS
pw,123456,center,+393359609600#

# Lettura livello batteria
pw,123456,bat#

# Test GPS
pw,123456,gps#
```

### Parser Risposte

```typescript
interface WatchResponse {
  command: string
  data: Record<string, any>
  raw: string
}

export function parseWatchResponse(sms: string): WatchResponse | null {
  // Risposta TS (configurazione)
  if (sms.startsWith('TS:')) {
    // Formato: TS:52.28.132.157,80,0#,12,0,0,0...
    const parts = sms.substring(3).split(',')
    return {
      command: 'TS',
      data: {
        server_ip: parts[0],
        server_port: parts[1],
        apn: parts[2],
        gps_zone: parts[3],
        battery_level: parseInt(parts[4]) || 0
      },
      raw: sms
    }
  }

  // Risposta URL (posizione)
  if (sms.startsWith('http')) {
    // Formato: http://maps.google.com/maps?q=41.123456,12.654321
    const match = sms.match(/q=([-\d.]+),([-\d.]+)/)
    if (match) {
      return {
        command: 'URL',
        data: {
          latitude: parseFloat(match[1]),
          longitude: parseFloat(match[2]),
          maps_url: sms
        },
        raw: sms
      }
    }
  }

  // Risposta batteria
  if (sms.includes('battery')) {
    const match = sms.match(/(\d+)%/)
    return {
      command: 'BAT',
      data: {
        battery_level: match ? parseInt(match[1]) : 0
      },
      raw: sms
    }
  }

  // OK generico
  if (sms.toLowerCase().includes('ok')) {
    return {
      command: 'OK',
      data: { success: true },
      raw: sms
    }
  }

  return null
}
```

---

## 📝 Note Implementative

### Sicurezza
- ✅ Validare sempre numero mittente
- ✅ Rate limiting su API
- ✅ Token/password per webhook
- ✅ Logging completo di tutti gli SMS
- ✅ Cifratura password orologi nel DB

### Performance
- ✅ Queue sistema per invii multipli
- ✅ Retry automatico in caso di fallimento
- ✅ Timeout adeguati (60s per risposte SMS)
- ✅ Cache risposte per evitare duplicati

### Monitoring
- ✅ Log invii/ricezioni SMS
- ✅ Alert se gateway offline
- ✅ Statistiche utilizzo
- ✅ Dashboard stato SMS

---

## 🚀 Next Steps

1. ✅ Scegliere soluzione (Android consigliato per iniziare)
2. ✅ Creare pagina dashboard per gestione SMS
3. ✅ Implementare API invio/ricezione
4. ✅ Parser automatico risposte
5. ✅ Testing con 1-2 orologi
6. ✅ Scaling progressivo

---

**Documento creato**: 2025-12-27
**Versione**: 1.0
**Autore**: GPS Tracker Project
