# 📱 GUIDA CONFIGURAZIONE SMS PER GPS WATCH

## 🎯 Obiettivo

Configurare il sistema SMS per estrarre dati sanitari dall'orologio GPS C405_KYS_S5_V1.3_2025

---

## 📋 PASSI DA SEGUIRE

### 1️⃣ Installazione Dipendenze

```bash
cd /Users/fabio/NEXT_JS/gps-tracker
npm install twilio
```

### 2️⃣ Configurazione Account Twilio

#### 🌐 Creazione Account

1. Vai su [twilio.com](https://www.twilio.com)
2. Registrati per account gratuito
3. Verifica email e numero telefonico
4. Ottieni credito di prova (~$15)

#### 🔑 Ottenere Credenziali

1. Accedi a Twilio Console
2. Vai in **Settings > General**
3. Copia **Account SID** e **Auth Token**
4. Vai in **Phone Numbers > Buy a Number**
5. Compra un numero italiano (+39...)

### 3️⃣ Configurazione Variabili Ambiente

#### 📝 Crea file `.env`

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_PHONE_NUMBER="+393123456789"

# Watch Configuration
WATCH_PHONE_NUMBER="+393987654321"  # Numero SIM dell'orologio
WATCH_PASSWORD="123456"              # Password default orologio

# Server Configuration
WEBHOOK_URL="https://your-domain.com/sms/webhook"
SERVER_PORT=3000
```

#### 🔒 Carica variabili ambiente

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="your_auth_token_here"
export TWILIO_PHONE_NUMBER="+393123456789"
export WATCH_PHONE_NUMBER="+393987654321"
export WATCH_PASSWORD="123456"
```

### 4️⃣ Configurazione Webhook

#### 🌐 Configura URL Webhook in Twilio

1. Vai in **Phone Numbers > Active Numbers**
2. Seleziona il tuo numero
3. In **Messaging** configura:
   - **A MESSAGE COMES IN**: Webhook URL
   - **URL**: `https://your-server.com:3000/sms/webhook`
   - **HTTP Method**: POST

#### 🏠 Se in locale (testing)

```bash
# Usa ngrok per esporre localhost
npm install -g ngrok
ngrok http 3000

# Copia l'URL generato: https://abc123.ngrok.io
# Configura in Twilio: https://abc123.ngrok.io/sms/webhook
```

---

## 🧪 TESTING DEI COMANDI SMS

### 📱 Comandi Base da Testare

#### 1️⃣ Comando Posizione

```sms
pw,123456,ts#
```

**Risposta attesa**: `lat:45.123456,lng:9.123456,time:2024-12-24 10:30:00`

#### 2️⃣ Comando Salute

```sms
pw,123456,health#
```

**Risposta attesa**: `hr:72,bp:120/80,spo2:98,temp:36.5`

#### 3️⃣ Comando Batteria

```sms
pw,123456,bat#
```

**Risposta attesa**: `battery:85%,charging:no`

#### 4️⃣ Comando Stato

```sms
pw,123456,status#
```

**Risposta attesa**: `imei:863737078055392,signal:4,gps:yes`

### 🔄 Script di Test Automatico

```bash
# Esegui test comandi SMS
node test_sms_commands.js
```

---

## 📊 INTEGRAZIONE DATABASE

### 🗄️ Tabelle Necessarie

#### Tabella `sms_logs`

```sql
CREATE TABLE sms_logs (
    id SERIAL PRIMARY KEY,
    message_sid VARCHAR(100) UNIQUE,
    from_number VARCHAR(20),
    to_number VARCHAR(20),
    body TEXT,
    direction VARCHAR(10), -- 'inbound' or 'outbound'
    status VARCHAR(20),
    timestamp TIMESTAMP DEFAULT NOW()
);
```

#### Tabella `health_data_sms`

```sql
CREATE TABLE health_data_sms (
    id SERIAL PRIMARY KEY,
    watch_phone VARCHAR(20),
    heart_rate INTEGER,
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    spo2 INTEGER,
    temperature DECIMAL(4,1),
    battery INTEGER,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 AVVIO SISTEMA

### 1️⃣ Avvio Server Webhook

```bash
node server_sms.js
```

### 2️⃣ Test Manuale

```bash
# Invia comando posizione
node -e "
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
client.messages.create({
  body: 'pw,123456,ts#',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: process.env.WATCH_PHONE_NUMBER
}).then(msg => console.log('SMS inviato:', msg.sid));
"
```

### 3️⃣ Monitoraggio Risposte

```bash
# Controlla log risposte
tail -f sms_responses.log

# Controlla database
psql -h localhost -U gpsuser -d gpswatch -c "SELECT * FROM sms_logs ORDER BY timestamp DESC LIMIT 5;"
```

---

## ⚠️ RISOLUZIONE PROBLEMI

### ❌ SMS non arriva

1. Verifica numero SIM orologio
2. Controlla credito Twilio
3. Verifica formato comando
4. Controlla password orologio

### ❌ Nessuna risposta

1. Controlla configurazione webhook
2. Verifica firewall/porte
3. Testa con ngrok se locale
4. Controlla log Twilio Console

### ❌ Dati non salvati

1. Verifica connessione database
2. Controlla formato risposta
3. Verifica parsing dati
4. Controlla log errori server

---

## 📈 COSTI STIMATI

### 📊 Costi Mensili

- **Numero Twilio**: €1.00/mese
- **SMS Test (10/giorno)**: ~€15/mese
- **SMS Produzione (24/giorno)**: ~€35/mese

### 💡 Ottimizzazione Costi

- Usa comandi batch per richiedere più dati
- Limita frequenza richieste
- Monitora costi in Twilio Console

---

## 📞 SUPPORTO

### 🔧 Risorse Utili

- [Documentazione Twilio SMS](https://www.twilio.com/docs/sms)
- [API Reference Node.js](https://www.twilio.com/docs/libraries/reference/twilio-node/)
- [Debug SMS](https://www.twilio.com/console/sms/debugger)

### 🆘 Contatti

- Supporto Twilio: 24/7 chat/email
- Community: Stack Overflow tag `twilio`
- Progetto GPS Watch: Documentazione interna

---

_📅 Creato il 24 Dicembre 2024_  
_🎯 Progetto: GPS Watch Monitor - Sistema SMS_
