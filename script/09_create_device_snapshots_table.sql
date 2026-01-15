-- =====================================================
-- Script 09: Tabella Storico Configurazioni (device_snapshots)
-- =====================================================
-- Descrizione: Memorizza lo storico di TUTTE le risposte SMS
--              ricevute dagli orologi GPS per tracciare cambiamenti
--
-- Quando eseguire: Dopo 08_create_devices_table.sql
-- =====================================================

-- Crea tabella device_snapshots
CREATE TABLE IF NOT EXISTS device_snapshots (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL,             -- FK verso devices

    -- Tipo snapshot
    snapshot_type VARCHAR(50) NOT NULL,     -- 'ts', 'status', 'health', 'battery', 'manual'
    sms_command VARCHAR(100),               -- Comando SMS inviato (es: pw,123456,ts#)

    -- Dati snapshot (tutti i campi dalla risposta SMS)
    firmware_version VARCHAR(100),
    device_internal_id VARCHAR(50),
    imei VARCHAR(20),
    server_ip VARCHAR(50),
    server_port INTEGER,
    profile INTEGER,
    upload_interval INTEGER,
    battery_level INTEGER,
    language_code INTEGER,
    timezone DECIMAL(4,2),
    gps_zone VARCHAR(10),
    network_status VARCHAR(50),
    network_signal INTEGER,
    apn VARCHAR(100),
    mcc VARCHAR(10),
    mnc VARCHAR(10),

    -- Dati posizione (se presenti)
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    altitude DECIMAL(8, 2),
    speed DECIMAL(6, 2),

    -- Dati sanitari (se presenti)
    heart_rate INTEGER,
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    spo2 INTEGER,
    temperature DECIMAL(4, 1),
    steps INTEGER,

    -- Dati grezzi SMS
    raw_sms_response TEXT NOT NULL,        -- Risposta SMS completa

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,                     -- ID utente che ha inviato SMS (opzionale)

    -- Foreign Keys
    CONSTRAINT fk_snapshot_device FOREIGN KEY (device_id)
        REFERENCES devices(id) ON DELETE CASCADE,
    CONSTRAINT fk_snapshot_user FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE SET NULL
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_snapshots_device ON device_snapshots(device_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_created ON device_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_type ON device_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_snapshots_device_created ON device_snapshots(device_id, created_at DESC);

-- Constraint check per snapshot_type
ALTER TABLE device_snapshots
    ADD CONSTRAINT check_snapshot_type
    CHECK (snapshot_type IN ('ts', 'status', 'health', 'battery', 'config', 'manual', 'auto'));

-- Commenti
COMMENT ON TABLE device_snapshots IS 'Storico completo di tutte le risposte SMS ricevute dagli orologi GPS';
COMMENT ON COLUMN device_snapshots.snapshot_type IS 'Tipo: ts, status, health, battery, config, manual, auto';
COMMENT ON COLUMN device_snapshots.raw_sms_response IS 'Risposta SMS completa esattamente come ricevuta';
COMMENT ON COLUMN device_snapshots.created_by IS 'ID utente che ha richiesto snapshot (NULL se automatico)';

-- View per latest snapshots per device
CREATE OR REPLACE VIEW v_latest_device_snapshots AS
SELECT DISTINCT ON (device_id)
    device_id,
    snapshot_type,
    battery_level,
    network_status,
    network_signal,
    firmware_version,
    server_ip,
    server_port,
    created_at,
    raw_sms_response
FROM device_snapshots
ORDER BY device_id, created_at DESC;

COMMENT ON VIEW v_latest_device_snapshots IS 'Ultimo snapshot per ogni dispositivo';

-- Funzione per auto-creare snapshot quando devices viene aggiornato
CREATE OR REPLACE FUNCTION create_device_snapshot_on_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo se cambiano dati significativi
    IF (OLD.battery_level IS DISTINCT FROM NEW.battery_level) OR
       (OLD.firmware_version IS DISTINCT FROM NEW.firmware_version) OR
       (OLD.network_status IS DISTINCT FROM NEW.network_status) OR
       (OLD.server_ip IS DISTINCT FROM NEW.server_ip) OR
       (NEW.last_sms_raw IS NOT NULL AND NEW.last_sms_raw != OLD.last_sms_raw)
    THEN
        INSERT INTO device_snapshots (
            device_id,
            snapshot_type,
            firmware_version,
            device_internal_id,
            imei,
            server_ip,
            server_port,
            profile,
            upload_interval,
            battery_level,
            language_code,
            timezone,
            gps_zone,
            network_status,
            network_signal,
            apn,
            latitude,
            longitude,
            heart_rate,
            systolic_bp,
            diastolic_bp,
            spo2,
            temperature,
            steps,
            raw_sms_response
        ) VALUES (
            NEW.id,
            'auto',
            NEW.firmware_version,
            NEW.device_internal_id,
            NEW.imei,
            NEW.server_ip,
            NEW.server_port,
            NEW.profile,
            NEW.upload_interval,
            NEW.battery_level,
            NEW.language_code,
            NEW.timezone,
            NEW.gps_zone,
            NEW.network_status,
            NEW.network_signal,
            NEW.apn,
            NEW.last_latitude,
            NEW.last_longitude,
            NEW.last_heart_rate,
            NEW.last_systolic_bp,
            NEW.last_diastolic_bp,
            NEW.last_spo2,
            NEW.last_temperature,
            NEW.last_steps,
            COALESCE(NEW.last_sms_raw, 'Auto snapshot')
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per auto-snapshot (OPZIONALE - decommenta se vuoi)
-- DROP TRIGGER IF EXISTS trigger_auto_snapshot ON devices;
-- CREATE TRIGGER trigger_auto_snapshot
--     AFTER UPDATE ON devices
--     FOR EACH ROW
--     EXECUTE FUNCTION create_device_snapshot_on_update();

-- Feedback
DO $$
BEGIN
    RAISE NOTICE '✓ Tabella device_snapshots creata con successo!';
    RAISE NOTICE '✓ Memorizza storico completo risposte SMS';
    RAISE NOTICE '✓ Campi: tutti i dati di configurazione + raw SMS';
    RAISE NOTICE '✓ View: v_latest_device_snapshots per ultimo stato';
    RAISE NOTICE '✓ Trigger auto-snapshot: disponibile (commentato)';
    RAISE NOTICE 'ℹ️  Per abilitare auto-snapshot: decommenta il trigger nel file';
END $$;
