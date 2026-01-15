# 🔧 RISOLUZIONE TERMINALE BLOCCATO

## ❌ **Problema**

Dopo `pm2 logs gps-server --lines 50`, il terminale si blocca e non risponde ai comandi successivi come `netstat`.

---

## 🚀 **SOLUZIONI IMMEDIATE**

### 1️⃣ **Apri Nuova Sessione SSH**

```bash
# NON chiudere la sessione corrente
# Apri un nuovo terminale e connettiti di nuovo:
ssh root@91.99.141.225
```

### 2️⃣ **Uccidi Processo Bloccato**

```bash
# Trova PID del processo che si è bloccato
ps aux | grep "pm2 logs"

# Uccidi il processo specifico
kill -9 <PID>
```

### 3️⃣ **Usa Screen per Sessioni Separate**

```bash
# Crea nuova sessione screen
screen -S gps-logs

# Dentro screen, esegui i comandi
pm2 logs gps-server --lines 50
netstat -tlnp | grep :8001

# Esci da screen: CTRL+A poi D
# Ricollegati: screen -r gps-logs
```

### 4️⃣ **Comando in Background**

```bash
# Esegui in background e libera il terminale
pm2 logs gps-server --lines 50 &

# Controlla risultato dopo
jobs
fg %1  # per tornare al processo
```

### 5️⃣ **Salida Output su File**

```bash
# Salva log su file invece che a schermo
pm2 logs gps-server --lines 50 > /tmp/gps_logs.txt

# Poi visualizza il file
cat /tmp/gps_logs.txt
less /tmp/gps_logs.txt
```

---

## 🔍 **VERIFICHE ALTERNATIVE**

### 📊 **Controlla Server Direttamente**

```bash
# Metodo 1: Controlla processo node
ps aux | grep "server.js"

# Metodo 2: Controlla connessioni
ss -tlnp | grep :8001

# Metodo 3: Controlla PM2
pm2 status
pm2 jlist
```

### 📊 **Controlla Log Senza PM2**

```bash
# Controlla log PM2 direttamente
cat ~/.pm2/logs/gps-server-out.log
tail -f ~/.pm2/logs/gps-server-out.log

# Controlla log errori
cat ~/.pm2/logs/gps-server-error.log
```

### 📊 **Usa Journalctl (se systemd)**

```bash
# Controlla log di sistema
journalctl -u pm2 -f

# Controlla log del servizio
journalctl -u gps-server -f
```

---

## 🛠️ **RIPRISTINIO PM2**

### 🔄 **Riavvia PM2**

```bash
# Ferma tutti i processi PM2
pm2 kill all

# Riavvia PM2 daemon
pm2 resurrect

# Riavvia il server
pm2 start server.js --name "server"
```

### 🔄 **Reinstalla PM2**

```bash
# Disinstalla PM2
npm uninstall -g pm2

# Reinstalla PM2
npm install -g pm2

# Ricrea configurazione
pm2 startup
```

---

## 📱 **MONITORAGGIO ALTERNATIVO**

### 🌐 **Dashboard Web**

```bash
# Se hai una dashboard web, controlla via browser
curl http://91.99.141.225:3000/status
```

### 📊 **Query Database Dirette**

```bash
# Connettiti a PostgreSQL senza PM2
psql -h localhost -U gpsuser -d gpswatch

# Esegui query direttamente
SELECT COUNT(*) FROM device_config WHERE timestamp > NOW() - INTERVAL '1 hour';
```

---

## ✅ **VERIFICA RAPIDA**

### 📋 **Test Comandi Base**

```bash
# Test connessione server
curl -I http://localhost:8001

# Test database
psql -h localhost -U gpsuser -d gpswatch -c "SELECT NOW();"

# Test PM2
pm2 list
```

### 📋 **Controlla Risorse**

```bash
# CPU e memoria
top -p $(pgrep -f node)

# Spazio disco
df -h

# Rete
netstat -i
```

---

## 🎯 **SOLUZIONE CONSIGLIATA**

### 🥇 **Usa Screen Session**

```bash
# 1. Connettiti al server
ssh root@91.99.141.225

# 2. Crea sessione screen
screen -S gps-monitor

# 3. Dentro screen, avvia monitoraggio
watch -n 5 "pm2 logs gps-server --lines 20 && echo '---' && netstat -tlnp | grep :8001"
```

### 🥈 **Oppure Usa Tmux**

```bash
# Crea sessione tmux
tmux new -s gps

# Dividi finestra
tmux split-window -h

# In una finestra: log server
# Nell'altra: netstat
```

---

## 🆘 **SE TUTTO FALLISCE**

### 🔄 **Riavvia Server Manualmente**

```bash
# 1. Ferma tutto
pkill -f "node server.js"

# 2. Avvia manualmente
nohup node server.js > server.log 2>&1 &

# 3. Controlla
tail -f server.log
```

---

## 📋 **CHECKLIST SOLUZIONE**

- [ ] Aperto nuovo terminale/sessione
- [ ] Ucciso processo bloccato
- [ ] Eseguito comandi in sessione separata
- [ ] Verificato server in ascolto
- [ ] Controllato dati in arrivo
- [ ] Terminali non più bloccati

---

_📅 Aggiornato: 24 Dicembre 2024_  
_🎯 Obiettivo: Risolvere blocco terminale PM2_  
_✅ Status: SOLUZIONI PRONTE_
