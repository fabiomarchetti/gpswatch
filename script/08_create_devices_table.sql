-- =====================================================
-- Script 08: Tabella Dispositivi GPS (devices)
-- =====================================================
-- Descrizione: Crea la tabella per gestire gli orologi GPS
--              con TUTTI i dati di configurazione ricevuti via SMS
--
-- Quando eseguire: Dopo 07_sync_ruolo_trigger.sql
-- =====================================================

-- Crea tabella devices
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,

    -- Identificatori dispositivo
    device_id VARCHAR(50) UNIQUE NOT NULL,  -- Es: GPS-001 (assegnato da noi)
    device_internal_id VARCHAR(50),         -- ID: l50e5et0eq (ID interno orologio)
    imei VARCHAR(20) UNIQUE NOT NULL,       -- imei: 863737078055392

    -- Informazioni hardware/firmware
    firmware_version VARCHAR(100),           -- ver: C405_KYS_S5_04R6_V1.3_2025.10.11_11.43.26
    model VARCHAR(50),                       -- Es: C405_KYS_S5
    hardware_version VARCHAR(50),            -- Es: 04R6

    -- Informazioni SIM
    phone_number VARCHAR(20) UNIQUE,         -- Numero SIM installata
    iccid VARCHAR(30),                       -- ICCID della SIM
    apn VARCHAR(100),                        -- apn: internet.wind
    mcc VARCHAR(10),                         -- Mobile Country Code
    mnc VARCHAR(10),                         -- Mobile Network Code

    -- Configurazione Server
    password VARCHAR(20) DEFAULT '123456',   -- Password SMS (default: 123456)
    server_ip VARCHAR(50),                   -- ip_url: 91.99.141.225
    server_port INTEGER,                     -- port: 8001
    profile INTEGER DEFAULT 1,               -- profile: 1
    upload_interval INTEGER DEFAULT 60000,  -- upload: 60000S (ms)

    -- Configurazione Localizzazione
    language_code INTEGER,                   -- language: 12 (Italia)
    timezone DECIMAL(4,2),                   -- zone: 1.00 (UTC+1)
    gps_zone VARCHAR(10),                    -- GPS: ZKW o 12 (zona geografica)

    -- Assegnazione utente
    assigned_user_id INTEGER,                -- ID utente assegnato
    assigned_date TIMESTAMP,                 -- Data assegnazione

    -- Stato dispositivo corrente
    status VARCHAR(20) DEFAULT 'inactive',   -- active, inactive, offline, maintenance
    battery_level INTEGER,                   -- bat level: 63 (%)
    network_status VARCHAR(50),              -- NET: OK(45)
    network_signal INTEGER,                  -- 45 (da NET)
    gps_status VARCHAR(20),                  -- GPS attivo/inattivo

    -- Posizione ultima ricevuta
    last_latitude DECIMAL(10, 7),
    last_longitude DECIMAL(10, 7),
    last_altitude DECIMAL(8, 2),
    last_speed DECIMAL(6, 2),
    last_location_update TIMESTAMP,

    -- Dati sanitari ultimi
    last_heart_rate INTEGER,                -- Frequenza cardiaca
    last_systolic_bp INTEGER,               -- Pressione sistolica
    last_diastolic_bp INTEGER,              -- Pressione diastolica
    last_spo2 INTEGER,                      -- Saturazione ossigeno
    last_temperature DECIMAL(4, 1),         -- Temperatura
    last_steps INTEGER,                     -- Passi pedometro
    last_health_update TIMESTAMP,

    -- Timestamp gestione
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_connection TIMESTAMP,              -- Ultima connessione al server
    last_sms_response TIMESTAMP,            -- Ultimo SMS ricevuto
    last_config_update TIMESTAMP,           -- Ultimo aggiornamento configurazione

    -- Metadata amministratore
    notes TEXT,                             -- Note amministratore
    active BOOLEAN DEFAULT TRUE,            -- Dispositivo attivo nel sistema

    -- Dati grezzi ultimo SMS
    last_sms_raw TEXT,                      -- Risposta SMS completa (per debug)

    -- Foreign Key
    CONSTRAINT fk_assigned_user FOREIGN KEY (assigned_user_id)
        REFERENCES users(id) ON DELETE SET NULL
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_imei ON devices(imei);
CREATE INDEX IF NOT EXISTS idx_devices_phone ON devices(phone_number);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_user ON devices(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_devices_internal_id ON devices(device_internal_id);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_devices_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_devices_timestamp ON devices;
CREATE TRIGGER trigger_update_devices_timestamp
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_devices_timestamp();

-- Constraint check per status
ALTER TABLE devices
    ADD CONSTRAINT check_device_status
    CHECK (status IN ('active', 'inactive', 'offline', 'maintenance'));

-- Commenti sulle colonne
COMMENT ON COLUMN devices.device_internal_id IS 'ID interno orologio ricevuto da SMS ts# (es: l50e5et0eq)';
COMMENT ON COLUMN devices.firmware_version IS 'Versione firmware completa da SMS (es: C405_KYS_S5_04R6_V1.3_2025.10.11_11.43.26)';
COMMENT ON COLUMN devices.language_code IS 'Codice lingua: 12=Italia';
COMMENT ON COLUMN devices.gps_zone IS 'Zona GPS: ZKW (default) o 12 (Italia)';
COMMENT ON COLUMN devices.network_status IS 'Formato: OK(45) dove 45 è la forza segnale';
COMMENT ON COLUMN devices.last_sms_raw IS 'Risposta SMS completa per debug e parsing futuro';

-- Feedback
DO $$
BEGIN
    RAISE NOTICE '✓ Tabella devices creata con successo!';
    RAISE NOTICE '✓ Identificatori: device_id, device_internal_id, imei';
    RAISE NOTICE '✓ Firmware: version, model, hardware';
    RAISE NOTICE '✓ SIM: phone, iccid, apn, mcc, mnc';
    RAISE NOTICE '✓ Server: password, ip, port, profile, upload_interval';
    RAISE NOTICE '✓ Localizzazione: language, timezone, gps_zone';
    RAISE NOTICE '✓ Status: battery, network, GPS, posizione';
    RAISE NOTICE '✓ Salute: heart_rate, bp, spo2, temperatura, steps';
    RAISE NOTICE '✓ Metadata: timestamps, notes, last_sms_raw';
END $$;
