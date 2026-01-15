# 📱 GUIDA COMPLETA REGISTRAZIONE TWILIO

## 🎯 Obiettivo

Creare account Twilio e ottenere le credenziali per inviare/ricevere SMS dall'orologio GPS

---

## 📋 PASSO 1: REGISTRAZIONE ACCOUNT

### 🌐 Vai su Twilio

1. Apri il browser: **[twilio.com](https://www.twilio.com)**
2. Clicca sul pulsante **"Sign Up"** (in alto a destra)
3. Seleziona **"Try Twilio for Free"**

### 📧 Dati Registrazione

Compila il modulo con i tuoi dati:

```
Email: la tua email personale
Password: crea una password sicura (min 8 caratteri)
Confirm Password: ripeti la password
```

**✅ Spunta la casella**: "I agree to the Terms of Service..."

### 📞 Verifica Email

1. Controlla la tua email (anche spam/promozioni)
2. Cerca email da: "noreply@twilio.com"
3. Clicca sul link di verifica
4. Sarai reindirizzato su Twilio

---

## 📋 PASSO 2: VERIFICA TELEFONO

### 📱 Inserimento Numero

1. Twilio ti chiederà di verificare un numero telefonico
2. Inserisci il tuo numero italiano (es: +39 3xx xxx xxxx)
3. Clicca **"Verify Phone Number"**

### 🔍 Codice SMS

1. Riceverai un SMS con codice a 6 cifre
2. Inserisci il codice nella pagina Twilio
3. Clicca **"Verify"**

---

## 📋 PASSO 3: DATI AZIENDALI

### 🏢 Informazioni Account

Twilio richiede dati aziendali. Puoi inserire dati personali:

```
First Name: Il tuo nome
Last Name: Il tuo cognome
Company Name: "Persona Fisica" o il tuo nome
Job Title: "Developer" o "System Administrator"
Country: Italy
City: La tua città
State/Province: La tua provincia
Postal Code: Il tuo CAP
Address: Il tuo indirizzo
```

### 💳 Informazioni Fatturazione

```
Card Number: Numero carta di credito/visa
Expiration Date: MM/YY
CVV: Codice sicurezza (3 cifre retro carta)
Cardholder Name: Nome sulla carta
```

**⚠️ IMPORTANTE**: Non ti addebiteranno nulla subito! La carta serve solo per verifica.

---

## 📋 PASSO 4: WELCOME BONUS

### 🎉 Credito Gratuito

1. Dopo la registrazione, vedrai il **Dashboard Twilio**
2. In alto a destra vedrai il tuo credito: **$15.00 USD**
3. Questo credito è sufficiente per:
   - **~375 SMS** in Italia
   - **~15 numeri telefonici** per un mese

### 📊 Riepilogo Account

- **Account SID**: Ti servirà dopo
- **Auth Token**: Ti servirà dopo
- **Trial Account**: Limiti temporanei

---

## 📋 PASSO 5: ACQUISTO NUMERO TELEFONICO

### 📞 Compra Numero Italiano

1. Nel dashboard, clicca su **"Phone Numbers"** (menu a sinistra)
2. Clicca **"Buy a Number"**
3. Configura i filtri:
   - **Country**: Italy 🇮🇹
   - **Capabilities**: SMS (spunta)
   - **Type**: Mobile Number (se disponibile)
4. Clicca **"Search"**
5. Scegli un numero dalla lista (es: +39 3xx xxx xxxx)
6. Clicca **"Buy"** → **"Confirm"**

### 💳 Costo Numero

- **Costo**: ~€1.00 al mese
- **Addebitato**: Dal tuo credito $15
- **Rinnovo**: Automatico ogni mese

---

## 📋 PASSO 6: OTTENI CREDENZIALI API

### 🔑 Trova Account SID

1. Nel dashboard Twilio, clicca su **"Settings"** (ingranaggio ⚙️)
2. Clicca su **"General"**
3. Vedrai **"Account SID"**:
   ```
   ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. Clicca **"Show"** accanto a **"Auth Token"**:
   ```
   your_auth_token_here
   ```

### 📋 Copia le Credenziali

Copia e salva questi tre valori:

```
1. ACCOUNT SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
2. AUTH TOKEN: your_auth_token_here
3. PHONE NUMBER: +393123456789 (quello che hai comprato)
```

---

## 📋 PASSO 7: CONFIGURAZIONE WEBHOOK

### 🌐 Per Testing Locale (con ngrok)

1. Per ora salta questo passo
2. Lo configureremo dopo quando testerai localmente

### 🌐 Per Produzione VPS

1. Vai su **"Phone Numbers"** → **"Active Numbers"**
2. Clicca sul tuo numero
3. Scorri fino a **"Messaging"**
4. In **"A MESSAGE COMES IN"**:
   - Seleziona **"Webhook"**
   - URL: `https://91.99.141.225:3000/sms/webhook`
   - Method: **HTTP POST**
5. Clicca **"Save"**

---

## 📋 PASSO 8: PRIMO TEST

### 🧪 Test dalla Console Twilio

1. Vai su **"Messaging"** → **"Try it out"**
2. Compila:
   - **From**: Il tuo numero Twilio (+39...)
   - **To**: Il tuo numero personale
   - **Message**: "Test SMS da Twilio"
3. Clicca **"Send Message"**

### ✅ Verifica Ricezione

1. Controlla il tuo telefono
2. Dovresti ricevere: "Test SMS da Twilio"
3. Se lo ricevi, tutto funziona!

---

## 📋 PASSO 9: CONFIGURAZIONE PROGETTO

### 📁 Crea File .env

Nel tuo progetto locale:

```bash
cd /Users/fabio/NEXT_JS/gps-tracker
cp .env.example .env
```

### ✏️ Modifica .env

Apri il file `.env` e inserisci i tuoi dati:

```bash
# Sostituisci con i tuoi valori reali
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_PHONE_NUMBER="+393123456789"

# Numero SIM dell'orologio (da scoprire)
WATCH_PHONE_NUMBER="+393987654321"
WATCH_PASSWORD="123456"
```

---

## 📋 PASSO 10: INSTALLAZIONE DIPENDENZE

### 📦 Installa Pacchetti

```bash
cd /Users/fabio/NEXT_JS/gps-tracker
npm run setup
```

Questo installerà:

- `twilio` - Client Twilio
- `express` - Server web
- `body-parser` - Parser richieste
- `dotenv` - Variabili ambiente

---

## 📋 PASSO 11: PRIMO TEST SMS

### 🧪 Test Automatico

```bash
npm run test-sms
```

Questo avvierà il menu interattivo:

1. Scegli **1** per test comandi base
2. Scegli **2** per test comandi salute
3. Scegli **6** per test completo

### 📱 Monitora Risposte

1. Apri un altro terminale
2. Avvia il server SMS:
   ```bash
   npm run server-sms
   ```
3. Il server riceverà le risposte dall'orologio

---

## ⚠️ NOTE IMPORTANTI

### 💰 Costi Reali

- **SMS in uscita**: ~€0.04-0.06 cadauno
- **SMS in entrata**: ~€0.01 cadauno
- **Numero telefonico**: €1.00/mese
- **Credito iniziale**: $15 (~€14)

### 🔒 Limiti Trial Account

- **Massimo 10 SMS/giorno** ai numeri non verificati
- **Solo numeri italiani** per ora
- **Nessun limite** dopo upgrade (richiede documenti)

### 📞 Numero Orologio

Devi scoprire il numero SIM dell'orologio:

1. Chiama l'orologio da un altro telefono
2. Oppure inserisci la SIM in un telefono
3. Il numero apparirà nelle impostazioni

---

## 🎯 RIEPILOGO CREDENZIALI NECESSARIE

### ✅ Dati da Raccogliere:

1. **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
2. **Auth Token**: `your_auth_token_here`
3. **Twilio Phone Number**: `+393123456789`
4. **Watch Phone Number**: `+393987654321` (da scoprire)
5. **Watch Password**: `123456` (default)

### 📝 Dove Trovarli:

- **1,2,3**: Dashboard Twilio → Settings → General
- **4**: SIM dell'orologio (da verificare)
- **5**: Documentazione orologio o default "123456"

---

## 🚀 PROSSIMI PASSI

### ✅ Fatto:

- [x] Account Twilio creato
- [x] Numero telefonico comprato
- [x] Credenziali ottenute
- [x] Primo SMS di test

### 🔄 Da Fare:

- [ ] Scoprire numero SIM orologio
- [ ] Configurare file .env
- [ ] Installare dipendenze
- [ ] Testare comandi SMS
- [ ] Verificare risposte orologio

---

## 🆘 AIUTO E SUPPORTO

### 📚 Risorse Utili:

- [Twilio Console](https://console.twilio.com)
- [Twilio SMS Docs](https://www.twilio.com/docs/sms)
- [Twilio Pricing Italy](https://www.twilio.com/sms/pricing/IT)

### 🆘 In caso di problemi:

1. **SMS non arriva**: Controlla credito e numero destinatario
2. **Webhook non funziona**: Usa ngrok per testing locale
3. **Credenziali errate**: Ricopia Account SID e Auth Token
4. **Numero bloccato**: Contatta supporto Twilio

---

_📅 Guida aggiornata: 24 Dicembre 2024_  
_🎯 Obiettivo: Configurazione Twilio per GPS Watch SMS_
