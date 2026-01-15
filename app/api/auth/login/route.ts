import { NextRequest, NextResponse } from 'next/server'
// import bcrypt from 'bcryptjs' // TEMPORANEO: disabilitato per password in chiaro
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validazione input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username e password sono obbligatori' },
        { status: 400 }
      )
    }

    // Cerca utente nel database con JOIN per ottenere info ruolo
    const result = await pool.query(
      `SELECT
        u.id, u.nome, u.cognome, u.username, u.password, u.email, u.active, u.ruolo_id,
        r.nome_ruolo, r.descrizione as ruolo_descrizione, r.livello_accesso
       FROM users u
       JOIN ruoli r ON u.ruolo_id = r.id
       WHERE u.username = $1`,
      [username]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Username o password non validi' },
        { status: 401 }
      )
    }

    const user = result.rows[0]

    // Verifica se l'utente è attivo
    if (!user.active) {
      return NextResponse.json(
        { error: 'Account disattivato. Contatta l\'amministratore' },
        { status: 403 }
      )
    }

    // Verifica password - TEMPORANEO: confronto diretto (password in chiaro)
    const passwordMatch = password === user.password

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Username o password non validi' },
        { status: 401 }
      )
    }

    // Login successful - ritorna dati utente (senza password)
    return NextResponse.json(
      {
        message: 'Login effettuato con successo',
        user: {
          id: user.id,
          nome: user.nome,
          cognome: user.cognome,
          username: user.username,
          email: user.email,
          ruolo: {
            id: user.ruolo_id,
            nome: user.nome_ruolo,
            descrizione: user.ruolo_descrizione,
            livello: user.livello_accesso,
          },
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Errore durante il login:', error)
    return NextResponse.json(
      { error: 'Errore del server durante il login' },
      { status: 500 }
    )
  }
}
