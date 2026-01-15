-- ============================================
-- Script: Migrazione tabella USERS per usare RUOLI
-- Descrizione: Modifica la tabella users per usare ruolo_id invece di ruolo VARCHAR
-- Data: 2025-12-26
-- Ordine esecuzione: 4 (DOPO aver eseguito 02_create_ruoli_table.sql)
-- ============================================

-- STEP 1: Aggiungi colonna temporanea ruolo_id
ALTER TABLE users
ADD COLUMN IF NOT EXISTS ruolo_id INTEGER;

-- STEP 2: Mappa i vecchi ruoli VARCHAR ai nuovi ID
-- Aggiorna tutti gli utenti esistenti
UPDATE users SET ruolo_id = (
    CASE
        WHEN ruolo = 'admin' THEN (SELECT id FROM ruoli WHERE nome_ruolo = 'sviluppatore')
        WHEN ruolo = 'user' THEN (SELECT id FROM ruoli WHERE nome_ruolo = 'utente_base')
        WHEN ruolo = 'viewer' THEN (SELECT id FROM ruoli WHERE nome_ruolo = 'utente_base')
        WHEN ruolo = 'sviluppatore' THEN (SELECT id FROM ruoli WHERE nome_ruolo = 'sviluppatore')
        WHEN ruolo = 'animatore_digitale' THEN (SELECT id FROM ruoli WHERE nome_ruolo = 'animatore_digitale')
        WHEN ruolo = 'assistente_control' THEN (SELECT id FROM ruoli WHERE nome_ruolo = 'assistente_control')
        WHEN ruolo = 'controllo_parentale' THEN (SELECT id FROM ruoli WHERE nome_ruolo = 'controllo_parentale')
        ELSE (SELECT id FROM ruoli WHERE nome_ruolo = 'utente_base')
    END
)
WHERE ruolo_id IS NULL;

-- STEP 3: Verifica che tutti gli utenti abbiano un ruolo_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE ruolo_id IS NULL) THEN
        RAISE EXCEPTION 'Errore: alcuni utenti non hanno ruolo_id assegnato';
    END IF;
END $$;

-- STEP 4: Rendi ruolo_id NOT NULL
ALTER TABLE users
ALTER COLUMN ruolo_id SET NOT NULL;

-- STEP 5: Aggiungi foreign key verso tabella ruoli
ALTER TABLE users
ADD CONSTRAINT fk_users_ruolo
FOREIGN KEY (ruolo_id) REFERENCES ruoli(id) ON DELETE RESTRICT;

-- STEP 6: Rimuovi la vecchia colonna ruolo VARCHAR (OPZIONALE - commentato per sicurezza)
-- ATTENZIONE: Decommenta solo dopo aver verificato che tutto funzioni
-- ALTER TABLE users DROP COLUMN IF EXISTS ruolo;

-- STEP 7: Crea indice per ruolo_id
CREATE INDEX IF NOT EXISTS idx_users_ruolo_id ON users(ruolo_id);

-- STEP 8: Aggiorna i commenti
COMMENT ON COLUMN users.ruolo_id IS 'ID del ruolo (foreign key verso tabella ruoli)';

-- STEP 9: Aggiungi foreign keys alla tabella user_relations (ora che users è pronta)
ALTER TABLE user_relations
DROP CONSTRAINT IF EXISTS fk_tutore,
DROP CONSTRAINT IF EXISTS fk_tutelato;

ALTER TABLE user_relations
ADD CONSTRAINT fk_tutore FOREIGN KEY (tutore_id) REFERENCES users(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_tutelato FOREIGN KEY (tutelato_id) REFERENCES users(id) ON DELETE CASCADE;

-- Verifica migrazione
SELECT 'Migrazione completata con successo!' AS status;

-- Mostra statistiche
SELECT
    r.nome_ruolo,
    r.livello_accesso,
    COUNT(u.id) as numero_utenti
FROM ruoli r
LEFT JOIN users u ON u.ruolo_id = r.id
GROUP BY r.id, r.nome_ruolo, r.livello_accesso
ORDER BY r.livello_accesso DESC;

-- Mostra utenti con i nuovi ruoli
SELECT
    u.id,
    u.username,
    u.nome,
    u.cognome,
    r.nome_ruolo,
    r.livello_accesso
FROM users u
JOIN ruoli r ON u.ruolo_id = r.id
ORDER BY r.livello_accesso DESC, u.username;
