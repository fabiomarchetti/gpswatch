# 🔐 GUIDA RISOLUZIONE PROTOCOLLO AQSH+

## 📋 Situazione Attuale

Il tuo orologio GPS **C405_KYS_S5_V1.3_2025** (IMEI: `863737078055392`) utilizza un **protocollo criptato proprietario AQSH+** invece del protocollo standard in chiaro documentato.

### 🔍 Dati Ricevuti

```
Hex: ff41515348002b0100000027b6b5d4fc...
```

**Struttura identificata:**

- `ff` = Marker inizio pacchetto criptato
- `41515348` = 'AQSH' header proprietario Wonlex
- `002b` = Lunghezza payload (43 bytes)
- Resto = Dati criptati (probabilmente AES-128)

---

## 🎯 SOLUZIONI PRIORITARIE

### ⭐ **SOLUZIONE 1: Richiesta Documentazione (CONSIGLIATA)**

**Contatta IMMEDIATAMENTE il produttore:**

#### 📧 Email Template

```
To: sales@4p-touch.com, info@setracker.com, info@iwonlex.net
Subject: URGENT - AQSH+ Protocol Documentation Request

Dear Technical Team,

I have a C405_KYS_S5_V1.3_2025 GPS watch that sends encrypted data
with AQSH+ protocol to my server.

Device Details:
- IMEI: 863737078055392
- Registration Code: l50e5et0eq
- Firmware: C405_KYS_S5_V1.3_2025.10.11_11.43.26
- System: RTOS 1.5

My Server:
- IP: 91.99.141.225
- Port: 5000 (or 8001)

I need:
1. AQSH+ protocol documentation
2. AES decryption key/algorithm
3. OR firmware without encryption

Please provide FOTA to redirect device to my server.

Thank you for urgent assistance.
```

#### 📱 WhatsApp

- **+86-15323476221**
- **+8618681535670**

Invia lo stesso messaggio via WhatsApp per risposta più rapida.

---

### 🔄 **SOLUZIONE 2: Firmware Downgrade**

Richiedi un **FOTA (Firmware Over The Air)** per installare una versione precedente che usa il protocollo standard.

**Messaggio per FOTA:**

```
Please send FOTA to downgrade firmware to version without AQSH+ encryption.
IMEI: 863737078055392
Target Server: 91.99.141.225:5000
```

---

### 🛠️ **SOLUZIONE 3: Configurazione Server Alternativa**

Se il produttore non risponde, prova queste configurazioni:

#### A. Cambia Porta Server

Il tuo server attuale usa porta `8001`. Prova anche:

- Porta `5000` (standard SeTracker)
- Porta `8001` (attuale)
- Porta `8080` (alternativa)

#### B. Verifica Configurazione Orologio

Nelle impostazioni dell'orologio, cerca:

- **Server IP**: deve essere `91.99.141.225`
- **Server Port**: deve essere `5000` o `8001`
- **Protocol**: se c'è opzione, scegli "Standard" o "Clear"

---

## 🔧 IMPLEMENTAZIONE TECNICA

### 📁 File Creati

1. **[`aqsh_decoder.js`](aqsh_decoder.js)** - Decoder sperimentale per AQSH+
2. **[`test_connection.js`](test_connection.js)** - Script di test connessione
3. **[`server.js`](server.js)** - Server aggiornato con supporto AQSH+

### 🚀 Come Usare

#### 1. Testa la Connessione

```bash
node test_connection.js
```

#### 2. Verifica Log Server

```bash
# Sul VPS
pm2 logs gps-server --lines 100
```

#### 3. Riavvia Server con Nuove Funzionalità

```bash
# Sul VPS
pm2 restart gps-server
```

---

## 🔍 DEBUGGING

### Verifica Dati in Arrivo

Il server aggiornato ora:

1. **Rileva automaticamente** pacchetti AQSH+
2. **Tenta decrittazione** con chiavi comuni
3. **Logga dettagli** per analisi

### Log da Cercare

```
🔐 RILEVATO PROTOCOLLO AQSH+ CRIPTATO!
✅ DECRITTAZIONE RIUSCITA!
❌ DECRITTAZIONE FALLITA
```

### Se la Decrittazione Fallisce

```
💡 Contatta il produttore per la chiave di decrittazione
```

---

## 📞 CONTATTI PRODUTTORE

| Canale       | Contatto                 | Note            |
| ------------ | ------------------------ | --------------- |
| **Email**    | sales@4p-touch.com       | Principale      |
| **Email**    | info@setracker.com       | SeTracker       |
| **Email**    | info@iwonlex.net         | Wonlex          |
| **WhatsApp** | +86-15323476221          | Risposta rapida |
| **WhatsApp** | +8618681535670           | Alternativo     |
| **Sito**     | https://www.4p-touch.com | Documentazione  |

---

## ⏰ TIMELINE PREVISTA

| Azione                  | Tempo      | Priorità |
| ----------------------- | ---------- | -------- |
| Contatto produttore     | **OGGI**   | 🔴 ALTA  |
| Risposta email/WhatsApp | 24-48h     | 🟡 MEDIA |
| FOTA o documentazione   | 2-5 giorni | 🟢 BASSA |
| Implementazione finale  | 1-2 giorni | 🟢 BASSA |

---

## 🎯 RISULTATI ATTESI

### ✅ **Scenario Ottimale**

1. Produttore fornisce chiave AES
2. Decoder funziona immediatamente
3. Dati decrittati automaticamente

### 🔄 **Scenario Alternativo**

1. FOTA verso firmware senza crittografia
2. Orologio usa protocollo standard
3. Server funziona senza modifiche

### ⚠️ **Scenario Peggiore**

1. Produttore non collabora
2. Reverse engineering necessario
3. Tempi più lunghi per soluzione

---

## 💡 SUGGERIMENTI AGGIUNTIVI

### 🔍 **Analisi Dati**

- Raccogli più campioni di dati AQSH+
- Confronta pattern tra diversi messaggi
- Cerca sequenze ripetitive

### 🛡️ **Backup Plan**

- Considera orologio alternativo senza crittografia
- Valuta produttori più collaborativi
- Mantieni documentazione per casi futuri

### 📚 **Documentazione**

- Salva tutte le comunicazioni con il produttore
- Documenta ogni tentativo di decrittazione
- Mantieni log dettagliati per debug

---

## 🚨 AZIONI IMMEDIATE

1. **📧 INVIA EMAIL** al produttore (template sopra)
2. **📱 CONTATTA WHATSAPP** per urgenza
3. **🔍 TESTA CONNESSIONE** con script fornito
4. **📊 MONITORA LOG** server per nuovi dati
5. **⏰ SEGUI UP** ogni 24h se no risposta

---

_Documento creato il 24 Dicembre 2024_  
_Progetto: GPS Watch Monitor - Fabio Marchetti_
