-- ============================================
-- Script: Creazione tabella USERS
-- Descrizione: Tabella per gestire gli utenti del sistema GPS Watch
-- Data: 2025-12-26
-- ============================================

-- Creazione della tabella users
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

-- Indice per username (per velocizzare le query di login)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Indice per ruolo (per filtrare utenti per ruolo)
CREATE INDEX IF NOT EXISTS idx_users_ruolo ON users(ruolo);

-- Trigger per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- Commenti per documentazione
COMMENT ON TABLE users IS 'Tabella utenti del sistema GPS Watch';
COMMENT ON COLUMN users.ruolo IS 'Ruoli disponibili: admin (amministratore), user (utente standard), viewer (solo visualizzazione)';
COMMENT ON COLUMN users.password IS 'Password hashata con bcrypt';

-- Inserimento utente admin di default (password: Admin2025!)
-- NOTA: Questa password è TEMPORANEA e deve essere cambiata al primo accesso!
INSERT INTO users (nome, cognome, ruolo, username, password, email)
VALUES (
    'Admin',
    'Sistema',
    'admin',
    'admin',
    '$2b$10$E8DQ4tbVbL38GhVDVYE/gexaENo.KJSPDQCoWl3CyYelXAZKQwiH.', -- Password temporanea: Admin2025!
    'admin@gpswatch.local'
)
ON CONFLICT (username) DO NOTHING;

-- Verifica creazione tabella
SELECT 'Tabella users creata con successo!' AS status;
SELECT * FROM users;
