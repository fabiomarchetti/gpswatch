# 💾 GUIDA BACKUP DATABASE GPS WATCH

## 🎯 Situazione Attuale

Con il **FOTA completato**, i dati arrivano in chiaro via TCP. Il backup diventa un processo semplice e diretto.

---

## 📊 **Cosa Backuppare**

### 🗄️ **Tabelle Principali**

```sql
-- Dati dispositivi
SELECT * FROM devices;

-- Posizioni GPS
SELECT * FROM locations ORDER BY recorded_at DESC;

-- Dati sanitari
SELECT * FROM health_data ORDER BY recorded_at DESC;

-- Allarmi
SELECT * FROM alarms ORDER BY recorded_at DESC;
```

### 📱 **Tabelle Nuove (dal FOTA)**

```sql
-- Configurazione dispositivo
SELECT * FROM device_config ORDER BY timestamp DESC;

-- Funzioni abilitate
SELECT * FROM device_functions ORDER BY timestamp DESC;

-- Status SMS reminder
SELECT * FROM sms_reminder_status ORDER BY timestamp DESC;
```

---

## 🔄 **Metodi di Backup**

### 1️⃣ **Backup Automatico con pg_dump**

#### 📋 **Backup Completo**

```bash
# Sul server
pg_dump -h localhost -U gpsuser -d gpswatch > backup_completo_$(date +%Y%m%d_%H%M%S).sql

# Compresso
pg_dump -h localhost -U gpsuser -d gpswatch | gzip > backup_completo_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### 📋 **Backup Solo Dati**

```bash
# Solo dati, non schema
pg_dump -h localhost -U gpsuser -d gpswatch --data-only > backup_dati_$(date +%Y%m%d_%H%M%S).sql

# Solo tabelle importanti
pg_dump -h localhost -U gpsuser -d gpswatch -t devices -t locations -t health_data -t alarms > backup_core_$(date +%Y%m%d_%H%M%S).sql
```

### 2️⃣ **Backup Programmato (Cron)**

#### ⏰ **Backup Giorniero**

```bash
# Crontab -e
# Aggiungi questa riga per backup giorniero alle 2:00 AM
0 2 * * * /usr/bin/pg_dump -h localhost -U gpsuser -d gpswatch | gzip > /backups/gpswatch_$(date +\%Y\%m\%d).sql.gz
```

#### ⏰ **Backup Settimanale**

```bash
# Ogni domenica alle 3:00 AM
0 3 * * 0 /usr/bin/pg_dump -h localhost -U gpsuser -d gpswatch > /backups/gpswatch_settimanale_$(date +\%Y\%m\%d).sql
```

### 3️⃣ **Backup Script Personalizzato**

#### 📄 **Script Backup Completo**

Crea file `/root/backup_gpswatch.sh`:

```bash
#!/bin/bash

# Configurazione
DB_HOST="localhost"
DB_USER="gpsuser"
DB_NAME="gpswatch"
BACKUP_DIR="/backups/gpswatch"
DATE=$(date +%Y%m%d_%H%M%S)

# Crea directory se non esiste
mkdir -p $BACKUP_DIR

# Backup completo compresso
echo "🔄 Inizio backup completo..."
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/gpswatch_completo_$DATE.sql.gz

# Backup solo dati recenti (ultimi 30 giorni)
echo "🔄 Inizio backup dati recenti..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
\copy (
    SELECT * FROM devices WHERE updated_at > NOW() - INTERVAL '30 days'
    UNION ALL
    SELECT * FROM locations WHERE recorded_at > NOW() - INTERVAL '30 days'
    UNION ALL
    SELECT * FROM health_data WHERE recorded_at > NOW() - INTERVAL '30 days'
    UNION ALL
    SELECT * FROM alarms WHERE recorded_at > NOW() - INTERVAL '30 days'
) TO stdout WITH CSV HEADER
" | gzip > $BACKUP_DIR/gpswatch_recenti_$DATE.csv.gz

# Pulizia vecchi backup (mantiene ultimi 7 giorni)
echo "🗑️ Pulizia vecchi backup..."
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# Log backup
echo "✅ Backup completato: $DATE" >> $BACKUP_DIR/backup.log

echo "🎉 Backup completato!"
```

#### 🔧 **Rendi Script Eseguibile**

```bash
chmod +x /root/backup_gpswatch.sh
```

---

## 📂 **Struttura Backup Consigliata**

### 📁 **Directory Backup**

```
/backups/gpswatch/
├── giornieri/
│   ├── 20241224_gpswatch.sql.gz
│   ├── 20241223_gpswatch.sql.gz
│   └── ...
├── settimanali/
│   ├── 2024_W52_gpswatch.sql.gz
│   └── ...
├── mensili/
│   ├── 2024_12_gpswatch.sql.gz
│   └── ...
└── log/
    └── backup.log
```

---

## 🔄 **Ripristino Database**

### 1️⃣ **Ripristino Completo**

```bash
# Ferma server prima del ripristino
pm2 stop server

# Ripristina da backup
gunzip -c backup_completo_20241224_020000.sql.gz | psql -h localhost -U gpsuser -d gpswatch

# Riavvia server
pm2 start server.js --name "server"
```

### 2️⃣ **Ripristino Selettivo**

```bash
# Solo tabella locations
psql -h localhost -U gpsuser -d gpswatch -c "TRUNCATE TABLE locations;"
psql -h localhost -U gpsuser -d gpswatch < locations_backup.sql

# Solo dati sanitari
psql -h localhost -U gpsuser -d gpswatch -c "TRUNCATE TABLE health_data;"
psql -h localhost -U gpsuser -d gpswatch < health_data_backup.sql
```

---

## 📊 **Monitoraggio Backup**

### 📋 **Script Verifica Backup**

```bash
#!/bin/bash
# /root/check_backup.sh

BACKUP_DIR="/backups/gpswatch"
MAX_AGE=2 # giorni

echo "🔍 Verifica backup..."

# Controlla ultimo backup
LAST_BACKUP=$(find $BACKUP_DIR -name "*.gz" -mtime -$MAX_AGE -printf "%T@ %p\n" | sort -n | tail -1 | cut -d' ' -f2-)

if [ -n "$LAST_BACKUP" ]; then
    BACKUP_DATE=$(stat -c %y "$LAST_BACKUP")
    echo "✅ Ultimo backup: $BACKUP_DATE"
    echo "📁 File: $LAST_BACKUP"
    echo "📊 Dimensione: $(du -h "$LAST_BACKUP" | cut -f1)"
else
    echo "❌ NESSUN BACKUP RECENTE TROVATO!"
    echo "⚠️ Backup più vecchi di $MAX_AGE giorni"
fi

# Spazio utilizzato
TOTAL_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
echo "💾 Spazio totale backup: $TOTAL_SIZE"
```

---

## 🌐 **Backup Remoto**

### ☁️ **Upload su Cloud Storage**

```bash
# Google Drive (rclone)
rclone copy /backups/gpswatch/ remote:backups/gpswatch/

# AWS S3
aws s3 sync /backups/gpswatch/ s3://tuobucket/gpswatch/

# FTP Remoto
lftp -u username,password -e "mirror -R /backups/gpswatch/ /remote/path/"
```

---

## 📱 **Automazione Completa**

### ⚙️ **Setup Automatico**

```bash
# 1. Crea script backup
nano /root/backup_gpswatch.sh
# Incolla il codice sopra

# 2. Rendi eseguibile
chmod +x /root/backup_gpswatch.sh

# 3. Aggiungi a crontab
crontab -e

# 4. Aggiungi righe:
# Backup giorniero alle 2:00
0 2 * * * /root/backup_gpswatch.sh

# Verifica backup alle 9:00
0 9 * * * /root/check_backup.sh

# 5. Salva e esci
```

---

## 📋 **Procedure di Disaster Recovery**

### 🚨 **In Caso di Corruzione Database**

```bash
# 1. Identifica ultimo backup funzionante
ls -la /backups/gpswatch/ | tail -5

# 2. Ferma tutti i servizi
pm2 stop all

# 3. Ricrea database vuoto
dropdb -h localhost -U gpsuser gpswatch
createdb -h localhost -U gpsuser gpswatch

# 4. Ripristina schema
psql -h localhost -U gpsuser -d gpswatch < schema_backup.sql

# 5. Ripristina dati
gunzip -c /backups/gpswatch/gpswatch_completo_ULTIMO.sql.gz | psql -h localhost -U gpsuser -d gpswatch

# 6. Riavvia servizi
pm2 start all
```

---

## 🎯 **Best Practices**

### ✅ **Frequenza Backup**

- **Giorniero**: Per dati critici
- **Settimanale**: Per snapshot completi
- **Mensile**: Per archivio lungo termine

### ✅ **Conservazione**

- **Ultimi 7 giorni**: Backup giornieri
- **Ultimi 4 settimane**: Backup settimanali
- **Ultimi 12 mesi**: Backup mensili

### ✅ **Sicurezza**

- **Crittografare backup**: `gpg --symmetric --cipher-algo AES256`
- **Storage offline**: Backup esterni disconnessi
- **Test ripristino**: Verifica periodica backup

---

## 📊 **Query Utili per Verifica**

### 🔍 **Integrità Dati**

```sql
-- Controlla dati recenti
SELECT
    'devices' as table_name, COUNT(*) as records, MAX(updated_at) as last_update
FROM devices
UNION ALL
SELECT
    'locations' as table_name, COUNT(*) as records, MAX(recorded_at) as last_update
FROM locations
UNION ALL
SELECT
    'health_data' as table_name, COUNT(*) as records, MAX(recorded_at) as last_update
FROM health_data;
```

### 📈 **Statistiche Backup**

```sql
-- Dimensioni tabelle
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

_📅 Guida aggiornata: 24 Dicembre 2024_  
_🎯 Obiettivo: Backup semplice e affidabile database GPS_  
_💾 Metodo: pg_dump + automazione + cloud storage_
