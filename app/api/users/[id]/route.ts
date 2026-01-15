import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import bcrypt from 'bcryptjs'

/**
 * GET /api/users/[id]
 * Recupera un singolo utente
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await pool.query(`
      SELECT
        u.id, u.nome, u.cognome, u.username, u.email, u.active,
        u.created_at, u.updated_at,
        r.id as ruolo_id, r.nome_ruolo, r.descrizione as ruolo_descrizione, r.livello_accesso
      FROM users u
      LEFT JOIN ruoli r ON u.ruolo = r.nome_ruolo
      WHERE u.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0]
    })
  } catch (error: any) {
    console.error('Errore recupero utente:', error)
    return NextResponse.json(
      { error: 'Errore recupero utente', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/[id]
 * Aggiorna un utente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nome, cognome, username, email, password, ruolo_id, active } = body

    // Verifica se l'utente esiste
    const existingUser = await pool.query('SELECT id FROM users WHERE id = $1', [id])
    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    // Verifica username unico (escludendo l'utente corrente)
    if (username) {
      const duplicateUser = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, id]
      )
      if (duplicateUser.rows.length > 0) {
        return NextResponse.json(
          { error: 'Username già esistente' },
          { status: 409 }
        )
      }
    }

    // Costruisci query dinamica
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (nome !== undefined) {
      updates.push(`nome = $${paramIndex++}`)
      values.push(nome)
    }
    if (cognome !== undefined) {
      updates.push(`cognome = $${paramIndex++}`)
      values.push(cognome)
    }
    if (username !== undefined) {
      updates.push(`username = $${paramIndex++}`)
      values.push(username)
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`)
      values.push(email)
    }
    if (password !== undefined && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10)
      updates.push(`password = $${paramIndex++}`)
      values.push(hashedPassword)
    }
    if (ruolo_id !== undefined) {
      // Recupera il nome del ruolo dall'ID
      const roleResult = await pool.query(
        'SELECT nome_ruolo FROM ruoli WHERE id = $1',
        [ruolo_id]
      )

      if (roleResult.rows.length > 0) {
        const nome_ruolo = roleResult.rows[0].nome_ruolo
        updates.push(`ruolo = $${paramIndex++}`)
        values.push(nome_ruolo)
      }
    }
    if (active !== undefined) {
      updates.push(`active = $${paramIndex++}`)
      values.push(active)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Nessun campo da aggiornare' },
        { status: 400 }
      )
    }

    values.push(id)
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING id, nome, cognome, username, email, active, updated_at`,
      values
    )

    // Aggiungi ruolo_id e nome_ruolo se aggiornati o fetchali di nuovo se serve
    // Per semplicità, ritorniamo l'utente base aggiornato.
    // Il frontend ricaricherà la lista.

    return NextResponse.json({
      success: true,
      message: 'Utente aggiornato con successo',
      user: result.rows[0]
    })
  } catch (error: any) {
    console.error('Errore aggiornamento utente:', error)
    return NextResponse.json(
      { error: 'Errore aggiornamento utente', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]
 * Elimina un utente
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verifica se l'utente esiste
    const existingUser = await pool.query('SELECT id, username FROM users WHERE id = $1', [id])
    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    // Impedisci eliminazione dell'admin principale
    if (existingUser.rows[0].username === 'admin') {
      return NextResponse.json(
        { error: 'Non puoi eliminare l\'utente admin principale' },
        { status: 403 }
      )
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id])

    return NextResponse.json({
      success: true,
      message: 'Utente eliminato con successo'
    })
  } catch (error: any) {
    console.error('Errore eliminazione utente:', error)
    return NextResponse.json(
      { error: 'Errore eliminazione utente', details: error.message },
      { status: 500 }
    )
  }
}
