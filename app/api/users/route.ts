import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

/**
 * GET /api/users
 * Recupera tutti gli utenti
 */
export async function GET(request: NextRequest) {
  try {
    // Join su nome_ruolo perchè users.ruolo è una stringa
    const result = await pool.query(`
      SELECT
        u.id, u.nome, u.cognome, u.username, u.email, u.active,
        u.valid_from, u.valid_until,
        u.created_at, u.updated_at,
        r.id as ruolo_id, r.nome_ruolo, r.descrizione as ruolo_descrizione, r.livello_accesso
      FROM users u
      LEFT JOIN ruoli r ON u.ruolo = r.nome_ruolo
      ORDER BY u.created_at DESC
    `)

    return NextResponse.json({
      success: true,
      users: result.rows
    })
  } catch (error: any) {
    console.error('Error fetching users:', error) // Aggiunto log errore
    return NextResponse.json(
      { error: 'Errore nel recupero degli utenti: ' + error.message }, // Ritorna messaggio errore
      { status: 500 }
    )
  }
}

/**
 * POST /api/users
 * Crea un nuovo utente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, cognome, username, email, password, ruolo_id } = body

    if (!nome || !cognome || !username || !password || !ruolo_id) {
      return NextResponse.json(
        { error: 'Tutti i campi obbligatori devono essere compilati' },
        { status: 400 }
      )
    }

    // Verifica username unico
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Username già esistente' },
        { status: 409 }
      )
    }

    // Recupera il nome del ruolo dall'ID
    const roleResult = await pool.query(
      'SELECT nome_ruolo FROM ruoli WHERE id = $1',
      [ruolo_id]
    )

    if (roleResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Ruolo non valido' },
        { status: 400 }
      )
    }

    const nome_ruolo = roleResult.rows[0].nome_ruolo

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (nome, cognome, username, email, password, ruolo, active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, nome, cognome, username, email, active, created_at`,
      [nome, cognome, username, email, hashedPassword, nome_ruolo]
    )

    // Aggiungiamo ruolo_id alla risposta per coerenza col frontend
    const newUser = {
      ...result.rows[0],
      ruolo_id: ruolo_id,
      nome_ruolo: nome_ruolo
    }

    return NextResponse.json({
      success: true,
      message: 'Utente creato con successo',
      user: newUser
    }, { status: 201 })
  } catch (error: any) {
    console.error('Errore creazione utente:', error)
    return NextResponse.json(
      { error: 'Errore creazione utente', details: error.message },
      { status: 500 }
    )
  }
}
