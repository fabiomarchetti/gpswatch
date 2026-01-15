# 📘 Vademecum Sviluppatore GPS Watch

Guida rapida ai comandi essenziali per gestire il progetto, il database Supabase e il repository GitHub.

---

## 🛠️ Git & GitHub (Gestione Codice)

### Flusso di Lavoro Quotidiano
Ogni volta che fai una modifica funzionante:

1.  **Controlla cosa è cambiato:**
    ```bash
    git status
    ```
    *(Vedi i file in rosso/verde)*

2.  **Prepara i file ("Add"):**
    ```bash
    git add .
    ```
    *(Aggiunge TUTTO. Se vuoi solo un file specifico: `git add nomefile`)*

3.  **Salva la versione ("Commit"):**
    ```bash
    git commit -m "Descrizione breve di cosa hai fatto"
    ```
    *(Esempio: `git commit -m "Fix: risolto bug login"`)*

4.  **Pubblica online ("Push"):**
    ```bash
    git push
    ```
    *(Invia le modifiche a GitHub e scatena il deploy automatico su Vercel)*

### Pulizia Repository
Per eliminare file o cartelle dal repository (ma tenerli magari in locale se messi nel .gitignore):
```bash
git rm -r nome_cartella
git commit -m "Rimossa cartella inutile"
git push
```

---

## 🗄️ Database Supabase (Gestione Dati)

### Collegamento Diretto (Interactive Shell)
Per entrare nella console SQL e lanciare comandi manualmente:

```bash
PGPASSWORD="Filohori11!" psql -h aws-1-eu-north-1.pooler.supabase.com -p 5432 -U postgres.qqddxwwovgbztdisowwt -d postgres
```

**Comandi utili una volta dentro:**
*   `\dt` → Lista tutte le tabelle
*   `\d nome_tabella` → Vedi la struttura di una tabella (colonne, tipi)
*   `SELECT * FROM users;` → Vedi tutti i dati di una tabella
*   `\q` → Esci

### Comando "Al Volo" (One-Liner)
Per eseguire una query e uscire subito senza entrare nella console:

```bash
PGPASSWORD="Filohori11!" psql -h aws-1-eu-north-1.pooler.supabase.com -p 5432 -U postgres.qqddxwwovgbztdisowwt -d postgres -c "LA TUA QUERY SQL QUI"
```

**Esempi:**
*   **Contare utenti:** `... -c "SELECT count(*) FROM users;"`
*   **Aggiornare un ruolo:** `... -c "UPDATE users SET ruolo = 'admin' WHERE username = 'mario';"`

---

## 🚀 Script Utili (Già pronti nel progetto)

Nella cartella `scripts/` trovi degli strumenti automatici:

*   **`npm run dev`**: Avvia il server di sviluppo locale.
*   **`node scripts/import_from_vps.js`**: Importa dispositivi e pazienti dalla vecchia VPS a Supabase.
*   **`node scripts/import_users_vps.js`**: Importa gli utenti dalla vecchia VPS.

---

## 💡 Consigli
*   **Vercel Deploy**: Ogni volta che fai `git push`, Vercel aggiorna il sito live automaticamente.
*   **Backup**: GitHub è il tuo backup del codice. Supabase fa backup automatici dei dati.
*   **Sicurezza**: Non committare mai file `.env` con password reali su GitHub (sono già nel `.gitignore`).
