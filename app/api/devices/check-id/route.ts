import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// GET - Verifica se un device_id esiste già nel database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('device_id')

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID mancante' },
        { status: 400 }
      )
    }

    const result = await pool.query(
      'SELECT id FROM devices WHERE device_id = $1',
      [deviceId]
    )

    return NextResponse.json(
      { exists: result.rows.length > 0 },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Errore verifica Device ID:', error)
    return NextResponse.json(
      { error: 'Errore del server', exists: false },
      { status: 500 }
    )
  }
}
