-- ============================================
-- Script: ALLINEAMENTO SCHEMA SUPABASE
-- Descrizione: Allinea il DB Supabase con la struttura completa della VPS
-- ============================================

-- 1. UTENTI E RUOLI
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    ruolo VARCHAR(50) NOT NULL CHECK (ruolo IN ('admin', 'user', 'viewer')),
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_ruolo ON users(ruolo);

CREATE OR REPLACE FUNCTION update_users_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
CREATE TRIGGER trigger_update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_users_updated_at();

INSERT INTO users (nome, cognome, ruolo, username, password, email)
VALUES ('Admin', 'Sistema', 'admin', 'admin', '$2b$10$E8DQ4tbVbL38GhVDVYE/gexaENo.KJSPDQCoWl3CyYelXAZKQwiH.', 'admin@gpswatch.local')
ON CONFLICT (username) DO NOTHING;

CREATE TABLE IF NOT EXISTS ruoli (
    id SERIAL PRIMARY KEY,
    nome_ruolo VARCHAR(50) NOT NULL UNIQUE,
    descrizione TEXT,
    livello_accesso INTEGER NOT NULL CHECK (livello_accesso >= 1 AND livello_accesso <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ruoli_nome ON ruoli(nome_ruolo);

INSERT INTO ruoli (nome_ruolo, descrizione, livello_accesso) VALUES
    ('sviluppatore', 'Accesso completo al sistema, gestione configurazioni e sviluppo', 5),
    ('animatore_digitale', 'Configurazione orologi, gestione dispositivi e assistenza tecnica', 4),
    ('assistente_control', 'Monitoraggio multi-utente in control room, visualizzazione dashboard generale', 3),
    ('controllo_parentale', 'Monitoraggio di parenti/tutelati specifici, notifiche e alert', 2),
    ('utente_base', 'Visualizzazione solo dei propri dati, funzionalità limitate', 1)
ON CONFLICT (nome_ruolo) DO NOTHING;

-- 2. USER RELATIONS
CREATE TABLE IF NOT EXISTS user_relations (
    id SERIAL PRIMARY KEY,
    tutore_id INTEGER NOT NULL,
    tutelato_id INTEGER NOT NULL,
    tipo_relazione VARCHAR(50) NOT NULL,
    note TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_no_self_relation CHECK (tutore_id != tutelato_id),
    CONSTRAINT unique_relation UNIQUE (tutore_id, tutelato_id)
);

CREATE INDEX IF NOT EXISTS idx_relations_tutore ON user_relations(tutore_id);

-- 3. DEVICES (Ricostruzione completa)
DROP TABLE IF EXISTS devices CASCADE;

CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    device_internal_id VARCHAR(50),
    imei VARCHAR(20) UNIQUE NOT NULL,
    firmware_version VARCHAR(100),
    model VARCHAR(50),
    hardware_version VARCHAR(50),
    phone_number VARCHAR(20) UNIQUE,
    iccid VARCHAR(30),
    apn VARCHAR(100),
    mcc VARCHAR(10),
    mnc VARCHAR(10),
    password VARCHAR(20) DEFAULT '123456',
    server_ip VARCHAR(50),
    server_port INTEGER,
    profile INTEGER DEFAULT 1,
    upload_interval INTEGER DEFAULT 60000,
    language_code INTEGER,
    timezone DECIMAL(4,2),
    gps_zone VARCHAR(10),
    assigned_user_id INTEGER,
    assigned_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'inactive',
    battery_level INTEGER,
    network_status VARCHAR(50),
    network_signal INTEGER,
    gps_status VARCHAR(20),
    last_latitude DECIMAL(10, 7),
    last_longitude DECIMAL(10, 7),
    last_altitude DECIMAL(8, 2),
    last_speed DECIMAL(6, 2),
    last_location_update TIMESTAMP,
    last_heart_rate INTEGER,
    last_systolic_bp INTEGER,
    last_diastolic_bp INTEGER,
    last_spo2 INTEGER,
    last_temperature DECIMAL(4, 1),
    last_steps INTEGER,
    last_health_update TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_connection TIMESTAMP,
    last_sms_response TIMESTAMP,
    last_config_update TIMESTAMP,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    last_sms_raw TEXT,
    CONSTRAINT fk_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT check_device_status CHECK (status IN ('active', 'inactive', 'offline', 'maintenance'))
);

CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_imei ON devices(imei);
CREATE INDEX idx_devices_phone ON devices(phone_number);

CREATE OR REPLACE FUNCTION update_devices_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_devices_timestamp BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_devices_timestamp();

-- 4. RIPRISTINO FOREIGN KEYS (dopo drop cascade)
ALTER TABLE alarms DROP CONSTRAINT IF EXISTS alarms_device_id_fkey;
ALTER TABLE alarms ADD CONSTRAINT alarms_device_id_fkey FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;

ALTER TABLE geofences DROP CONSTRAINT IF EXISTS geofences_device_id_fkey;
ALTER TABLE geofences ADD CONSTRAINT geofences_device_id_fkey FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;

ALTER TABLE health_data DROP CONSTRAINT IF EXISTS health_data_device_id_fkey;
ALTER TABLE health_data ADD CONSTRAINT health_data_device_id_fkey FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;

ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_device_id_fkey;
ALTER TABLE locations ADD CONSTRAINT locations_device_id_fkey FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;

-- 5. SNAPSHOTS
CREATE TABLE IF NOT EXISTS device_snapshots (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL,
    snapshot_type VARCHAR(50) NOT NULL,
    sms_command VARCHAR(100),
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
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    altitude DECIMAL(8, 2),
    speed DECIMAL(6, 2),
    heart_rate INTEGER,
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    spo2 INTEGER,
    temperature DECIMAL(4, 1),
    steps INTEGER,
    raw_sms_response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    CONSTRAINT fk_snapshot_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    CONSTRAINT fk_snapshot_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT check_snapshot_type CHECK (snapshot_type IN ('ts', 'status', 'health', 'battery', 'config', 'manual', 'auto'))
);

-- 6. WEARERS (Pazienti)
CREATE TABLE IF NOT EXISTS wearers (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    data_nascita DATE,
    codice_fiscale VARCHAR(16) UNIQUE,
    sesso VARCHAR(1) CHECK (sesso IN ('M', 'F', 'A')),
    indirizzo VARCHAR(255),
    citta VARCHAR(100),
    provincia VARCHAR(2),
    cap VARCHAR(10),
    telefono VARCHAR(20),
    email VARCHAR(255),
    emergenza_nome VARCHAR(200),
    emergenza_telefono VARCHAR(20),
    emergenza_relazione VARCHAR(100),
    emergenza2_nome VARCHAR(200),
    emergenza2_telefono VARCHAR(20),
    emergenza2_relazione VARCHAR(100),
    gruppo_sanguigno VARCHAR(5),
    allergie TEXT,
    patologie TEXT,
    farmaci TEXT,
    note_mediche TEXT,
    device_id INTEGER UNIQUE,
    device_assigned_date TIMESTAMP,
    foto_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    CONSTRAINT fk_wearer_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL,
    CONSTRAINT fk_wearer_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wearers_cognome ON wearers(cognome);

-- 7. UPDATE DEVICES & WEARERS
ALTER TABLE devices ADD COLUMN IF NOT EXISTS sim_pin VARCHAR(8);
ALTER TABLE wearers ADD COLUMN IF NOT EXISTS luogo_nascita VARCHAR(100);

-- 8. SMS LOGS
DO $$ BEGIN
    CREATE TYPE sms_direction AS ENUM ('sent', 'received');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sms_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'received');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS sms_logs (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    direction sms_direction NOT NULL,
    message TEXT NOT NULL,
    command_type VARCHAR(50),
    parsed_data JSONB,
    status sms_status DEFAULT 'pending',
    gateway_message_id VARCHAR(100),
    error_message TEXT,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    received_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    CONSTRAINT fk_sms_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    CONSTRAINT fk_sms_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sms_created ON sms_logs(created_at DESC);
