# Deploy GPS Tracker su VPS - Guida Completa

## Informazioni VPS

- **IP VPS**: `91.99.141.225`
- **Username**: `root`
- **Directory progetto Next.js**: `/var/www/gps-tracker`
- **Directory server TCP**: `/root/gps-server`
- **Porte**:
  - Next.js Web App: `3001`
  - TCP Server GPS: `3000`
  - PostgreSQL: `5432`

**⚠️ IMPORTANTE**: Tutto il portale sviluppato in locale (`/Users/fabio/NEXT_JS/gps-tracker`) è completamente replicato sulla VPS nella directory `/var/www/gps-tracker/`. Ogni modifica locale deve essere sincronizzata sulla VPS per essere visibile in produzione.

---

## 1. Connessione SSH

### Connessione base

```bash
ssh root@91.99.141.225
```

### SSH Tunnel per Database (sviluppo locale)

Quando lavori in locale e vuoi accedere al database VPS, **devi sempre** creare un tunnel SSH.

#### Metodo 1: Automatico con npm (CONSIGLIATO) ⭐

Usa il comando automatico che gestisce tutto:

```bash
npm run dev:local
```

Questo comando:
1. ✅ Crea automaticamente il tunnel SSH
2. ✅ Aspetta 2 secondi per la connessione
3. ✅ Avvia Next.js in modalità development

#### Metodo 2: Comandi separati

```bash
# Crea il tunnel SSH (in background)
npm run tunnel

# Verifica che il tunnel sia attivo
npm run tunnel:check

# Avvia Next.js normalmente
npm run dev

# Se necessario, chiudi il tunnel
npm run tunnel:kill
```

#### Metodo 3: Manuale (sconsigliato)

```bash
ssh -f -N -L 5433:localhost:5432 root@91.99.141.225
```

**Come funziona il tunnel:**
- Mappa la porta `5432` (PostgreSQL VPS) sulla tua porta locale `5433`
- Il tunnel gira in background (flag `-f`)
- Nel codice locale viene usato automaticamente `DB_PORT=5433` (grazie al file `.env` unificato)

**⚠️ IMPORTANTE:** Senza tunnel SSH attivo, tutte le API restituiranno errore `ECONNREFUSED` e le pagine saranno vuote!

### Copia file singoli

```bash
# Copia un file locale → VPS
scp /path/locale/file.js root@91.99.141.225:/var/www/gps-tracker/

# Copia un file VPS → locale
scp root@91.99.141.225:/var/www/gps-tracker/file.js /path/locale/
```

### Sincronizzazione directory con rsync

```bash
# Sincronizza directory locale → VPS (esclude node_modules e .git)
rsync -avz --delete --exclude 'node_modules' --exclude '.git' --exclude '.env.local' \
  /path/locale/ root@91.99.141.225:/var/www/gps-tracker/

# Solo la cartella .next (build)
rsync -avz --delete .next/ root@91.99.141.225:/var/www/gps-tracker/.next/

# Solo i sorgenti (app, components, lib, etc)
rsync -avz --delete app/ root@91.99.141.225:/var/www/gps-tracker/app/
rsync -avz --delete components/ root@91.99.141.225:/var/www/gps-tracker/components/
rsync -avz --delete lib/ root@91.99.141.225:/var/www/gps-tracker/lib/
```

### Alternativa: FileZilla con SFTP

Puoi usare **FileZilla** per caricare i file tramite interfaccia grafica:

**Configurazione FileZilla:**
1. Apri FileZilla
2. File → Gestore siti → Nuovo sito
3. Inserisci i parametri:
   - **Protocollo**: SFTP - SSH File Transfer Protocol
   - **Host**: `91.99.141.225`
   - **Porta**: `22`
   - **Tipo di accesso**: Normale
   - **Utente**: `root`
   - **Password**: [la tua password SSH]
4. Connetti

**Directory VPS da aprire**: `/var/www/gps-tracker`

**⚠️ Importante con FileZilla:**
- ✅ **PRO**: Interfaccia grafica semplice, drag & drop
- ⚠️ **CONTRO**: Più lento di rsync, nessuna esclusione automatica
- **Ricorda**: NON caricare `node_modules/` e `.next/` (troppo grandi e inutili)
- **Dopo il caricamento**: Devi **sempre** fare build sulla VPS e riavviare PM2

**Consiglio**: Usa FileZilla per modifiche singole/rapide, usa `rsync` o lo script `deploy.sh` per deploy completi (molto più veloce!).

#### Perché devo fare build e restart dopo FileZilla?

Dopo aver caricato file con FileZilla, **devi sempre** eseguire questi comandi SSH:

```bash
# 1. Connettiti via SSH
ssh root@91.99.141.225

# 2. Vai nella directory del progetto
cd /var/www/gps-tracker

# 3. COMPILA il nuovo codice
npm run build

# 4. RIAVVIA l'applicazione
pm2 restart gps-tracker-web
```

**Spiegazione dei comandi:**

1. **`cd /var/www/gps-tracker`**
   - Entra nella directory del progetto sulla VPS

2. **`npm run build`** - **FONDAMENTALE!**
   - Next.js non esegue direttamente i tuoi file `.tsx`
   - Deve compilarli: TypeScript → JavaScript ottimizzato
   - Crea tutto nella cartella `.next/` pronta per la produzione
   - **Analogia**: I tuoi file `.tsx` sono ingredienti crudi, il build è la cottura in forno, `.next/` è la torta pronta da servire

3. **`pm2 restart gps-tracker-web`**
   - L'applicazione è sempre in esecuzione in memoria
   - Il restart carica la **nuova versione** appena compilata
   - **Analogia**: Come riavviare un'app sul telefono dopo un aggiornamento

**⚠️ Cosa succede se NON fai il build?**
- ❌ L'applicazione usa il **vecchio codice**
- ❌ Le tue modifiche **NON sono visibili** sul sito
- ❌ Potrebbero apparire errori strani

**💡 Perché rsync/deploy.sh sono più veloci?**
- FileZilla: Carica file + **devi fare manualmente** build + restart
- rsync/deploy.sh: Tutto automatico in un solo comando! (carica + build + restart)

---

## 2. Gestione Database PostgreSQL

### Connessione al database da SSH

```bash
# Connessione interattiva
ssh root@91.99.141.225 "PGPASSWORD=GpsWatch2025 psql -h localhost -U gpsuser -d gpswatch"

# Eseguire una query specifica
ssh root@91.99.141.225 "PGPASSWORD=GpsWatch2025 psql -h localhost -U gpsuser -d gpswatch -c 'SELECT COUNT(*) FROM devices;'"

# Eseguire un file SQL
ssh root@91.99.141.225 "PGPASSWORD=GpsWatch2025 psql -h localhost -U gpsuser -d gpswatch -f /path/to/file.sql"
```

### Query utili

```bash
# Contare record nelle tabelle principali
ssh root@91.99.141.225 "PGPASSWORD=GpsWatch2025 psql -h localhost -U gpsuser -d gpswatch -c '
SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM devices) as devices,
  (SELECT COUNT(*) FROM wearers) as wearers,
  (SELECT COUNT(*) FROM health_data) as health_data;
'"

# Vedere tutte le tabelle
ssh root@91.99.141.225 "PGPASSWORD=GpsWatch2025 psql -h localhost -U gpsuser -d gpswatch -c '\dt'"

# Backup database
ssh root@91.99.141.225 "PGPASSWORD=GpsWatch2025 pg_dump -h localhost -U gpsuser gpswatch > /tmp/backup_$(date +%Y%m%d_%H%M%S).sql"

# Scaricare backup in locale
scp root@91.99.141.225:/tmp/backup_*.sql ./backups/

# Ripristinare backup
ssh root@91.99.141.225 "PGPASSWORD=GpsWatch2025 psql -h localhost -U gpsuser -d gpswatch -f /tmp/backup_20250105.sql"
```

### Credenziali Database

```
Host: localhost
Port: 5432 (VPS) / 5433 (locale via SSH tunnel)
Database: gpswatch
User: gpsuser
Password: GpsWatch2025
```

---

## 3. Processo di Deploy

### ⚠️ IMPORTANTE: Build sulla VPS

**NON fare il build in locale!** Le variabili d'ambiente vengono "baked in" durante il build.

Il build DEVE essere fatto direttamente sulla VPS con le variabili di produzione.

### Deploy completo - Passo per passo

#### 1. Sincronizza i file sorgenti

```bash
# Dalla directory locale del progetto
rsync -avz --delete --exclude 'node_modules' --exclude '.git' --exclude '.env.local' --exclude '.next' \
  app/ root@91.99.141.225:/var/www/gps-tracker/app/

rsync -avz --delete components/ root@91.99.141.225:/var/www/gps-tracker/components/
rsync -avz --delete contexts/ root@91.99.141.225:/var/www/gps-tracker/contexts/
rsync -avz --delete hooks/ root@91.99.141.225:/var/www/gps-tracker/hooks/
rsync -avz --delete lib/ root@91.99.141.225:/var/www/gps-tracker/lib/
```

#### 2. Sincronizza i file di configurazione

```bash
scp package.json package-lock.json next.config.js tsconfig.json \
  tailwind.config.js postcss.config.js \
  root@91.99.141.225:/var/www/gps-tracker/
```

#### 3. Installa/Aggiorna dipendenze sulla VPS

```bash
ssh root@91.99.141.225 "cd /var/www/gps-tracker && npm install --legacy-peer-deps"
```

#### 4. Build sulla VPS (FONDAMENTALE!)

```bash
ssh root@91.99.141.225 "cd /var/www/gps-tracker && NODE_ENV=production npm run build"
```

#### 5. Riavvia l'applicazione

```bash
ssh root@91.99.141.225 "pm2 restart gps-tracker-web"
```

#### 6. Verifica funzionamento

```bash
# Verifica che l'app risponda
ssh root@91.99.141.225 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/"

# Testa una API specifica
ssh root@91.99.141.225 "curl -s http://localhost:3001/api/wearers | head -c 200"
```

---

## 4. Gestione PM2

### Comandi base PM2

```bash
# Lista processi
ssh root@91.99.141.225 "pm2 list"

# Restart applicazione web
ssh root@91.99.141.225 "pm2 restart gps-tracker-web"

# Restart con aggiornamento variabili ambiente
ssh root@91.99.141.225 "pm2 restart gps-tracker-web --update-env"

# Stop applicazione
ssh root@91.99.141.225 "pm2 stop gps-tracker-web"

# Start applicazione
ssh root@91.99.141.225 "pm2 start gps-tracker-web"

# Riavvia server GPS
ssh root@91.99.141.225 "pm2 restart gps-server"
```

### Log e Monitoraggio

```bash
# Vedere log in tempo reale
ssh root@91.99.141.225 "pm2 logs gps-tracker-web"

# Ultimi 50 log
ssh root@91.99.141.225 "pm2 logs gps-tracker-web --lines 50 --nostream"

# Solo errori
ssh root@91.99.141.225 "pm2 logs gps-tracker-web --err --lines 30 --nostream"

# Info dettagliate processo
ssh root@91.99.141.225 "pm2 info gps-tracker-web"

# Variabili ambiente del processo
ssh root@91.99.141.225 "pm2 env 3"  # 3 è l'ID del processo

# Monitoraggio risorse
ssh root@91.99.141.225 "pm2 monit"
```

### Salvataggio configurazione

```bash
# Salva la configurazione attuale (importante dopo modifiche)
ssh root@91.99.141.225 "pm2 save"

# Configurazione all'avvio del sistema
ssh root@91.99.141.225 "pm2 startup"
```

---

## 5. Troubleshooting

### Problema: API non rispondono

```bash
# 1. Verifica stato PostgreSQL
ssh root@91.99.141.225 "systemctl status postgresql"

# 2. Verifica connessione database
ssh root@91.99.141.225 "PGPASSWORD=GpsWatch2025 psql -h localhost -U gpsuser -d gpswatch -c 'SELECT 1;'"

# 3. Verifica porte in ascolto
ssh root@91.99.141.225 "ss -tlnp | grep -E '(3000|3001|5432)'"

# 4. Verifica errori nei log
ssh root@91.99.141.225 "pm2 logs gps-tracker-web --err --lines 50 --nostream"
```

### Problema: Build fallisce

```bash
# Pulisci cache Next.js
ssh root@91.99.141.225 "cd /var/www/gps-tracker && rm -rf .next"

# Reinstalla dipendenze
ssh root@91.99.141.225 "cd /var/www/gps-tracker && rm -rf node_modules && npm install --legacy-peer-deps"

# Rebuild
ssh root@91.99.141.225 "cd /var/www/gps-tracker && NODE_ENV=production npm run build"
```

### Problema: App non si avvia dopo deploy

```bash
# Stop completo
ssh root@91.99.141.225 "pm2 stop gps-tracker-web"

# Pulisci cache
ssh root@91.99.141.225 "cd /var/www/gps-tracker && rm -rf .next"

# Rebuild sulla VPS
ssh root@91.99.141.225 "cd /var/www/gps-tracker && NODE_ENV=production npm run build"

# Riavvia
ssh root@91.99.141.225 "pm2 start gps-tracker-web"

# Salva configurazione
ssh root@91.99.141.225 "pm2 save"
```

### Verifica spazio disco

```bash
# Spazio totale disco
ssh root@91.99.141.225 "df -h /"

# Output attuale (Gennaio 2025):
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sda1        75G  3.9G   68G   6% /

# Spazio occupato dai progetti
ssh root@91.99.141.225 "du -sh /var/www/gps-tracker /root/gps-server"

# Output attuale:
# 811M    /var/www/gps-tracker
# 25M     /root/gps-server

# Spazio dettagliato per directory specifiche
ssh root@91.99.141.225 "du -h --max-depth=1 /var/www/gps-tracker | sort -h"

# Trova file più grandi (top 10)
ssh root@91.99.141.225 "find /var/www/gps-tracker -type f -exec du -h {} + | sort -rh | head -10"
```

**Stato attuale VPS:**

- Disco totale: **75 GB**
- Spazio usato: **3.9 GB (6%)**
- Spazio disponibile: **68 GB**
- GPS Tracker Web: **811 MB**
- GPS Server TCP: **25 MB**

### Verifica memoria

```bash
# Memoria RAM
ssh root@91.99.141.225 "free -h"

# Output attuale (Gennaio 2025):
#               total        used        free      shared  buff/cache   available
# Mem:           3.7Gi       650Mi       685Mi        35Mi       2.7Gi       3.1Gi
# Swap:             0B          0B          0B

# Uso memoria per processo
ssh root@91.99.141.225 "ps aux --sort=-%mem | head -10"

# Memoria usata da PM2
ssh root@91.99.141.225 "pm2 list"
```

**Stato attuale Memoria:**

- RAM totale: **3.7 GB**
- RAM usata: **650 MB**
- RAM disponibile: **3.1 GB**
- Swap: **Non configurato**

---

## 6. Variabili d'Ambiente

### ✅ File .env Unificato (NUOVO)

**Posizione**:
- Locale: `/Users/fabio/NEXT_JS/gps-tracker/.env`
- VPS: `/var/www/gps-tracker/.env`

**Riconoscimento automatico dell'ambiente**:
Il file `.env` unificato funziona **automaticamente** sia in locale che su VPS grazie alla logica in `lib/db.ts`:

```typescript
const defaultPort = process.env.NODE_ENV === 'production' ? '5432' : '5433'
```

- **Locale** (`npm run dev`): `NODE_ENV=development` → usa porta **5433** (tunnel SSH)
- **VPS** (`npm start`): `NODE_ENV=production` → usa porta **5432** (database locale)

**Contenuto file `.env` unificato**:

```env
# 📱 GPS WATCH - CONFIGURAZIONE UNIFICATA
# Questo file funziona automaticamente sia in locale che su VPS
#
# AMBIENTE AUTOMATICO:
# - Locale (npm run dev): NODE_ENV=development → usa porta 5433 (tunnel SSH)
# - VPS (npm start): NODE_ENV=production → usa porta 5432 (database locale)

# 🗄️ Database Configuration
# IMPORTANTE: NON impostare DB_PORT qui, viene scelto automaticamente da lib/db.ts
DB_HOST=localhost
DB_NAME=gpswatch
DB_USER=gpsuser
DB_PASSWORD=GpsWatch2025
# DB_PORT viene impostato automaticamente:
#   - development: 5433 (tunnel SSH verso VPS)
#   - production: 5432 (database locale sulla VPS)

# 📱 Watch Configuration
WATCH_PHONE_NUMBER="+393987654321"
WATCH_PASSWORD="123456"

# 🌐 Server Configuration
SERVER_PORT=8001

# 🖥️ VPS TCP Server (HTTP API per comandi TCP)
VPS_TCP_SERVER="http://91.99.141.225:3000"

# 🔐 JWT Secret per autenticazione
JWT_SECRET=gps-watch-super-secret-key-2025

# 🌐 Base URL per chiamate API interne
NEXT_PUBLIC_BASE_URL=http://localhost:3001

# 📊 Logging
ENABLE_FILE_LOGGING=true
LOG_FILE_PATH="./sms_responses.log"
LOG_LEVEL="info"
```

**File di backup**:
- I vecchi file sono salvati con suffisso `_old`:
  - `.env.local_old` (locale)
  - `.env.production_old` (locale)
  - `.env_old` (VPS)
  - `.env.production_old` (VPS)

---

## 7. Script Deploy Rapido

Crea uno script `deploy.sh` nella root del progetto:

```bash
#!/bin/bash

echo "🚀 Inizio deploy su VPS..."

# 1. Sincronizza sorgenti
echo "📦 Sincronizzazione file sorgenti..."
rsync -avz --delete app/ root@91.99.141.225:/var/www/gps-tracker/app/
rsync -avz --delete components/ root@91.99.141.225:/var/www/gps-tracker/components/
rsync -avz --delete contexts/ root@91.99.141.225:/var/www/gps-tracker/contexts/
rsync -avz --delete hooks/ root@91.99.141.225:/var/www/gps-tracker/hooks/
rsync -avz --delete lib/ root@91.99.141.225:/var/www/gps-tracker/lib/

# 2. Sincronizza config
echo "⚙️  Sincronizzazione configurazioni..."
scp package.json package-lock.json next.config.js tsconfig.json tailwind.config.js postcss.config.js \
  root@91.99.141.225:/var/www/gps-tracker/

# 3. Installa dipendenze
echo "📚 Installazione dipendenze..."
ssh root@91.99.141.225 "cd /var/www/gps-tracker && npm install --legacy-peer-deps"

# 4. Build sulla VPS
echo "🔨 Build applicazione sulla VPS..."
ssh root@91.99.141.225 "cd /var/www/gps-tracker && NODE_ENV=production npm run build"

# 5. Restart PM2
echo "🔄 Riavvio applicazione..."
ssh root@91.99.141.225 "pm2 restart gps-tracker-web"

# 6. Verifica
echo "✅ Verifica funzionamento..."
HTTP_CODE=$(ssh root@91.99.141.225 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Deploy completato con successo! (HTTP $HTTP_CODE)"
else
    echo "❌ Errore: l'applicazione non risponde correttamente (HTTP $HTTP_CODE)"
    exit 1
fi

echo "🎉 Deploy terminato!"
```

Rendi eseguibile lo script:

```bash
chmod +x deploy.sh
```

Esegui il deploy:

```bash
./deploy.sh
```

---

## 8. Backup e Restore

### Backup completo

```bash
# Backup database
ssh root@91.99.141.225 "PGPASSWORD=GpsWatch2025 pg_dump -h localhost -U gpsuser gpswatch > /tmp/gpswatch_backup_$(date +%Y%m%d).sql"

# Scarica backup in locale
scp root@91.99.141.225:/tmp/gpswatch_backup_*.sql ./backups/

# Backup file applicazione
ssh root@91.99.141.225 "tar -czf /tmp/gps-tracker-backup-$(date +%Y%m%d).tar.gz -C /var/www gps-tracker --exclude='node_modules' --exclude='.next'"

# Scarica backup applicazione
scp root@91.99.141.225:/tmp/gps-tracker-backup-*.tar.gz ./backups/
```

### Restore

```bash
# Restore database
scp ./backups/gpswatch_backup_20250105.sql root@91.99.141.225:/tmp/
ssh root@91.99.141.225 "PGPASSWORD=GpsWatch2025 psql -h localhost -U gpsuser -d gpswatch -f /tmp/gpswatch_backup_20250105.sql"

# Restore applicazione
scp ./backups/gps-tracker-backup-20250105.tar.gz root@91.99.141.225:/tmp/
ssh root@91.99.141.225 "cd /var/www && tar -xzf /tmp/gps-tracker-backup-20250105.tar.gz"
```

---

## 9. Note Importanti

### ⚠️ RICORDA SEMPRE:

1. **Build sulla VPS**: NON fare il build in locale, le variabili d'ambiente verrebbero "baked in" con valori sbagliati
2. **SSH Tunnel per sviluppo**: Quando lavori in locale, usa sempre l'SSH tunnel (porta 5433):
   ```bash
   ssh -f -N -L 5433:localhost:5432 root@91.99.141.225
   ```
3. **File .env unificato**: Usa lo stesso file `.env` sia in locale che su VPS, il riconoscimento è automatico
4. **Backup regolari**: Fai backup del database prima di modifiche importanti
5. **Test dopo deploy**: Verifica sempre che l'applicazione risponda correttamente
6. **PM2 save**: Dopo modifiche ai processi PM2, salva sempre la configurazione

### Differenze Ambiente Locale vs VPS

| Parametro        | Locale                    | VPS                   | Note                              |
| ---------------- | ------------------------- | --------------------- | --------------------------------- |
| DB_PORT          | 5433 (SSH tunnel)         | 5432                  | Auto-detect via NODE_ENV          |
| DB_HOST          | localhost                 | localhost             | Stesso valore in `.env`           |
| NODE_ENV         | development               | production            | Impostato automaticamente         |
| Next.js URL      | http://localhost:3000     | http://localhost:3001 |                                   |
| TCP Server       | http://91.99.141.225:3000 | http://localhost:3000 |                                   |
| File config      | `.env`                    | `.env`                | Stesso file, comportamento diverso |
| Tunnel SSH       | ✅ Richiesto              | ❌ Non necessario     | Porta 5433 → 5432                 |

---

## 10. Contatti e Risorse

- **Documentazione Next.js**: https://nextjs.org/docs
- **Documentazione PM2**: https://pm2.keymetrics.io/docs/
- **PostgreSQL**: https://www.postgresql.org/docs/

---

**Ultima modifica**: 2025-01-05
**Versione**: 1.4 (Sistema .env unificato + Guida FileZilla SFTP + Script tunnel automatico)
