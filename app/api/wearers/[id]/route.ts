import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

/**
 * GET /api/wearers/[id]
 * Recupera un singolo paziente
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await pool.query(`
      SELECT
        w.*,
        d.device_id as device_name,
        d.phone_number as device_phone
      FROM wearers w
      LEFT JOIN devices d ON w.device_id = d.id
      WHERE w.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Paziente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      wearer: result.rows[0]
    })
  } catch (error: any) {
    console.error('Errore recupero paziente:', error)
    return NextResponse.json(
      { error: 'Errore recupero paziente', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/wearers/[id]
 * Aggiorna un paziente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      nome,
      cognome,
      data_nascita,
      luogo_nascita,
      codice_fiscale,
      sesso,
      telefono,
      email,
      indirizzo,
      citta,
      emergenza_nome,
      emergenza_telefono,
      emergenza_relazione,
      gruppo_sanguigno,
      allergie,
      patologie,
      farmaci,
      note_mediche,
      device_id,
      active
    } = body

    if (!nome || !cognome) {
      return NextResponse.json(
        { error: 'Nome e cognome sono obbligatori' },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `UPDATE wearers SET
        nome = $1,
        cognome = $2,
        data_nascita = $3,
        luogo_nascita = $4,
        codice_fiscale = $5,
        sesso = $6,
        telefono = $7,
        email = $8,
        indirizzo = $9,
        citta = $10,
        emergenza_nome = $11,
        emergenza_telefono = $12,
        emergenza_relazione = $13,
        gruppo_sanguigno = $14,
        allergie = $15,
        patologie = $16,
        farmaci = $17,
        note_mediche = $18,
        device_id = $19,
        active = COALESCE($20, active),
        updated_at = NOW()
      WHERE id = $21
      RETURNING *`,
      [
        nome,
        cognome,
        data_nascita || null,
        luogo_nascita || null,
        codice_fiscale || null,
        sesso || null,
        telefono || null,
        email || null,
        indirizzo || null,
        citta || null,
        emergenza_nome || null,
        emergenza_telefono || null,
        emergenza_relazione || null,
        gruppo_sanguigno || null,
        allergie || null,
        patologie || null,
        farmaci || null,
        note_mediche || null,
        device_id || null,
        active,
        id
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Paziente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Paziente aggiornato con successo',
      wearer: result.rows[0]
    })
  } catch (error: any) {
    console.error('Errore aggiornamento paziente:', error)
    return NextResponse.json(
      { error: 'Errore aggiornamento paziente', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/wearers/[id]
 * Aggiorna parzialmente un paziente (es. solo la foto)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { foto_url } = body

    if (foto_url !== undefined) {
      const result = await pool.query(
        `UPDATE wearers SET foto_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [foto_url, id]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Paziente non trovato' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Foto aggiornata con successo',
        wearer: result.rows[0]
      })
    }

    return NextResponse.json(
      { error: 'Nessun campo da aggiornare' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Errore aggiornamento parziale:', error)
    return NextResponse.json(
      { error: 'Errore aggiornamento', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/wearers/[id]
 * Elimina un paziente (soft delete - imposta active = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Soft delete - imposta active = false
    const result = await pool.query(
      `UPDATE wearers SET active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Paziente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Paziente eliminato con successo'
    })
  } catch (error: any) {
    console.error('Errore eliminazione paziente:', error)
    return NextResponse.json(
      { error: 'Errore eliminazione paziente', details: error.message },
      { status: 500 }
    )
  }
}
