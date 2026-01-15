# 🔧 GUIDA CAMBIAMENTI IP SERVER

## 🎯 Obiettivo

Guida passo-passo per modificare la configurazione IP del server GPS

---

## 📋 **INDICE OPERAZIONI**

### 🥇 **PASSO 1: Backup Attuale**

```bash
# 1. Connettiti al server
ssh root@91.99.141.225
cd /percorso/gps-server/

# 2. Backup file correnti
cp server.js server.js.backup
cp package.json package.json.backup

# 3. Verifica backup
ls -la *.backup
```

### 🥈 **PASSO 2: Modifica server.js**

```bash
# 1. Apri file per modifica
nano server.js

# 2. Cerca la riga del binding
# Cerca: server.listen(
# Oppure usa: Ctrl+W e cerca "listen"

# 3. Modifica la configurazione del binding
# Sostituisci questa riga:
const server = net.createServer((socket) => {
  // ... codice esistente
});

// Con questa configurazione:
const server = net.createServer((socket) => {
  // ... codice esistente
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server in ascolto su tutte le interfacce`);
});
```

### 🥉 **PASSO 3: Salva e Riavvia**

```bash
# 1. Salva le modifiche
Ctrl+O (nano)
Y (per confermare)

# 2. Riavvia il server
pm2 restart server

# 3. Verifica che ora ascolta su tutte le interfacce
netstat -tlnp | grep :8001

# 4. Controlla i log
pm2 logs server --lines 10
```

---

## 🔍 **VERIFICA POST-CAMBIAMENTO**

### 1️⃣ **Controlla Binding**

```bash
# Dovresti vedere:
tcp 0 0.0.0.0:8001 LISTEN node
# Invece di:
tcp 1657756 151.19.29.109:46025 ESTABLISHED
```

### 2️⃣ **Controlla Log**

```bash
pm2 logs server --lines 5

# Dovresti vedere:
Server in ascolto su tutte le interfacce: 0.0.0.0:8001
```

### 3️⃣ **Test Connessione**

```bash
# Test da locale
curl -I http://localhost:8001

# Test da esterno
curl -I http://91.99.141.225:8001
```

---

## 🔄 **ALTERNATIVE SE IL PROBLEMA PERSISTE**

### 🔄 **Opzione 2: Disattiva IPv6**

Se il problema è causato da IPv6, disattivalo:

```javascript
// In server.js, prima di creare il server:
const server = net.createServer(
  {
    ipv6Only: false, // Disattiva IPv6
    // ... altre opzioni
  },
  (socket) => {
    // ...
  }
);
```

### 🔄 **Opzione 3: Configura Firewall**

Assicurati che il firewall permetta connessioni in entrata sulla porta 8001:

```bash
# Controlla UFW
ufw status

# Se necessario, apri la porta
ufw allow 8001/tcp

# Controlla iptables
iptables -L | grep 8001
```

### 🔄 **Opzione 4: Controlla Servizi Conflittuali**

Verifica che nessun altro servizio stia usando la porta 8001:

```bash
# Controlla tutti i servizi in ascolto
netstat -tlnp

# Controlla servizi specifici
systemctl status apache2
systemctl status nginx
systemctl status httpd
```

---

## 📋 **RISOLUZIONE ERRORI COMUNI**

### ❌ **"Cannot read property 'options' of undefined"**

Se vedi questo errore, aggiungi opzioni vuote al server:

```javascript
const server = net.createServer(
  {
    // ... altre opzioni
  },
  (socket) => {
    // ...
  }
);
```

### ❌ **"EADDRINUSE: address already in use"**

Se l'errore persiste:

1. **Uccidi tutti i processi Node.js**

```bash
pkill -f node
```

2. **Attendi 5 secondi**

```bash
sleep 5
```

3. **Riavvia PM2**

```bash
pm2 restart server
```

### ❌ **"EACCES: permission denied"**

```bash
# Controlla permessi del file
ls -la server.js

# Se necessario, cambia permessi
chmod +x server.js
```

---

## 🎯 **VERIFICA FINALE**

### ✅ **Test Completo**

```bash
# 1. Controlla che il server ascolta su tutte le interfacce
netstat -tlnp | grep :8001

# 2. Controlla che PM2 gestisce il processo
pm2 list

# 3. Controlla i log per errori
pm2 logs server --err

# 4. Test connessione
curl -I http://localhost:8001
```

### ✅ **Test da Esterno**

Chiedi a un amico o collega di provare a connettersi al tuo server:

```
http://91.99.141.225:8001
```

---

## 📱 **COMANDI UTILI**

### 📋 **Diagnostica Completa**

```bash
# Stato completo sistema
echo "=== DIAGNOSI SISTEMA GPS WATCH ==="
echo "1. Stato server:"
pm2 status
echo ""
echo "2. Porte in ascolto:"
netstat -tlnp | grep :8001
echo ""
echo "3. Connessioni attive:"
netstat -tnp | grep :8001 | wc -l
echo ""
echo "4. Log recenti:"
pm2 logs server --lines 5
echo ""
echo "5. Utilizzo risorse:"
top -bn1 | head -5
```

### 📋 **Monitoraggio in Tempo Reale**

```bash
# Crea script di monitoraggio
nano /root/monitor_server.sh

# Incolla questo contenuto:
#!/bin/bash
while true; do
    clear
    date
    echo "=== MONITORAGGIO SERVER ==="
    echo "Processi attivi:"
    pm2 list
    echo ""
    echo "Porta 8001:"
    netstat -tlnp | grep :8001
    echo ""
    echo "Connessioni recenti:"
    pm2 logs server --lines 3 | grep CONNESSIONE
    echo ""
    echo "Ultimi errori:"
    pm2 logs server --lines 3 | grep -i error || echo "Nessun errore recente"
    echo ""
    sleep 10
done
```

Rendi eseguibile:

```bash
chmod +x /root/monitor_server.sh
/root/monitor_server.sh
```

---

## 🎯 **RISULTATO ATTESO**

Una volta applicate le modifiche in [`RISOLVI_BINDING_IP.md`](RISOLVI_BINDING_IP.md), il tuo server:

- ✅ **Ascolterà su tutte le interfacce** (0.0.0.0:8001)
- ✅ **Risolverà problema binding** EADDRINUSE
- ✅ **Garantirà massima compatibilità** con qualsiasi configurazione di rete
- ✅ **L'orologio potrà connettersi sempre** indipendentemente da dove si connette

Ora puoi finalmente procedere con il monitoraggio dei dati sanitari in tempo reale! 🎉

---

_📅 Aggiornato: 24 Dicembre 2024_  
_🎯 Obiettivo: Risolvere configurazione binding IP server_  
_✅ Status: GUIDA COMPLETA PER CAMBIAMENTI_
