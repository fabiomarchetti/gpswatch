-- =====================================================
-- Script 10: Tabella Utenti Orologi (wearers)
-- =====================================================
-- Descrizione: Crea la tabella per gli utenti finali che indossano
--              gli orologi GPS (anziani, pazienti, etc.)
--              Diversa dalla tabella users che contiene gli operatori
--
-- Quando eseguire: Dopo 09_create_device_snapshots_table.sql
-- =====================================================

-- Crea tabella wearers
CREATE TABLE IF NOT EXISTS wearers (
    id SERIAL PRIMARY KEY,

    -- Dati anagrafici
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    data_nascita DATE,
    codice_fiscale VARCHAR(16) UNIQUE,
    sesso VARCHAR(1) CHECK (sesso IN ('M', 'F', 'A')),  -- M=Maschio, F=Femmina, A=Altro

    -- Recapiti
    indirizzo VARCHAR(255),
    citta VARCHAR(100),
    provincia VARCHAR(2),
    cap VARCHAR(10),
    telefono VARCHAR(20),
    email VARCHAR(255),

    -- Contatti di emergenza
    emergenza_nome VARCHAR(200),
    emergenza_telefono VARCHAR(20),
    emergenza_relazione VARCHAR(100),  -- es: "Figlio", "Coniuge", "Badante"

    -- Contatto secondario
    emergenza2_nome VARCHAR(200),
    emergenza2_telefono VARCHAR(20),
    emergenza2_relazione VARCHAR(100),

    -- Informazioni mediche
    gruppo_sanguigno VARCHAR(5),       -- es: "A+", "0-", etc.
    allergie TEXT,
    patologie TEXT,
    farmaci TEXT,
    note_mediche TEXT,

    -- Dispositivo assegnato
    device_id INTEGER UNIQUE,          -- FK verso devices (1-to-1)
    device_assigned_date TIMESTAMP,

    -- Foto profilo (opzionale)
    foto_url TEXT,

    -- Status
    active BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,                -- ID utente sistema che ha creato

    -- Foreign Keys
    CONSTRAINT fk_wearer_device FOREIGN KEY (device_id)
        REFERENCES devices(id) ON DELETE SET NULL,
    CONSTRAINT fk_wearer_created_by FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE SET NULL
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_wearers_cognome ON wearers(cognome);
CREATE INDEX IF NOT EXISTS idx_wearers_nome ON wearers(nome);
CREATE INDEX IF NOT EXISTS idx_wearers_cf ON wearers(codice_fiscale);
CREATE INDEX IF NOT EXISTS idx_wearers_device ON wearers(device_id);
CREATE INDEX IF NOT EXISTS idx_wearers_active ON wearers(active);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_wearers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wearers_timestamp ON wearers;
CREATE TRIGGER trigger_update_wearers_timestamp
    BEFORE UPDATE ON wearers
    FOR EACH ROW
    EXECUTE FUNCTION update_wearers_timestamp();

-- Trigger per aggiornare assigned_user_id in devices quando viene assegnato un wearer
CREATE OR REPLACE FUNCTION sync_device_wearer()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando un wearer viene assegnato a un device, aggiorna il device
    IF NEW.device_id IS NOT NULL AND (OLD.device_id IS NULL OR OLD.device_id != NEW.device_id) THEN
        UPDATE devices
        SET assigned_user_id = NULL,  -- Per ora NULL, ma potrebbe essere l'ID del wearer se necessario
            assigned_date = CURRENT_TIMESTAMP
        WHERE id = NEW.device_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_device_wearer ON wearers;
CREATE TRIGGER trigger_sync_device_wearer
    AFTER INSERT OR UPDATE ON wearers
    FOR EACH ROW
    EXECUTE FUNCTION sync_device_wearer();

-- View per visualizzazione completa wearers + devices
CREATE OR REPLACE VIEW v_wearers_devices AS
SELECT
    w.id as wearer_id,
    w.nome,
    w.cognome,
    w.data_nascita,
    w.telefono,
    w.emergenza_nome,
    w.emergenza_telefono,
    w.patologie,
    w.active as wearer_active,
    d.id as device_id,
    d.device_id as device_code,
    d.imei,
    d.phone_number as device_phone,
    d.model,
    d.battery_level,
    d.status as device_status,
    w.device_assigned_date,
    w.created_at
FROM wearers w
LEFT JOIN devices d ON w.device_id = d.id
ORDER BY w.cognome, w.nome;

COMMENT ON VIEW v_wearers_devices IS 'Vista combinata wearers e dispositivi assegnati';

-- Commenti sulle colonne
COMMENT ON TABLE wearers IS 'Utenti finali che indossano gli orologi GPS (anziani, pazienti, etc.)';
COMMENT ON COLUMN wearers.device_id IS 'Dispositivo GPS assegnato (relazione 1-to-1)';
COMMENT ON COLUMN wearers.emergenza_nome IS 'Contatto di emergenza principale';
COMMENT ON COLUMN wearers.note_mediche IS 'Note mediche importanti, allergie, patologie croniche';
COMMENT ON COLUMN wearers.created_by IS 'ID dell''operatore che ha registrato il wearer';

-- Feedback
DO $$
BEGIN
    RAISE NOTICE '✓ Tabella wearers creata con successo!';
    RAISE NOTICE '✓ Anagrafici: nome, cognome, data_nascita, CF, sesso';
    RAISE NOTICE '✓ Recapiti: indirizzo, città, telefono, email';
    RAISE NOTICE '✓ Emergenze: 2 contatti con nome, telefono, relazione';
    RAISE NOTICE '✓ Medico: gruppo_sanguigno, allergie, patologie, farmaci';
    RAISE NOTICE '✓ Device: assegnazione 1-to-1 con dispositivo GPS';
    RAISE NOTICE '✓ View: v_wearers_devices per vista combinata';
    RAISE NOTICE '✓ Trigger: sincronizzazione automatica con devices';
END $$;
