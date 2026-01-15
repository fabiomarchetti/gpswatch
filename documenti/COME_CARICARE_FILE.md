# 📤 GUIDA DETTAGLIATA CARICAMENTO FILE

## 🎯 Obiettivo

Caricare i 3 file necessari sul server GPS

---

## 📁 **FILE DA CARICARE**

### 🗂 **Percorso Locale (tuo Mac)**

```
/Users/fabio/NEXT_JS/gps-tracker/
├── create_new_tables.sql      (nuove tabelle database)
├── .env.example              (template configurazione)
└── server_sms_backup.js      (server SMS emergenze)
```

### 🗂 **Destinazione Server**

```
/percorso/gps-server/  (la tua cartella progetto)
```

---

## 📤 **METODO 1: FILEZILLA (RACCOMANDATO)**

### 🔧 **Configurazione FileZilla**

1. **Apri FileZilla**
2. **Host**: `91.99.141.225`
3. **Username**: `root`
4. **Password**: la tua password SSH
5. **Porta**: `22` (SFTP)
6. Clicca **"Connessione rapida"**

### 📂 **Navigazione File**

1. **Pannello sinistra**:

   - Naviga fino a `/Users/fabio/NEXT_JS/gps-tracker/`
   - Vedrai i 3 file elencati sopra

2. **Pannello destra**:
   - Naviga fino a `/percorso/gps-server/`
   - Questa è la cartella del progetto sul server

### 📤 **Operazione di Caricamento**

1. **Seleziona i 3 file** nel pannello sinistra
2. **Trascinali** nel pannello destra
3. **Conferma sovrascrittura** se chiesto
4. **Attendi completamento** trasferimento

### ✅ **Verifica Successo**

Nel pannello destro dovresti vedere:

```
📄 create_new_tables.sql
📄 .env.example
📄 server_sms_backup.js
```

---

## 📤 **METODO 2: TERMINALE SCP**

### 🖥️ **Dal tuo Mac**

```bash
# 1. Vai alla cartella del progetto
cd /Users/fabio/NEXT_JS/gps-tracker

# 2. Carica i 3 file con scp
scp create_new_tables.sql root@91.99.141.225:/percorso/gps-server/
scp .env.example root@91.99.141.225:/percorso/gps-server/
scp server_sms_backup.js root@91.99.141.225:/percorso/gps-server/

# 3. Inserisci password SSH quando richiesta
```

### ✅ **Verifica Caricamento**

```bash
# Connettiti al server per verificare
ssh root@91.99.141.225
cd /percorso/gps-server/
ls -la *.sql *.env *.js
```

---

## 🔧 **DOPO IL CARICAMENTO**

### 📞 **Connettiti al Server**

```bash
ssh root@91.99.141.225
cd /percorso/gps-server/
```

### ✅ **Verifica File Presenti**

```bash
ls -la
# Dovresti vedere output simile:
# -rw-r--r-- 1 root root  4500 Dec 24 14:30 create_new_tables.sql
# -rw-r--r-- 1 root root   800 Dec 24 14:30 .env.example
# -rw-r--r-- 1 root root 15000 Dec 24 14:30 server_sms_backup.js
```

### 🚀 **Continua con Installazione**

```bash
# 1. Esegui script tabelle
psql -h localhost -U gpsuser -d gpswatch -f create_new_tables.sql

# 2. Crea file configurazione
cp .env.example .env

# 3. Modifica configurazione
nano .env
# Inserisci le tue credenziali Twilio
```

---

## ❌ **RISOLUZIONE PROBLEMI**

### 🔍 **Problema: Percorso server sconosciuto**

```bash
# Trova la cartella corretta del progetto
find / -name "server.js" -type f 2>/dev/null
# Output esempio: /var/www/gps-tracker/server.js
# Quindi il percorso è: /var/www/gps-tracker/
```

### 🔍 **Problema: Permission denied**

```bash
# Controlla utente e permessi
whoami  # dovrebbe essere root
ls -la /percorso/gps-server/
# Se necessario, cambia permessi:
chmod 755 /percorso/gps-server/
```

### 🔍 **Problema: FileZilla non si connette**

1. **Verifica IP**: 91.99.141.225
2. **Controlla porta**: 22 (SSH) o 21 (FTP)
3. **Prova utente diverso**: ubuntu, www-data
4. **Controlla firewall server**: `ufw status`

### 🔍 **Problema: SCP non funziona**

```bash
# Verifica connessione SSH
ssh root@91.99.141.225 "echo 'Connessione OK'"

# Se funziona, riprova SCP con opzioni verbose:
scp -v create_new_tables.sql root@91.99.141.225:/percorso/gps-server/
```

---

## 📋 **CHECKLIST CARICAMENTO**

### ✅ **Prima di Iniziare**

- [ ] Ho accesso SSH al server
- [ ] Conosco percorso esatto progetto
- [ ] Ho FileZilla installato (o uso terminale)

### ✅ **Durante Caricamento**

- [ ] File trovati in locale
- [ ] Connessione FTP/SCP stabilita
- [ ] Tutti i 3 file trasferiti
- [ ] Nessun errore di trasferimento

### ✅ **Dopo Caricamento**

- [ ] File presenti sul server
- [ ] Permessi corretti
- [ ] Pronto per eseguire script database

---

## 🎯 **PROSSIMO PASSO**

Una volta caricati i 3 file con successo:

1. ✅ **Esegui `create_new_tables.sql`**
2. ✅ **Configura `.env`**
3. ✅ **Riavvia server**
4. ✅ **Verifica dati in chiaro**

Poi torna alla guida **[`ORDINE_OPERAZIONI.md`](ORDINE_OPERAZIONI.md)** e continua dal **PASSO 5**!

---

_📅 Guida aggiornata: 24 Dicembre 2024_  
_🎯 Obiettivo: Caricamento 3 file essenziali_  
_📤 Metodo: FileZilla (consigliato) o SCP_
