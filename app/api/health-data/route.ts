import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

/**
 * GET /api/health-data
 * Recupera i dati sanitari degli orologi GPS
 *
 * Query params:
 * - imei: filtra per dispositivo
 * - limit: numero massimo di record (default 100)
 * - type: 'all' | 'heart' | 'bp' | 'spo2' | 'temp'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imei = searchParams.get('imei')
    const limit = parseInt(searchParams.get('limit') || '100')
    const type = searchParams.get('type') || 'all'

    // Query base - Convert UTC timestamps to Rome timezone
    let query = `
      SELECT
        h.id,
        h.device_id,
        h.imei,
        h.heart_rate,
        h.systolic_bp,
        h.diastolic_bp,
        h.spo2,
        h.temperature,
        h.temperature_mode,
        (h.recorded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as recorded_at,
        (h.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as created_at,
        d.phone_number,
        d.model
      FROM health_data h
      LEFT JOIN devices d ON h.imei = d.imei
    `

    const conditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Filtro per IMEI
    if (imei) {
      conditions.push(`h.imei = $${paramIndex}`)
      values.push(imei)
      paramIndex++
    }

    // Filtro per tipo
    if (type === 'heart') {
      conditions.push('h.heart_rate IS NOT NULL')
    } else if (type === 'bp') {
      conditions.push('h.systolic_bp IS NOT NULL')
    } else if (type === 'spo2') {
      conditions.push('h.spo2 IS NOT NULL')
    } else if (type === 'temp') {
      conditions.push('h.temperature IS NOT NULL')
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ` ORDER BY h.recorded_at DESC LIMIT $${paramIndex}`
    values.push(limit)

    const result = await pool.query(query, values)

    // Calcola statistiche - Convert timestamps to Rome timezone
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT imei) as devices,
        AVG(heart_rate)::numeric(5,1) as avg_heart_rate,
        AVG(systolic_bp)::numeric(5,1) as avg_systolic,
        AVG(diastolic_bp)::numeric(5,1) as avg_diastolic,
        AVG(spo2)::numeric(5,1) as avg_spo2,
        AVG(temperature)::numeric(4,1) as avg_temperature,
        (MIN(recorded_at) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as first_record,
        (MAX(recorded_at) AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as last_record
      FROM health_data
      ${imei ? 'WHERE imei = $1' : ''}
    `, imei ? [imei] : [])

    // Ultimi valori per ogni tipo di dato - Convert timestamps to Rome timezone
    const latestValues = await pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (imei)
          imei,
          heart_rate,
          systolic_bp,
          diastolic_bp,
          spo2,
          temperature,
          (recorded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as recorded_at
        FROM health_data
        ${imei ? 'WHERE imei = $1' : ''}
        ORDER BY imei, recorded_at DESC
      )
      SELECT * FROM latest
    `, imei ? [imei] : [])

    return NextResponse.json({
      success: true,
      data: result.rows,
      stats: stats.rows[0],
      latest: latestValues.rows,
      filters: { imei, limit, type }
    })
  } catch (error: any) {
    console.error('Errore recupero dati sanitari:', error)
    return NextResponse.json(
      { error: 'Errore recupero dati sanitari', details: error.message },
      { status: 500 }
    )
  }
}
