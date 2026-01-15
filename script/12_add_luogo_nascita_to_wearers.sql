-- =====================================================
-- Script 12: Aggiungi campo luogo_nascita a wearers
-- =====================================================
-- Descrizione: Aggiunge il campo luogo_nascita alla tabella wearers
--              per memorizzare il luogo di nascita dell'utente
--
-- Quando eseguire: Dopo 11_add_sim_pin_to_devices.sql
-- =====================================================

-- Aggiungi colonna luogo_nascita
ALTER TABLE wearers
ADD COLUMN IF NOT EXISTS luogo_nascita VARCHAR(100);

-- Commento sulla colonna
COMMENT ON COLUMN wearers.luogo_nascita IS 'Luogo di nascita dell''utente (città)';

-- Feedback
DO $$
BEGIN
    RAISE NOTICE '✓ Campo luogo_nascita aggiunto alla tabella wearers!';
    RAISE NOTICE '✓ Tipo: VARCHAR(100) per città di nascita';
    RAISE NOTICE '✓ Nullable: SI (opzionale)';
END $$;
