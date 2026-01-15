# 🔧 RISOLUZIONE ERRORE DATABASE SU VPS

## 🚨 PROBLEMA IDENTIFICATO

Il server sulla VPS riceve i dati dall'orologio ma **NON riesce a salvarli nel database** perché:

- Cerca di connettersi al DB locale (localhost) invece che al DB VPS
- La password del DB locale è diversa da quella del DB VPS

**Errore nei log**:

```
❌ Errore DB dispositivo: password authentication failed for user "gpsuser"
```

## ✅ SOLUZIONE

Devi aggiornare il file `server.js` sulla VPS per usare il database locale.

### Passaggi:

1. Connettiti alla VPS:

```bash
ssh root@91.99.141.225
```

2. Vai alla cartella del server:

```bash
cd /root/gps-server
# oppure
find / -name "server.js" -type f
```

3. Modifica il file `server.js`:
   Cerca queste righe (intorno alla riga 8-14):

```javascript
const pool = new Pool({
  host: "localhost",
  database: "gpswatch",
  user: "gpsuser",
  password: "GpsWatch2025", // <-- QUESTA È SBAGLIATA
  port: 5432,
});
```

E sostituiscile con:

```javascript
const pool = new Pool({
  host: "localhost", // localhost perché il DB è sulla stessa macchina
  database: "gpswatch",
  user: "gpsuser",
  password: "GpsWatch2025", // <-- QUESTA È CORRETTA
  port: 5432,
});
```

**NOTA IMPORTANTE**: La password deve essere `GpsWatch2025!` (con punto esclamativo) non `GpsWatch2025` (senza punto).

4. Salva il file e riavvia il server:

```bash
pm2 restart gps-server
pm2 logs gps-server --lines 30
```

5. Verifica che il server si connetta al DB:
   Dovresti vedere:

```
✅ Database connesso: 2025-12-29...
```

Invece di:

```
❌ Errore connessione DB: password authentication failed
```

---

## 📋 COMANDI COMPLETI

### 1. Configurazione Database VPS

- [`.env.local`](.env.local:1) aggiornato per usare DB VPS
- [`lib/db.ts`](lib/db.ts:1) configurato per connettersi al DB VPS

### 2. Componenti Dashboard

- [`components/SendCommandPanel.tsx`](components/SendCommandPanel.tsx:1) - Invio comandi SMS/TCP
- [`components/WatchLogsPanel.tsx`](components/WatchLogsPanel.tsx:1) - Visualizzazione log

### 3. Server TCP Aggiornato

- [`server.js`](server.js:1) locale - con funzione invio comandi TCP
- Server VPS - **DA AGGIORNARE** per DB locale

---

## 🎯 DOPO AVERE AGGIORNATO IL SERVER VPS

1. **Verifica connessione DB**:

```bash
pm2 logs gps-server | grep "Database connesso"
```

2. **Verifica ricezione dati**:

```bash
pm2 logs gps-server | grep "Pacchetto completo"
```

3. **Verifica salvataggio dati**:

```bash
pm2 logs gps-server | grep "Posizione salvata"
pm2 logs gps-server | grep "Salute"
```

4. **Testa comandi SMS dalla dashboard**:

```bash
cd /Users/fabio/NEXT_JS/gps-tracker
npm run dev
# Apri http://localhost:3000/dashboard
```

---

## ⚠️ NOTE IMPORTANTI

1. **Il server sulla VPS deve usare il DB locale** perché il DB PostgreSQL è installato sulla stessa macchina
2. **La password corretta è `GpsWatch2025!`** (con punto esclamativo)
3. **Dopo aver aggiornato il server**, riavvialo con `pm2 restart gps-server`
4. **Verifica i log** per assicurarti che non ci siano più errori di autenticazione

---

## 🔍 VERIFICA FINALE

Dopo aver aggiornato il server, esegui questo comando per verificare che tutto funzioni:

```bash
ssh root@91.99.141.225 "pm2 logs gps-server --lines 50 | tail -n 20"
```

Dovresti vedere:

- ✅ Connessione al database riuscita
- ✅ Pacchetti ricevuti dall'orologio
- ✅ Dati salvati nel database
- ❌ NESSUN errore di autenticazione

Se vedi ancora errori di autenticazione, verifica che la password sia corretta (`GpsWatch2025!` con punto esclamativo).
