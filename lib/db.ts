import { Pool } from 'pg'

// Configurazione del pool di connessioni
// In ambiente serverless (Vercel) è importante gestire bene le connessioni
// per evitare di esaurire il limite di Supabase (specialmente in Session Mode porta 5432)

let pool: Pool

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10, // Limite connessioni in produzione
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })
} else {
  // In sviluppo usiamo un global per non ricreare il pool ad ogni hot reload
   if (!(global as any).postgresPool) {
     (global as any).postgresPool = new Pool({
       connectionString: process.env.DATABASE_URL,
       // Rimuoviamo SSL forzato in dev se causa errori "server does not support SSL"
       // ssl: { rejectUnauthorized: false },
       max: 5, // Limite molto basso in dev per non saturare Supabase
       idleTimeoutMillis: 30000,
       connectionTimeoutMillis: 5000,
     })
   }
  pool = (global as any).postgresPool
}

export default pool
