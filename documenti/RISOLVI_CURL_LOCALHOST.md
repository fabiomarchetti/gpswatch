# 🔧 RISOLUZIONE ERRORE CURL LOCALHOST

## ❌ **Problema Identificato**

```
curl -I http://localhost:8001
Failed to connect to localhost port 8001
```

`curl` non riesce a connettersi al tuo server locale sulla porta 8001.

---

## 🔍 **CAUSE COMUNI DELL'ERRORE**

### 1️⃣ **Server non in esecuzione**

```bash
# Controlla se il server è attivo
pm2 list

# Se non è online, questo è il problema
if ! pm2 list | grep -q "server.*online"; then
    echo "❌ Server non in esecuzione!"
    exit 1
fi
```

### 2️⃣ **Porta 8001 bloccata o non in ascolto**

```bash
# Controlla se la porta è in uso
lsof -i :8001

# Se la porta è occupata o non in ascolto, questo è il problema
if lsof -i :8001; then
    echo "❌ Porta 8001 già in uso o non in ascolto!"
    # Trova il processo che la usa
    PID=$(lsof -i :8001 | awk 'NR>1 {print $2}')

    # Mostra opzioni
    echo "Processo che usa la porta 8001:"
    lsof -p -i :8001 -P

    # Uccidi il processo specifico
    if [ -n "$PID" ]; then
        echo "Uccidendo processo $PID..."
        kill -9 $PID
        sleep 2
        echo "✅ Processo ucciso"
    fi
else
    echo "Nessun processo trovato sulla porta 8001"
fi
```

### 3️⃣ **Server in ascolto su IP diverso**

```bash
# Se il server si ascolta su 0.0.0.0 invece di 127.0.0.1
netstat -tlnp | grep :8001

# Se non ascolta su localhost
if ! netstat -tlnp | grep :8001; then
    echo "❌ Server non in ascolto su localhost!"
    echo "Controlla configurazione binding in server.js"
    exit 1
fi
```

### 4️⃣ **Firewall blocca la porta**

```bash
# Controlla firewall
ufw status

# Se la porta è bloccata
if ufw status | grep -q "8001.*DENY"; then
    echo "❌ Porta 8001 bloccata dal firewall!"
    echo "Apri la porta:"
    echo "sudo ufw allow 8001/tcp"
    exit 1
fi

# Controlla iptables
iptables -L | grep 8001
```

### 5️⃣ **Node.js processi zombi**

```bash
# Controlla processi Node.js zombi
ps aux | grep "[s]erver.js.*defunct"

# Se ci sono processi zombi
if ps aux | grep "[s]erver.js.*defunct"; then
    echo "❌ Trovati processi Node.js zombi!"
    echo "Uccidi i processi:"
    ps aux | grep "[s]erver.js.*defunct" | awk '{print $2}'

    # Uccidi tutti i processi zombi
    pkill -f "[s]erver.js.*defunct"
    sleep 2
    echo "✅ Processi zombi uccisi"
fi
```

---

## 🚀 **SOLUZIONI IMMEDIATE**

### 🔄 **Soluzione 1: Verifica Server**

```bash
# 1. Controlla stato PM2
pm2 status

# 2. Se non online, avvialo
if ! pm2 list | grep -q "server.*online"; then
    echo "🔄 Avvio server..."
    pm2 start server
    sleep 5
fi

# 3. Controlla che sia in ascolto
pm2 logs server --lines 5 | grep "Server in ascolto"
```

### 🔄 **Soluzione 2: Testa Connessione**

```bash
# Testa connessione locale
curl -I http://127.0.0.1:8001

# Testa connessione esterna
curl -I http://91.99.141.225:8001
```

### 🔄 **Soluzione 3: Diagnostica Completa**

```bash
# Script di diagnostica completa
echo "=== DIAGNOSI SERVER $(date) ==="
echo "1. Stato server:"
pm2 status
echo ""
echo "2. Porte in ascolto:"
netstat -tlnp | grep :8001
echo ""
echo "3. Processi attivi:"
ps aux | grep node | head -5
echo ""
echo "4. Connessioni attive:"
netstat -tnp | grep :8001 | wc -l
echo ""
echo "5. Utilizzo risorse:"
top -bn1 | head -3
echo ""
echo "6. Spazio disco:"
df -h | head -5
echo ""
echo "7. Log errori recenti:"
pm2 logs server --err --lines 5
```

---

## 🎯 **TEST POST-RISOLUZIONE**

### ✅ **Test 1: Server Locale**

```bash
# Dovresti vedere: HTTP/1.1 200 OK
curl -I http://127.0.0.1:8001

# Se funziona, il problema è altrove
```

### ✅ **Test 2: Server Esterno**

```bash
# Dovresti vedere: HTTP/1.1 200 OK
curl -I http://91.99.141.225:8001
```

---

## 📋 **PROCEDURA SECONDA LA RISOLUZIONE**

### 🔄 **Se il test locale falla**

1. **Riavvia PM2**: `pm2 restart server`
2. **Attendi 10 secondi**: `sleep 10`
3. **Riprova il test**: `curl -I http://127.0.0.1:8001`

### 🔄 **Se il test esterno falla**

1. **Controlla rete**: `ping 8.8.8.8`
2. **Controlla DNS**: `nslookup google.com`
3. **Controlla firewall locale**: `ufw status`

---

## 🎯 **RISULTATO ATTESO**

### ✅ **Se il test locale funziona**

- Il problema è nella configurazione locale o nel tuo computer
- Il server è in esecuzione ma non raggiungibile da `localhost`

### ✅ **Se il test esterno funziona**

- Il problema è nel server o nella rete tra te e il server
- Il server è raggiungibile dall'esterno ma non dal locale

---

## 🔧 **COMANDI AGGIUNTIVI**

### 🔄 **Test con netcat**

```bash
# Test connessione con netcat
nc -v 127.0.0.1 8001

# Invia dati di test
echo "GET / HTTP/1.1" | nc 127.0.0.1 8001
```

### 🔄 **Test con telnet**

```bash
# Test connessione con telnet
telnet 127.0.0.1 8001

# Dovresti vedere "Connected to 127.0.0.1"
```

### 🔄 **Test con socat**

```bash
# Test connessione con socat
socat TCP4 127.0.0.1:8001

# Dovresti vedere "GET / HTTP/1.1 200 OK"
```

---

## 📋 **GUIDA RAPIDA PER SVILUPPATORI**

### 🔄 **Se il problema persiste**

1. **Cambia porta server**: Modifica `server.js` con `PORT = 8002`
2. **Usa IP specifico**: Forza binding con `HOST = '0.0.0.0'`
3. **Contatta supporto**: Il problema potrebbe essere tecnico
4. **Cambia computer**: Prova da un altro computer

---

## 📋 **VERIFICA FINALE**

### ✅ **Checklist Completata**

- [ ] Server PM2 online e stabile?
- [ ] Server in ascolto su porta 8001?
- [ ] Nessun processo occupa la porta 8001?
- [ ] Firewall permette connessioni in entrata?
- [ ] `curl -I localhost:8001` funziona?
- [ ] `curl -I http://91.99.141.225:8001` funziona?

---

## 🎯 **CONCLUSIONI**

### ❌ **Se `curl -I localhost:8001` fallisce:**

1. **Il problema è locale**: Il tuo computer o la rete locale sta bloccando le connessioni
2. **Soluzioni consigliate**:
   - Riavvia il server: `pm2 restart server`
   - Controlla firewall: `ufw status`
   - Usa un altro computer per testare
   - Verifica configurazione DNS locale

### ✅ **Se `curl -I localhost:8001` funziona:**

1. **Il problema è remoto**: Il server potrebbe non essere raggiungibile
2. **Soluzioni consigliate**:
   - Controlla configurazione NAT/firewall del provider
   - Verifica che l'IP sia corretto
   - Testa da un'altra rete

---

_📅 Aggiornato: 24 Dicembre 2024_  
_🎯 Obiettivo: Risolvere errore connessione locale_  
_✅ Status: RISOLUZIONE ERRORE CURL_
