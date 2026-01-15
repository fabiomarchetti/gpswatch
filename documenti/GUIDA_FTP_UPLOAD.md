# 📤 GUIDA CARICAMENTO FILE VIA FTP

## 🎯 Obiettivo

Caricare i file aggiornati sul server GPS per gestire i dati in chiaro dall'orologio

---

## 📁 **File da Caricare sul Server**

### 🔄 **File MODIFICATI da Sostituire**

#### 1️⃣ **server.js**

- **Percorso locale**: `/Users/fabio/NEXT_JS/gps-tracker/server.js`
- **Destinazione server**: `/percorso/gps-server/server.js`
- **Perché**: Aggiunto gestione nuovi comandi (CONFIG, ICCID, etc.)

#### 2️⃣ **package.json**

- **Percorso locale**: `/Users/fabio/NEXT_JS/gps-tracker/package.json`
- **Destinazione server**: `/percorso/gps-server/package.json`
- **Perché**: Aggiunte dipendenze SMS (twilio, express, etc.)

### 🆕 **File NUOVI da Caricare**

#### 3️⃣ **create_new_tables.sql**

- **Percorso locale**: `/Users/fabio/NEXT_JS/gps-tracker/create_new_tables.sql`
- **Destinazione server**: `/percorso/gps-server/create_new_tables.sql`
- **Perché**: Script per creare nuove tabelle database

#### 4️⃣ **.env.example**

- **Percorso locale**: `/Users/fabio/NEXT_JS/gps-tracker/.env.example`
- **Destinazione server**: `/percorso/gps-server/.env.example`
- **Perché**: Template configurazione SMS

#### 5️⃣ **server_sms.js**

- **Percorso locale**: `/Users/fabio/NEXT_JS/gps-tracker/server_sms.js`
- **Destinazione server**: `/percorso/gps-server/server_sms.js`
- **Perché**: Server separato per gestione SMS

#### 6️⃣ **test_sms_complete.js**

- **Percorso locale**: `/Users/fabio/NEXT_JS/gps-tracker/test_sms_complete.js`
- **Destinazione server**: `/percorso/gps-server/test_sms_complete.js`
- **Perché**: Script test completo comandi SMS

---

## 📋 **Procedura FTP con FileZilla**

### 🔧 **Configurazione FileZilla**

1. Apri FileZilla
2. **Host**: `91.99.141.225`
3. **Username**: `root` (o il tuo utente SSH)
4. **Password**: la tua password SSH
5. **Porta**: `22` (SFTP)
6. Clicca **"Connessione rapida"**

### 📂 **Navigazione Cartelle**

1. **Sinistra**: Il tuo Mac → naviga in `/Users/fabio/NEXT_JS/gps-tracker/`
2. **Destra**: Server → naviga nella cartella del progetto GPS:
   - Probabilmente: `/root/gps-server/`
   - Oppure: `/var/www/gps-tracker/`
   - Oppure: `/home/username/gps-server/`

### 📤 **Caricamento File**

#### **File da Sostituire (SOVRASCRIVI):**

```
☑️ server.js
☑️ package.json
```

#### **File Nuovi (AGGIUNGI):**

```
☑️ create_new_tables.sql
☑️ .env.example
☑️ server_sms.js
☑️ test_sms_complete.js
```

### ✅ **Operazioni FTP:**

1. **Trascina** i file da sinistra a destra
2. **Conferma sovrascrittura** per server.js e package.json
3. **Attendi trasferimento completo**
4. **Verifica** che tutti i file siano presenti sul server

---

## 📋 **Procedura Alternative (senza FTP)**

### 🚀 **Opzione 1: SCP da Terminale**

```bash
# Dal tuo Mac, nella cartella del progetto
cd /Users/fabio/NEXT_JS/gps-tracker

# Copia file principali
scp server.js root@91.99.141.225:/percorso/gps-server/
scp package.json root@91.99.141.225:/percorso/gps-server/

# Copia nuovi file
scp create_new_tables.sql root@91.99.141.225:/percorso/gps-server/
scp .env.example root@91.99.141.225:/percorso/gps-server/
scp server_sms_backup.js root@91.99.141.225:/percorso/gps-server/
scp SISTEMA_SMS_BACKUP.md root@91.99.141.225:/percorso/gps-server/
```

### 🚀 **Opzione 2: Git (se usi versionamento)**

```bash
# Sul tuo Mac
git add .
git commit -m "Aggiunto gestione dati chiari e SMS"
git push origin main

# Sul server
cd /percorso/gps-server/
git pull origin main
```

---

## 🔧 **Dopo il Caricamento**

### 1️⃣ **Connettiti al Server**

```bash
ssh root@91.99.141.225
cd /percorso/gps-server/
```

### 2️⃣ **Verifica File Caricati**

```bash
ls -la
# Dovresti vedere tutti i file nuovi/aggiornati
```

### 3️⃣ **Installa Nuove Dipendenze**

```bash
npm install
# Oppure se hai lo script:
npm run setup
```

### 4️⃣ **Crea Tabelle Database**

```bash
psql -h localhost -U gpsuser -d gpswatch -f create_new_tables.sql
```

### 5️⃣ **Riavvia Server**

```bash
pm2 restart server
# Oppure:
pm2 stop server && pm2 start server.js --name "server"
```

### 6️⃣ **Verifica Funzionamento**

```bash
pm2 logs server --lines 20
```

---

## ⚠️ **NOTE IMPORTANTI**

### 🔄 **Backup Prima di Sostituire**

```bash
# Sul server, prima di sovrascrivere
cp server.js server.js.backup
cp package.json package.json.backup
```

### 📁 **Percorsi da Verificare**

I percorsi esatti sul server potrebbero essere:

- `/root/gps-server/`
- `/var/www/gps-tracker/`
- `/home/ubuntu/gps-tracker/`
- `/root/project/gps-server/`

### 🔐 **Permessi File**

Dopo il caricamento, verifica permessi:

```bash
chmod +x server.js
chmod +x test_sms_complete.js
```

---

## 📋 **Checklist Completa**

### ✅ **Prima del Caricamento:**

- [ ] Ho il percorso esatto della cartella sul server
- [ ] Ho le credenziali FTP/SSH corrette
- [ ] Ho fatto backup dei file esistenti

### ✅ **Durante il Caricamento:**

- [ ] Server.js e package.json sovrascritti
- [ ] Tutti i file nuovi caricati
- [ ] Trasferimento completato senza errori

### ✅ **Dopo il Caricamento:**

- [ ] Installate nuove dipendenze npm
- [ ] Eseguito script database
- [ ] Server riavviato correttamente
- [ ] Log mostrano nuovi comandi processati

---

## 🆘 **Risoluzione Problemi**

### ❌ **Connessione FTP fallita**

- Verifica IP: 91.99.141.225
- Controlla credenziali SSH
- Prova porta diversa (21, 2222)

### ❌ **File non trovato sul server**

- Verifica percorso cartella
- Usa `find / -name "server.js"` per trovare file

### ❌ **Permessi negati**

- Usa `sudo` se necessario
- Controlla proprietà cartelle

### ❌ **Server non si riavvia**

- Controlla errori con `pm2 logs server`
- Verifica sintassi JavaScript: `node -c server.js`

---

## 🎯 **Riepilogo File da Caricare**

| File                    | Azione     | Importanza    |
| ----------------------- | ---------- | ------------- |
| `server.js`             | Sostituire | 🔴 CRITICO    |
| `package.json`          | Sostituire | 🔴 CRITICO    |
| `create_new_tables.sql` | Nuovo      | 🔴 CRITICO    |
| `.env.example`          | Nuovo      | 🟡 IMPORTANTE |
| `server_sms.js`         | Nuovo      | 🟡 IMPORTANTE |
| `test_sms_complete.js`  | Nuovo      | 🟢 OPTIONAL   |

---

_📅 Guida aggiornata: 24 Dicembre 2024_  
_🎯 Obiettivo: Caricare file aggiornati per dati chiari_
