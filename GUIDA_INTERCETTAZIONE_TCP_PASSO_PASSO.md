# 🌐 GUIDA INTERCETTAZIONE TCP - PASSO PASSO

## 🎯 OBIETTIVO
Intercettare la comunicazione TCP dell'orologio con il server cinese e modificarla per redirigere al tuo server.

## 📋 SITUAZIONE CONFERMATA
- ✅ Orologio risponde a comandi di lettura (`ts#`)
- ❌ Orologio **bloccato** per comandi di modifica (`ip#`, `restart#`)
- 🎯 Server attuale: `52.28.132.157:8001` (cinese)
- 🎯 Server target: `91.99.141.225:8001` (tuo)

---

## 🚀 STEP 9: PREPARAZIONE INTERCETTAZIONE

### Cosa faremo:
1. Creare un **proxy TCP** sul tuo server VPS
2. **Intercettare** la comunicazione orologio ↔ server cinese
3. **Modificare** i pacchetti per redirigere al tuo server
4. **Forzare** l'orologio a connettersi al proxy

### Preparazione sul tuo VPS:
Devi eseguire questi comandi sul tuo server VPS (91.99.141.225):

```bash
# Connettiti al VPS
ssh root@91.99.141.225

# Scarica lo script di intercettazione
wget https://raw.githubusercontent.com/your-repo/tcp_intercept_proxy.js

# Oppure crea il file manualmente
nano tcp_intercept_proxy.js
```

**Sei pronto a connetterti al tuo VPS per configurare il proxy di intercettazione?**