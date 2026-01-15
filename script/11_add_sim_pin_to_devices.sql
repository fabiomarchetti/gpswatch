-- =====================================================
-- Script 11: Aggiungi campo SIM PIN a devices
-- =====================================================
-- Descrizione: Aggiunge il campo sim_pin alla tabella devices
--              per memorizzare il PIN della SIM installata
--
-- Quando eseguire: Dopo 10_create_wearers_table.sql
-- =====================================================

-- Aggiungi colonna sim_pin
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS sim_pin VARCHAR(8);

-- Commento sulla colonna
COMMENT ON COLUMN devices.sim_pin IS 'PIN della scheda SIM installata nell''orologio';

-- Feedback
DO $$
BEGIN
    RAISE NOTICE '✓ Campo sim_pin aggiunto alla tabella devices!';
    RAISE NOTICE '✓ Tipo: VARCHAR(8) per PIN fino a 8 cifre';
    RAISE NOTICE '✓ Nullable: SI (opzionale)';
END $$;
