-- 🗄️ TABELLE AGGIUNTIVE PER DATI CHIARI GPS WATCH
-- Esegui questo script su PostgreSQL per aggiungere le nuove tabelle

-- ---------------------------------------------------
-- 1. Tabella configurazione dispositivo
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS device_config (
    id SERIAL PRIMARY KEY,
    imei VARCHAR(20) NOT NULL,
    config_data JSONB,
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index per ricerca rapida
CREATE INDEX IF NOT EXISTS idx_device_config_imei ON device_config(imei);
CREATE INDEX IF NOT EXISTS idx_device_config_timestamp ON device_config(timestamp);

-- ---------------------------------------------------
-- 2. Tabella funzioni app abilitate
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS device_functions (
    id SERIAL PRIMARY KEY,
    imei VARCHAR(20) NOT NULL,
    functions_data JSONB,
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index per ricerca rapida
CREATE INDEX IF NOT EXISTS idx_device_functions_imei ON device_functions(imei);
CREATE INDEX IF NOT EXISTS idx_device_functions_timestamp ON device_functions(timestamp);

-- ---------------------------------------------------
-- 3. Tabella status reminder SMS
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS sms_reminder_status (
    id SERIAL PRIMARY KEY,
    imei VARCHAR(20) NOT NULL,
    status_data TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index per ricerca rapida
CREATE INDEX IF NOT EXISTS idx_sms_reminder_imei ON sms_reminder_status(imei);
CREATE INDEX IF NOT EXISTS idx_sms_reminder_timestamp ON sms_reminder_status(timestamp);

-- ---------------------------------------------------
-- 4. Tabella comandi non gestiti (per debug)
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS unknown_commands (
    id SERIAL PRIMARY KEY,
    imei VARCHAR(20) NOT NULL,
    command VARCHAR(50),
    data TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index per ricerca rapida
CREATE INDEX IF NOT EXISTS idx_unknown_commands_imei ON unknown_commands(imei);
CREATE INDEX IF NOT EXISTS idx_unknown_commands_command ON unknown_commands(command);
CREATE INDEX IF NOT EXISTS idx_unknown_commands_timestamp ON unknown_commands(timestamp);

-- ---------------------------------------------------
-- 5. Aggiorna tabella devices con nuovi campi
-- ---------------------------------------------------
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS iccid VARCHAR(30),
ADD COLUMN IF NOT EXISTS operator VARCHAR(50),
ADD COLUMN IF NOT EXISTS imei_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_imei_confirmation TIMESTAMP,
ADD COLUMN IF NOT EXISTS health_functions_enabled TEXT,
ADD COLUMN IF NOT EXISTS health_functions_updated TIMESTAMP;

-- Index per nuovi campi
CREATE INDEX IF NOT EXISTS idx_devices_imei_confirmed ON devices(imei_confirmed);
CREATE INDEX IF NOT EXISTS idx_devices_health_functions ON devices(health_functions_enabled);

-- ---------------------------------------------------
-- 6. Vista per riepilogo dispositivi
-- ---------------------------------------------------
CREATE OR REPLACE VIEW device_summary AS
SELECT 
    d.imei,
    d.name,
    d.iccid,
    d.operator,
    d.imei_confirmed,
    d.last_imei_confirmation,
    d.health_functions_enabled,
    d.health_functions_updated,
    d.created_at,
    d.updated_at,
    -- Ultima configurazione
    (SELECT jsonb_build_object(
        'timestamp', dc.timestamp,
        'config', dc.config_data
    ) FROM device_config dc 
     WHERE dc.imei = d.imei 
     ORDER BY dc.timestamp DESC 
     LIMIT 1) as latest_config,
    -- Ultimo heartbeat
    (SELECT timestamp FROM locations l 
     WHERE l.imei = d.imei 
     ORDER BY l.recorded_at DESC 
     LIMIT 1) as last_location,
    -- Ultimo dato salute
    (SELECT timestamp FROM health_data h 
     WHERE h.imei = d.imei 
     ORDER BY h.recorded_at DESC 
     LIMIT 1) as last_health_data
FROM devices d;

-- ---------------------------------------------------
-- 7. Funzione per pulizia vecchi dati
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Mantiene solo ultimi 30 giorni di logs
    DELETE FROM device_config WHERE timestamp < NOW() - INTERVAL '30 days';
    DELETE FROM device_functions WHERE timestamp < NOW() - INTERVAL '30 days';
    DELETE FROM sms_reminder_status WHERE timestamp < NOW() - INTERVAL '30 days';
    DELETE FROM unknown_commands WHERE timestamp < NOW() - INTERVAL '7 days';
    
    RAISE NOTICE 'Pulizia vecchi dati completata';
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------
-- 8. Trigger per aggiornare timestamp
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applica trigger alla tabella devices
DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------
-- 9. Dati di esempio (opzionale)
-- ---------------------------------------------------
-- Inserisci dispositivo di esempio se non esiste
INSERT INTO devices (imei, name, iccid, operator, imei_confirmed, health_functions_enabled)
VALUES (
    '863737078055392', 
    'Orologio GPS C405',
    '8939880841110848432F',
    'Unknown',
    TRUE,
    'hb15,te16,ox35,sp14'
) ON CONFLICT (imei) DO NOTHING;

-- ---------------------------------------------------
-- 10. Query utili per monitoraggio
-- ---------------------------------------------------

-- Dispositivi con funzioni sanitarie abilitate
/*
SELECT imei, name, health_functions_enabled, health_functions_updated
FROM devices 
WHERE health_functions_enabled IS NOT NULL 
ORDER BY health_functions_updated DESC;
*/

-- Ultimi comandi non gestiti
/*
SELECT imei, command, data, timestamp
FROM unknown_commands 
ORDER BY timestamp DESC 
LIMIT 10;
*/

-- Riepilogo configurazioni recenti
/*
SELECT d.imei, d.name, dc.config_data, dc.timestamp
FROM devices d
JOIN device_config dc ON d.imei = dc.imei
ORDER BY dc.timestamp DESC
LIMIT 5;
*/

-- Funzioni abilitate per dispositivo
/*
SELECT imei, functions_data, timestamp
FROM device_functions 
ORDER BY timestamp DESC
LIMIT 5;
*/

COMMIT;

-- ---------------------------------------------------
-- 11. Verifica creazione tabelle
-- ---------------------------------------------------
\d device_config
\d device_functions  
\d sms_reminder_status
\d unknown_commands
\d devices

SELECT 'Tabelle create con successo!' as status;