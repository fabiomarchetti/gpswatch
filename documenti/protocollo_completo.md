# 📡 Protocollo Completo Orologio GPS C405 KYS S5

## 🔌 Modalità di Comunicazione

### TCP/4G (Principale)
- **Formato**: `[3G*DEVICE_ID*LEN*COMMAND,params]`
- **Server**: `91.99.141.225:8001`
- **Uso**: Comunicazione primaria per dati GPS, comandi remoti, monitoraggio

### SMS (Secondaria/Setup)
- **Formato**: `pw,PASSWORD,command#`
- **Password default**: `123456`
- **Uso**: Configurazione iniziale, comandi di emergenza quando TCP non disponibile

---

## 📋 COMANDI COMPLETI

### 1️⃣ Configurazione Base

| Funzione                                | TCP                                     | SMS |
|----------|-----|-----|----------|-----|-----|----------|-----|-----|----------|-----|-----|----------|-----|-----|
| **Leggi configurazione**       | `[3G*ID*0005*VERNO]`        | `pw,123456,ts#` |
| **Riavvia orologio**              | `[3G*ID*0006*RESET]`          | `pw,123456,restart#` |
| **Spegni orologio**               | `[3G*ID*0009*POWEROFF]` | `pw,123456,poweroff#` |
| **Reset fabbrica**                 | -                                              | `pw,123456,reset#` |
| **Disabilita PIN SIM**           | -                                              | `pw,123456,nopincode#` |

### 2️⃣ Server & Connessione

| Funzione | TCP | SMS |
|----------|-----|-----|
| **Configura server** | `[3G*ID*0014*IP,ip.add.re.ss]` | `pw,123456,ip,91.99.141.225,8001#` |
| **Configura APN** | - | `pw,123456,apn,mobile.vodafone.it#` |
| **Intervallo upload** | `[3G*ID*0011*UPLOAD,600]` | `pw,123456,upload,10#` |
| **Test connessione** | `[3G*ID*0008*GPSTEST]` | `pw,123456,gps#` |

### 3️⃣ GPS & Posizione

| Funzione | TCP | SMS |
|----------|-----|-----|
| **Posizione immediata** | `[3G*ID*0002*CR]` | `pw,123456,url#` |
| **Zona GPS** | - | `pw,123456,lz,12#` *(12=Italia)* |
| **LBS (posizione celle)** | `[3G*ID*0003*LK]` | `pw,123456,lk#` |
| **Test GPS** | `[3G*ID*0008*GPSTEST]` | `pw,123456,gps#` |

### 4️⃣ Batteria & Stato

| Funzione | TCP | SMS |
|----------|-----|-----|
| **Livello batteria** | `[3G*ID*0002*CR]` *(incluso in risposta)* | `pw,123456,bat#` |
| **Info completa** | `[3G*ID*0005*VERNO]` | `pw,123456,ts#` |

### 5️⃣ Numeri SOS & Emergenza

| Funzione | TCP | SMS |
|----------|-----|-----|
| **SOS 1** | `[3G*ID*0014*SOS,num1,num2,num3]` | `pw,123456,sos1,+39327157xxxx#` |
| **SOS 2** | *(stesso TCP)* | `pw,123456,sos2,+39327157xxxx#` |
| **SOS 3** | *(stesso TCP)* | `pw,123456,sos3,+39327157xxxx#` |
| **Centro ascolto** | `[3G*ID*0013*CENTER,num]` | `pw,123456,center,+39327157xxxx#` |

### 6️⃣ Trova Orologio

| Funzione | TCP | SMS |
|----------|-----|-----|
| **Trova (suona)** | `[3G*ID*0004*FIND]` | `pw,123456,find#` |
| **Monitor vocale** | `[3G*ID*0007*MONITOR,num]` | `pw,123456,monitor,+39327157xxxx#` |

### 7️⃣ Sveglie & Promemoria

| Funzione | TCP | SMS |
|----------|-----|-----|
| **Sveglia/Promemoria** | `[3G*ID*0018*REMIND,08:30-1-2]` | `pw,123456,remind,08:30-1-2#` |
| *(formato: HH:MM-tipo-stato)* | *tipo: 1=promemoria, 2=acqua, 3=esercizio, 4=medicina, 5=allarme* | |

### 8️⃣ Salute (Funzioni Anziani)

| Funzione | TCP | SMS |
|----------|-----|-----|
| **Freq. cardiaca** | `[3G*ID*0012*hrtstart,300]` | `pw,123456,hrt,on#` |
| **Stop freq. cardiaca** | `[3G*ID*0010*hrtstop]` | `pw,123456,hrt,off#` |
| **Pressione + FC** | `[3G*ID*0005*bphrt]` | - |
| **Ossigeno sangue** | `[3G*ID*0006*oxygen]` | - |
| **Temperatura** | *(in risposta UD2)* | - |
| **Passi pedometro** | *(in risposta UD2)* | - |

### 9️⃣ Allarme Caduta (IMPORTANTE per anziani!)

| Funzione | TCP | SMS |
|----------|-----|-----|
| **Attiva allarme caduta** | `[3G*ID*0014*FALLDOWN,1,1]` | `pw,123456,fall,on#` |
| **Disattiva allarme** | `[3G*ID*0015*FALLDOWN,0,0]` | `pw,123456,fall,off#` |
| **Sensibilità caduta** | `[3G*ID*0010*LSSET,3+6]` | - |
| *(3+6 = valore consigliato per anziani)* | | |

### 🔟 Impostazioni Orologio

| Funzione | TCP | SMS |
|----------|-----|-----|
| **Lingua** | `[3G*ID*0006*LANG,3]` | `pw,123456,language,italian#` |
| *(0=CN,1=EN,2=ES,3=IT,4=FR,etc)* | | |
| **Fuso orario** | `[3G*ID*0008*ZONE,+1]` | `pw,123456,lz,12#` |
| **Formato ora** | `[3G*ID*0006*TIME,1]` | - |
| *(0=12h, 1=24h)* | | |
| **Modalità silenzio** | `[3G*ID*0010*SILENTS,1]` | - |
| **Profilo utente** | `[3G*ID*0028*profile,age,h,w,sex]` | - |
| *(età,altezza cm,peso kg,sesso 0=donna 1=uomo)* | | |

### 1️⃣1️⃣ Modalità Risparmio

| Funzione | TCP | SMS |
|----------|-----|-----|
| **Risparmio batteria** | `[3G*ID*0008*SAVE,ON]` | `pw,123456,save,on#` |
| **Disattiva risparmio** | `[3G*ID*0009*SAVE,OFF]` | `pw,123456,save,off#` |

### 1️⃣2️⃣ Funzioni Avanzate

| Funzione | TCP | SMS |
|----------|-----|-----|
| **Flowerset (fiore crescita)** | `[3G*ID*0013*flowerset,8000]` | - |
| **Storico chiamate** | `[3G*ID*0005*CALLS]` | - |
| **SMS remoto** | `[3G*ID*00XX*SMS,num,msg]` | - |
| **Rubrica telefonica** | `[3G*ID*00XX*PHB,name,num]` | - |

---

## 📊 RISPOSTE OROLOGIO

### Risposta Configurazione (TS)
```
ver:C405_KYS_S5_04R6_V1.3_2025.10.11_11.43.26;
ID:3707805539;
imei:863737078055392;
ip_url:91.99.141.225; port:8001;
bat level:93;
```

### Risposta Posizione GPS (UD)
```
[3G*3707805539*00B4*UD,251227,143020,A,
4520.2345,N,00912.3456,E,
0.00,0.00,0.00,
6,100,50,0,0,
00200020,1,255,460,0,9771,3671,141,9771,3672,142,...]
```

**Decodifica UD**:
- Data: YYMMDD (251227 = 27 dic 2025)
- Ora: HHMMSS (143020 = 14:30:20)
- Latitudine: 45°20.2345' N
- Longitudine: 9°12.3456' E
- Velocità, direzione, altitudine
- Satelliti, batteria, GSM signal
- Celle LBS per posizione alternativa

### Risposta Batteria
```
bat level:93
```

### Risposta Allarme Caduta
```
[3G*ID*LEN*UD2,date,time,
bat,step,temp,hr,
falldown,...]
```

---

## 🎯 COMANDI CONSIGLIATI PER SETUP INIZIALE

### Sequenza Setup Completo

1. **Disabilita PIN SIM**: `pw,123456,nopincode#`
2. **Verifica configurazione**: `pw,123456,ts#`
3. **Configura server** (se necessario): `pw,123456,ip,91.99.141.225,8001#`
4. **Configura numeri SOS**:
   - `pw,123456,sos1,+39xxxxxxxxxx#`
   - `pw,123456,sos2,+39xxxxxxxxxx#`
   - `pw,123456,sos3,+39xxxxxxxxxx#`
5. **Attiva allarme caduta**: `pw,123456,fall,on#` *(per anziani)*
6. **Configura zona GPS**: `pw,123456,lz,12#` *(Italia)*
7. **Test posizione**: `pw,123456,url#`

---

## ⚠️ NOTE IMPORTANTI

1. **Password default**: `123456` (cambiare per sicurezza!)
2. **Timeout risposte SMS**: 30-60 secondi
3. **Risposte TCP**: Immediate via server
4. **IMEI dispositivo**: `863737078055392`
5. **Device ID**: `3707805539`
6. **Server già configurato**: `91.99.141.225:8001`
7. **Intervallo upload attuale**: 60000 secondi (~16 ore)

---

## 🔧 TROUBLESHOOTING

| Problema | Soluzione |
|----------|-----------|
| Orologio non risponde | Verificare credito SIM, segnale GSM |
| GPS non funziona | Aspettare fix satelliti (all'aperto), usare `pw,123456,gps#` |
| Batteria scarica rapida | Ridurre intervallo upload, disattivare funzioni inutilizzate |
| Allarme caduta troppo sensibile | Regolare sensibilità con `LSSET,3+6` |
| Server non riceve dati | Verificare APN, firewall, porta 8001 aperta |

---

**Ultimo aggiornamento**: 28/12/2024
**Versione firmware**: C405_KYS_S5_04R6_V1.3
**Protocollo**: TCP Version V3.2



5. SERVER TCP - ANALISI
File: server.js
Funzionalità Implementate
✅ Connessione TCP su porta 8001
✅ Parser protocollo [3GIDLEN*CMD,data]
✅ Supporto decrittazione AQSH+ (legacy)
✅ Auto-registrazione dispositivi
✅ Gestione comandi:

LK: Heartbeat
UD/UD2: Posizione GPS
AL: Allarmi SOS
bphrt: Pressione e battito
oxygen: SpO2
btemp2: Temperatura
CONFIG: Configurazione dispositivo
ICCID: Info SIM
RYIMEI: Conferma IMEI
APPANDFNREPORT: Funzioni app
SMSREMINDSTATUSINFO: Status reminder
Gestione Errori
✅ Timeout socket (5 minuti)
✅ Keep-alive attivo
✅ Buffer per pacchetti frammentati
✅ Log dettagliati

📨 6. SISTEMA SMS - ANALISI
Gateway SMS
File: lib/sms-gateway.ts

URL: http://192.168.0.106:8080 (configurabile)
Autenticazione: Basic Auth
Timeout: 15 secondi
Parser SMS
File: lib/sms-parser.ts

parseTSResponse: Configurazione
parseURLResponse: Posizione GPS
parseBatteryResponse: Batteria
parseLKResponse: Heartbeat
parseUDResponse: Dati posizione
parseOKResponse: Conferma generica
API SMS
/api/sms/send: Invio comandi
/api/sms/receive: Webhook ricezione
Doppia scrittura: DB locale + VPS remoto
