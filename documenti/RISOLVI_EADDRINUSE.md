# 🔧 RISOLUZIONE ERRORE EADDRINUSE

## ❌ **Problema Identificato**

```
Error: listen EADDRINUSE: address already in use 0.0.0.0:8001
```

Questo errore significa che **un altro processo sta già usando la porta 8001**.

---

## 🔍 **DIAGNOSI RAPIDA**

### 1️⃣ **Controlla Processi sulla Porta**

```bash
# Trova tutti i processi usando la porta 8001
lsof -i :8001

# Output esempio:
# COMMAND   PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
# node      12345   root   6u  IPv4 0t0  TCP *:8001 (LISTEN)
```

### 2️⃣ **Controlla Tutti i Processi Node.js**

```bash
# Tutti i processi Node.js attivi
ps aux | grep node

# Controlla se ci sono altri server.js
ps aux | grep "server.js"
```

### 3️⃣ **Controlla PM2**

```bash
# Lista tutti i processi PM2
pm2 list

# Controlla stato processi
pm2 jlist
```

---

## 🚀 **SOLUZIONI IMMEDIATE**

### 🥇 **SOLUZIONE 1: Uccidi Processo Occupante**

```bash
# Trova PID del processo sulla porta 8001
PID=$(lsof -t -i :8001 | awk 'NR>1 {print $2}')

# Uccidi il processo
kill -9 $PID

# Verifica che la porta sia libera
lsof -i :8001
```

### 🥈 **SOLUZIONE 2: Ferma PM2**

```bash
# Ferma tutti i processi PM2
pm2 kill all

# Riavvia solo il server corretto
pm2 start server.js --name "server"
```

### 🥉 **SOLUZIONE 3: Cambia Porta Server**

```bash
# Modifica server.js per usare porta diversa
nano server.js

# Cerca questa riga:
const PORT = process.env.PORT || 8001;

# Cambiala in:
const PORT = process.env.PORT || 8002;

# Salva e riavvia
pm2 restart server
```

### 🥇 **SOLUZIONE 4: Riavvio Completo**

```bash
# 1. Ferma tutti i processi
pkill -f node

# 2. Attendi 5 secondi
sleep 5

# 3. Riavvia PM2
pm2 resurrect

# 4. Avvia server
pm2 start server.js --name "server"

# 5. Verifica
pm2 status
```

---

## 📋 **PROCEDURA CONSIGLIATA**

### 🎯 **Step-by-Step Corretto**

#### **Passo 1: Diagnosi**

```bash
# 1. Controlla processi sulla porta
lsof -i :8001

# 2. Controlla PM2
pm2 list

# 3. Controlla processi Node.js
ps aux | grep node
```

#### **Passo 2: Pulizia**

```bash
# 1. Uccidi processo specifico
kill -9 <PID>

# OPPURE ferma tutto PM2
pm2 kill all

# Attendi che tutto si fermi
sleep 3
```

#### **Passo 3: Riavvio Corretto**

```bash
# 1. Riavvia PM2
pm2 resurrect

# 2. Avvia server con nome specifico
pm2 start server.js --name "server"

# 3. Verifica stato
pm2 status
pm2 logs server --lines 10
```

---

## 🔧 **PREVENZIONE FUTURA**

### ✅ **Modifica server.js per Gestire Errori**

Aggiungi questo codice all'inizio di server.js:

```javascript
const server = net.createServer((socket) => {
  // ... codice esistente ...
});

// Gestione errore porta già in uso
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Porta ${PORT} già in uso!`);
    console.error(
      `🔍 Processo: $(lsof -t -i :${PORT} | awk 'NR>1 {print $2}')`
    );
    process.exit(1);
  } else {
    console.error("❌ Errore server:", err);
    process.exit(1);
  }
});

// Gestione graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑️ Ricevuto SIGTERM, chiusura graceful...");
  server.close(() => {
    console.log("✅ Server chiuso correttamente");
    process.exit(0);
  });
});
```

### 📋 **Script di Avvio Robusto**

Crea `/root/start_server.sh`:

```bash
#!/bin/bash

# Script di avvio server GPS Watch
echo "🚀 Avvio Server GPS Watch $(date)"

# 1. Controlla se la porta è libera
if lsof -i :8001 > /dev/null; then
    echo "❌ Porta 8001 già in uso!"
    echo "🔍 Processi attivi:"
    lsof -i :8001

    # Uccidi processi Node.js esistenti
    pkill -f "node server.js"

    # Attendi
    sleep 3

    echo "🔄 Riavvio PM2..."
    pm2 resurrect
fi

# 2. Avvia il server
echo "🚀 Avvio server su porta 8001..."
pm2 start server.js --name "server"

# 3. Verifica stato
sleep 5
if pm2 list | grep -q "server"; then
    echo "✅ Server avviato con successo!"
    pm2 logs server --lines 5
else
    echo "❌ Errore avvio server!"
    pm2 logs server --err
fi
```

Rendi eseguibile:

```bash
chmod +x /root/start_server.sh
```

---

## 🎯 **VERIFICA FINALE**

### ✅ **Test dopo Risoluzione**

```bash
# 1. Controlla che la porta sia libera
netstat -tlnp | grep :8001

# 2. Controlla processo PM2
pm2 list

# 3. Controlla log
pm2 logs server --lines 10

# 4. Test connessione
curl -I http://localhost:8001
```

### 📊 **Output Atteso**

Dovresti vedere:

```
✅ Server avviato con successo!
┌────┬─────────────┬─────────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ id │ name      │ namespace │ version │ mode    │ pid     │ status │
├────┼─────────────┼─────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ 0  │ server    │ default   │ 1.0.0   │ fork    │ 12345   │ online  │
└────┴─────────────┴─────────────┴─────────┴─────────┴─────────┴─────────┘
```

---

## 🆘 **SE IL PROBLEMA PERSISTE**

### 🔄 **Controlla Servizi Conflittuali**

```bash
# Controlla altri servizi sulla porta 8001
systemctl status | grep :8001

# Controlla Apache/Nginx se usano proxy
netstat -tlnp | grep :80
```

### 🔧 **Controlla Configurazione Firewall**

```bash
# Controlla regole firewall
ufw status

# Controlla se la porta è bloccata
iptables -L | grep 8001
```

### 📞 **Contatta Supporto**

Se il problema persiste:

1. **Riavvia il server VPS**: `reboot`
2. **Contatta il provider**: verifica se bloccano porte
3. **Controlla documentazione Node.js**: problemi binding socket

---

_📅 Aggiornato: 24 Dicembre 2024_  
_🎯 Obiettivo: Risolvere conflitto porta 8001_  
_✅ Status: SOLUZIONI PRONTE_
