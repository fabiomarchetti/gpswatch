# 📊 VERIFICA DATI ARRIVATI

## 🎉 Server Avviato con Successo!

PM2 mostra:

- **Processo gps-server**: ✅ Online
- **Processo server**: ❌ Fermato (va bene così)
- **CPU**: 0% (ottimo)
- **Memoria**: 12.8mb (ottimo)

---

## 🔍 **VERIFICA DATI IN ARRIVO**

### 1️⃣ **Controlla Log Server**

```bash
pm2 logs gps-server --lines 50
```

### 2️⃣ **Controlla Connessioni Attive**

```bash
# Vedi se l'orologio è connesso
netstat -tlnp | grep :8001

# Dovresti vedere connessioni dall'IP dell'orologio
```

### 3️⃣ **Controlla Database**

```bash
# Verifica dati recenti
psql -h localhost -U gpsuser -d gpswatch -c "
SELECT
    'devices' as table, COUNT(*) as records, MAX(updated_at) as last_update
FROM devices
UNION ALL
SELECT
    'locations' as table, COUNT(*) as records, MAX(recorded_at) as last_update
FROM locations
UNION ALL
SELECT
    'health_data' as table, COUNT(*) as records, MAX(recorded_at) as last_update
FROM health_data
UNION ALL
SELECT
    'device_config' as table, COUNT(*) as records, MAX(timestamp) as last_update
FROM device_config;
"
```

---

## 📱 **TEST ORLOGGIO PER DATI**

### 🔄 **Testa Funzioni Sanitarie**

Sull'orologio, prova ad attivare:

1. **Frequenza Cardiaca**

   - Apri app "Cuore" o "HR"
   - Attiva monitoraggio per 30 secondi
   - Controlla log per pacchetto `bphrt`

2. **Temperatura**

   - Apri app "Temperatura"
   - Avvia misurazione
   - Controlla log per pacchetto `btemp2`

3. **Saturazione Ossigeno**

   - Apri app "Ossigeno" o "SpO2"
   - Avvia misurazione
   - Controlla log per pacchetto `oxygen`

4. **Pedometro**
   - Cammina per 100 passi
   - Controlla log per pacchetto `steps`

---

## 📊 **QUERY UTILI PER VERIFICA**

### 🗄️ **Dati Dispositivo**

```sql
-- Informazioni complete dispositivo
SELECT
    d.imei,
    d.name,
    d.iccid,
    d.operator,
    d.imei_confirmed,
    d.health_functions_enabled,
    d.created_at,
    d.updated_at
FROM devices d
WHERE d.imei = '863737078055392';
```

### 🗄️ **Configurazione Recente**

```sql
-- Ultima configurazione ricevuta
SELECT
    config_data,
    timestamp
FROM device_config
WHERE imei = '863737078055392'
ORDER BY timestamp DESC
LIMIT 1;
```

### 🗄️ **Funzioni Abilitate**

```sql
-- Funzioni attive sull'orologio
SELECT
    functions_data,
    timestamp
FROM device_functions
WHERE imei = '863737078055392'
ORDER BY timestamp DESC
LIMIT 1;
```

### 🗄️ **Dati Sanitari Recenti**

```sql
-- Ultimi dati sanitari
SELECT
    heart_rate,
    systolic_bp,
    diastolic_bp,
    spo2,
    temperature,
    recorded_at
FROM health_data
WHERE imei = '863737078055392'
ORDER BY recorded_at DESC
LIMIT 10;
```

---

## 🎯 **CERCARE NEI LOG**

### 📋 **Pattern da Cercare**

```bash
# Cerca comandi CONFIG
pm2 logs gps-server | grep "CONFIG"

# Cerca funzioni abilitate
pm2 logs gps-server | grep "APPANDFNREPORT"

# Cerca dati sanitari
pm2 logs gps-server | grep -E "(bphrt|oxygen|btemp2)"

# Cerca heartbeat
pm2 logs gps-server | grep "LK"

# Cerca posizioni
pm2 logs gps-server | grep -E "(UD|UD2)"
```

### 📋 **Log in Tempo Reale**

```bash
# Segui log in tempo reale
pm2 logs gps-server --lines 0 -f

# Filtra per tipo dati
pm2 logs gps-server | grep -E "(health|CONFIG|LK)" --line-buffered
```

---

## 🚨 **SE NON ARRIVANO DATI**

### ❌ **Controlla Connessione Orologio**

```bash
# L'orologio è spento o offline?
pm2 logs gps-server | grep "DISCONNESSO"

# Controlla timeout
pm2 logs gps-server | grep "timeout"
```

### ❌ **Controlla Server**

```bash
# Server in ascolto sulla porta giusta?
netstat -tlnp | grep :8001

# Errori nel log?
pm2 logs gps-server --err
```

### ❌ **Controlla Database**

```bash
# Connessione DB funzionante?
psql -h localhost -U gpsuser -d gpswatch -c "SELECT NOW();"

# Permessi corretti?
ls -la /var/lib/postgresql/data/
```

---

## 📈 **MONITORAGGIO CONTINUO**

### 📊 **Script Monitoraggio**

```bash
# Crea script monitor.sh
nano /root/monitor_gps.sh

# Incolla questo contenuto:
#!/bin/bash
echo "=== MONITORAGGIO GPS WATCH $(date) ==="
echo "Server Status:"
pm2 list
echo ""
echo "Connessioni attive:"
netstat -tlnp | grep :8001
echo ""
echo "Dati recenti:"
psql -h localhost -U gpsuser -d gpswatch -c "
SELECT
    'Locations: ' || COUNT(*) FROM locations WHERE recorded_at > NOW() - INTERVAL '1 hour'
UNION ALL SELECT
    'Health: ' || COUNT(*) FROM health_data WHERE recorded_at > NOW() - INTERVAL '1 hour';"

# Rendi eseguibile
chmod +x /root/monitor_gps.sh
```

### ⏰ **Esegui Monitoraggio**

```bash
/root/monitor_gps.sh
```

---

## 🎯 **PROSSIMI PASSI**

### ✅ **Se dati arrivano correttamente:**

1. **Crea dashboard** per visualizzazione dati
2. **Imposta backup automatico** giorniero
3. **Configura notifiche** per allarmi
4. **Testa tutte le funzioni** sanitarie

### ❌ **Se dati non arrivano:**

1. **Verifica connessione** orologio
2. **Controlla configurazione** APN SIM
3. **Riavvia orologio** e attendi riconnessione
4. **Contatta assistenza** produttore

---

_📅 Aggiornato: 24 Dicembre 2024_  
_🎯 Obiettivo: Verifica ricezione dati FOTA_  
_✅ Status: SERVER AVVIATO - ATTESA DATI_
