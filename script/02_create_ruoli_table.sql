-- ============================================
-- Script: Creazione tabella RUOLI
-- Descrizione: Tabella per gestire i ruoli del sistema GPS Watch
-- Data: 2025-12-26
-- Ordine esecuzione: 2
-- ============================================

-- Creazione della tabella ruoli
CREATE TABLE IF NOT EXISTS ruoli (
    id SERIAL PRIMARY KEY,
    nome_ruolo VARCHAR(50) NOT NULL UNIQUE,
    descrizione TEXT,
    livello_accesso INTEGER NOT NULL CHECK (livello_accesso >= 1 AND livello_accesso <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indice per nome_ruolo
CREATE INDEX IF NOT EXISTS idx_ruoli_nome ON ruoli(nome_ruolo);

-- Indice per livello_accesso
CREATE INDEX IF NOT EXISTS idx_ruoli_livello ON ruoli(livello_accesso);

-- Commenti per documentazione
COMMENT ON TABLE ruoli IS 'Tabella dei ruoli del sistema GPS Watch';
COMMENT ON COLUMN ruoli.livello_accesso IS 'Livello di accesso: 1=base, 5=completo';
COMMENT ON COLUMN ruoli.nome_ruolo IS 'Nome univoco del ruolo (usare snake_case)';

-- Inserimento ruoli predefiniti
INSERT INTO ruoli (nome_ruolo, descrizione, livello_accesso) VALUES
    ('sviluppatore', 'Accesso completo al sistema, gestione configurazioni e sviluppo', 5),
    ('animatore_digitale', 'Configurazione orologi, gestione dispositivi e assistenza tecnica', 4),
    ('assistente_control', 'Monitoraggio multi-utente in control room, visualizzazione dashboard generale', 3),
    ('controllo_parentale', 'Monitoraggio di parenti/tutelati specifici, notifiche e alert', 2),
    ('utente_base', 'Visualizzazione solo dei propri dati, funzionalità limitate', 1)
ON CONFLICT (nome_ruolo) DO NOTHING;

-- Verifica creazione tabella
SELECT 'Tabella ruoli creata con successo!' AS status;
SELECT * FROM ruoli ORDER BY livello_accesso DESC;
