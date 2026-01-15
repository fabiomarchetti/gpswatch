# 📜 Script SQL - GPS Watch Tracker

Questa cartella contiene tutti gli script SQL per la gestione del database.

## 📋 Come eseguire gli script in pgAdmin

### 🔵 Database Locale (GPS Watch Local)

1. Apri **pgAdmin**
2. Nel pannello di sinistra, espandi **Servers** → **GPS Watch Local**
3. Espandi **Databases** → **gpswatch**
4. **Click destro** su `gpswatch` → **Query Tool**
5. Nel Query Tool:
   - Click su **Open File** (icona cartella 📁) oppure `Cmd+O` (Mac) / `Ctrl+O` (Windows)
   - Naviga a: `/Users/fabio/NEXT_JS/gps-tracker/script/`
   - Seleziona lo script da eseguire (es. `01_create_users_table.sql`)
   - Click su **Execute/Run** (icona play ▶️) oppure premi `F5`
6. Verifica l'output nella sezione **Messages** in basso
7. Se vedi "✓ creata con successo", tutto è andato bene!

### 🌍 Database VPS (GPS Watch VPS)

**Ripeti gli stessi passaggi sopra**, ma al punto 2 seleziona **GPS Watch VPS** invece di Local.

⚠️ **IMPORTANTE:** Esegui TUTTI gli script sia su **Local** che su **VPS** per mantenerli sincronizzati!

---

## 🗂️ Lista Script (Ordine di Esecuzione)

**Ordine corretto:**
1. 01_create_users_table.sql
2. 02_create_ruoli_table.sql
3. 03_create_user_relations_table.sql
4. 04_migrate_users_to_ruoli.sql
5. **06_fix_ruolo_nullable.sql** ⚠️ OBBLIGATORIO
6. **06b_remove_ruolo_constraint.sql** ⚠️ OBBLIGATORIO
7. **07_sync_ruolo_trigger.sql** ⚠️ CONSIGLIATO
8. **08_create_devices_table.sql** ⚠️ OBBLIGATORIO (gestione orologi GPS)
9. **09_create_device_snapshots_table.sql** ⚠️ CONSIGLIATO (storico configurazioni)
10. 05_cleanup_old_ruolo_column.sql (opzionale)

---

### ✅ 01_create_users_table.sql
**Quando:** Prima installazione
**Database:** Locale + VPS
**Descrizione:** Crea la tabella `users` per gestire gli utenti del sistema

**Cosa crea:**
- Tabella `users` con campi: id, nome, cognome, ruolo, username, password, email, active
- Indici per ottimizzare le query
- Trigger per `updated_at` automatico
- Utente admin di default (username: `admin`, password: `Admin2025!`)

---

### ✅ 02_create_ruoli_table.sql
**Quando:** Dopo `01_create_users_table.sql`
**Database:** Locale + VPS
**Descrizione:** Crea la tabella `ruoli` per gestire i ruoli del sistema

**Cosa crea:**
- Tabella `ruoli` con campi: id, nome_ruolo, descrizione, livello_accesso
- 5 ruoli predefiniti:
  - `sviluppatore` (livello 5) - Accesso completo al sistema
  - `animatore_digitale` (livello 4) - Configurazione orologi
  - `assistente_control` (livello 3) - Monitoraggio multi-utente
  - `controllo_parentale` (livello 2) - Monitoraggio parenti
  - `utente_base` (livello 1) - Solo propri dati

---

### ✅ 03_create_user_relations_table.sql
**Quando:** Dopo `02_create_ruoli_table.sql`
**Database:** Locale + VPS
**Descrizione:** Crea la tabella `user_relations` per gestire relazioni tutore-tutelato

**Cosa crea:**
- Tabella `user_relations` per relazioni tra utenti
- Permette a un "controllo_parentale" di monitorare più utenti
- Campi: tutore_id, tutelato_id, tipo_relazione (es: "genitore", "tutore")

---

### ✅ 04_migrate_users_to_ruoli.sql
**Quando:** Dopo `03_create_user_relations_table.sql`
**Database:** Locale + VPS
**Descrizione:** Migra la tabella `users` da ruolo VARCHAR a ruolo_id INTEGER

**Cosa fa:**
- Aggiunge colonna `ruolo_id` a `users`
- Mappa i vecchi ruoli (admin, user, viewer) ai nuovi ID
- Crea foreign key verso tabella `ruoli`
- **NON rimuove** la vecchia colonna `ruolo` (per sicurezza)

---

### 🔧 06_fix_ruolo_nullable.sql
**Quando:** SUBITO dopo `04_migrate_users_to_ruoli.sql` - **OBBLIGATORIO**
**Database:** Locale + VPS
**Descrizione:** Rimuove vincolo NOT NULL dalla vecchia colonna `ruolo`

**Cosa fa:**
- Rende la colonna `ruolo` VARCHAR nullable (DROP NOT NULL)
- Imposta `ruolo_id` come NOT NULL (obbligatorio)
- Permette di registrare nuovi utenti usando il nuovo sistema con `ruolo_id`

⚠️ **IMPORTANTE:** Senza questo script, la registrazione di nuovi utenti FALLISCE!

---

### 🔧 06b_remove_ruolo_constraint.sql
**Quando:** Dopo `06_fix_ruolo_nullable.sql` - **OBBLIGATORIO**
**Database:** Locale + VPS
**Descrizione:** Rimuove il vincolo CHECK sulla colonna `ruolo`

**Cosa fa:**
- Trova e rimuove automaticamente il CHECK CONSTRAINT sulla colonna `ruolo`
- Il constraint accettava solo i vecchi valori ('admin', 'user', 'viewer')
- Permette di inserire i nuovi ruoli ('sviluppatore', 'animatore_digitale', etc.)

⚠️ **IMPORTANTE:** Senza questo script, il trigger 07 FALLISCE con errore "check constraint"!

---

### ✅ 07_sync_ruolo_trigger.sql
**Quando:** Dopo `06_fix_ruolo_nullable.sql` - **CONSIGLIATO**
**Database:** Locale + VPS
**Descrizione:** Crea trigger per sincronizzare automaticamente ruolo con ruolo_id

**Cosa fa:**
- Crea funzione trigger `sync_ruolo_from_ruolo_id()`
- Crea trigger su INSERT che popola automaticamente `ruolo` da `ruolo_id`
- Crea trigger su UPDATE che aggiorna `ruolo` quando cambia `ruolo_id`
- Popola i campi `ruolo` NULL degli utenti esistenti

**Vantaggi:**
- Il campo `ruolo` viene automaticamente popolato quando inserisci/aggiorni utenti
- Mantiene sincronizzati `ruolo` e `ruolo_id`
- Non devi modificare il codice dell'applicazione

---

### ✅ 08_create_devices_table.sql
**Quando:** Dopo `07_sync_ruolo_trigger.sql` - **OBBLIGATORIO**
**Database:** Locale + VPS
**Descrizione:** Crea tabella `devices` per gestire orologi GPS

**Cosa crea:**
- Identificatori: device_id, device_internal_id (ID:...), imei
- Hardware: firmware_version, model, hardware_version
- SIM: phone_number, iccid, apn, mcc, mnc
- Server: password, server_ip, server_port, profile, upload_interval
- Localizzazione: language_code (12=Italia), timezone, gps_zone
- Status: battery_level, network_status, network_signal
- Posizione: last_latitude, last_longitude, last_altitude, last_speed
- Salute: heart_rate, bp, spo2, temperatura, steps
- Metadata: timestamps, notes, last_sms_raw (risposta SMS completa)

**Campi chiave dalla risposta SMS `pw,123456,ts#`:**
```
ver → firmware_version
ID → device_internal_id
imei → imei
ip_url → server_ip
port → server_port
upload → upload_interval
bat level → battery_level
language → language_code
zone → timezone
NET → network_status + network_signal
GPS → gps_zone
apn → apn
```

---

### ✅ 09_create_device_snapshots_table.sql
**Quando:** Dopo `08_create_devices_table.sql` - **CONSIGLIATO**
**Database:** Locale + VPS
**Descrizione:** Crea tabella `device_snapshots` per storico configurazioni

**Cosa crea:**
- Storico completo di TUTTE le risposte SMS ricevute
- Snapshot automatici ad ogni aggiornamento device
- View `v_latest_device_snapshots` per ultimo stato
- Campi: tutti i dati di configurazione + raw_sms_response
- Trigger opzionale per auto-snapshot (commentato di default)

**Vantaggi:**
- Traccia tutti i cambiamenti configurazione nel tempo
- Debug: confronta configurazioni precedenti
- Analisi: vedi evoluzione batteria, segnale, firmware
- Audit: chi ha fatto cosa e quando

---

### ⚠️ 05_cleanup_old_ruolo_column.sql
**Quando:** OPZIONALE - Solo dopo aver verificato che tutto funzioni
**Database:** Locale + VPS
**Descrizione:** Rimuove la vecchia colonna `ruolo` VARCHAR

**⚠️ ATTENZIONE:**
- Script **IRREVERSIBILE**
- Esegui SOLO dopo aver testato il sistema
- Fai un **backup** del database prima di eseguirlo
- Devi decommentare il comando `ALTER TABLE` per eseguirlo

---

## 🔄 Procedura Completa di Installazione

### Per Database Locale (GPS Watch Local):

```
1. Esegui: 01_create_users_table.sql
2. Esegui: 02_create_ruoli_table.sql
3. Esegui: 03_create_user_relations_table.sql
4. Esegui: 04_migrate_users_to_ruoli.sql
5. Esegui: 06_fix_ruolo_nullable.sql ⚠️ OBBLIGATORIO
6. Esegui: 06b_remove_ruolo_constraint.sql ⚠️ OBBLIGATORIO
7. Esegui: 07_sync_ruolo_trigger.sql ⚠️ CONSIGLIATO
8. Esegui: 08_create_devices_table.sql ⚠️ OBBLIGATORIO
9. Esegui: 09_create_device_snapshots_table.sql ⚠️ CONSIGLIATO
10. (Opzionale dopo test): 05_cleanup_old_ruolo_column.sql
```

### Per Database VPS (GPS Watch VPS):

```
Ripeti gli stessi 10 passaggi sopra
```

---

## 🎯 Ruoli del Sistema

| Ruolo | Livello | Descrizione | Permessi |
|-------|---------|-------------|----------|
| 🔧 **sviluppatore** | 5 | Sviluppatore di sistema | Accesso completo, configurazioni, gestione utenti |
| 💻 **animatore_digitale** | 4 | Tecnico configurazione | Configurazione orologi, gestione dispositivi |
| 📊 **assistente_control** | 3 | Operatore control room | Monitoraggio multi-utente, dashboard generale |
| 👨‍👩‍👧 **controllo_parentale** | 2 | Tutore/Genitore | Monitoraggio parenti assegnati, notifiche |
| 👤 **utente_base** | 1 | Utente standard | Solo visualizzazione propri dati |

---

## 📝 Note Importanti

✅ **Idempotenza:** Puoi eseguire gli script più volte senza problemi (usano `IF NOT EXISTS`)
✅ **Sicurezza:** Le password sono hashate con bcrypt
✅ **Backup:** Fai sempre un backup prima di modifiche importanti
✅ **Sincronizzazione:** Mantieni locale e VPS sincronizzati

---

## 🆘 Risoluzione Problemi

### Errore: "relation already exists"
➡️ Lo script è già stato eseguito, nessun problema

### Errore: "foreign key violation"
➡️ Esegui gli script nell'ordine corretto (01 → 02 → 03 → 04)

### Errore: "permission denied"
➡️ Assicurati di essere connesso con l'utente `gpsuser` o `postgres`

---

## 👤 Credenziali Admin Default

Dopo aver eseguito `01_create_users_table.sql`:

- **Username:** `admin`
- **Password:** `Admin2025!`
- **Ruolo:** sviluppatore (dopo la migrazione)

⚠️ **Cambia la password al primo accesso!**
