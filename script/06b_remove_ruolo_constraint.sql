-- =====================================================
-- Script 06b: Rimuove constraint CHECK su colonna ruolo
-- =====================================================
-- Descrizione: Rimuove il vincolo CHECK sulla colonna ruolo
--              che impedisce l'inserimento dei nuovi ruoli
--
-- Quando eseguire: Dopo 06_fix_ruolo_nullable.sql
--                   PRIMA di 07_sync_ruolo_trigger.sql
-- =====================================================

-- Trova e rimuovi il constraint CHECK sulla colonna ruolo
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Trova il nome del constraint CHECK sulla colonna ruolo
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = con.conrelid
        AND att.attnum = ANY(con.conkey)
    WHERE rel.relname = 'users'
        AND att.attname = 'ruolo'
        AND con.contype = 'c';  -- 'c' = CHECK constraint

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE '✓ Constraint CHECK "%s" rimosso con successo!', constraint_name;
    ELSE
        RAISE NOTICE 'ℹ️  Nessun constraint CHECK trovato sulla colonna ruolo';
    END IF;
END $$;

-- Verifica che non ci siano più constraint sulla colonna ruolo
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = con.conrelid
        AND att.attnum = ANY(con.conkey)
    WHERE rel.relname = 'users'
        AND att.attname = 'ruolo'
        AND con.contype = 'c';

    IF constraint_count = 0 THEN
        RAISE NOTICE '✓ Nessun constraint CHECK presente sulla colonna ruolo';
        RAISE NOTICE '✓ Ora puoi eseguire 07_sync_ruolo_trigger.sql';
    ELSE
        RAISE NOTICE '⚠️  Ancora %s constraint CHECK presente/i sulla colonna ruolo', constraint_count;
    END IF;
END $$;
