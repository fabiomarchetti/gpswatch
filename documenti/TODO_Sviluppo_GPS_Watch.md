# TODO List - Sistema di Monitoraggio GPS per Anziani

## 📋 Checklist Operativa di Sviluppo

---

## FASE 1: Preparazione Hardware ⏱️ Settimana 1

### Acquisto e Setup SIM
- [ ] Acquistare SIM 4G con piano dati (consigliato: Iliad 4,99€/mese o ho.Mobile 5,99€/mese)
- [ ] Verificare che la SIM supporti rete 4G/LTE
- [ ] Attivare la SIM e verificare funzionamento su smartphone

### Setup Orologio
- [ ] Inserire SIM nell'orologio (slot solitamente sotto coperchio posteriore)
- [ ] Accendere l'orologio (tenere premuto pulsante laterale)
- [ ] Verificare che prenda segnale (icona rete visibile)
- [ ] Annotare numero IMEI (etichetta sul retro o confezione)

### Test con SeTracker (temporaneo)
- [ ] Scaricare app SeTracker2 (Android/iOS)
- [ ] Registrare account SeTracker
- [ ] Scansionare QR code o inserire IMEI manualmente
- [ ] Verificare che l'orologio appaia online nell'app
- [ ] Testare localizzazione GPS
- [ ] Testare pulsante SOS (chiamata di emergenza)
- [ ] Testare comunicazione vocale bidirezionale
- [ ] Testare monitoraggio parametri salute (se supportato)

**✅ Checkpoint:** L'orologio funziona correttamente con SeTracker

---

## FASE 2: Setup Infrastruttura ⏱️ Settimana 1-2

### Account Cloud
- [ ] Creare account Supabase (https://supabase.com)
- [ ] Creare nuovo progetto Supabase (regione: EU West)
- [ ] Salvare credenziali: URL, anon key, service key
- [ ] Creare account Vercel (https://vercel.com)
- [ ] Collegare Vercel a repository GitHub

### VPS Server TCP
- [ ] Scegliere provider VPS:
  - [ ] Hetzner (https://hetzner.com) - da 4,51€/mese
  - [ ] DigitalOcean (https://digitalocean.com) - da $6/mese
  - [ ] OVH (https://ovh.it) - da 3,50€/mese
- [ ] Acquistare VPS con:
  - [ ] Sistema: Ubuntu 22.04 LTS
  - [ ] RAM: minimo 1GB
  - [ ] IP pubblico fisso (incluso)
- [ ] Annotare IP pubblico del VPS

### Configurazione VPS
- [ ] Accedere via SSH: `ssh root@IP_VPS`
- [ ] Aggiornare sistema: `apt update && apt upgrade -y`
- [ ] Installare Node.js 20 LTS:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  apt install -y nodejs
  ```
- [ ] Installare PM2 (process manager): `npm install -g pm2`
- [ ] Configurare firewall UFW:
  ```bash
  ufw allow ssh
  ufw allow 5000/tcp  # Porta server TCP per orologio
  ufw allow 80/tcp    # HTTP
  ufw allow 443/tcp   # HTTPS
  ufw enable
  ```
- [ ] Installare Nginx (reverse proxy, opzionale): `apt install nginx`

### Dominio (opzionale ma consigliato)
- [ ] Registrare dominio (es. monitoraggio-anziani.it)
- [ ] Configurare DNS A record → IP del VPS
- [ ] Configurare SSL con Certbot (Let's Encrypt)

**✅ Checkpoint:** VPS accessibile, porta 5000 aperta, Node.js funzionante

---

## FASE 3: Sviluppo Backend ⏱️ Settimana 2-3

### Database Supabase
- [ ] Creare tabella `devices`:
  ```sql
  - id (uuid, primary key)
  - imei (text, unique)
  - name (text)
  - owner_id (uuid, foreign key → auth.users)
  - sos_numbers (text[])
  - settings (jsonb)
  - created_at (timestamp)
  - updated_at (timestamp)
  ```
- [ ] Creare tabella `locations`:
  ```sql
  - id (uuid, primary key)
  - device_id (uuid, foreign key)
  - latitude (double)
  - longitude (double)
  - altitude (double)
  - speed (double)
  - accuracy (double)
  - satellites (int)
  - battery (int)
  - steps (int)
  - source (text: GPS/LBS/WIFI)
  - raw_data (jsonb)
  - recorded_at (timestamp)
  - created_at (timestamp)
  ```
- [ ] Creare tabella `health_data`:
  ```sql
  - id (uuid, primary key)
  - device_id (uuid, foreign key)
  - heart_rate (int)
  - systolic_bp (int)
  - diastolic_bp (int)
  - spo2 (double)
  - temperature (double)
  - temperature_mode (text: wrist/forehead)
  - recorded_at (timestamp)
  - created_at (timestamp)
  ```
- [ ] Creare tabella `alarms`:
  ```sql
  - id (uuid, primary key)
  - device_id (uuid, foreign key)
  - type (text: SOS/FALL/LOW_BATTERY/REMOVE/GEOFENCE)
  - latitude (double)
  - longitude (double)
  - acknowledged (boolean)
  - acknowledged_by (uuid)
  - acknowledged_at (timestamp)
  - raw_data (jsonb)
  - created_at (timestamp)
  ```
- [ ] Creare tabella `geofences`:
  ```sql
  - id (uuid, primary key)
  - device_id (uuid, foreign key)
  - name (text)
  - latitude (double)
  - longitude (double)
  - radius (int) -- metri
  - active (boolean)
  - created_at (timestamp)
  ```
- [ ] Configurare Row Level Security (RLS) per tutte le tabelle
- [ ] Creare indici per query frequenti
- [ ] Abilitare Realtime sulle tabelle necessarie

### Server TCP Node.js
- [ ] Creare repository GitHub per progetto server
- [ ] Inizializzare progetto: `npm init`
- [ ] Installare dipendenze:
  ```bash
  npm install @supabase/supabase-js dotenv
  ```
- [ ] Implementare connessione TCP base (porta 5000)
- [ ] Implementare parser protocollo `[3G*ID*LEN*CMD,data]`
- [ ] Implementare gestione comandi:
  - [ ] LK (heartbeat) - rispondere con conferma
  - [ ] UD (posizione) - parsing completo + salvataggio
  - [ ] UD2 (blind spot) - salvataggio storico
  - [ ] AL (allarme) - parsing + notifica + salvataggio
  - [ ] bphrt (salute) - parsing parametri vitali
  - [ ] oxygen (SpO2)
  - [ ] btemp2 (temperatura)
- [ ] Implementare invio comandi al dispositivo:
  - [ ] CR (richiesta posizione)
  - [ ] SOS (configurazione numeri)
  - [ ] hrtstart (avvio monitoraggio cardiaco)
  - [ ] FALLDOWN (configurazione caduta)
  - [ ] FIND (trova orologio)
- [ ] Implementare logging dettagliato
- [ ] Implementare gestione errori e riconnessione
- [ ] Creare file `.env` con credenziali Supabase
- [ ] Testare con netcat: `nc IP_VPS 5000`

### Deploy Server TCP
- [ ] Clonare repository su VPS
- [ ] Configurare variabili ambiente
- [ ] Avviare con PM2: `pm2 start server.js --name gps-server`
- [ ] Configurare avvio automatico: `pm2 startup && pm2 save`
- [ ] Verificare logs: `pm2 logs gps-server`

**✅ Checkpoint:** Server TCP attivo, risponde a connessioni, salva dati su Supabase

---

## FASE 4: Migrazione Dispositivo ⏱️ Settimana 3

### Richiesta FOTA al Produttore
- [ ] Preparare email con:
  - [ ] IMEI del dispositivo
  - [ ] IP pubblico del proprio server
  - [ ] Porta TCP (es. 5000)
- [ ] Contattare 4P-Touch/Beesure:
  - Email: sales@4p-touch.com
  - WhatsApp: +86-15323476221
- [ ] Richiedere FOTA (Firmware Over The Air) per reindirizzamento
- [ ] Attendere conferma (solitamente 24-48 ore lavorative)

### Verifica Migrazione
- [ ] Riavviare l'orologio dopo conferma FOTA
- [ ] Verificare ricezione primo pacchetto LK sul proprio server
- [ ] Verificare che l'orologio non appaia più su SeTracker
- [ ] Testare ricezione dati posizione (UD)
- [ ] Testare invio comando CR e ricezione risposta
- [ ] Testare tutti i comandi bidirezionali

**✅ Checkpoint:** Orologio connesso al proprio server, dati salvati su Supabase

---

## FASE 5: Sviluppo Frontend ⏱️ Settimana 3-4

### Setup Next.js
- [ ] Creare progetto: `npx create-next-app@latest gps-dashboard`
- [ ] Installare dipendenze:
  ```bash
  npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
  npm install leaflet react-leaflet
  npm install recharts date-fns
  npm install @tanstack/react-query
  npm install tailwindcss postcss autoprefixer
  ```
- [ ] Configurare Supabase Auth
- [ ] Creare layout base con sidebar navigazione

### Pagine da Sviluppare
- [ ] **Login/Register**: autenticazione Supabase
- [ ] **Dashboard**: overview dispositivi, stato connessione, ultimi allarmi
- [ ] **Mappa**: 
  - [ ] Leaflet con posizione realtime
  - [ ] Marker personalizzati per ogni dispositivo
  - [ ] Storico percorsi con slider temporale
  - [ ] Visualizzazione geofence
- [ ] **Salute**:
  - [ ] Grafico frequenza cardiaca (ultime 24h/7gg/30gg)
  - [ ] Grafico pressione sanguigna
  - [ ] Grafico SpO2
  - [ ] Grafico temperatura
  - [ ] Indicatori anomalie (valori fuori range)
- [ ] **Allarmi**:
  - [ ] Lista allarmi con filtri (tipo, data, stato)
  - [ ] Badge notifiche non lette
  - [ ] Pulsante "Prendi in carico"
  - [ ] Storico allarmi gestiti
- [ ] **Configurazione Dispositivo**:
  - [ ] Modifica numeri SOS
  - [ ] Configura geofence (disegno su mappa)
  - [ ] Sensibilità rilevamento caduta
  - [ ] Intervallo upload dati
  - [ ] Modalità silenziosa/vibrazione
- [ ] **Comandi Rapidi**:
  - [ ] Pulsante "Localizza ora"
  - [ ] Pulsante "Trova orologio" (fa suonare)
  - [ ] Pulsante "Riavvia dispositivo"
- [ ] **Impostazioni Account**: gestione profilo, notifiche

### Realtime Updates
- [ ] Configurare Supabase Realtime per tabella `locations`
- [ ] Configurare Supabase Realtime per tabella `alarms`
- [ ] Implementare notifiche browser (Web Push API)
- [ ] Implementare notifiche sonore per allarmi critici

### Responsive Design
- [ ] Ottimizzare per desktop
- [ ] Ottimizzare per tablet
- [ ] Ottimizzare per mobile (caregiver in movimento)

**✅ Checkpoint:** Dashboard funzionante con dati realtime

---

## FASE 6: Testing e Deploy ⏱️ Settimana 4

### Testing Funzionale
- [ ] Test flusso completo: orologio → server → database → frontend
- [ ] Test allarme SOS (premere pulsante, verificare notifica)
- [ ] Test rilevamento caduta (simulare caduta)
- [ ] Test batteria scarica (scaricare orologio sotto 20%)
- [ ] Test geofencing (uscire/entrare da zona definita)
- [ ] Test parametri salute (confrontare con valori reali)
- [ ] Test blind spot (disattivare rete, riattivare, verificare storico)

### Testing Performance
- [ ] Verificare latenza dati (tempo da orologio a dashboard)
- [ ] Verificare consumo batteria orologio con intervallo configurato
- [ ] Stress test connessioni multiple (se previsti più dispositivi)

### Sicurezza
- [ ] Verificare RLS Supabase (utente A non vede dati utente B)
- [ ] Verificare autenticazione API
- [ ] Configurare rate limiting
- [ ] Review codice per vulnerabilità comuni

### Deploy Produzione
- [ ] Deploy frontend su Vercel
- [ ] Configurare dominio personalizzato su Vercel
- [ ] Verificare SSL attivo
- [ ] Configurare backup automatici database Supabase
- [ ] Configurare monitoring uptime (UptimeRobot, gratuito)
- [ ] Configurare alerting per downtime server TCP

### Documentazione
- [ ] Scrivere guida utente (PDF)
- [ ] Scrivere documentazione tecnica (README)
- [ ] Documentare API comandi dispositivo
- [ ] Creare video tutorial configurazione

**✅ Checkpoint:** Sistema in produzione, monitorato, documentato

---

## 📞 Contatti Utili

### Produttore Dispositivo (4P-Touch/Beesure)
- **Email:** sales@4p-touch.com
- **WhatsApp:** +86-15323476221, +86-15323473782
- **Sito:** https://www.4p-touch.com

### Documentazione Protocollo
- **Protocollo completo:** https://www.4p-touch.com/beesure-gps-setracker-server-protocol.html

### Supporto Tecnico Stack
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Leaflet Docs:** https://leafletjs.com/reference.html

---

## 💰 Budget Stimato

| Voce | Costo Una Tantum | Costo Mensile |
|------|------------------|---------------|
| SIM 4G | - | 5-10€ |
| VPS | - | 5-20€ |
| Dominio | 10€/anno | ~1€ |
| Supabase | - | 0€ (free tier) |
| Vercel | - | 0€ (free tier) |
| **TOTALE** | **~10€** | **~11-31€** |

---

## ⏰ Timeline Stimata

| Fase | Durata | Settimana |
|------|--------|-----------|
| Preparazione Hardware | 2-3 giorni | 1 |
| Setup Infrastruttura | 3-4 giorni | 1-2 |
| Sviluppo Backend | 5-7 giorni | 2-3 |
| Migrazione Dispositivo | 1-2 giorni | 3 |
| Sviluppo Frontend | 7-10 giorni | 3-4 |
| Testing e Deploy | 3-4 giorni | 4 |
| **TOTALE** | **~3-4 settimane** | |

---

*Documento generato il: Dicembre 2024*
