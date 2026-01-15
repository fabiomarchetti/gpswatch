/**
 * Database Connection Pool - VPS Remoto
 * Per scrittura su database remoto in parallelo al locale
 */

import { Pool } from 'pg'

// Pool per database VPS remoto
const remotePool = new Pool({
  host: '91.99.141.225',
  database: process.env.DB_NAME || 'gpswatch',
  user: process.env.DB_USER || 'gpsuser',
  password: process.env.DB_PASSWORD || 'GpsWatch2025',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 5, // Meno connessioni per il remoto
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Timeout più lungo per connessione remota
})

// Log connessione
remotePool.on('connect', () => {
  console.log('🌐 Connesso al database VPS remoto')
})

remotePool.on('error', (err) => {
  console.error('❌ Errore database VPS remoto:', err.message)
})

export default remotePool

/**
 * Esegue una query su entrambi i database (locale e remoto)
 * Non blocca se il remoto fallisce
 */
export async function queryBothDatabases(
  localPool: Pool,
  query: string,
  params: any[]
): Promise<{ local: any; remote: any; remoteError?: string }> {
  const results: { local: any; remote: any; remoteError?: string } = {
    local: null,
    remote: null
  }

  // Query locale (principale)
  try {
    results.local = await localPool.query(query, params)
  } catch (error: any) {
    console.error('❌ Errore query database locale:', error.message)
    throw error // Il locale è obbligatorio
  }

  // Query remota (secondaria, non blocca se fallisce)
  try {
    results.remote = await remotePool.query(query, params)
    console.log('✅ Query eseguita su database VPS')
  } catch (error: any) {
    console.warn('⚠️ Query database VPS fallita (non bloccante):', error.message)
    results.remoteError = error.message
  }

  return results
}
