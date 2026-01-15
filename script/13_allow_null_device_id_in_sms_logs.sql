-- Script 13: Permetti device_id NULL nella tabella sms_logs
-- Questo permette di salvare log SMS anche quando il dispositivo non è ancora registrato

-- Rimuovi vincolo NOT NULL da device_id
ALTER TABLE sms_logs
ALTER COLUMN device_id DROP NOT NULL;

-- Commento per documentare
COMMENT ON COLUMN sms_logs.device_id IS 'Device ID (NULL se dispositivo non ancora registrato)';

-- Verifica modifica
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'sms_logs'
AND column_name = 'device_id';
