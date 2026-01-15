# 🚀 ORDINE OPERAZIONI SEMPLIFICATO

## 🎯 Situazione Attuale

Con il **FOTA completato**, i dati arrivano in chiaro via TCP. Twilio SMS è solo **backup emergenze**.

---

## 📋 **ORDINE SEMPLIFICATO**

### 🥇 **PASSO 1: Connessione Server**

```bash
ssh root@91.99.141.225
cd /percorso/gps-server/
```

### 🥈 **PASSO 2: Backup Attuale**

```bash
cp server.js server.js.backup
```

### 🥉 **PASSO 3: Caricamento File**

Dal tuo Mac `/Users/fabio/NEXT_JS/gps-tracker/` carica sul server:

🔴 **CRITICI da sovrascrivere:**

- `server.js` (aggiornato con nuovi comandi)
- `package.json` (dipendenze nuove)

🟡 **IMPORTANTI:**

- `create_new_tables.sql` (nuove tabelle database)

### 🥇 **PASSO 4: Installazione**

```bash
npm install
psql -h localhost -U gpsuser -d gpswatch -f create_new_tables.sql
```

### 🥇 **PASSO 5: Riavvio Server**

```bash
pm2 stop server
pm2 start server.js --name "server"
pm2 logs server --lines 10
```

---

## ✅ **VERIFICHE FINALI**

### 🔍 **1. Server Attivo**

```bash
netstat -tlnp | grep :8001
# Dovresti vedere: tcp ... :8001 LISTEN
```

### 🔍 **2. Dati in Arrivo**

```bash
pm2 logs server | grep -E "(CONFIG|LK|health_data)"
```

### 🔍 **3. Database Popolato**

```sql
SELECT COUNT(*) FROM device_config;
SELECT COUNT(*) FROM health_data WHERE recorded_at > NOW() - INTERVAL '1 day';
```

---

## 📱 **SMS - SOLO SE VUOI**

### 🆘 **Se vuoi backup SMS:**

1. Carica anche `server_sms_backup.js`
2. Configura `.env` con credenziali Twilio
3. Avvia: `pm2 start server_sms_backup.js --name "sms-backup"`

### 💰 **Costi SMS:**

- **Senza SMS**: €0/mese (dati via TCP)
- **Con SMS backup**: €0.50-1.00/mese (solo emergenze)

---

## 🎯 **RISULTATO FINALE**

### ✅ **Cosa Otterrai:**

- **Server TCP** su porta 8001 con dati in chiaro ✅
- **Database** completo con tutte le tabelle ✅
- **Dati sanitari** real-time dall'orologio ✅
- **Backup automatico** database programmato ✅
- **SMS opzionale** solo per emergenze ✅

### ❌ **Cosa NON ti serve più:**

- ❌ Account Twilio (dati arrivano via TCP)
- ❌ Server SMS complesso (solo backup)
- ❌ Test SMS automatici (non necessari)

---

## 📋 **CHECKLIST MINIMA**

- [ ] Connesso al server
- [ ] Caricati server.js e package.json
- [ ] Caricato create_new_tables.sql
- [ ] Eseguito script database
- [ ] Server riavviato
- [ ] Dati in arrivo dai log

---

## 🚨 **SE QUALCOSA NON VA**

### ❌ **Server non parte:**

```bash
pm2 logs server --err
node -c server.js
```

### ❌ **Nessun dato:**

```bash
# Controlla connessione orologio
pm2 logs server | grep "CONNESSIONE"
# Forse l'orologio è spento o offline
```

### ❌ **Database errori:**

```bash
psql -h localhost -U gpsuser -d gpswatch -c "SELECT NOW();"
```

---

## 🎉 **CONGRATULAZIONI!**

Una volta completati questi passi:

- ✅ **Dati sanitari real-time** senza costi
- ✅ **Sistema stabile** e professionale
- ✅ **Backup automatico** affidabile
- ✅ **SMS emergenze** solo se necessario

---

_📅 Guida semplificata: 24 Dicembre 2024_  
_🎯 Focus: Dati TCP + Database + SMS opzionale_  
_✅ Status: PRONTO PER PRODUZIONE_
