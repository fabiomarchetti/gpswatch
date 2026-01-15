import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

/**
 * GET /api/devices/[id]
 * Recupera un singolo dispositivo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await pool.query(`
      SELECT
        d.*,
        u.nome as assigned_user_name,
        u.cognome as assigned_user_surname
      FROM devices d
      LEFT JOIN users u ON d.assigned_user_id = u.id
      WHERE d.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Dispositivo non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      device: result.rows[0]
    })
  } catch (error: any) {
    console.error('Errore recupero dispositivo:', error)
    return NextResponse.json(
      { error: 'Errore recupero dispositivo', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/devices/[id]
 * Elimina un dispositivo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verifica se il dispositivo esiste
    const existingDevice = await pool.query(
      'SELECT id, device_id FROM devices WHERE id = $1',
      [id]
    )

    if (existingDevice.rows.length === 0) {
      return NextResponse.json(
        { error: 'Dispositivo non trovato' },
        { status: 404 }
      )
    }

    // Elimina prima i dati correlati (locations, health_data, ecc.)
    await pool.query('DELETE FROM locations WHERE imei = (SELECT imei FROM devices WHERE id = $1)', [id])
    await pool.query('DELETE FROM health_data WHERE imei = (SELECT imei FROM devices WHERE id = $1)', [id])

    // Elimina il dispositivo
    await pool.query('DELETE FROM devices WHERE id = $1', [id])

    return NextResponse.json({
      success: true,
      message: 'Dispositivo eliminato con successo'
    })
  } catch (error: any) {
    console.error('Errore eliminazione dispositivo:', error)
    return NextResponse.json(
      { error: 'Errore eliminazione dispositivo', details: error.message },
      { status: 500 }
    )
  }
}
