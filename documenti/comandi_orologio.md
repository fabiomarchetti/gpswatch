# 📱 COMANDI SMS OROLOGIO GPS C405 KYS S5

## 🎯 Informazioni Generali

**Modello**: C405_KYS_S5_V1.3_2025
**Password Default**: `123456`
**Formato Comandi**: `pw,PASSWORD,COMANDO#`

⚠️ **IMPORTANTE**: Tutti i comandi devono terminare con `#`

---

## 🔧 COMANDI CONFIGURAZIONE BASE

### 📍 Leggere Configurazione Completa
```sms
pw,123456,ts#
```
**Risposta**: Restituisce IP server, porta, APN, zona GPS, batteria, segnale, ecc.
**Formato**: `TS:IP,PORT,APN,ZONA,BATTERIA,SEGNALE,...`

---

### 🔄 Reset Orologio
```sms
pw,123456,reset#
```
**Azione**: Resetta l'orologio alle impostazioni di fabbrica
⚠️ **ATTENZIONE**: Cancella tutte le impostazioni personalizzate!

---

### ♻️ Riavvio Orologio
```sms
pw,123456,restart#
```
**Azione**: Riavvia il dispositivo (reboot)
**Tempo**: ~30-60 secondi

---

### 🌐 Configurare Server
```sms
pw,123456,ip,INDIRIZZO_IP,PORTA#
```
**Esempio**: `pw,123456,ip,52.28.132.157,8001#`
**Azione**: Imposta server TCP per invio dati GPS

---

### 📶 Configurare APN
```sms
pw,123456,apn,NOME_APN,USERNAME,PASSWORD_APN#
```
**Esempi**:
- TIM: `pw,123456,apn,ibox.tim.it,,,#`
- Wind/Tre: `pw,123456,apn,internet.wind,,,#`
- Vodafone: `pw,123456,apn,web.omnitel.it,,,#`
- Iliad: `pw,123456,apn,iliad,,,#`

---

### 🌍 Configurare Zona GPS
```sms
pw,123456,lz,ZONA#
```
**Zone Comuni**:
- `12` = Italia (UTC+1/+2)
- `0` = UTC
- `8` = Cina

**Esempio**: `pw,123456,lz,12#`

---

### ⏱️ Configurare Intervallo Upload
```sms
pw,123456,upload,MINUTI#
```
**Esempio**: `pw,123456,upload,30#` (upload ogni 30 minuti)
**Range**: 1-1440 minuti (1 minuto - 24 ore)

---

### 📞 Configurare Numeri SOS
```sms
pw,123456,sos1,+393331234567#
pw,123456,sos2,+393337654321#
pw,123456,sos3,+393339876543#
```
**Azione**: Imposta numeri di emergenza (chiamata rapida)
**Massimo**: 3 numeri SOS

---

### 📧 Configurare Centro SMS
```sms
pw,123456,center,+393359609600#
```
**Azione**: Imposta numero centro servizi SMS (operatore mobile)
**Default TIM**: `+393359609600`
**Default Vodafone**: `+393492000200`
**Default Wind**: `+393205858000`

---

## 🔒 GESTIONE SIM E SICUREZZA

### ❌ **DISABILITARE PIN SIM** (⭐ CONSIGLIATO PER ANZIANI)
```sms
pw,123456,nopincode#
```
**Azione**: Disabilita richiesta PIN all'accensione
✅ **Benefici**: Orologio funziona subito dopo accensione/riavvio
⚠️ **Sicurezza**: SIM non protetta se orologio rubato

**ALTERNATIVA**: Disabilita PIN direttamente dalla SIM prima di inserirla nell'orologio

---

### 🔐 Abilitare PIN SIM
```sms
pw,123456,pincode,1234#
```
**Azione**: Abilita richiesta PIN all'accensione
**Default PIN SIM**: Di solito `1234` o `0000`

---

### 🔑 Cambiare Password Orologio
```sms
pw,123456,password,NUOVA_PASSWORD#
```
**Esempio**: `pw,123456,password,654321#`
⚠️ **IMPORTANTE**: Memorizza la nuova password!

---

## 📍 COMANDI POSIZIONE E MONITORAGGIO

### 🗺️ Ottenere Posizione GPS
```sms
pw,123456,url#
```
**Risposta**: Link Google Maps con coordinate
**Formato**: `http://maps.google.com/maps?q=LAT,LON`

---

### 📡 Test GPS
```sms
pw,123456,gps#
```
**Risposta**: Stato GPS, numero satelliti, precisione

---

### 📍 Posizione Semplificata (senza password)
```sms
ts#
```
**Risposta**: Coordinate GPS e timestamp
⚠️ **Nota**: Funziona solo se abilitato nelle impostazioni

---

## 🔋 COMANDI STATO E BATTERIA

### 🔋 Leggere Batteria
```sms
pw,123456,bat#
```
**Risposta**: Livello batteria in percentuale
**Formato**: `battery:85%` o `BAT:85%`

---

### 📊 Stato Generale
```sms
pw,123456,status#
```
**Risposta**: IMEI, segnale GSM, stato GPS, batteria

---

### ℹ️ Informazioni Dispositivo
```sms
pw,123456,info#
```
**Risposta**: Modello, versione firmware, IMEI

---

### 🆙 Versione Firmware
```sms
pw,123456,ver#
```
**Risposta**: Versione software installato

---

## 🏥 COMANDI SALUTE (se supportati dal modello)

### ❤️ Frequenza Cardiaca
```sms
pw,123456,hrt#
```
**Risposta**: BPM (battiti per minuto)

---

### 🩸 Pressione Sanguigna
```sms
pw,123456,bp#
```
**Risposta**: Sistolica/Diastolica (es: 120/80)

---

### 💧 Saturazione Ossigeno
```sms
pw,123456,spo2#
```
**Risposta**: SpO2 in percentuale (es: 98%)

---

### 🌡️ Temperatura
```sms
pw,123456,temp#
```
**Risposta**: Temperatura corporea in °C

---

### 🏥 Dati Salute Completi
```sms
pw,123456,health#
```
**Risposta**: Tutti i parametri sanitari disponibili
**Formato**: `HR:72,BP:120/80,SPO2:98,TEMP:36.5`

---

## 🔊 COMANDI AUDIO E CHIAMATE

### 📞 Attivare Ascolto Remoto
```sms
pw,123456,monitor,+393331234567#
```
**Azione**: L'orologio chiama il numero e permette di ascoltare l'ambiente
⚠️ **Privacy**: Usa solo con consenso dell'utente

---

### 🔇 Modalità Silenziosa
```sms
pw,123456,silenttime,INIZIO,FINE#
```
**Esempio**: `pw,123456,silenttime,22:00,07:00#`
**Azione**: Disattiva suoneria tra 22:00 e 07:00

---

### 🔊 Volume
```sms
pw,123456,volume,LIVELLO#
```
**Livelli**: 1-9 (1=minimo, 9=massimo)
**Esempio**: `pw,123456,volume,5#`

---

## ⏰ COMANDI SVEGLIA E PROMEMORIA

### ⏰ Impostare Sveglia
```sms
pw,123456,alarm,NUMERO,ORA,MINUTO#
```
**Esempio**: `pw,123456,alarm,1,08,30#` (sveglia 1 alle 08:30)
**Numero**: 1-3 (fino a 3 sveglie)

---

### 💊 Promemoria Farmaci
```sms
pw,123456,remind,NUMERO,ORA,MINUTO,TESTO#
```
**Esempio**: `pw,123456,remind,1,09,00,Prendi medicina#`

---

## 🚨 COMANDI EMERGENZA

### 🆘 Attivare SOS
```sms
pw,123456,sos#
```
**Azione**: Invia SMS di emergenza ai numeri SOS configurati

---

### 🚫 Cancellare Numeri SOS
```sms
pw,123456,dsos#
```
**Azione**: Rimuove tutti i numeri SOS

---

## 🛡️ COMANDI SICUREZZA E GEOFENCING

### 📍 Impostare Geofence (recinto virtuale)
```sms
pw,123456,fence,RAGGIO#
```
**Esempio**: `pw,123456,fence,500#` (500 metri)
**Azione**: Invia allarme se l'orologio esce dall'area

---

### 🚷 Disabilitare Geofence
```sms
pw,123456,nofence#
```

---

### ⚠️ Allarme Rimozione Orologio
```sms
pw,123456,remove,on#
pw,123456,remove,off#
```
**Azione**: Invia SMS se l'orologio viene rimosso dal polso

---

## 🌐 COMANDI AVANZATI

### 🔍 Trovare Orologio (suona)
```sms
pw,123456,find#
```
**Azione**: L'orologio suona per 1 minuto (utile se perso in casa)

---

### 📸 Scattare Foto Remota (se dotato di camera)
```sms
pw,123456,photo#
```
**Azione**: Scatta foto e invia al server configurato

---

### 🔒 Bloccare Orologio
```sms
pw,123456,pwr,1#
```
**Azione**: Impedisce lo spegnimento dell'orologio
**Sblocco**: `pw,123456,pwr,0#`

---

### 📵 Modalità Aereo
```sms
pw,123456,flight,1#
```
**Attiva**: `flight,1`
**Disattiva**: `flight,0`

---

## 📝 COMANDI DIAGNOSTICA

### 🧪 Test Completo
```sms
pw,123456,test#
```
**Risposta**: Test di tutti i sensori e funzioni

---

### 📊 Log Errori
```sms
pw,123456,log#
```
**Risposta**: Ultimi errori registrati

---

### 🔄 Factory Reset Completo
```sms
pw,123456,factory#
```
⚠️ **ATTENZIONE**: Ripristino totale, cancella TUTTO!

---

## 📋 FORMATO RISPOSTE COMUNI

### ✅ Risposta OK
```
OK
```
Comando eseguito con successo

---

### ❌ Risposta Errore
```
ERROR
```
o
```
FAIL
```
Comando fallito (controlla password o sintassi)

---

### 📍 Risposta TS (Configurazione)
```
TS:52.28.132.157,8001,internet.wind,12,85,95,...
```
- IP server: `52.28.132.157`
- Porta: `8001`
- APN: `internet.wind`
- Zona GPS: `12` (Italia)
- Batteria: `85%`
- Segnale GSM: `95%`

---

### 🗺️ Risposta URL (Posizione)
```
http://maps.google.com/maps?q=45.464664,9.188540
```
- Latitudine: `45.464664`
- Longitudine: `9.188540`

---

## ⚠️ NOTE IMPORTANTI

### ✅ Best Practices

1. **Testa comandi su orologio di prova** prima di usarli su produzione
2. **Salva sempre la password** in luogo sicuro
3. **Disabilita PIN SIM** per utenti anziani (evita blocchi)
4. **Configura almeno 2 numeri SOS** per emergenze
5. **Verifica copertura GSM** prima di configurare zone remote

---

### ❌ Cosa Evitare

1. **NON cambiare password** senza annotarla
2. **NON fare factory reset** senza backup configurazione
3. **NON configurare IP server sbagliato** (perdi connessione dati)
4. **NON dimenticare il `#` finale** nei comandi
5. **NON inviare comandi troppo velocemente** (attendi 5-10 secondi tra SMS)

---

### 🔧 Risoluzione Problemi

#### Comando non funziona
- ✅ Verifica password corretta
- ✅ Controlla che ci sia `#` finale
- ✅ Assicurati che la SIM abbia credito
- ✅ Verifica copertura GSM

#### Nessuna risposta
- ✅ Attendi 30-60 secondi (rete lenta)
- ✅ Controlla che orologio sia acceso
- ✅ Verifica che SIM sia inserita
- ✅ Controlla configurazione APN

#### Risposta "ERROR"
- ✅ Password sbagliata
- ✅ Sintassi comando errata
- ✅ Comando non supportato dal modello
- ✅ Parametri mancanti o errati

---

## 📞 ESEMPI PRATICI

### Esempio 1: Setup Iniziale Completo
```sms
1. pw,123456,nopincode#          (disabilita PIN)
2. pw,123456,apn,internet.wind,,,#  (configura APN)
3. pw,123456,ip,52.28.132.157,8001#  (configura server)
4. pw,123456,lz,12#              (zona Italia)
5. pw,123456,upload,30#          (upload ogni 30 min)
6. pw,123456,sos1,+393331234567# (numero emergenza 1)
7. pw,123456,sos2,+393337654321# (numero emergenza 2)
```

### Esempio 2: Monitoraggio Giornaliero
```sms
1. pw,123456,url#     (posizione mattina)
2. pw,123456,health#  (dati salute)
3. pw,123456,bat#     (controlla batteria)
```

### Esempio 3: Troubleshooting
```sms
1. pw,123456,ts#      (leggi configurazione)
2. pw,123456,status#  (stato generale)
3. pw,123456,test#    (test completo)
4. pw,123456,restart# (riavvio se problemi)
```

---

## 🎯 COMANDI CONSIGLIATI PER ANZIANI

### Setup Semplificato (una volta sola)
```sms
pw,123456,nopincode#                    ← Evita richiesta PIN
pw,123456,sos1,+39NUMERO_FIGLIO#        ← Numero figlio
pw,123456,sos2,+39NUMERO_BADANTE#       ← Numero badante
pw,123456,remind,1,09,00,Prendi pastiglie#  ← Promemoria medicine
```

### Monitoraggio Quotidiano (dal computer)
```sms
pw,123456,url#      ← Posizione anziano
pw,123456,bat#      ← Controllo batteria
```

---

**📅 Documento Creato**: 27 Dicembre 2025
**🔄 Ultimo Aggiornamento**: 27 Dicembre 2025
**📱 Modello**: C405_KYS_S5_V1.3_2025
**✅ Testato**: Comandi base verificati

---

**⚠️ DISCLAIMER**: Alcuni comandi potrebbero variare leggermente tra versioni firmware. Testa sempre su orologio di prova prima di usare su dispositivi in produzione.
