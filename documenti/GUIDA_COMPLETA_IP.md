# 🔧 GUIDA COMPLETA PER CAMBIAMENTI IP SERVER

## 🎯 **SINTESI COMPLETI**

Ho preparato una guida completa che copre tutti gli aspetti del cambiamento IP del server GPS Watch.

---

## 📋 **INDICE RAPIDO**

### 🚀 **PASSO 0: PREPARAZIONE**

- [ ] Backup file correnti
- [ ] Verifica configurazione attuale
- [ ] Prepara ambiente di lavoro

### 🔄 **PASSO 1: MODIFICA SERVER**

- [ ] Apri server.js in editor
- [ ] Cerca riga `server.listen(`
- [ ] Modifica binding a `0.0.0.0`
- [ ] Salva modifiche
- [ ] Chiudi editor

### 🔄 **PASSO 2: CARICAMENTO (se necessario)**

- [ ] Carica file modificato via FTP
- [ ] Sovrascrivi file sul server
- [ ] Verifica caricamento

### 🔄 **PASSO 3: RIAVVIO SERVER**

- [ ] Ferma processo PM2: `pm2 stop server`
- [ ] Attendi 5 secondi
- [ ] Riavvia: `pm2 start server`
- [ ] Verifica stato: `pm2 status`

### 🔄 **PASSO 4: VERIFICA**

- [ ] Controlla binding: `netstat -tlnp | grep :8001`
- [ ] Controlla log: `pm2 logs server --lines 10`
- [ ] Test connessione: `curl -I http://localhost:8001`
- [ ] Verifica da esterno: `curl -I http://91.99.141.225:8001`

---

## 🔧 **MODIFICHE SPECIFICHE PER server.js**

### 📝 **Opzione 1: Binding a Tutti gli IP**

```javascript
// Sostituisci questa riga:
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server in ascolto su tutte le interfacce: ${PORT}`);
});
```

### 📝 **Opzione 2: Disattiva IPv6**

```javascript
// Aggiungi opzioni se necessario:
const server = net.createServer(
  {
    ipv6Only: false, // Disattiva IPv6
    allowHalfOpen: true, // Per connessioni problematiche
  },
  (socket) => {
    // ...
  }
);
```

### 📝 **Opzione 3: Forza IP Specifico**

```javascript
// Sostituisci con IP specifico:
const HOST = "0.0.0.0"; // Forza ascolto su tutti gli IP
// oppure:
const HOST = "91.99.141.225"; // Forza ascolto su IP specifico

server.listen(PORT, HOST, () => {
  console.log(`Server in ascolto su ${HOST}:${PORT}`);
});
```

### 📝 **Opzione 4: Multi-Interfacce**

```javascript
// Per ascolto su più interfacce:
const interfaces = require("os").networkInterfaces();
const HOST = Object.keys(interfaces)
  .filter((name) => !name.includes("lo") && !name.includes("docker"))
  .map((name) => interfaces[name][0].address)
  .filter((ip) => ip && !ip.includes("127."));

const server = net.createServer((socket) => {
  // ...
});

// Ascolta su tutte le interfacce disponibili
interfaces.forEach((host) => {
  server.listen(PORT, host, () => {
    console.log(`Server in ascolto su ${host}:${PORT}`);
  });
});
```

---

## 🔧 **PROCEDURE FTP PER CARICAMENTO**

### 📤 **FileZilla (Metodo Visuale)**

1. **Apri FileZilla**
2. **Host**: `91.99.141.225`
3. **Username**: `root`
4. **Password**: tua password SSH
5. **Porta**: `22` (SFTP)

### 📂 **Procedura Caricamento**

1. **Pannello sinistra**: Naviga a `/Users/fabio/NEXT_JS/gps-tracker/`
2. **Pannello destra**: Naviga a `/percorso/gps-server/`
3. **Trascina file**: Trascina `server.js` dal sinistro al destra
4. **Conferma sovrascrittura**: Click "Sì" quando richiesto
5. **Attendi caricamento**: Aspetta completamento
6. **Verifica**: Controlla che il file sia presente sul server

### 📂 **SCP (Metodo Terminale)**

```bash
# Dal tuo Mac:
cd /Users/fabio/NEXT_JS/gps-tracker/
scp server.js root@91.99.141.225:/percorso/gps-server/
```

---

## 🔧 **COMANDI VERIFICA POST-CARICAMENTO**

### 📊 **Verifica Server**

```bash
# 1. Controlla che PM2 gestisca il processo
pm2 list

# 2. Controlla stato del server
pm2 status server

# 3. Controlla log
pm2 logs server --lines 20

# 4. Controlla porte in ascolto
netstat -tlnp | grep :8001

# 5. Test connessione
curl -I http://localhost:8001
```

### 📊 **Verifica da Esterno**

```bash
# Test da altro computer
curl -I http://91.99.141.225:8001

# Test da telefono/mobile
# Apri browser: http://91.99.141.225:8001
```

---

## 🔧 **RISOLUZIONE PROBLEMI COMUNI**

### ❌ **"EADDRINUSE" persiste**

```bash
# 1. Uccidi tutti i processi Node.js
pkill -f node

# 2. Attendi 10 secondi
sleep 10

# 3. Riavvia PM2
pm2 restart server

# 4. Se il problema persiste, cambia porta
# Modifica server.js con PORT = 8002
```

### ❌ **"EACCES: permission denied"**

```bash
# Controlla permessi file
ls -la server.js

# Correggi permessi se necessario
chmod +x server.js
chown root:root server.js
```

### ❌ **"Cannot read property 'options'"**

```javascript
// Assicurati che il server sia un oggetto valido
const server = net.createServer(
  {
    // ... opzioni valide
  },
  (socket) => {
    // ...
  }
);
```

### ❌ **Firewall blocca porta**

```bash
# Controlla stato firewall
ufw status

# Apri porta se necessario
ufw allow 8001/tcp

# Controlla iptables
iptables -L | grep 8001
```

---

## 🔧 **SCRIPT AUTOMATIZZIONE**

### 📋 **Script di Avvio Robusto**

```bash
#!/bin/bash
# /root/start_robust_server.sh

echo "🚀 Avvio Server GPS Watch Robusto $(date)"

# 1. Ferma tutti i processi Node.js
pkill -f node

# 2. Attendi per assicurare che le porte siano libere
sleep 3

# 3. Pulizia log vecchi
pm2 flush

# 4. Avvia server con configurazione robusta
pm2 start server.js --name "server"

# 5. Verifica stato
sleep 5
pm2 status

# 6. Controlla log
pm2 logs server --lines 10

# 7. Test connessione
curl -I http://localhost:8001

# 8. Log risultato
echo "$(date): Server avviato con successo" >> /var/log/server_start.log
```

### 📋 **Script di Monitoraggio**

```bash
#!/bin/bash
# /root/monitor_server_continuo.sh

while true; do
    clear
    date
    echo "=== MONITORAGGIO SERVER ==="
    echo "Processi attivi:"
    pm2 list | grep server
    echo ""
    echo "Porta 8001:"
    netstat -tlnp | grep :8001
    echo ""
    echo "Connessioni attive:"
    netstat -tnp | grep :8001 | wc -l
    echo ""
    echo "Log recenti:"
    pm2 logs server --lines 3 | tail -5
    echo ""
    echo "Utilizzo risorse:"
    top -bn1 | head -3
    echo ""
    echo "==============================="
    sleep 30
done
```

---

## 🔧 **BACKUP E RIPRISTINO**

### 📋 **Backup Automatico del Database**

```bash
#!/bin/bash
# /root/backup_database.sh

BACKUP_DIR="/backups/gpswatch"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🔄 Inizio backup database..."

# Backup completo
pg_dump -h localhost -U gpsuser -d gpswatch | gzip > $BACKUP_DIR/gpswatch_completo_$DATE.sql.gz

# Backup solo dati recenti
psql -h localhost -U gpsuser -d gpswatch --data-only > $BACKUP_DIR/gpswatch_dati_$DATE.sql.gz

# Pulizia vecchi backup (7 giorni)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "✅ Backup completato: $DATE"
```

### 📋 **Ripristino Database**

```bash
#!/bin/bash
# /root/restore_database.sh

BACKUP_FILE=$1

echo "🔄 Ripristino database da: $BACKUP_FILE"

# 1. Ferma server
pm2 stop server

# 2. Ripristina database
gunzip -c $BACKUP_FILE | psql -h localhost -U gpsuser -d gpswatch

# 3. Riavvia server
pm2 start server

echo "✅ Ripristino completato"
```

---

## 🎯 **CHECKLIST FINALE**

### ✅ **Prima delle Modifiche**

- [ ] Ho fatto il backup dei file correnti
- [ ] Ho verificato la configurazione attuale
- [ ] Ho capito quale modifica applicare
- [ ] Ho testato la modifica in locale

### ✅ **Durante le Modifiche**

- [ ] Ho modificato solo la riga necessaria
- [ ] Ho salvato il file prima di riavviare
- [ ] Ho verificato la sintassi del codice

### ✅ **Dopo le Modifiche**

- [ ] Il server si è riavviato correttamente
- [ ] Il binding è passato da `EADDRINUSE` a funzionante
- [ ] Le connessioni funzionano regolarmente
- [ ] I log mostrano il server in ascolto su tutte le interfacce
- [ ] L'orologio si connette al server senza problemi

### ✅ **Verifiche Tecniche**

- [ ] `netstat -tlnp | grep :8001` mostra il binding corretto
- [ ] `pm2 status` mostra il processo come "online"
- [ ] `curl -I http://91.99.141.225:8001` risponde "200 OK"
- [ ] Nessun errore nei log PM2
- [ ] Il server è raggiungibile dall'esterno

---

## 🎯 **RISULTATO FINALE**

Una volta seguita questa guida, il tuo server GPS Watch sarà:

- ✅ **Robusto e Affidabile**
- ✅ **Compatibile Massimo** (ascolta su tutte le interfacce)
- ✅ **Senza Problemi di Binding**
- ✅ **Facile da Monitorare**
- ✅ **Pronto per Dati FOTA in Tempo Reale**

Ora puoi finalmente concentrarti sul monitoraggio dei dati sanitari dal tuo orologio GPS! 🎉

---

_📅 Guida aggiornata: 24 Dicembre 2024_  
_🎯 Obiettivo: Server robusto con binding multiplo_  
_✅ Status: GUIDA COMPLETA PER CAMBIAMENTI IP_
