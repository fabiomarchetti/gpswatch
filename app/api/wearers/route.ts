import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

/**
 * GET /api/wearers
 * Recupera tutti gli utenti che indossano gli orologi
 */
export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`
      SELECT
        w.id,
        w.nome,
        w.cognome,
        w.data_nascita,
        w.luogo_nascita,
        w.codice_fiscale,
        w.sesso,
        w.telefono,
        w.email,
        w.indirizzo,
        w.citta,
        w.emergenza_nome,
        w.emergenza_telefono,
        w.emergenza_relazione,
        w.gruppo_sanguigno,
        w.allergie,
        w.patologie,
        w.farmaci,
        w.note_mediche,
        w.device_id,
        w.foto_url,
        w.active,
        w.created_at,
        d.device_id as device_name,
        d.phone_number as device_phone,
        d.imei as device_imei
      FROM wearers w
      LEFT JOIN devices d ON w.device_id = d.id
      WHERE w.active = true
      ORDER BY w.cognome, w.nome
    `)

    return NextResponse.json({
      success: true,
      wearers: result.rows,
      total: result.rows.length
    })
  } catch (error: any) {
    console.error('Errore recupero wearers:', error)
    return NextResponse.json(
      { error: 'Errore recupero wearers', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/wearers
 * Crea un nuovo wearer
 */
export async function POST(request: NextRequest) {
  try {
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
      device_id
    } = body

    if (!nome || !cognome) {
      return NextResponse.json(
        { error: 'Nome e cognome sono obbligatori' },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `INSERT INTO wearers (
        nome, cognome, data_nascita, luogo_nascita, codice_fiscale, sesso, telefono, email,
        indirizzo, citta, emergenza_nome, emergenza_telefono, emergenza_relazione,
        gruppo_sanguigno, allergie, patologie, farmaci, note_mediche, device_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        nome, cognome, data_nascita || null, luogo_nascita || null, codice_fiscale || null, sesso || null,
        telefono || null, email || null, indirizzo || null, citta || null,
        emergenza_nome || null, emergenza_telefono || null, emergenza_relazione || null,
        gruppo_sanguigno || null, allergie || null, patologie || null,
        farmaci || null, note_mediche || null, device_id || null
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Utente creato con successo',
      wearer: result.rows[0]
    }, { status: 201 })
  } catch (error: any) {
    console.error('Errore creazione wearer:', error)
    return NextResponse.json(
      { error: 'Errore creazione wearer', details: error.message },
      { status: 500 }
    )
  }
}
