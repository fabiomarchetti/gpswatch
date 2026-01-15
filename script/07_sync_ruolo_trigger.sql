-- =====================================================
-- Script 07: Trigger per sincronizzare ruolo con ruolo_id
-- =====================================================
-- Descrizione: Crea un trigger che automaticamente popola
--              la colonna ruolo VARCHAR quando viene inserito
--              o aggiornato un utente con ruolo_id
--
-- Quando eseguire: Dopo 06_fix_ruolo_nullable.sql
-- =====================================================

-- Funzione trigger che sincronizza ruolo con ruolo_id
CREATE OR REPLACE FUNCTION sync_ruolo_from_ruolo_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Se ruolo_id è stato impostato, popola automaticamente ruolo
    IF NEW.ruolo_id IS NOT NULL THEN
        SELECT nome_ruolo INTO NEW.ruolo
        FROM ruoli
        WHERE id = NEW.ruolo_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crea trigger per INSERT
DROP TRIGGER IF EXISTS trigger_sync_ruolo_insert ON users;
CREATE TRIGGER trigger_sync_ruolo_insert
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_ruolo_from_ruolo_id();

-- Crea trigger per UPDATE
DROP TRIGGER IF EXISTS trigger_sync_ruolo_update ON users;
CREATE TRIGGER trigger_sync_ruolo_update
    BEFORE UPDATE ON users
    FOR EACH ROW
    WHEN (OLD.ruolo_id IS DISTINCT FROM NEW.ruolo_id)
    EXECUTE FUNCTION sync_ruolo_from_ruolo_id();

-- Popola i campi ruolo NULL degli utenti esistenti
UPDATE users
SET ruolo = (SELECT nome_ruolo FROM ruoli WHERE id = users.ruolo_id)
WHERE ruolo IS NULL AND ruolo_id IS NOT NULL;

-- Feedback
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM users
    WHERE ruolo IS NOT NULL AND ruolo_id IS NOT NULL;

    RAISE NOTICE '✓ Trigger creato con successo!';
    RAISE NOTICE '✓ La colonna ruolo sarà automaticamente sincronizzata con ruolo_id';
    RAISE NOTICE '✓ Utenti con ruolo popolato: %', updated_count;
    RAISE NOTICE 'ℹ️  Quando inserisci/aggiorni un utente con ruolo_id, il campo ruolo sarà automatico';
END $$;
