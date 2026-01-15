import { Pool } from 'pg'

// Porta di default: 5432 per produzione (VPS), 5433 per sviluppo locale (SSH tunnel)
const defaultPort = process.env.NODE_ENV === 'production' ? '5432' : '5433'

// Configurazione del pool di connessioni PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || defaultPort),
  database: process.env.DB_NAME || 'gpswatch',
  user: process.env.DB_USER || 'gpsuser',
  password: process.env.DB_PASSWORD || 'GpsWatch2025',
  max: 20, // Numero massimo di client nel pool
  idleTimeoutMillis: 30000, // Chiudi client inattivi dopo 30 secondi
  connectionTimeoutMillis: 5000, // Timeout connessione
})

// Gestione errori del pool
pool.on('error', (err) => {
  console.error('❌ Errore pool PostgreSQL (VPS):', err)
})

// Log connessione
pool.on('connect', () => {
  console.log('🌐 Connesso al database VPS (91.99.141.225)')
})

export default pool
