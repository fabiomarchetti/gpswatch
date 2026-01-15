# 🖥 GUIDA COMPLETA SSH E SERVER MANAGEMENT

## 🎯 Obiettivo

Guida completa per la gestione del server GPS Watch via SSH

---

## 📋 **INDICE COMANDI**

### 🔄 **1. COMANDI BASE SERVER**

- `pm2 start/stop/restart` - Gestione processi
- `pm2 logs` - Visualizzazione log
- `pm2 status/list` - Stato processi
- `netstat/ss` - Controllo porte e connessioni

### 🗄️ **2. COMANDI DATABASE**

- `psql` - Connessione PostgreSQL
- Query SQL per dati GPS e sanitari
- Backup e ripristino database

### 📊 **3. COMANDI MONITORAGGIO**

- `top/htop` - Utilizzo risorse
- `df -h` - Spazio disco
- `free -h` - Utilizzo memoria
- `tail -f` - Log in tempo reale

### 🔧 **4. COMANDI SYSTEM**

- `systemctl` - Gestione servizi systemd
- `journalctl` - Log di sistema
- `crontab -e` - Programmazione task
- `ufw` - Firewall

### 📱 **5. COMANDI RETE**

- `ip/ifconfig` - Configurazione IP
- `ping/traceroute` - Test connettività
- `lsof` - Processi su porte
- `curl/wget` - Test HTTP/HTTPS

---

## 🚀 **PROCEDURE COMPLETE**

### 🔄 **1. AVVIO E GESTIONE SERVER**

#### 📋 **Avvio Server GPS**

```bash
# 1. Connettiti al server
ssh root@91.99.141.225

# 2. Vai alla cartella progetto
cd /percorso/gps-server/

# 3. Avvia il server
pm2 start server.js --name "server"

# 4. Verifica stato
pm2 status
pm2 logs server --lines 10
```

#### 📋 **Riavvio Server**

```bash
# Riavvio completo
pm2 restart server

# Riavvio manuale
pm2 stop server
pm2 start server.js --name "server"
```

#### 📋 **Arresto Server**

```bash
# Fermata completa
pm2 stop server

# Arresto forzata
pkill -f "node server.js"
```

#### 📋 **Visualizzazione Log**

```bash
# Log in tempo reale
pm2 logs server --lines 50 -f

# Log errori
pm2 logs server --err

# Log su file
pm2 logs server --lines 100 > /tmp/server_log.txt
cat /tmp/server_log.txt
```

---

### 🗄️ **2. GESTIONE DATABASE**

#### 📋 **Connessione Database**

```bash
# Connessione interattiva
psql -h localhost -U gpsuser -d gpswatch

# Connessione con password
psql -h localhost -U gpsuser -d gpswatch -W

# Connessione con credenziali da file
PGPASSWORD=GpsWatch2025! psql -h localhost -U gpsuser -d gpswatch
```

#### 📋 **Query Utili**

```sql
-- Dati dispositivo
SELECT * FROM devices WHERE imei = '863737078055392';

-- Posizioni recenti
SELECT * FROM locations
WHERE imei = '863737078055392'
ORDER BY recorded_at DESC
LIMIT 10;

-- Dati sanitari recenti
SELECT * FROM health_data
WHERE imei = '863737078055392'
ORDER BY recorded_at DESC
LIMIT 10;

-- Configurazioni dispositivo
SELECT * FROM device_config
WHERE imei = '863737078055392'
ORDER BY timestamp DESC
LIMIT 5;

-- Funzioni abilitate
SELECT * FROM device_functions
WHERE imei = '863737078055392'
ORDER BY timestamp DESC
LIMIT 1;
```

#### 📋 **Backup Database**

```bash
# Backup completo
pg_dump -h localhost -U gpsuser -d gpswatch > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup compresso
pg_dump -h localhost -U gpsuser -d gpswatch | gzip > backup_$(date +%Y%m%d).sql.gz

# Solo dati (senza schema)
pg_dump -h localhost -U gpsuser -d gpswatch --data-only > dati_$(date +%Y%m%d).sql
```

#### 📋 **Ripristino Database**

```bash
# Da backup completo
psql -h localhost -U gpsuser -d gpswatch < backup_20241224.sql

# Da backup compresso
gunzip -c backup_20241224.sql.gz | psql -h localhost -U gpsuser -d gpswatch

# Solo tabelle specifiche
psql -h localhost -U gpsuser -d gpswatch -c "TRUNCATE locations;"
psql -h localhost -U gpsuser -d gpswatch < locations_backup.sql
```

---

### 📊 **3. MONITORAGGIO SISTEMA**

#### 📋 **Utilizzo Risorse**

```bash
# Utilizzo CPU e memoria in tempo reale
top -p $(pgrep -f node)

# Utilizzo memoria
free -h

# Utilizzo disco
df -h

# Processi attivi
ps aux | grep node
```

#### 📋 **Controllo Porte e Connessioni**

```bash
# Porte in ascolto
netstat -tlnp

# Connessioni attive
netstat -tnp

# Processi su porte specifiche
lsof -i :8001

# Connessioni dall'orologio
netstat -tnp | grep :8001
```

#### 📋 **Log di Sistema**

```bash
# Log recenti del sistema
journalctl -n 50 --no-pager

# Log del servizio PM2
journalctl -u pm2 -n 20

# Log di PostgreSQL
journalctl -u postgresql -n 20
```

---

### 🔧 **4. GESTIONE SERVIZI SYSTEMD**

#### 📋 **Controllo Servizi**

```bash
# Stato tutti i servizi
systemctl status

# Stato servizio specifico
systemctl status pm2
systemctl status postgresql
systemctl status nginx  # se usi web server

# Elenco servizi abilitati
systemctl list-unit-files --state=enabled
```

#### 📋 **Gestione Servizi**

```bash
# Avvia servizio
systemctl start pm2
systemctl start postgresql

# Ferma servizio
systemctl stop pm2
systemctl stop postgresql

# Riavvia servizio
systemctl restart pm2
systemctl restart postgresql

# Abilita servizio all'avvio
systemctl enable pm2
systemctl enable postgresql

# Disabilita servizio all'avvio
systemctl disable pm2
systemctl disable postgresql
```

---

### 📱 **5. GESTIONE RETE E FIREWALL**

#### 📋 **Configurazione Rete**

```bash
# Indirizzi IP
ip addr show

# Interfacce di rete
ip link show

# Tabella di routing
ip route show

# Test connettività
ping -c 4 8.8.8.8
traceroute google.com
```

#### 📋 **Firewall UFW**

```bash
# Stato firewall
ufw status

# Abilita firewall
ufw enable

# Disabilita firewall
ufw disable

# Apri porta
ufw allow 8001/tcp
ufw allow 22/tcp

# Chiudi porta
ufw deny 8001/tcp
ufw delete allow 8001/tcp

# Mostra regole
ufw status verbose
```

#### 📋 **Test Connessioni Web**

```bash
# Test HTTP
curl -I http://localhost:8001

# Test HTTPS (se usi SSL)
curl -I https://91.99.141.225:8001

# Test con verbosità
curl -v http://localhost:8001

# Test con headers specifici
curl -H "Content-Type: application/json" http://localhost:8001/api/status
```

---

## 🛠️ **6. MANUTENZIONE E TROUBLESHOOTING**

#### 📋 **Pulizia Log**

```bash
# Pulizia log PM2
pm2 flush

# Pulizia log vecchi
find /var/log -name "*.log" -mtime +30 -delete

# Pulizia cache
npm cache clean --force
```

#### 📋 **Aggiornamento Sistema**

```bash
# Aggiorna pacchetti Ubuntu/Debian
apt update && apt upgrade -y

# Aggiorna pacchetti Node.js
npm update -g

# Aggiorna pacchetti globali
npm update -g
```

#### 📋 **Gestione File e Permessi**

```bash
# Trova file di grandi dimensioni
find /percorso/gps-server -type f -size +100M -exec ls -lh {} \;

# Controlla permessi
ls -la /percorso/gps-server/

# Cambia permessi
chmod 755 /percorso/gps-server/
chmod +x /percorso/gps-server/server.js

# Cambia proprietario
chown -R root:root /percorso/gps-server/
```

---

## 📋 **7. SCRIPT UTILI AUTOMATIZZATI**

#### 📋 **Script Monitoraggio Completo**

```bash
# Crea /root/monitor_gps.sh
#!/bin/bash

echo "=== MONITORAGGIO GPS WATCH $(date) ==="
echo "1. Stato Server:"
pm2 status
echo ""
echo "2. Porta in ascolto:"
netstat -tlnp | grep :8001
echo ""
echo "3. Connessioni attive:"
netstat -tnp | grep :8001 | wc -l
echo ""
echo "4. Utilizzo risorse:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}'%)"
echo "Memoria: $(free -h | awk '/^Mem:/ {print $3"/"$3}' | sed 's/M//')"
echo "Disco: $(df -h / | awk '/\// {print $3}')"
echo ""
echo "5. Dati recenti:"
psql -h localhost -U gpsuser -d gpswatch -c "
SELECT
    (SELECT COUNT(*) FROM locations WHERE recorded_at > NOW() - INTERVAL '1 hour') as locations,
    (SELECT COUNT(*) FROM health_data WHERE recorded_at > NOW() - INTERVAL '1 hour') as health_data
" 2>/dev/null | cat || echo "Errore connessione database"

chmod +x /root/monitor_gps.sh
```

#### 📋 **Script Backup Automatico**

```bash
# Crea /root/backup_auto.sh
#!/bin/bash

BACKUP_DIR="/backups/gpswatch"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Inizio backup $DATE..."

# Backup database
pg_dump -h localhost -U gpsuser -d gpswatch | gzip > $BACKUP_DIR/gpswatch_$DATE.sql.gz

# Pulizia backup vecchi (7 giorni)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completato: gpswatch_$DATE.sql.gz"
echo "Spazio utilizzato: $(du -sh $BACKUP_DIR | cut -f1)"

chmod +x /root/backup_auto.sh
```

#### 📋 **Crontab per Automazione**

```bash
# Edit crontab
crontab -e

# Aggiungi queste righe:
# Backup giorniero alle 2:00 AM
0 2 * * * /root/backup_auto.sh >> /var/log/backup.log 2>&1

# Monitoraggio ogni 5 minuti
*/5 * * * * /root/monitor_gps.sh >> /var/log/monitor.log 2>&1

# Riavvio server giorniero alle 3:00 AM
0 3 * * * /usr/bin/pm2 restart server >> /var/log/restart.log 2>&1
```

---

## 📋 **8. COMANDI DI EMERGENZA**

#### 📋 **Arresto Emergenza Server**

```bash
# Arresto immediato tutti i processi
pkill -f node
pm2 kill all

# Arresto forzato database
systemctl stop postgresql

# Svuota cache e pulisce
sync && echo 3 > /proc/sys/vm/drop_caches
```

#### 📋 **Ripristino di Emergenza**

```bash
# Avvia solo servizi essenziali
systemctl start postgresql
systemctl start networking

# Avvia server GPS in modalità sicura
node server.js --safe-mode

# Controlla stato
pm2 status
```

---

## 🎯 **BEST PRACTICES**

### ✅ **Sicurezza**

- Usa sempre SSH con chiavi invece di password
- Cambia porte default (8001 → porta personalizzata)
- Configura firewall per permettere solo porte necessarie
- Mantieni backup aggiornati e testati

### ✅ **Performance**

- Monitora regolarmente utilizzo risorse
- Pulisci log vecchi per evitare riempimento disco
- Usa PM2 per gestione processi Node.js
- Configura backup automatici giornieri

### ✅ **Affidabilità**

- Configura health check per servizi critici
- Usa systemd per riavvio automatico servizi
- Implementa notifiche per errori critici
- Mantieni documentazione aggiornata

---

## 📋 **9. RIFERIMENTI RAPIDI**

### 🔄 **PM2**

```bash
pm2 restart server          # Riavvia
pm2 logs server --lines 100 # Ultimi 100 log
pm2 monit                   # Monitoraggio
pm2 delete server           # Rimuovi processo
```

### 🗄️ **PostgreSQL**

```bash
psql -c "\l"              # Lista database
psql -c "\d"              # Lista tabelle
psql -c "\d table_name"    # Struttura tabella
\dt+                       # Tabelle con dimensioni
```

### 📊 **Sistema**

```bash
journalctl -u pm2 -f       # Log PM2 in tempo reale
systemctl --failed          # Servizi falliti
df -h --total              # Spazio disco completo
free -m                   # Memoria in MB
```

---

## 🆘 **CONTATTI SUPPORTO**

### 📞 **Per problemi critici**

1. **Server non risponde**: Controlla `netstat -tlnp | grep :8001`
2. \*\*Database errori`: Verifica `systemctl status postgresql`
3. **Alto utilizzo risorse**: Controlla `top` e `free`
4. **Connessioni orologio**: Analizza log PM2 per IP client

### 📞 **Comandi diagnostici**

```bash
# Stato completo sistema
systemctl status --all

# Log recenti con dettagli
journalctl -xe

# Processi Node.js
ps aux | grep -E "node|gps"

# Connessioni di rete
ss -tuln
```

---

_📅 Guida aggiornata: 24 Dicembre 2024_  
_🎯 Obiettivo: Gestione completa server GPS Watch_  
_✅ Status: RIFERIMENTO COMPLETO SSH E SYSTEM_
