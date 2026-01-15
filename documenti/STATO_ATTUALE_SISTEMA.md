# 📊 STATO ATTUALE DEL SISTEMA GPS TRACKER

Ultimo aggiornamento: 29 Dicembre 2025

---

## 🏗️ ARCHITETTURA SISTEMA

```
┌─────────────────────────────────────────────────┐
│  OROLOGIO GPS C405_KYS_S5                  │
│  - IMEI: 863737078055392                │
│  - Password: 123456                           │
│  - Device ID: 3707805539 (ultimi 10 cifre) │
└────────────┬────────────────────────────────┘
             │
             ├── SMS (tramite SMS Gate Android)
             │   └─> Invio comandi: pw,123456,ts#
             │   └─> Ricezione risposte automatiche
             │   └─> Comandi disponibili:
             │       • ts - Configurazione Completa
             │       • url - Configurazione URL
             │       • bat - Stato Batteria
             │       • ver - Versione Firmware
             │       • reboot - Riavvia Orologio
             │       • hrt - Frequenza Cardiaca
             │       • bp - Pressione Sanguigna
             │       • oxygen - Saturazione Ossigeno
             │       • temp - Temperatura Corporea
             │       • ip - Configura Server
             │       • upload - Intervallo Upload
             │       • lz - Zona GPS
             │
             ├── TCP (tramite server Node.js VPS)
             │   └─> Invio comandi: [3G*ID*LEN*CMD]
             │   └─> Ricezione heartbeat: LK,0,0,63
             │   └─> Ricezione posizioni: UD/UD2
             │   └─> Comandi disponibili:
             │       • CR - Posizione Immediata
             │       • LK - Heartbeat/Status
             │       • bphrt - Pressione e Battito
             │       • oxygen - Saturazione Ossigeno
             │       • btemp2 - Temperatura
             │       • VERNO - Versione Firmware
             │       • RESET - Reset Fabbrica
             │       • POWEROFF - Spegni Orologio
             │       • UPLOAD - Intervallo Upload
             │
             ▼
┌─────────────────────────────────────────────────┐
│  SERVER NODE.JS (VPS: 91.99.141.225)   │
│  - Porta TCP: 8001 (ricezione)          │
│  - Porta HTTP: 3000 (invio comandi)      │
│  - Database: PostgreSQL (gpswatch)          │
│  - Password DB: GpsWatch2025 (senza !)    │
└────────────┬────────────────────────────────┘
             │
             ├── Parser comandi GPS
             ├── Salvataggio dati nel DB
             ├── Invio comandi agli orologi
             └─> API HTTP per comandi TCP
             │
             ▼
┌─────────────────────────────────────────────────┐
│  DATABASE POSTGRESQL (VPS)                  │
│  - devices (dispositivi)                     │
│  - locations (posizioni GPS)                  │
│  - health_data (dati sanitari)               │
│  - alarms (allarmi SOS)                      │
│  - sms_logs (log comandi SMS)                │
│  - device_config (configurazioni)              │
│  - device_functions (funzioni app)            │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│  FRONTEND NEXT.JS (localhost:3000)         │
│  - Dashboard Sviluppatore                   │
│  - SendCommandPanel (invio comandi)          │
│  - WatchLogsPanel (visualizzazione log)        │
│  - API Routes (SMS/TCP)                    │
│  - Timeout connessione DB: 30 secondi        │
└─────────────────────────────────────────────────┘
```

---

## ✅ STATO COMPONENTI

### Server VPS (91.99.141.225)

- ✅ **Server TCP**: Porta 8001 - RICEVE DATI DAGLI OROLOGI
- ✅ **Server HTTP**: Porta 3000 - INVIA COMANDI TCP
- ✅ **Database**: Connesso e funzionante
- ✅ **Dispositivo registrato**: 3707805539
- ✅ **Heartbeat**: Ricevuti correttamente ogni ~40 secondi
- ✅ **Batteria**: 63%
- ✅ **Aggiornamento DB**: 1 riga modificata per heartbeat

### Database VPS

- ✅ **devices**: 1 dispositivo registrato
- ✅ **health_data**: 7 record sanitari
- ⚠️ **locations**: 0 posizioni (orologio invia solo heartbeat)
- ⚠️ **sms_logs**: 0 record (route aggiornata ma logs non salvati)

### Frontend Next.js (localhost:3000)

- ✅ **Dashboard Sviluppatore**: Componenti integrati
- ✅ **Invio comandi SMS**: Funzionante
- ✅ **Invio comandi TCP**: Funzionante (quando orologio connesso)
- ✅ **Visualizzazione log**: Funzionante
- ✅ **Comando url# aggiunto**: Per configurazione URL server
- ⚠️ **Connessione DB**: Timeout dopo 10 secondi (aumentato a 30s)

---

## 📋 COMANDI DISPONIBILI

### Comandi SMS (funzionano sempre)

1. **pw,123456,ts#** - Configurazione Completa
2. **pw,123456,url#** - Configurazione URL Server
3. **pw,123456,bat#** - Stato Batteria
4. **pw,123456,ver#** - Versione Firmware
5. **pw,123456,reboot#** - Riavvia Orologio
6. **pw,123456,hrt#** - Frequenza Cardiaca
7. **pw,123456,bp#** - Pressione Sanguigna
8. **pw,123456,oxygen#** - Saturazione Ossigeno
9. **pw,123456,temp#** - Temperatura Corporea
10. **pw,123456,ip,91.99.141.225,8001#** - Configura Server
11. **pw,123456,upload,30000#** - Intervallo Upload (30s)
12. **pw,123456,lz,12#** - Zona GPS Italia

### Comandi TCP (richiedono connessione orologio)

1. **CR** - Posizione Immediata
2. **LK** - Heartbeat/Status
3. **bphrt** - Pressione e Battito
4. **oxygen** - Saturazione Ossigeno
5. **btemp2** - Temperatura
6. **VERNO** - Versione Firmware
7. **RESET** - Reset Fabbrica
8. **POWEROFF** - Spegni Orologio
9. **UPLOAD,300** - Intervallo Upload (5 min)

---

## ⚠️ PROBLEMI RILEVATI

### 1. Timeout Connessione Database VPS

**Problema**: Il frontend Next.js locale sta cercando di connettersi al DB VPS (91.99.141.225:5432) ma la connessione scade dopo 10 secondi.

**Sintomi**:

```
Errore recupero log SMS: Error: Connection terminated due to connection timeout
Errore durante il recupero dispositivi: Error: Connection terminated due to connection timeout
```

**Soluzione**: Timeout aumentato da 10 a 30 secondi in [`lib/db.ts`](lib/db.ts:1)

### 2. Tabella sms_logs Vuota

**Problema**: Nonostante la route SMS sia stata aggiornata per salvare correttamente i log, la tabella `sms_logs` contiene 0 record.

**Possibili Cause**:

- I log SMS ricevuti non vengono salvati correttamente
- La query INSERT potrebbe fallire silenziosamente
- Il gateway Android potrebbe non inviare i webhook

**Soluzione**: Aggiungere logging dettagliato nella route [`app/api/sms/receive/route.ts`](app/api/sms/receive/route.ts:1)

---

## 🎯 PROSSIMI PASSI PER TEST

### 1. Testa Comandi SMS

1. Accedi alla dashboard: `http://localhost:3000/dashboard`
2. Vai alla sezione "Invia Comando"
3. Seleziona il dispositivo
4. Scegli "SMS" come tipo comando
5. Seleziona categoria "Base"
6. Seleziona comando "Configurazione Completa" (`pw,123456,ts#`)
7. Clicca "Invia Comando"
8. Attendi 10-30 secondi
9. Vai alla sezione "Log Orologio"
10. Verifica che il log sia arrivato con i dati parsati

### 2. Verifica Dati nel Database

```bash
ssh root@91.99.141.225
PGPASSWORD='GpsWatch2025' psql -h localhost -U gpsuser -d gpswatch -c "SELECT COUNT(*) FROM sms_logs;"
PGPASSWORD='GpsWatch2025' psql -h localhost -U gpsuser -d gpswatch -c "SELECT COUNT(*) FROM devices;"
```

### 3. Testa Comandi TCP (solo se orologio connesso)

1. Verifica che l'orologio sia connesso al server VPS
2. Dalla dashboard, scegli "TCP" come tipo comando
3. Seleziona categoria "TCP Posizione"
4. Seleziona comando "Posizione Immediata" (`CR`)
5. Clicca "Invia Comando"
6. Verifica i log server VPS: `pm2 logs gps-server --lines 30`

---

## 📝 NOTE IMPORTANTI

1. **Comandi SMS funzionano sempre** - Non richiedono connessione TCP dell'orologio
2. **Comandi TCP richiedono connessione** - L'orologio deve essere connesso al server VPS (91.99.141.225:8001)
3. **Tutti i dati salvati nel DB VPS** - Non c'è più duplicazione tra DB locale e VPS
4. **Sviluppo locale con dati reali** - Puoi continuare a sviluppare in locale usando il DB VPS
5. **Timeout connessione DB aumentato** - Da 10 a 30 secondi per connessioni remote
6. **Password DB corretta**: `GpsWatch2025` (senza punto esclamativo)

---

## 🚀 FUNZIONALITÀ DA IMPLEMENTARE

1. **Mappa GPS Interattiva** - Visualizzazione posizioni orologi su mappa con Leaflet
2. **Grafici Sanitari** - Visualizzazione dati sanitari con Recharts
3. **Sistema Notifiche** - Allarmi e avvisi in tempo reale
4. **Geofencing UI** - Gestione aree geografiche per gli orologi
5. **Esportazione Dati** - Export in CSV/PDF dei dati
6. **Backup Automatici** - Backup programmato del database

---

## 📞 COMANDI UTILI

### Verifica Stato Server VPS

```bash
ssh root@91.99.141.225
pm2 status
pm2 logs gps-server --lines 50
```

### Verifica Database

```bash
ssh root@91.99.141.225
PGPASSWORD='GpsWatch2025' psql -h localhost -U gpsuser -d gpswatch
```

### Riavvio Server VPS

```bash
ssh root@91.99.141.225
pm2 restart gps-server
```

### Verifica Connessione Orologio

```bash
ssh root@91.99.141.225
pm2 logs gps-server | grep "CONNESSIONE"
```

---

## 📊 STATISTICHE SISTEMA

- **Dispositivi Attivi**: 1 (3707805539)
- **Heartbeat Ricevuti**: ~1 ogni 40 secondi
- **Livello Batteria**: 63%
- **Dati Sanitari**: 7 record
- **Posizioni GPS**: 0 (orologio in modalità heartbeat)
- **Allarmi SOS**: 0
- **Log SMS**: 0 (da verificare)

---

**Ultimo aggiornamento**: 29 Dicembre 2025 - 16:35
