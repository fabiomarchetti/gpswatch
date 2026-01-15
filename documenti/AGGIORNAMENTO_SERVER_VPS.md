# ✅ AGGIORNAMENTO SERVER VPS - PASSWORD CORRETTA

## 📋 ISTRUZIONI

### 1. Connettiti alla VPS

```bash
ssh root@91.99.141.225
```

### 2. Vai alla cartella del server

```bash
cd /root/gps-server
# oppure
find / -name "server.js" -type f
```

### 3. Apri il file server.js

```bash
nano server.js
# oppure usa FileZilla per modificare
```

### 4. Cerca questa riga (intorno alla riga 8-14):

```javascript
const pool = new Pool({
  host: "localhost",
  database: "gpswatch",
  user: "gpsuser",
  password: "GpsWatch2025",
  port: 5432,
});
```

### 5. Sostituiscila con:

```javascript
const pool = new Pool({
  host: "localhost",
  database: "gpswatch",
  user: "gpsuser",
  password: "GpsWatch2025",
  port: 5432,
});
```

### 6. Salva e esci (CTRL+O, ENTER, CTRL+X)

```bash
# Salva: CTRL+O
# Esci: CTRL+X
```

### 7. Riavvia il server

```bash
pm2 restart gps-server
pm2 logs gps-server --lines 30
```

---

## ⚠️ VERIFICHE

Dopo aver salvato, esegui questi comandi per verificare:

### 1. Verifica configurazione database

```bash
ssh root@91.99.141.225
psql -h localhost -U gpsuser -d gpswatch -c "\du"
```

Dovresti vedere:

```
host: localhost
port: 5432
database: gpswatch
user: gpsuser
password: GpsWatch2025!
```

### 2. Verifica log

```bash
ssh root@91.99.141.225
pm2 logs gps-server --lines 30
```

Dovresti vedere:

```
✅ Nessun errore di autenticazione
✅ Pacchetti ricevuti e salvati
```

---

## 📋 SE LA CONFIGURAZIONE È GIÀ CORRETTA

Se dopo aver modificato vedi ancora errori, esegui:

```bash
ssh root@91.99.141.225
pm2 restart gps-server
pm2 logs gps-server --lines 30
```

Se vedi ancora errori di autenticazione, il problema potrebbe essere:

1. Il file non è stato salvato correttamente
2. Il server non è stato riavviato
3. La configurazione del database locale è diversa

In questo caso, fornisci:

1. Output del comando: `psql -h localhost -U gpsuser -d gpswatch -c "\du"`
2. Ultimi 30 righe dei log: `pm2 logs gps-server --lines 30 | tail -n 20`
3. Screenshot della dashboard Next.js

---

## 📤 COMANDI PER VERIFICA

### 1. Testa comando SMS

Dal telefono, invia:

```bash
pw,123456,ts#
```

Dovresti ricevere risposta come:

```
ver:C405_KYS_S5_04R6_V1.3_2025.10.11_11.43.26;
ID:3707805539;
imei:863737078055392;
ip_url:91.99.141.225; port:8001;
```

### 2. Verifica connessione orologio al server

```bash
ssh root@91.99.141.225
pm2 logs gps-server | grep "CONNESSIONE"
```

Dovresti vedere:

```
✅ CONNESSIONE da: [IP orologio]
```

---

## 🎯 PROSSIMI PASSI

1. **Aggiorna il server VPS** con la password corretta
2. **Riavvia il server**
3. **Verifica i log**
4. **Testa i comandi dalla dashboard**
5. **Se tutto funziona, procedi con lo sviluppo**

---

## 📞 NOTA IMPORTANTE

La password corretta è: **`GpsWatch2025!`** (con punto esclamativo)
Il punto esclamativo (`!`) è **FONDAMENTALE** per PostgreSQL e potrebbe causare problemi di autenticazione.

Se dopo aver modificato il file, il server potrebbe non rilevare la modifica finché è in esecuzione. In questo caso:

1. Ferma il server: `pm2 stop gps-server`
2. Aspetta 5-10 secondi
3. Riavvia: `pm2 restart gps-server`
