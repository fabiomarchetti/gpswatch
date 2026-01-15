import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

/**
 * GET /api/stats
 * Recupera statistiche per la dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Esegui tutte le query in parallelo
    const [usersCount, patientsCount, devicesCount, activeDevices, healthCount, healthTotalCount, smsCount, tcpStatus] = await Promise.all([
      // Conteggio utenti staff
      pool.query('SELECT COUNT(*) as count FROM users WHERE active = true'),

      // Conteggio pazienti (chi indossa l'orologio)
      pool.query('SELECT COUNT(*) as count FROM wearers WHERE active = true'),

      // Conteggio dispositivi totali
      pool.query('SELECT COUNT(*) as count FROM devices'),

      // Dispositivi attivi (con connessione recente)
      pool.query(`
        SELECT COUNT(*) as count FROM devices
        WHERE updated_at > NOW() - INTERVAL '1 hour'
      `),

      // Misurazioni salute oggi (con timezone corretta)
      pool.query(`
        SELECT COUNT(*) as count FROM health_data
        WHERE created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome' > CURRENT_DATE
      `),

      // Misurazioni salute totali
      pool.query('SELECT COUNT(*) as count FROM health_data'),

      // SMS inviati oggi
      pool.query(`
        SELECT COUNT(*) as count FROM sms_logs
        WHERE created_at > CURRENT_DATE
      `),

      // Stato TCP (prova a connettersi al server)
      fetch('http://91.99.141.225:3000/api/tcp/status', {
        signal: AbortSignal.timeout(3000)
      }).then(r => r.json()).catch(() => ({ totalConnections: 0, connectedDevices: [] }))
    ])

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: parseInt(usersCount.rows[0].count),
        totalPatients: parseInt(patientsCount.rows[0].count),
        totalDevices: parseInt(devicesCount.rows[0].count),
        activeDevices: parseInt(activeDevices.rows[0].count),
        connectedDevices: tcpStatus.totalConnections || 0,
        connectedDevicesList: tcpStatus.connectedDevices || [],
        healthMeasurementsToday: parseInt(healthCount.rows[0].count),
        healthMeasurementsTotal: parseInt(healthTotalCount.rows[0].count),
        smsToday: parseInt(smsCount.rows[0].count),
        systemStatus: 'online'
      }
    })
  } catch (error: any) {
    console.error('Errore recupero statistiche:', error)
    return NextResponse.json(
      { error: 'Errore recupero statistiche', details: error.message },
      { status: 500 }
    )
  }
}
