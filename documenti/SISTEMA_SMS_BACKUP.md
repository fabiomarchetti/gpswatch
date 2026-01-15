# 📱 SISTEMA SMS - MODALITÀ BACKUP

## 🎯 Nuova Situazione

Con il **FOTA completato**, l'orologio ora invia dati in chiaro tramite TCP. Il sistema SMS diventa un **backup secondario** per emergenze.

---

## 🔄 **Ruolo SMS Adesso**

### ✅ **Primario: TCP Diretto**

- Dati in chiaro via server.js su porta 8001
- Real-time, immediato, senza costi
- Gestito dal server principale

### 🆘 **Secondario: SMS Backup**

- Solo se TCP non funziona
- Per comandi remoti di emergenza
- Per notifiche critiche

---

## 📱 **Comandi SMS Utili Come Backup**

### 🚨 **Comandi Emergenza**

```sms
# Posizione immediata (se offline TCP)
pw,123456,ts#

# Stato batteria (critico)
pw,123456,bat#

# Allarme SOS
pw,123456,sos#
```

### 📋 **Comandi Configurazione**

```sms
# Riavvio dispositivo
pw,123456,reboot#

# Impostazioni APN
pw,123456,apn,internet.wind

# Frequenza invio dati
pw,123456,upload,300
```

---

## 🗄️ **Database SMS Semplificato**

### 📊 **Tabelle Mantenute**

- `sms_logs` - Per audit e backup
- `sms_backup_health` - Solo dati sanitari critici
- `sms_emergency_commands` - Comandi di emergenza

### 🗑️ **Tabelle Rimosse**

- `health_data_sms` (ridondante con dati TCP)
- `locations_sms` (ridondante con dati TCP)
- `sms_test_results` (non più necessari)

---

## 🔧 **Server SMS Semplificato**

### 📱 **Funzioni Mantenute**

1. **Webhook** per ricevere SMS di emergenza
2. **Invio comandi** critici solo quando necessario
3. **Logging** per audit trail
4. **Notifiche** per caregiver

### ❌ **Funzioni Rimosse**

- Test automatici periodici
- Parser dati sanitari completi
- Richieste programmate
- Dashboard SMS dedicata

---

## 💰 **Costi SMS Ridotti**

### 📊 **Utilizzo Reale Stimato**

- **Emergenze**: 5-10 SMS/mese
- **Test configurazione**: 2-3 SMS/mese
- **Totale**: ~€0.50-1.00/mese

### ✅ **Risparmio**

- **Prima**: €35-45/mese (monitoraggio continuo)
- **Adesso**: €0.50-1.00/mese (solo backup)
- **Risparmio**: ~95%!

---

## 🚀 **Implementazione Semplificata**

### 1️⃣ **File da Mantenere**

- ✅ `server_sms.js` (versione semplificata)
- ✅ `.env.example` (solo credenziali Twilio)
- ❌ `test_sms_complete.js` (non più necessario)
- ❌ `GUIDA_CONFIGURAZIONE_SMS.md` (ridotta)

### 2️⃣ **Configurazione Minima**

```bash
# Solo credenziali essenziali
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+39..."
WATCH_PHONE_NUMBER="+39..."
WATCH_PASSWORD="123456"
```

### 3️⃣ **Database Minimo**

```sql
-- Solo tabelle essenziali backup
CREATE TABLE sms_logs (
    id SERIAL PRIMARY KEY,
    message_sid VARCHAR(100),
    from_number VARCHAR(20),
    to_number VARCHAR(20),
    body TEXT,
    direction VARCHAR(10),
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sms_emergency (
    id SERIAL PRIMARY KEY,
    command_type VARCHAR(20),
    response_data TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 📋 **Procedure Emergenza**

### 🚨 **Quando Usare SMS**

1. **Server TCP offline** > 5 minuti
2. **Batteria critica** < 10%
3. **Allarme SOS** attivato
4. **Test connettività** periodico

### 📞 **Comandi Critici**

```javascript
// Solo questi comandi SMS sono utili:
const EMERGENCY_COMMANDS = {
  position: "pw,123456,ts#",
  battery: "pw,123456,bat#",
  sos: "pw,123456,sos#",
  reboot: "pw,123456,reboot#",
};
```

---

## 🎯 **Raccomandazione Finale**

### ✅ **Focus Principale**

- **Ottimizzare server TCP** per dati real-time
- **Monitorare salute** tramite connessione diretta
- **Dashboard web** per visualizzazione dati

### 🆘 **Backup SMS**

- **Mantenere sistema minimo** per emergenze
- **Costi quasi nulli** con uso ridotto
- **Pronto all'uso** se TCP fallisce

---

## 🔄 **Azione Immediata**

### 1️⃣ **Semplifica server_sms.js**

- Rimuovi test automatici
- Mantieni solo emergenza
- Riduci complessità

### 2️⃣ **Aggiorna package.json**

- Rimuovi script test SMS
- Mantieni solo server SMS base

### 3️⃣ **Documentazione**

- Aggiorna guide riflettendo nuovo ruolo
- Evidenzia risparmio costi
- Sposta focus su TCP

---

_📅 Aggiornato: 24 Dicembre 2024_  
_🎯 Status: SMS come BACKUP - TCP come PRIMARIO_  
_💡 Risparmio: 95% costi SMS_
