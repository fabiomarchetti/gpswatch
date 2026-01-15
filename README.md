# 🔓 Sistema Sblocco Automatico Orologi GPS

Sistema completo per lo sblocco automatizzato di centinaia di orologi GPS per il monitoraggio sanitario di pazienti anziani.

## 🎯 Problema Risolto

Gli orologi GPS C405_KYS_S5_V1.3_2025 richiedono sblocco individuale dall'azienda cinese per connettersi al tuo server. Questo sistema automatizza il processo per centinaia di dispositivi.

## 🚀 Soluzioni Implementate

### 1. 📧 Richiesta FOTA di Massa
Automatizza l'invio di richieste FOTA (Firmware Over The Air) al produttore per sbloccare tutti i dispositivi contemporaneamente.

### 2. 🔓 Sblocco Automatizzato
Sistema che utilizza API del produttore per sbloccare dispositivi in batch automaticamente.

### 3. 🔬 Decoder AQSH+ Avanzato
Reverse engineering del protocollo criptato AQSH+ con machine learning per decrittazione automatica.

### 4. 🧪 Test Pilota
Framework completo per testare le soluzioni su dispositivi pilota prima del deployment di massa.

## 📦 Installazione

```bash
# Clona il repository
git clone https://github.com/fabio-marchetti/gps-tracker-mass-unlock.git
cd gps-tracker-mass-unlock

# Esegui setup automatico
npm run setup

# Configura il file .env con i tuoi dati
nano .env
```

## ⚙️ Configurazione

Modifica il file `.env` con i tuoi dati:

```env
# Configurazione Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com

# Informazioni Business
BUSINESS_EMAIL=your_business@email.com
BUSINESS_PHONE=+39 XXX XXX XXXX
BUSINESS_CONTACT=Fabio Marchetti

# Credenziali SeTracker/Wonlex
SETRACKER_USERNAME=your_dealer_username
SETRACKER_PASSWORD=your_dealer_password

# Configurazione Server
SERVER_IP=91.99.141.225
SERVER_PORT=8001
```

## 📋 Preparazione Dati

Crea un file CSV con i tuoi dispositivi:

```csv
IMEI,RegistrationCode,Model,Notes
863737078055392,l50e5et0eq,C405_KYS_S5,Paziente Mario Rossi
863737078055393,m60f6fu1fr,C405_KYS_S5,Paziente Anna Bianchi
...
```

## 🚀 Utilizzo

### Metodo 1: Richiesta FOTA di Massa (Consigliato)

```bash
# Invia richiesta FOTA per tutti i dispositivi
npm run fota device_list.csv
```

Questo comando:
- ✅ Invia email professionale al produttore
- ✅ Include lista completa dispositivi
- ✅ Enfatizza valore business (€50,000+)
- ✅ Richiede firmware senza crittografia

### Metodo 2: Sblocco Automatizzato

```bash
# Sblocco automatico via API
npm run unlock device_list.csv
```

Questo comando:
- ✅ Autentica con API produttore
- ✅ Sblocca dispositivi in batch
- ✅ Configura server di destinazione
- ✅ Genera report dettagliato

### Metodo 3: Test Decoder AQSH+

```bash
# Test reverse engineering
npm run decode
```

Questo comando:
- ✅ Analizza protocollo criptato
- ✅ Tenta decrittazione con chiavi comuni
- ✅ Apprende da dispositivi funzionanti
- ✅ Applica chiavi a nuovi dispositivi

## 🧪 Test Pilota

Prima del deployment di massa, testa su dispositivi pilota:

```bash
# Esegui test completi
npm test

# Test specifici
npm run test:fota
npm run test:unlock
npm run test:decode
```

## 📊 Monitoraggio

### Verifica Stato Sistema

```bash
# Controlla configurazione
npm run check-env

# Stato connessioni server
curl http://91.99.141.225:3000/api/tcp/status
```

### Log e Report

I risultati vengono salvati in:
- `results/unlock_results_*.csv` - Risultati sblocco
- `results/pilot_test_report_*.json` - Report test pilota
- `logs/` - Log dettagliati operazioni

## 🎯 Strategia Consigliata

### Fase 1: Approccio Diplomatico (1-2 settimane)
1. **Invia richiesta FOTA di massa** con `npm run fota`
2. **Enfatizza valore business** (contratto €50,000+)
3. **Follow-up automatico** dopo 24 ore

### Fase 2: Soluzione Tecnica (Parallela)
1. **Sviluppa sblocco automatizzato** con `npm run unlock`
2. **Testa decoder AQSH+** con `npm run decode`
3. **Valuta alternative hardware** (XPLORA, ANIO)

### Fase 3: Deployment (1-2 settimane)
1. **Test pilota** su 5-10 dispositivi
2. **Deployment graduale** (50-100 dispositivi)
3. **Monitoraggio continuo** e ottimizzazioni

## 📞 Contatti Produttore

Il sistema contatta automaticamente:
- sales@4p-touch.com
- info@setracker.com
- info@iwonlex.net
- support@wonlex.com

## 🛡️ Alternative Hardware

Se lo sblocco fallisce, considera migrazione a:

| Modello | Protocollo | Prezzo | Disponibilità |
|---------|------------|--------|---------------|
| **XPLORA X5 PLAY** | HTTP REST | €199-249 | 🟢 Italia |
| **ANIO 5 TOUCH** | MQTT/HTTP | €229-279 | 🟢 Germania |
| **SPACETALK ADVENTURER** | HTTP REST | €240 | 🟡 Import |

## 📊 Probabilità di Successo

- **FOTA di massa**: 70% (se enfatizzi valore business)
- **Sblocco automatizzato**: 60% (dipende da API disponibili)
- **Reverse engineering**: 40% (complesso ma possibile)
- **Migrazione hardware**: 95% (costosa ma sicura)

## 🔧 Troubleshooting

### Errore Autenticazione Email
```bash
# Verifica credenziali Gmail
# Usa App Password invece della password normale
export EMAIL_PASSWORD="your_16_char_app_password"
```

### Errore API Produttore
```bash
# Verifica credenziali dealer
export SETRACKER_USERNAME="your_dealer_account"
export SETRACKER_PASSWORD="your_dealer_password"
```

### Errore Connessione Server
```bash
# Verifica server VPS
ssh root@91.99.141.225
pm2 status
pm2 logs gps-server
```

## 📚 Documentazione Completa

- [`documenti/SOLUZIONI_SBLOCCO_AUTOMATICO_OROLOGI.md`](documenti/SOLUZIONI_SBLOCCO_AUTOMATICO_OROLOGI.md) - Soluzioni dettagliate
- [`documenti/ANALISI_OROLOGI_GPS_ALTERNATIVI.md`](documenti/ANALISI_OROLOGI_GPS_ALTERNATIVI.md) - Alternative hardware
- [`documenti/STATO_ATTUALE_SISTEMA.md`](documenti/STATO_ATTUALE_SISTEMA.md) - Stato sistema attuale

## 🤝 Supporto

Per supporto tecnico:
- **Email**: fabio@gps-tracker.it
- **Telefono**: +39 XXX XXX XXXX
- **GitHub Issues**: [Apri un issue](https://github.com/fabio-marchetti/gps-tracker-mass-unlock/issues)

## 📄 Licenza

MIT License - Vedi [LICENSE](LICENSE) per dettagli.

---

**🎯 AZIONE IMMEDIATA**: Esegui `npm run setup` e poi `npm run fota` per iniziare lo sblocco di massa!

---

_Sviluppato da Fabio Marchetti per il progetto GPS Tracker Healthcare System_