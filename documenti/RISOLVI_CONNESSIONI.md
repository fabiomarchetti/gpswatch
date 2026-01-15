# 🔧 RISOLUZIONE CONNESSIONI SERVER

## ❌ **Problema Identificato**

```
curl -I http://localhost:8001
Failed to connect to localhost port 8001 after 0 ms: Couldn't connect to server
```

Questo errore può avere diverse cause. Ecco la guida completa per diagnosticare e risolvere.

---

## 🔍 **DIAGNOSI IMMEDIATE**

### 1️⃣ **Verifica Stato Server**

```bash
# Controlla se il processo è attivo
pm2 status

# Controlla se è in esecuzione
ps aux | grep "[s]erver.js"

# Controlla log per errori
pm2 logs server --err

# Controlla se la porta è in ascolto
netstat -tlnp | grep :8001
```

### 2️⃣ **Verifica Connettività Locale**

```bash
# Test con netcat (se installato)
nc -z localhost 8001

# Test con telnet
telnet localhost 8001

# Test con socat
socat - TCP4 localhost:8001
```

### 3️⃣ **Controlla Processi in Ascolto**

```bash
# Processi in ascolto sulla porta 8001
lsof -i :8001

# Processi totali Node.js
ps aux | grep node
```

### 4️⃣ **Verifica Configurazione Firewall**

```bash
# Controlla UFW
ufw status

# Controlla iptables
iptables -L | grep 8001

# Controlla SELinux
sestatus | grep 8001
```

### 5️⃣ **Verifica Systemd Services**

```bash
# Controlla servizio PM2
systemctl status pm2

# Controlla se PM2 gestisce il processo
pm2 jlist | grep server

# Controlla log di PM2
journalctl -u pm2 -f --lines 10
```

---

## 🚀 **SOLUZIONI COMUNI**

### 🔄 **Soluzione 1: Server non in Esecuzione**

Se il processo non è attivo:

```bash
# Riavvia il server
pm2 start server.js --name "server"

# Verifica stato
pm2 status
```

### 🔄 **Soluzione 2: Porta Occupata**

Se la porta è già in uso:

```bash
# Trova il processo che usa la porta
PID=$(lsof -i :8001 | awk 'NR>1 {print $2}')

# Uccidi il processo specifico
kill -9 $PID

# Attendi 5 secondi
sleep 5

# Riavvia il server
pm2 restart server
```

### 🔄 **Soluzione 3: Firewall Bloccante**

Se il firewall blocca la porta:

```bash
# Controlla UFW
ufw status

# Se necessario, apri la porta
ufw allow 8001/tcp

# Controlla iptables
iptables -L | grep 8001
```

### 🔄 **Soluzione 4: IPv6 Abilitato**

Se IPv6 causa problemi:

```javascript
// Disattiva IPv6 nel server.js
const server = net.createServer(
  {
    ipv6Only: true,
    // ... altre opzioni
  },
  (socket) => {
    // ...
  }
);
```

### 🔄 **Soluzione 5: Permessi Errati**

Se ci sono errori di permessi:

```bash
# Controlla permessi del file
ls -la server.js

# Correggi permessi se necessario
chmod 755 server.js
chown root:root server.js
```

### 🔄 **Soluzione 6: Node.js in Modalità Debug**

Se necessario debuggare:

```javascript
// Abilita debug
NODE_OPTIONS='--inspect'

# Avvia con debug
node --inspect server.js
```

---

## 📊 **TEST POST-RISOLUZIONE**

### 🧪 **Test 1: Connessione Locale**

```bash
# Testa se server risponde localmente
curl -v http://localhost:8001

# Testa con timeout
timeout 5 curl -I http://localhost:8001
```

### 🧪 **Test 2: Connessione Esterna**

```bash
# Testa dall'IP del server
curl -I http://91.99.141.225:8001

# Testa con HTTPS (se configurato)
curl -I https://91.99.141.225:8001
```

### 🧪 **Test 3: Diagnostica Completa**

```bash
# Script di diagnostica completo
cat > /tmp/diagnosi_server.txt << 'EOF'
echo "=== DIAGNOSI SERVER $(date) ==="
echo "1. Stato PM2:"
pm2 status
echo ""
echo "2. Processi attivi:"
pm2 list
echo ""
echo "3. Porta in ascolto:"
netstat -tlnp | grep :8001
echo ""
echo "4. Connessioni attive:"
netstat -tnp | grep :8001 | wc -l
echo ""
echo "5. Log recenti:"
pm2 logs server --lines 20 | grep -E "(ERROR|WARN)" || echo "Nessun errore recente"
echo ""
echo "6. Utilizzo risorse:"
top -bn1 | head -5
echo ""
echo "7. Spazio disco:"
df -h | head -5
EOF

# Mostra diagnostica
cat /tmp/diagnosi_server.txt
```

---

## 🎯 **PROCEDURE AUTOMATICHE**

### 📋 **Script di Monitoraggio Continuo**

```bash
#!/bin/bash
# /root/monitor_server.sh

while true; do
    clear
    date
    echo "=== MONITORAGGIO SERVER $(date) ==="
    echo "1. Stato PM2:"
    pm2 status | grep -E "online\|errore" | head -1 || echo "offline"

    echo "2. Porta 8001:"
    netstat -tlnp | grep :8001 && echo "IN USO" || echo "NON IN USO"

    echo "3. Connessioni attive:"
    netstat -tnp | grep :8001 | wc -l

    echo "4. Log errori recenti:"
    pm2 logs server --err | tail -10 || echo "Nessun errore"

    echo "5. Utilizzo risorse:"
    top -bn1 | head -3 | awk '/Cpu\(s\)/{print $2}' | sed 's/%//'

    sleep 10
done
```

### 📋 **Script di Backup Automatico**

```bash
#!/bin/bash
# /root/backup_auto.sh

BACKUP_DIR="/backups/gpswatch"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🔄 Inizio backup $DATE..."

# Backup database
pg_dump -h localhost -U gpsuser -d gpswatch | gzip > $BACKUP_DIR/gpswatch_$DATE.sql.gz

# Pulizia backup vecchi
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "✅ Backup completato: gpswatch_$DATE.sql.gz"
```

---

## 🎯 **CHECKLIST FINALE**

- [ ] **Server PM2**: processo online e stabile
- [ ] **Porta 8001**: in ascolto e funzionante
- [ ] **Connessioni**: dati in arrivo dall'orologio
- [ ] **Database**: connesso e funzionante
- [ ] **Log**: nessun errore critico
- [ ] **Monitoraggio**: script attivi e funzionanti
- [ ] **Backup**: automatico e testato
- [ ] **Test locale**: `curl -I` funziona
- [ ] **Test esterno**: `curl -I` raggiungibile

---

## 🔧 **MANUTENZIONE PREVENTIVA**

### 📋 **Comandi Utili Frequenti**

```bash
# Stato server
pm2 status

# Log recenti
pm2 logs server --lines 20

# Riavvio se necessario
pm2 restart server

# Test connessione
curl -I http://localhost:8001

# Diagnostica completa
/root/monitor_server.sh
```

---

_📅 Aggiornato: 24 Dicembre 2024_  
_🎯 Obiettivo: Risolvere tutti i problemi di connessione server_  
_✅ Status: PRONTO PER RISOLUZIONE_
