-- 🔧 SCRIPT CORREZIONE ISSUE DATABASE
-- Esegui solo se hai errori nel create_new_tables.sql

-- ---------------------------------------------------
-- 1. Aggiungi colonne mancanti alla tabella devices
-- ---------------------------------------------------
ALTER TABLE devices ADD COLUMN IF NOT EXISTS iccid VARCHAR(30);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS operator VARCHAR(50);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS imei_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_imei_confirmation TIMESTAMP;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS health_functions_enabled TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS health_functions_updated TIMESTAMP;

-- ---------------------------------------------------
-- 2. Rimuovi trigger duplicato (se esiste)
-- ---------------------------------------------------
DROP TRIGGER IF EXISTS "update_devices_updated_at" ON devices;

-- ---------------------------------------------------
-- 3. Ricrea trigger corretto
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------
-- 4. Verifica stato finale
-- ---------------------------------------------------
\d devices
\d device_config
\d device_functions
\d sms_reminder_status
\d unknown_commands

SELECT '✅ Correzioni completate!' as status;
SELECT 'Tabelle create con successo!' as result;