# 📱 COME SI CONNETTE L'OROLOGIO AL SERVER

## 🎯 **Processo Automatico di Connessione**

L'orologio GPS C405_KYS_S5_V1.3_2025 si connette al tuo server in modo completamente automatico.

---

## 🔄 **1. Accensione e Connessione**

### 📱 **Quando l'Orologio si Accende**

1. **Boot del dispositivo**: L'orologio si accende
2. **Connessione rete**: Si connette alla rete 4G/3G
3. **Rilevamento APN**: Configura automaticamente l'APN della SIM
4. **Connessione al server**: Si connette a `91.99.141.225:8001`

### 📡 **Dettagli Connessione**

```
Orologio (accensione) → Rete 4G/3G → Server GPS
     ↓                      ↓              ↓
     IMEI: 863737078055392
     Porta server: 8001
     Protocollo: TCP
     IP server: 91.99.141.225
```

---

## 🔄 **2. Invio Dati Periodico**

### 📊 **Heartbeat (LK)**

- **Frequenza**: Ogni 5-10 minuti
- **Contenuto**: Passi, rolls, batteria
- **Formato**: `[3G*3707805539*0009*LK,0,0,78]`

### 📍 **Posizione (UD/UD2)**

- **Frequenza**: Ogni 10-30 minuti (configurabile)
- **Contenuto**: Lat, lon, altitudine, velocità
- **Formato**: `[3G*3707805539*02DD*UD,lat:45.123,lng:9.456,...]`

### 🏥 **Dati Sanitari**

- **Frequenza**: Quando attivi le funzioni
- **Contenuto**: Frequenza cardiaca, pressione, SpO2, temperatura
- **Formato**: `[3G*3707805539*0008*bphrt,120,80,72]`

---

## 📱 **3. Configurazione Dispositivo**

### ⚙️ **Invio CONFIG**

All'avvio o quando cambia configurazione, l'orologio invia:

```
[3G*3707805539*02DD*CONFIG,TY:g36f,UL:60000,SY:0,CM:0,WT:0,AA:2,HR:0,TB:5,PP:0,AB:0,HH:1,TR:0,MO:1,MO2:0,FL:0,VD:0,DD:2,SD:1,XY:2,HA:1,WF:0,WX:0,PH:1,RW:0,MT:0,XD:0,XL:0,YF:0,SM:0,HF:0,JX:0,WL:1,MP:1,BQ:2,QQ:0,DL:0,HT:0,PB:0,RS:172320,DW:0,SS:0,OF:1,IN:0,JT:0,LG:1+0+3+4+5+7+8+9+10+12+16+17+27+34+36+38+39+19+24+20,GH:0,BT:2,BW:1,CL:1,BO:1,YJ:0,FA:1,FD:1,CT:1,SO:1,ME:1,LR:0,TO:1,RR:1,AC:1,DC:2,RD:0,RY:3,XM:1,EM:0,VL:0+0,PV:0,FY:0,DS:0,DX:0,LL:0,AT:0,TM:1,DM:2,RP:1,FR:0,ZF:0,HC:0,LS:1+8,VS:0,CN:1,GS:1,EI:1,RA:1,JL:1,ACHS:0,DCHS:0,CR:0,NSEC:0,JG:1,RT:1,CAS:0,TS:1,DP:0,YP:0,WI:0,CJ:0,YT:1,GB:1,VC:10+0+0+10,DCCA:1,DCVO:1,JZ:0,CS:0,AU:3,AUDCT:5,OS:RTOS,CHIP:3603,VR:C405_KYS_S5_V1.3_2025.10.11_11.43.26,UK:0,RV:C405_KYS_S5_04R6_V1.3_2025.10.11_11.43.26]
```

### 📞 **Invio ICCID**

Informazioni sulla SIM card:

```
[3G*3707805539*0033*ICCID,8939880841110848432F,863737078055392,Unknown,]
```

---

## 🔄 **4. Comandi Automatici**

### 📋 **Upload Frequenza (UL)**

- **Default**: 60000ms (60 secondi)
- **Significato**: L'orologio invia dati ogni 60 secondi
- **Configurabile**: Tramite comando `UL:30000`

### 📋 **Monitoraggio Sedentario (SD)**

- **Attivo**: SD:1 nell'esempio
- **Funzione**: Rileva quando l'utente è sedentario troppo a lungo

---

## 📡 **5. Dettagli Tecnici Connessione**

### 🌐 **Protocollo**

- **Transport**: TCP
- **Porta**: 8001
- **Timeout**: 300 secondi (5 minuti)
- **Keep-alive**: Abilitato
- **Retry**: Automatico con backoff esponenziale

### 📱 **IP e Porta**

- **Server IP**: 91.99.141.225
- **Server Porta**: 8001
- **Device IP**: Dinamico (assegnato dall'operatore)
- **Device Porta**: Casuale (alta)

### 🔐 **Sicurezza**

- **Autenticazione**: Basata su IMEI
- **Criptazione**: Dati in chiaro (dopo FOTA)
- **Protocollo**: Proprietario (simile a TCP standard)

---

## 📊 **6. Log Server di Connessione**

### 📋 **Connessione Stabilita**

```bash
# Vedrai log simili a questi:
✅ CONNESSIONE da: 151.19.81.152:40029
📨 [24/12/2025, 12:39:28] DATI RICEVUTI da 151.19.81.152:40029
   ├── Protocollo: 3G
   ├── Device ID: 3707805539
   ├── Comando: CONFIG
   └── Dati: TY:g36f,UL:60000...
```

### 📋 **Disconnessione e Riconnessione**

```bash
# Pattern di disconnessione/riconnessione
❌ DISCONNESSO: 151.19.81.152:40029
[attendi 30-60 secondi]
✅ CONNESSIONE da: 151.19.81.152:40029
```

### 📋 **Cambio IP del Dispositivo**

```bash
# L'IP del dispositivo può cambiare
# Da: 151.19.81.152 → A: 151.19.29.109
# Questo è normale per dispositivi mobili
```

---

## 🔄 **7. Flusso Completo**

```
Orologio Acceso → Connessione Rete → Invio CONFIG → Server risponde → Invio ICCID → Server risponde →
Invio RYIMEI → Server risponde → Invio APPANDFNREPORT → Server risponde →
Invio SMSREMINDSTATUSINFO → Server risponde → Invio LK (heartbeat) →
Loop: LK periodico → Dati sanitari quando attivi → Posizioni periodiche → ...
```

---

## 🎯 **8. Cosa Riceve il Tuo Server**

### 📦 **Dati Grezzi**

- **CONFIG**: Configurazione completa dispositivo
- **ICCID**: Informazioni SIM card
- **RYIMEI**: Conferma IMEI
- **APPANDFNREPORT**: Funzioni app abilitate
- **SMSREMINDSTATUSINFO**: Status reminder SMS

### 📊 **Dati Dinamici**

- **LK**: Heartbeat con batteria
- **UD/UD2**: Posizione GPS
- **bphrt**: Pressione e frequenza cardiaca
- **oxygen**: Saturazione ossigeno
- **btemp2**: Temperatura corporea
- **steps**: Passi pedometro

---

## 🔧 **9. Configurazione Automatica**

### 📋 **Upload Interval**

- **Default**: 60 secondi
- **Configurabile**: Tramite comando SMS `pw,123456,UL,30000`

### 📋 **GPS Update Frequency**

- **Default**: 30 secondi (quando in movimento)
- **Configurabile**: Tramite app orologio

### 📋 **Health Monitoring**

- **Frequenza cardiaca**: Configurabile (continua o spot)
- **Misurazione manuale**: Attivabile dall'utente
- **Allarmi**: Soglie configurabili

---

## 🎯 **10. Verifica Connessione**

### 📋 **Dal Server**

```bash
# Controlla connessioni attive
netstat -tlnp | grep :8001

# Controlla log recenti
pm2 logs server --lines 20 | grep CONNESSIONE

# Controlla dispositivi connessi
pm2 logs server --lines 50 | grep "Device ID"
```

### 📋 **Dall'Orologio**

```bash
# Comando per verificare connessione
# Invia SMS: pw,123456,status#

# Risposta attesa: "signal:4,gps:yes"
```

---

## 🚨 **11. Risoluzione Problemi Connessione**

### ❌ **Nessun Dati**

1. **Controlla rete orologio**: Segnale 4G/3G
2. **Controlla APN**: internet.wind (o altro)
3. **Controlla credito SIM**: Sufficiente
4. **Controlla server**: Porta 8001 aperta

### ❌ **Disconnessioni Frequenti**

1. **Batteria scarica**: Controlla livello batteria
2. **Copertura scarsa**: Verifica segnale rete
3. **Timeout server**: Controlla stabilità server
4. **IP dinamico**: Normale per dispositivi mobili

### ❌ **Dati Non Arrivano**

1. **Verifica log server**: Controlla errori
2. **Controlla parsing**: Errori nel formato pacchetti
3. **Verifica database**: Connessione PostgreSQL
4. **Controlla firewall**: Porta 8001 aperta

---

## 📱 **12. Comandi Manuali Utili**

### 📋 **Test Connessione**

```sms
pw,123456,ts#          # Richiesta posizione immediata
pw,123456,status#       # Stato connessione
pw,123456,upload,30000#  # Cambia intervallo upload
```

### 📋 **Test Funzioni**

```sms
pw,123456,health#      # Richiede dati sanitari
pw,123456,hrt#        # Solo frequenza cardiaca
pw,123456,bp#          # Solo pressione
pw,123456,oxygen#      # Solo saturazione ossigeno
pw,123456,temp#        # Solo temperatura
```

---

_📅 Aggiornato: 24 Dicembre 2024_  
_🎯 Obiettivo: Spiegare connessione automatica orologio GPS_  
_✅ Status: CONNESSIONE COMPLETAMENTE AUTOMATICA_
