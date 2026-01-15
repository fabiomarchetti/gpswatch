# 🔧 RISOLUZIONE BINDING IP SERVER

## ❌ **Problema Identificato**

```
node\x20/115569  root   21u  IPv4 1657756      0t0  TCP static.225.141.99.91.clients.your-server.de:8001->151.19.29.109:46025 (ESTABLISHED)
```

Il server Node.js si sta connettendo **A** `151.19.29.109:46025` invece di ascoltare su `0.0.0.0:8001`.

---

## 🔍 **CAUSE DEL PROBLEMA**

### 1️⃣ **Configurazione Node.js Predefinita**

Node.js di default si binda a `0.0.0.0` (tutti gli indirizzi) ma il sistema operativo sta forzando il binding a un IP specifico.

### 2️⃣ **Proxy o NAT**

Il server potrebbe essere dietro un NAT/proxy che forza l'uso di un IP specifico.

### 3️⃣ **Configurazione PM2**

PM2 potrebbe avere una configurazione che influisce sul binding.

---

## 🚀 **SOLUZIONI**

### 🎯 **Soluzione 1: Forza Binding Corretto**

#### 📝 **Modifica server.js**

Aggiungi all'inizio del file server.js:

```javascript
const HOST = "0.0.0.0"; // Forza ascolto su tutti gli IP
const PORT = 8001;

const server = net.createServer((socket) => {
  // ... codice esistente
});

server.listen(PORT, HOST, () => {
  console.log(`Server in ascolto su ${HOST}:${PORT}`);
});
```

#### 📝 **Oppure con IP Specifico**

```javascript
const HOST = "91.99.141.225"; // Forza ascolto su IP specifico
const PORT = 8001;

const server = net.createServer((socket) => {
  // ... codice esistente
});

server.listen(PORT, HOST, () => {
  console.log(`Server in ascolto su ${HOST}:${PORT}`);
});
```

### 🎯 **Soluzione 2: Configurazione Variabili Ambiente**

#### 📝 **Crea/Modifica .env**

```bash
# Aggiungi al file .env
echo "SERVER_HOST=0.0.0.0" >> .env
echo "SERVER_PORT=8001" >> .env
```

#### 📝 **Modifica server.js per usare .env**

```javascript
require("dotenv").config();

const HOST = process.env.SERVER_HOST || "0.0.0.0";
const PORT = process.env.SERVER_PORT || 8001;

const server = net.createServer((socket) => {
  // ... codice esistente
});

server.listen(PORT, HOST, () => {
  console.log(`Server in ascolto su ${HOST}:${PORT}`);
});
```

### 🎯 **Soluzione 3: Configurazione PM2**

#### 📝 **File Ecosistema PM2**

Crea `/root/.pm2/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "gps-server",
      script: "/percorso/gps-server/server.js",
      env: {
        NODE_ENV: "production",
        SERVER_HOST: "0.0.0.0",
      },
    },
  ],
};
```

#### 📝 **Riavvia PM2 con Ecosistema**

```bash
pm2 delete server
pm2 start /root/.pm2/ecosystem.config.js
```

---

## 🔧 **PROCEDURA COMPLETA DI RISOLUZIONE**

### 🎯 **Soluzione Raccomandata: Forza 0.0.0.0**

#### 1️⃣ **Backup e Modifica server.js**

```bash
# 1. Backup file corrente
cp server.js server.js.backup

# 2. Modifica binding
nano server.js

# 3. Aggiungi dopo la prima riga (dopo require)
const HOST = '0.0.0.0';
const PORT = 8001;

# 4. Modifica la chiamata server.listen()
# Cerca questa riga:
server.listen(PORT, HOST, () => {
```

#### 2️⃣ **Riavvia Server**

```bash
# Ferma server corrente
pm2 stop server

# Avvia con nuova configurazione
pm2 start server.js --name "server"

# Verifica binding
pm2 logs server --lines 5
```

#### 3️⃣ **Verifica Corretto Binding**

```bash
# Controlla che ora ascolti su 0.0.0.0:8001
netstat -tlnp | grep :8001

# Dovresti vedere:
# tcp 0 0.0.0.0:8001 LISTEN 12345/node
```

---

## 📊 **Verifica Post-Risoluzione**

### 🔍 **Controlla Log Server**

```bash
# Dovresti vedere questo log:
pm2 logs server --lines 10

# Output atteso:
# Server in ascolto su 0.0.0.0:8001
```

### 🔍 **Controlla Connessioni In Arrivo**

```bash
# Controlla che l'orologio si connetta al tuo IP
netstat -tnp | grep :8001

# Dovresti vedere connessioni da IP dell'orologio
```

### 🔍 **Test da Esterno**

```bash
# Dal tuo computer locale
curl -I http://91.99.141.225:8001

# Dovresti ricevere risposta
```

---

## 🚨 **SE IL PROBLEMA PERSISTE**

### 🔧 **Soluzione 4: Disattiva IPv6**

Forza solo IPv4 aggiungendo al server.js:

```javascript
const server = net.createServer(
  {
    ipv6Only: false, // Forza solo IPv4
    // ... altre opzioni
  },
  (socket) => {
    // ... codice esistente
  }
);

server.listen(PORT, HOST, () => {
  console.log(`Server in ascolto su ${HOST}:${PORT}`);
});
```

### 🔧 **Soluzione 5: Controlla Firewall**

```bash
# Controlla regole firewall che potrebbero bloccare
ufw status
iptables -L | grep 8001

# Se necessario, apri porta
ufw allow 8001/tcp
iptables -A INPUT -p tcp --dport 8001 -j ACCEPT
```

---

## 📋 **CHECKLIST RISOLUZIONE**

- [ ] Backup server.js corrente
- [ ] Modificato binding con HOST = '0.0.0.0'
- [ ] Riavviato server con pm2
- [ ] Verificato ascolto su 0.0.0.0:8001
- [ ] Controllato log per errori
- [ ] Testato connessione da esterno
- [ ] Verificato connessioni dall'orologio

---

## 🎯 **RISULTATO ATTESO**

Una volta applicata la soluzione, dovresti vedere:

```
netstat -tlnp | grep :8001
tcp 0 0.0.0.0:8001 LISTEN 12345/node
```

E l'orologio potrà connettersi tranquillamente a `91.99.141.225:8001` invece di tentare di connettersi al IP del client NAT.

---

_📅 Aggiornato: 24 Dicembre 2024_  
_🎯 Obiettivo: Risolvere binding IP server Node.js_  
_✅ Status: SOLUZIONI PRONTE_
