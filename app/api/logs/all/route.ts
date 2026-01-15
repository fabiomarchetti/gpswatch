import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

/**
 * GET /api/logs/all
 * Recupera TUTTI i log: SMS, Health Data, Locations, Unknown Commands
 */
export async function GET(request: NextRequest) {
  try {
    // Esegui tutte le query in parallelo
    const [smsLogs, healthData, locations, unknownCommands, deviceStatus] = await Promise.all([
      // SMS Logs - Convert UTC timestamps to Rome timezone
      pool.query(`
        SELECT
          id, device_id, phone_number, direction, message,
          command_type, parsed_data, status, error_message,
          (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as created_at,
          (sent_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as sent_at,
          (received_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as received_at,
          'sms' as log_type
        FROM sms_logs
        ORDER BY created_at DESC
        LIMIT 50
      `),

      // Health Data (TCP) - Convert UTC timestamps to Rome timezone
      pool.query(`
        SELECT
          id, device_id, imei, heart_rate, systolic_bp, diastolic_bp,
          spo2, temperature, temperature_mode, raw_data,
          (recorded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as recorded_at,
          (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as created_at,
          'health' as log_type
        FROM health_data
        ORDER BY created_at DESC
        LIMIT 50
      `),

      // Locations (TCP GPS) - Convert UTC timestamps to Rome timezone
      pool.query(`
        SELECT
          id, imei, latitude, longitude, altitude, speed,
          battery, satellites, gsm_signal, gps_valid,
          (recorded_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as recorded_at,
          (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as created_at,
          'location' as log_type
        FROM locations
        ORDER BY created_at DESC
        LIMIT 50
      `),

      // Unknown Commands (TCP) - Convert UTC timestamps to Rome timezone
      pool.query(`
        SELECT
          id, imei, command, data,
          (timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as timestamp,
          (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as created_at,
          'tcp_command' as log_type
        FROM unknown_commands
        ORDER BY created_at DESC
        LIMIT 50
      `),

      // Device Status
      pool.query(`
        SELECT
          id, device_id, imei, phone_number, model,
          updated_at, created_at
        FROM devices
        ORDER BY updated_at DESC
      `)
    ])

    // Combina tutti i log in ordine cronologico
    const allLogs = [
      ...smsLogs.rows.map(r => ({ ...r, log_type: 'sms' })),
      ...healthData.rows.map(r => ({ ...r, log_type: 'health' })),
      ...locations.rows.map(r => ({ ...r, log_type: 'location' })),
      ...unknownCommands.rows.map(r => ({ ...r, log_type: 'tcp_command' }))
    ].sort((a, b) => {
      const dateA = new Date(a.created_at || a.recorded_at || a.timestamp)
      const dateB = new Date(b.created_at || b.recorded_at || b.timestamp)
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json({
      success: true,
      stats: {
        sms: smsLogs.rows.length,
        health: healthData.rows.length,
        locations: locations.rows.length,
        tcp_commands: unknownCommands.rows.length,
        total: allLogs.length
      },
      devices: deviceStatus.rows,
      logs: allLogs.slice(0, 100) // Limita a 100 log totali
    })
  } catch (error: any) {
    console.error('Errore recupero log:', error)
    return NextResponse.json(
      { error: 'Errore recupero log', details: error.message },
      { status: 500 }
    )
  }
}
