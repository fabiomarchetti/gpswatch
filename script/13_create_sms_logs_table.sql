-- =====================================================
-- Script 13: Tabella Log SMS
-- =====================================================
-- Descrizione: Crea la tabella per tracciare tutti gli SMS
--              inviati e ricevuti dagli orologi GPS
--
-- Quando eseguire: Dopo 12_add_luogo_nascita_to_wearers.sql
-- =====================================================

-- Crea ENUM per direzione SMS
CREATE TYPE sms_direction AS ENUM ('sent', 'received');

-- Crea ENUM per stato SMS
CREATE TYPE sms_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'received');

-- Crea tabella sms_logs
CREATE TABLE IF NOT EXISTS sms_logs (
    id SERIAL PRIMARY KEY,

    -- Riferimento dispositivo
    device_id INTEGER NOT NULL,

    -- Dati SMS
    phone_number VARCHAR(20) NOT NULL,
    direction sms_direction NOT NULL,
    message TEXT NOT NULL,

    -- Comando/Risposta
    command_type VARCHAR(50),         -- 'TS', 'RESET', 'REBOOT', 'GPS', 'URL', etc.
    parsed_data JSONB,                -- Dati parsati dalla risposta

    -- Status tracking
    status sms_status DEFAULT 'pending',
    gateway_message_id VARCHAR(100),  -- ID dal gateway SMS
    error_message TEXT,

    -- Timestamp
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    received_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Metadata
    user_id INTEGER,                  -- Chi ha inviato il comando

    -- Foreign Keys
    CONSTRAINT fk_sms_device FOREIGN KEY (device_id)
        REFERENCES devices(id) ON DELETE CASCADE,
    CONSTRAINT fk_sms_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_sms_device ON sms_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_direction ON sms_logs(direction);
CREATE INDEX IF NOT EXISTS idx_sms_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_created ON sms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_command_type ON sms_logs(command_type);

-- Indice per ricerca full-text su messaggi
CREATE INDEX IF NOT EXISTS idx_sms_message_search ON sms_logs USING gin(to_tsvector('italian', message));

-- View per SMS recenti con device info
CREATE OR REPLACE VIEW v_sms_logs_recent AS
SELECT
    sl.id,
    sl.device_id,
    d.device_id as device_code,
    d.imei,
    d.phone_number as device_phone,
    sl.direction,
    sl.message,
    sl.command_type,
    sl.status,
    sl.created_at,
    sl.sent_at,
    sl.received_at,
    u.nome as sent_by_name,
    u.cognome as sent_by_surname
FROM sms_logs sl
LEFT JOIN devices d ON sl.device_id = d.id
LEFT JOIN users u ON sl.user_id = u.id
ORDER BY sl.created_at DESC
LIMIT 100;

-- Function per auto-update status
CREATE OR REPLACE FUNCTION update_sms_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Se SMS ricevuto, imposta received_at
    IF NEW.direction = 'received' AND NEW.received_at IS NULL THEN
        NEW.received_at = CURRENT_TIMESTAMP;
        NEW.status = 'received';
    END IF;

    -- Se SMS inviato e status cambia a 'sent', imposta sent_at
    IF NEW.direction = 'sent' AND NEW.status = 'sent' AND OLD.status = 'pending' THEN
        NEW.sent_at = CURRENT_TIMESTAMP;
    END IF;

    -- Se SMS delivery confermato, imposta delivered_at
    IF NEW.status = 'delivered' AND NEW.delivered_at IS NULL THEN
        NEW.delivered_at = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sms_status ON sms_logs;
CREATE TRIGGER trigger_update_sms_status
    BEFORE INSERT OR UPDATE ON sms_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_sms_status();

-- Commenti
COMMENT ON TABLE sms_logs IS 'Log completo di tutti gli SMS inviati/ricevuti dagli orologi GPS';
COMMENT ON COLUMN sms_logs.direction IS 'Direzione: sent (inviato al device), received (ricevuto dal device)';
COMMENT ON COLUMN sms_logs.command_type IS 'Tipo comando: TS, RESET, REBOOT, GPS, URL, BAT, etc.';
COMMENT ON COLUMN sms_logs.parsed_data IS 'Dati strutturati parsati dalla risposta SMS (formato JSON)';
COMMENT ON COLUMN sms_logs.status IS 'Stato: pending, sent, delivered, failed, received';

-- Feedback
DO $$
BEGIN
    RAISE NOTICE '✓ Tabella sms_logs creata con successo!';
    RAISE NOTICE '✓ ENUM: sms_direction (sent, received)';
    RAISE NOTICE '✓ ENUM: sms_status (pending, sent, delivered, failed, received)';
    RAISE NOTICE '✓ Campi: device_id, phone_number, direction, message, command_type';
    RAISE NOTICE '✓ Tracking: status, sent_at, delivered_at, received_at';
    RAISE NOTICE '✓ Parsed data: JSONB per dati strutturati';
    RAISE NOTICE '✓ View: v_sms_logs_recent per ultimi 100 SMS';
    RAISE NOTICE '✓ Trigger: auto-update timestamp per status changes';
    RAISE NOTICE '✓ Indici: performance su device, phone, direction, status, date';
END $$;
