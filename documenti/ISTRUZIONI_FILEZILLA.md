# 📁 CARICAMENTO FILE CON FILEZILLA

## 🔧 **Configurazione FileZilla**

### **Dati Connessione:**

- **Host**: `91.99.141.225`
- **Protocollo**: `SFTP - SSH File Transfer Protocol`
- **Porta**: `22`
- **Utente**: `root`
- **Password**: [La password del tuo VPS Hetzner]

### **Procedura:**

1. Apri FileZilla
2. File → Gestore siti → Nuovo sito
3. Inserisci i dati sopra
4. Connetti

## 📂 **File da Caricare**

Carica questi file nella cartella `/root/gps-server/`:

### **File Principali:**

- ✅ [`server.js`](server.js) → `/root/gps-server/server.js`
- ✅ [`aqsh_decoder.js`](aqsh_decoder.js) → `/root/gps-server/aqsh_decoder.js`
- ✅ [`test_connection.js`](test_connection.js) → `/root/gps-server/test_connection.js`
- ✅ [`GUIDA_RISOLUZIONE_AQSH.md`](GUIDA_RISOLUZIONE_AQSH.md) → `/root/gps-server/GUIDA_RISOLUZIONE_AQSH.md`

### **Backup (Opzionale):**

- [`old_server.js`](old_server.js) → `/root/gps-server/backup_old_server.js`

## 🚀 **Dopo il Caricamento**

### **1. Connettiti via SSH**

```bash
ssh root@91.99.141.225
```

### **2. Vai alla Cartella Progetto**

```bash
cd /root/gps-server
ls -la
```

### **3. Verifica File Caricati**

```bash
# Dovresti vedere:
# server.js (nuovo)
# aqsh_decoder.js (nuovo)
# test_connection.js (nuovo)
# GUIDA_RISOLUZIONE_AQSH.md (nuovo)
```

### **4. Riavvia il Server**

```bash
pm2 restart gps-server
```

### **5. Verifica Funzionamento**

```bash
pm2 status
pm2 logs gps-server --lines 20
```

## 🔍 **Test Immediato**

### **Test 1: Connessione Server**

```bash
node test_connection.js
```

### **Test 2: Decoder AQSH+**

```bash
node aqsh_decoder.js
```

### **Test 3: Log in Tempo Reale**

```bash
pm2 logs gps-server
# Premi Ctrl+C per uscire
```

## 📊 **Cosa Aspettarsi**

### **Se l'Orologio è Connesso:**

```
✅ CONNESSIONE da: [IP_OROLOGIO]
🔐 RILEVATO PROTOCOLLO AQSH+ CRIPTATO!
❌ DECRITTAZIONE FALLITA - Dati ignorati
💡 Contatta il produttore per la chiave di decrittazione
```

### **Se Tutto Funziona:**

```
✅ DECRITTAZIONE RIUSCITA!
🔑 Metodo: aes-128-cbc
📝 Dati: [3G*863737078055392*LK,100,50,85]
```

## 🆘 **Risoluzione Problemi**

### **Server Non Si Avvia:**

```bash
pm2 delete gps-server
pm2 start server.js --name gps-server
pm2 save
```

### **Errori di Sintassi:**

```bash
node -c server.js
node -c aqsh_decoder.js
```

### **Porta Occupata:**

```bash
netstat -tlnp | grep 8001
# Se occupata, cambia porta nel server.js
```

## 📞 **Prossimi Passi**

1. **Carica file** con FileZilla
2. **Testa connessione** SSH
3. **Riavvia server** con PM2
4. **Monitora log** per dati orologio
5. **Contatta produttore** se AQSH+ non decrittato

---

_Dopo il caricamento, fammi sapere cosa vedi nei log!_
