import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

/**
 * GET /api/sms/logs
 * Recupera tutti i log SMS (inviati e ricevuti)
 */
export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT
        sl.id,
        sl.device_id,
        d.device_id as device_name,
        sl.phone_number,
        sl.direction,
        sl.message,
        sl.command_type,
        sl.parsed_data,
        sl.status,
        sl.error_message,
        (sl.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as created_at,
        (sl.sent_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as sent_at,
        (sl.received_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as received_at
      FROM sms_logs sl
      LEFT JOIN devices d ON sl.device_id = d.id
      ORDER BY sl.created_at DESC
      LIMIT 100`,
      []
    )

    return NextResponse.json({
      success: true,
      logs: result.rows,
      total: result.rows.length
    })
  } catch (error: any) {
    console.error('Errore recupero log SMS:', error)
    return NextResponse.json(
      { error: 'Errore recupero log', details: error.message },
      { status: 500 }
    )
  }
}
