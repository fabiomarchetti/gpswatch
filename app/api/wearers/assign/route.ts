import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

/**
 * POST /api/wearers/assign
 * Assegna un dispositivo a un wearer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wearer_id, device_id } = body

    if (!wearer_id) {
      return NextResponse.json(
        { error: 'ID wearer richiesto' },
        { status: 400 }
      )
    }

    // Se device_id è null, rimuovi l'assegnazione
    if (!device_id) {
      await pool.query(
        `UPDATE wearers SET device_id = NULL, device_assigned_date = NULL WHERE id = $1`,
        [wearer_id]
      )

      return NextResponse.json({
        success: true,
        message: 'Assegnazione rimossa'
      })
    }

    // Verifica che il dispositivo esista
    const deviceCheck = await pool.query('SELECT id FROM devices WHERE id = $1', [device_id])
    if (deviceCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Dispositivo non trovato' },
        { status: 404 }
      )
    }

    // Verifica che il wearer esista
    const wearerCheck = await pool.query('SELECT id FROM wearers WHERE id = $1', [wearer_id])
    if (wearerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    // Rimuovi l'assegnazione precedente del dispositivo (se esiste)
    await pool.query(
      `UPDATE wearers SET device_id = NULL, device_assigned_date = NULL WHERE device_id = $1`,
      [device_id]
    )

    // Assegna il dispositivo al wearer
    const result = await pool.query(
      `UPDATE wearers
       SET device_id = $1, device_assigned_date = NOW()
       WHERE id = $2
       RETURNING *`,
      [device_id, wearer_id]
    )

    return NextResponse.json({
      success: true,
      message: 'Dispositivo assegnato con successo',
      wearer: result.rows[0]
    })
  } catch (error: any) {
    console.error('Errore assegnazione dispositivo:', error)
    return NextResponse.json(
      { error: 'Errore assegnazione dispositivo', details: error.message },
      { status: 500 }
    )
  }
}
