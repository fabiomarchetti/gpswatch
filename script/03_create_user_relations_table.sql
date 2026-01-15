-- ============================================
-- Script: Creazione tabella USER_RELATIONS
-- Descrizione: Gestione relazioni tra utenti (es: tutore-tutelato per controllo parentale)
-- Data: 2025-12-26
-- Ordine esecuzione: 3
-- ============================================

-- Creazione della tabella user_relations
CREATE TABLE IF NOT EXISTS user_relations (
    id SERIAL PRIMARY KEY,
    tutore_id INTEGER NOT NULL,
    tutelato_id INTEGER NOT NULL,
    tipo_relazione VARCHAR(50) NOT NULL,
    note TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys (verranno aggiunte dopo la migrazione della tabella users)
    -- CONSTRAINT fk_tutore FOREIGN KEY (tutore_id) REFERENCES users(id) ON DELETE CASCADE,
    -- CONSTRAINT fk_tutelato FOREIGN KEY (tutelato_id) REFERENCES users(id) ON DELETE CASCADE,

    -- Constraint: un tutore non può essere tutelato di se stesso
    CONSTRAINT check_no_self_relation CHECK (tutore_id != tutelato_id),

    -- Constraint: evita duplicati
    CONSTRAINT unique_relation UNIQUE (tutore_id, tutelato_id)
);

-- Indici per ottimizzare le query
CREATE INDEX IF NOT EXISTS idx_relations_tutore ON user_relations(tutore_id);
CREATE INDEX IF NOT EXISTS idx_relations_tutelato ON user_relations(tutelato_id);
CREATE INDEX IF NOT EXISTS idx_relations_tipo ON user_relations(tipo_relazione);
CREATE INDEX IF NOT EXISTS idx_relations_active ON user_relations(active);

-- Trigger per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_user_relations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_relations_updated_at
    BEFORE UPDATE ON user_relations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_relations_updated_at();

-- Commenti per documentazione
COMMENT ON TABLE user_relations IS 'Relazioni tra utenti (tutore-tutelato per controllo parentale)';
COMMENT ON COLUMN user_relations.tutore_id IS 'ID utente che monitora (genitore, tutore, ecc.)';
COMMENT ON COLUMN user_relations.tutelato_id IS 'ID utente monitorato';
COMMENT ON COLUMN user_relations.tipo_relazione IS 'Tipo di relazione: genitore, tutore, coniuge, figlio, ecc.';
COMMENT ON COLUMN user_relations.active IS 'Se false, la relazione è disabilitata ma non cancellata';

-- Verifica creazione tabella
SELECT 'Tabella user_relations creata con successo!' AS status;
