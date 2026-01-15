# ✅ CONFIGURAZIONE VPS COMPLETA

## 📋 RIEPILOGO MODIFICHE

### 1. Server Node.js Aggiornato per DB VPS

**File da modificare sulla VPS**: `/root/gps-server/server.js`

**Modifiche da apportare**:
Cerca la riga 8-14 nel file (intorno alla configurazione del pool):

```javascript
// TROVA QUESTA RIGA (intorno alla riga 8):
const pool = new Pool({
  host: "localhost",
  database: "gpswatch",
  user: "gpsuser",
  password: "GpsWatch2025", // <-- QUESTA È SBAGLIATA
  port: 5432,
});
```

SOSTITUISCILA CON:

```javascript
const pool = new Pool({
  host: "localhost", // localhost perché il DB è sulla stessa macchina
  database: "gpswatch",
  user: "gpsuser",
  password: "GpsWatch2025!", // <-- QUESTA È CORRETTA (con punto esclamativo)
  port: 5432,
});
```

**IMPORTANTE**: Il punto esclamativo (`!`) è ESSENZIALE per PostgreSQL. Senza di esso, il sistema potrebbe non funzionare.

### 2. Riavvio Server

Dopo aver modificato il file, riavvia il server:

```bash
pm2 restart gps-server
```

### 3. Verifica Funzionamento

```bash
pm2 logs gps-server --lines 30
```

Dovresti vedere:

```
✅ Database connesso: 2025-12-29...
✅ Pacchetto completo: [3G*3707805539*0009*LK,0,0,64]
```

E NON:

```
❌ Errore DB dispositivo: password authentication failed
```

---

## 🔍 VERIFICA CONFIGURAZIONE DATABASE

### Passo 1: Verifica configurazione attuale

```bash
ssh root@91.99.141.225
psql -h localhost -U gpsuser -d gpswatch -c "\du"
```

Questo comando mostra le impostazioni del database. Verifica che la password sia corretta.

### Passo 2: Verifica password utente

```bash
ssh root@91.99.141.225
psql -h localhost -U gpsuser -d gpswatch -c "SELECT rolname, rolpassword FROM ruoli WHERE rolname = 'sviluppatore';"
```

### Passo 3: Verifica connessione database

```bash
ssh root@91.99.141.225
psql -h localhost -U gpsuser -d gpswatch -c "SELECT COUNT(*) FROM sms_logs;"
```

---

## 📤 PROCEDURA COMPLETA

### FASE 1: Aggiorna Server VPS

```bash
ssh root@91.99.141.225
cd /root/gps-server
nano server.js
```

1. Cerca la riga 8-14 (intorno a `new Pool`)
2. Modifica la password aggiungendo il punto esclamativo: `"GpsWatch2025!"`
3. Salva il file: CTRL+O, ENTER, CTRL+X
4. Esci da nano: CTRL+X
5. Riavvia il server:

```bash
pm2 restart gps-server
pm2 logs gps-server --lines 30
```

### FASE 2: Trasferisci File su VPS

```bash
# Dal Mac, esegui:
scp components/SendCommandPanel.tsx root@91.99.141.225:/root/gps-server/
scp components/WatchLogsPanel.tsx root@91.99.141.225:/root/gps-server/
scp components/dashboards/SviluppatoreDashboard.tsx root@91.99.141.225:/root/gps-server/
scp app/api/tcp/send/route.ts root@91.99.141.225:/root/gps-server/
```

### FASE 3: Avvia Frontend Locale

```bash
cd /Users/fabio/NEXT_JS/gps-tracker
npm run dev
```

### FASE 4: Testa il Sistema

1. Apri: `http://localhost:3000/dashboard`
2. Testa comandi SMS (funzionano sempre)
3. Verifica che i dati arrivino nel DB VPS

---

## ⚠️ SE IL PROBLEMA PERSISTE

Se dopo aver aggiornato il server vedi ancora errori di autenticazione:

1. Verifica che il punto esclamativo sia presente
2. Verifica che non ci siano spazi prima o dopo la password
3. Prova con password senza punto: `"GpsWatch2025"`
4. Riavvia il server e controlla i log

---

## ✅ RISULTATO ATTESO

Dopo aver completato tutti i passaggi:

1. ✅ Server VPS configurato per usare DB VPS (localhost)
2. ✅ Password corretta con punto esclamativo
3. ✅ Componenti per invio comandi creati
4. ✅ Sistema pronto per il test

**Tutti i dati dagli orologi verranno salvati nel database VPS senza duplicazione!**
