# 🚀 GUIDA AVVIO SERVER CORRETTO

## ❌ **Errore PM2**

`Process or Namespace server not found` significa che PM2 non ha un processo chiamato "server".

---

## 🔍 **VERIFICA SITUAZIONE ATTUALE**

### 1️⃣ **Controlla processi attivi**

```bash
pm2 list
```

### 2️⃣ **Se non vedi "server", procedi così:**

```bash
# Opzione A: Avvia nuovo processo
pm2 start server.js --name "server"

# Opzione B: Salta PM2 e avvia direttamente
node server.js
```

---

## 🚀 **PROCEDURE CORRETTE**

### 📋 **Opzione 1: Con PM2 (raccomandato)**

```bash
# 1. Ferma tutti i processi
pm2 kill all

# 2. Avvia server con nome specifico
pm2 start server.js --name "server"

# 3. Verifica
pm2 status
pm2 logs server --lines 10
```

### 📋 **Opzione 2: Senza PM2 (se PM2 ha problemi)**

```bash
# 1. Ferma processi PM2
pm2 kill all

# 2. Avvia server direttamente
nohup node server.js > server.log 2>&1 &

# 3. Controlla log
tail -f server.log

# 4. Per fermare
pkill -f "node server.js"
```

### 📋 **Opzione 3: Screen (per persistenza)**

```bash
# 1. Crea sessione screen
screen -S gps-server

# 2. Avvia server nella sessione
node server.js

# 3. Stacca da screen: CTRL+A poi D
# 4. Ricollegati: screen -r gps-server
```

---

## 🔧 **VERIFICHE POST-AVVIO**

### 📊 **Controlla che server sia in ascolto**

```bash
# Controlla porta 8001
netstat -tlnp | grep :8001

# Dovresti vedere:
# tcp 0 0 0.0.0:8001 LISTEN 12345/node
```

### 📊 **Controlla log per errori**

```bash
# Se usi PM2
pm2 logs server --err

# Se usi node diretto
tail -f server.log | grep -i error
```

### 📊 **Test connessione database**

```bash
psql -h localhost -U gpsuser -d gpswatch -c "SELECT NOW();"
```

---

## 🆘 **RISOLUZIONE PROBLEMI COMUNI**

### ❌ **Porta già in uso**

```bash
# Trova processo usando la porta
lsof -i :8001

# Uccidi il processo
kill -9 <PID>

# Poi riavvia
pm2 start server.js --name "server"
```

### ❌ **Errori dipendenze**

```bash
# Controlla node modules
npm list

# Reinstalla se necessario
npm install
```

### ❌ **Permessi insufficienti**

```bash
# Controlla permessi file
ls -la server.js

# Rendi eseguibile se necessario
chmod +x server.js
```

---

## 🎯 **COMANDO FINALE CORRETTO**

### ✅ **Se PM2 è installato:**

```bash
pm2 start server.js --name "server"
```

### ✅ **Se PM2 ha problemi:**

```bash
node server.js
```

### ✅ **Per riavvio:**

```bash
pm2 restart server
```

### ✅ **Per fermare:**

```bash
pm2 stop server
```

---

## 📋 **CHECKLIST COMPLETA**

- [ ] Verificato processi attivi (`pm2 list`)
- [ ] Server avviato con nome corretto
- [ ] Porta 8001 in ascolto (`netstat`)
- [ ] Log senza errori
- [ ] Database connesso
- [ ] Dati in arrivo dall'orologio

---

_📅 Aggiornato: 24 Dicembre 2024_  
_🎯 Obiettivo: Avvio corretto server GPS Watch_  
_✅ Status: PRONTO PER RISOLUZIONE ERRORI PM2_
