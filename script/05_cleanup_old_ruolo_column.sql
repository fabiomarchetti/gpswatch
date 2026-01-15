-- ============================================
-- Script: Pulizia colonna RUOLO vecchia
-- Descrizione: Rimuove la vecchia colonna ruolo VARCHAR dopo la migrazione
-- Data: 2025-12-26
-- Ordine esecuzione: 5 (OPZIONALE - Esegui SOLO dopo aver verificato che tutto funzioni)
-- ============================================

-- ⚠️ ATTENZIONE: Questo script è IRREVERSIBILE!
-- Esegui SOLO dopo aver verificato che:
-- 1. Tutti gli utenti hanno ruolo_id corretto
-- 2. Il sistema funziona con i nuovi ruoli
-- 3. Hai fatto un backup del database

-- Mostra i dati prima della rimozione (per sicurezza)
SELECT
    u.id,
    u.username,
    u.ruolo AS vecchio_ruolo,
    r.nome_ruolo AS nuovo_ruolo
FROM users u
JOIN ruoli r ON u.ruolo_id = r.id
ORDER BY u.id;

-- CONFERMA: Vuoi procedere con la rimozione? (decommenta la riga sotto)
-- ALTER TABLE users DROP COLUMN ruolo;

-- Dopo la rimozione, verifica
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- ORDER BY ordinal_position;

SELECT 'ATTENZIONE: Decommenta il comando ALTER TABLE per rimuovere la colonna ruolo' AS avviso;
