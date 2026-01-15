-- =====================================================
-- Script 06: Fix colonna ruolo - Rendi nullable
-- =====================================================
-- Descrizione: Rimuove il vincolo NOT NULL dalla vecchia
--              colonna ruolo VARCHAR per permettere l'inserimento
--              di nuovi utenti usando ruolo_id
--
-- Quando eseguire: SUBITO - necessario per registrare nuovi utenti
-- =====================================================

-- Rendi la colonna ruolo nullable (rimuovi NOT NULL)
ALTER TABLE users ALTER COLUMN ruolo DROP NOT NULL;

-- Aggiungi un commento alla colonna per indicare che è deprecata
COMMENT ON COLUMN users.ruolo IS 'DEPRECATO: Usare ruolo_id. Questa colonna sarà rimossa in futuro.';

-- Verifica che ruolo_id sia NOT NULL (deve esserlo!)
ALTER TABLE users ALTER COLUMN ruolo_id SET NOT NULL;

-- Feedback
DO $$
BEGIN
    RAISE NOTICE '✓ Colonna ruolo resa nullable con successo!';
    RAISE NOTICE '✓ Ora puoi registrare nuovi utenti usando ruolo_id';
    RAISE NOTICE '⚠ NOTA: La colonna ruolo è deprecata e sarà rimossa in futuro';
END $$;
