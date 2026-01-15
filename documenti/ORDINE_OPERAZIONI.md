# 🚀 ORDINE ESATTO DELLE OPERAZIONI

## 🎯 Obiettivo

Mettere in produzione il sistema GPS Watch con dati FOTA decrittati

---

## 📋 **ORDINE CRONOLOGICO**

### 🥇 **PASSO 1: Connessione Server**

```bash
# 1. Connettiti alla VPS
ssh root@91.99.141.225

# 2. Vai alla cartella del progetto
cd /percorso/gps-server/
```

### 🥈 **PASSO 2: Backup Attuale**

```bash
# 3. Fai backup del server attuale
cp server.js server.js.backup
cp package.json package.json.backup

# 4. Verifica backup
ls -la *.backup
```

### 🥉 **PASSO 3: Caricamento File (FTP)**

```bash
# 5. Trasferisci file dal tuo Mac al server
# File da caricare da /Users/fabio/NEXT_JS/gps-tracker/:

🔴 CRITICI da sovrascrivere:
- server.js
- package.json

🟡 IMPORTANTI nuovi:
- create_new_tables.sql
- .env.example
- server_sms_backup.js
- GUIDA_BACKUP_DATABASE.md
```

### 🥇 **PASSO 4: Installazione Dipendenze**

```bash
# 6. Installa nuove dipendenze
npm install

# 7. Verifica installazione
npm list --depth=0
```

### 🥇 **PASSO 5: Database**

```bash
# 8. Crea nuove tabelle
psql -h localhost -U gpsuser -d gpswatch -f create_new_tables.sql

# 9. Verifica tabelle create
psql -h localhost -U gpsuser -d gpswatch -c "\dt"
```

### 🥇 **PASSO 6: Configurazione**

```bash
# 10. Crea file .env
cp .env.example .env

# 11. Modifica .env con i tuoi dati
nano .env
# Inserisci:
# TWILIO_ACCOUNT_SID="AC..."
# TWILIO_AUTH_TOKEN="..."
# TWILIO_PHONE_NUMBER="+39..."
# WATCH_PHONE_NUMBER="+39..."
# WATCH_PASSWORD="123456"
```

### 🥇 **PASSO 7: Riavvio Server**

```bash
# 12. Ferma server attuale
pm2 stop server

# 13. Avvia nuovo server
pm2 start server.js --name "server"

# 14. Verifica stato
pm2 status
pm2 logs server --lines 10
```

### 🥇 **PASSO 8: Test Dati**

```bash
# 15. Monitora log per nuovi comandi
pm2 logs server --lines 50

# 16. Controlla database
psql -h localhost -U gpsuser -d gpswatch -c "SELECT COUNT(*) FROM device_config;"
```

---

## ✅ **VERIFICHE POST-INSTALLAZIONE**

### 🔍 **Verifica 1: Server Attivo**

```bash
# Controlla che server sia in ascolto
netstat -tlnp | grep :8001

# Dovresti vedere qualcosa come:
# tcp 0 0.0.0.0:8001 LISTEN node/server.js
```

### 🔍 **Verifica 2: Database Funzionante**

```sql
-- Test connessione database
SELECT NOW();

-- Verifica tabelle nuove
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE '%device%' OR table_name LIKE '%sms%';
```

### 🔍 **Verifica 3: Log Dati**

```bash
# Controlla log per pacchetti CONFIG
pm2 logs server | grep CONFIG

# Controlla log per funzioni abilitate
pm2 logs server | grep APPANDFNREPORT
```

---

## 🚨 **RISOLUZIONE PROBLEMI**

### ❌ **Server non parte**

```bash
# Controlla errori
pm2 logs server --err

# Controlla sintassi
node -c server.js

# Controlla porte
lsof -i :8001
```

### ❌ **Database errori**

```bash
# Test connessione DB
psql -h localhost -U gpsuser -d gpswatch -c "SELECT 1;"

# Controlla credenziali
cat .env | grep DB_
```

### ❌ **File mancanti**

```bash
# Verifica tutti i file presenti
ls -la

# Manca qualcosa? Ricaricala via FTP
```

---

## 📱 **PASSO 9: Setup SMS Backup (Opzionale)**

```bash
# 17. Solo se vuoi backup SMS attivo
pm2 start server_sms_backup.js --name "sms-backup"

# 18. Configura webhook Twilio (se usi SMS)
# URL: https://91.99.141.225:3001/sms/webhook
```

---

## 📊 **PASSO 10: Setup Backup Database**

```bash
# 19. Crea script backup
nano /root/backup_gpswatch.sh
# Incolla contenuto da GUIDA_BACKUP_DATABASE.md

# 20. Rendi eseguibile
chmod +x /root/backup_gpswatch.sh

# 21. Programma backup giorniero
crontab -e
# Aggiungi: 0 2 * * * /root/backup_gpswatch.sh
```

---

## 🎯 **RISULTATO FINALE**

### ✅ **Cosa Otterrai:**

- **Server TCP** su porta 8001 che processa dati in chiaro
- **Database** con tutte le tabelle necessarie
- **Dati sanitari** in tempo reale dall'orologio
- **Sistema backup** SMS per emergenze
- **Backup automatico** database giorniero

### 📊 **Monitoraggio:**

```bash
# Server principale
pm2 logs server --lines 20

# Server SMS backup (se attivo)
pm2 logs sms-backup --lines 10

# Stato database
psql -h localhost -U gpsuser -d gpswatch -c "
SELECT
    (SELECT COUNT(*) FROM devices) as devices,
    (SELECT COUNT(*) FROM locations WHERE recorded_at > NOW() - INTERVAL '1 day') as locations_today,
    (SELECT COUNT(*) FROM health_data WHERE recorded_at > NOW() - INTERVAL '1 day') as health_today;
"
```

---

## 📋 **CHECKLIST FINALE**

### ✅ **Prima di Iniziare:**

- [ ] Ho accesso SSH al server
- [ ] Ho percorso esatto cartella progetto
- [ ] Ho backup file attuali

### ✅ **Durante Installazione:**

- [ ] File caricati correttamente
- [ ] Dipendenze installate
- [ ] Tabelle database create
- [ ] Server riavviato
- [ ] Log senza errori

### ✅ **Dopo Installazione:**

- [ ] Server in ascolto su porta 8001
- [ ] Dati arrivano dall'orologio
- [ ] Database popola correttamente
- [ ] Backup programmato

---

## 🆘 **CONTATTI SUPPORTO**

### 📞 **Se qualcosa non funziona:**

1. **Controlla log**: `pm2 logs server --err`
2. **Verifica connessione**: `telnet 91.99.141.225 8001`
3. **Test database**: `psql -h localhost -U gpsuser -d gpswatch`
4. **Controlla file**: `ls -la /percorso/gps-server/`

### 📧 **Comandi Utili:**

```bash
# Riavvio tutto
pm2 restart all

# Stato servizi
pm2 status

# Log completi
pm2 logs

# Pulizia log vecchi
pm2 flush
```

---

_📅 Guida aggiornata: 24 Dicembre 2024_  
_🎯 Obiettivo: Installazione ordinata sistema GPS Watch_  
_🚀 Stato: PRONTO PER ESECUZIONE PASSO-PASSO_
