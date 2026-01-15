# 🔬 REVERSE ENGINEERING PROTOCOLLO AQSH+ - PASSO PASSO

## 🎯 OBIETTIVO
Decrittare il protocollo AQSH+ per ottenere controllo completo dell'orologio e bypassare il blocco firmware.

## 📋 SITUAZIONE CONFERMATA
- ✅ Orologio ha **blocco firmware selettivo**
- ✅ Comandi lettura (ts#) funzionano
- ❌ Comandi modifica (ip#, restart#) bloccati
- 🔐 Comunicazione TCP usa protocollo **AQSH+ criptato**

---

## 🚀 STEP 15: RACCOLTA DATI AQSH+

### Cosa faremo:
1. **Catturare** pacchetti AQSH+ dall'orologio funzionante
2. **Analizzare** la struttura criptata
3. **Decrittare** usando il decoder avanzato
4. **Applicare** la chiave trovata per sbloccare altri orologi

### Sul tuo VPS, ferma il proxy e avvia la cattura dati:

```bash
# Ferma il proxy (CTRL+C)
# Poi avvia il server normale per catturare dati AQSH+
pm2 restart gps-server
pm2 logs gps-server --lines 0 -f
```

Questo mostrerà i dati AQSH+ criptati quando l'orologio si connette.

**Hai fermato il proxy e avviato il monitoraggio del server normale?**