import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, cognome, ruolo_nome, username, password, email } = body

    // Validazione input
    if (!nome || !cognome || !ruolo_nome || !username || !password) {
      return NextResponse.json(
        { error: 'Tutti i campi obbligatori devono essere compilati' },
        { status: 400 }
      )
    }

    // Validazione ruolo - verifica che esista
    const checkRuolo = await pool.query(
      'SELECT id, nome_ruolo, livello_accesso FROM ruoli WHERE nome_ruolo = $1',
      [ruolo_nome]
    )

    if (checkRuolo.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ruolo non valido' },
        { status: 400 }
      )
    }

    const ruolo = checkRuolo.rows[0]

    // Validazione password
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 8 caratteri' },
        { status: 400 }
      )
    }

    // Verifica se username esiste già
    const checkUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )

    if (checkUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Username già esistente' },
        { status: 409 }
      )
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Inserimento utente con ruolo_id
    const result = await pool.query(
      `INSERT INTO users (nome, cognome, ruolo_id, username, password, email)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, cognome, ruolo_id, username, email, created_at`,
      [nome, cognome, ruolo.id, username, hashedPassword, email || null]
    )

    const user = result.rows[0]

    return NextResponse.json(
      {
        message: 'Utente registrato con successo',
        user: {
          id: user.id,
          nome: user.nome,
          cognome: user.cognome,
          username: user.username,
          email: user.email,
          ruolo: {
            id: ruolo.id,
            nome: ruolo.nome_ruolo,
            livello: ruolo.livello_accesso,
          },
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Errore durante la registrazione:', error)
    return NextResponse.json(
      { error: 'Errore del server durante la registrazione' },
      { status: 500 }
    )
  }
}
