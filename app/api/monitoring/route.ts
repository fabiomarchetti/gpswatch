import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

/**
 * GET /api/monitoring
 * Recupera tutti i pazienti con i loro ultimi dati di salute per il monitoraggio
 */
export async function GET(request: NextRequest) {
  try {
    // Query semplificata - usa i dati già presenti nella tabella devices
    const result = await pool.query(`
      SELECT
        w.id as wearer_id,
        w.nome,
        w.cognome,
        w.foto_url,
        w.telefono,
        w.data_nascita,
        w.sesso,
        w.gruppo_sanguigno,
        w.allergie,
        w.patologie,
        w.emergenza_nome,
        w.emergenza_telefono,
        d.id as device_db_id,
        d.phone_number as device_phone,
        d.model as device_model,
        d.imei,
        d.status as device_status,
        d.battery_level,
        d.last_heart_rate,
        d.last_systolic_bp,
        d.last_diastolic_bp,
        d.last_spo2,
        d.last_temperature,
        d.last_steps,
        d.last_latitude,
        d.last_longitude,
        (d.last_health_update AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as health_recorded_at,
        (d.last_location_update AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as location_recorded_at,
        (d.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Rome')::text as last_seen
      FROM wearers w
      LEFT JOIN devices d ON w.device_id = d.id
      WHERE w.active = true
      ORDER BY w.cognome, w.nome
    `)

    // Ottieni lo stato delle connessioni TCP attive
    let connectedDevices: string[] = []
    try {
      const tcpResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tcp/send`)
      const tcpData = await tcpResponse.json()
      connectedDevices = tcpData.connectedDevices || []
    } catch (e) {
      // Se non riesce a ottenere lo stato TCP, continua comunque
      console.log('TCP status not available')
    }

    // Arricchisci i dati con lo stato online/offline
    const patients = result.rows.map(row => {
      // Determina se il dispositivo è online
      const isConnectedTcp = row.imei && connectedDevices.includes(row.imei)

      let lastDataTime: Date | null = null
      if (row.health_recorded_at) {
        lastDataTime = new Date(row.health_recorded_at)
      }
      if (row.location_recorded_at) {
        const locTime = new Date(row.location_recorded_at)
        if (!lastDataTime || locTime > lastDataTime) {
          lastDataTime = locTime
        }
      }
      if (row.last_seen) {
        const seenTime = new Date(row.last_seen)
        if (!lastDataTime || seenTime > lastDataTime) {
          lastDataTime = seenTime
        }
      }

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      const isRecentData = lastDataTime && lastDataTime > tenMinutesAgo
      const isOnline = isConnectedTcp || isRecentData

      return {
        id: row.wearer_id,
        nome: row.nome,
        cognome: row.cognome,
        nomeCompleto: `${row.nome} ${row.cognome}`,
        foto: row.foto_url,
        telefono: row.device_phone || row.telefono,
        dataNascita: row.data_nascita,
        sesso: row.sesso,
        gruppoSanguigno: row.gruppo_sanguigno,
        allergie: row.allergie,
        patologie: row.patologie,
        emergenzaNome: row.emergenza_nome,
        emergenzaTelefono: row.emergenza_telefono,
        deviceModel: row.device_model || 'GPS Watch',
        imei: row.imei,
        deviceId: row.device_db_id,
        hasDevice: !!row.device_db_id,
        isOnline,
        lastSeen: row.last_seen || lastDataTime?.toISOString(),
        health: {
          heartRate: row.last_heart_rate,
          systolicBp: row.last_systolic_bp,
          diastolicBp: row.last_diastolic_bp,
          spo2: row.last_spo2,
          temperature: row.last_temperature,
          recordedAt: row.health_recorded_at
        },
        location: {
          latitude: row.last_latitude,
          longitude: row.last_longitude,
          gpsValid: true,
          recordedAt: row.location_recorded_at
        },
        battery: row.battery_level,
        steps: row.last_steps
      }
    })

    // Statistiche
    const stats = {
      totalPatients: patients.length,
      online: patients.filter(p => p.isOnline).length,
      offline: patients.filter(p => !p.isOnline).length,
      withDevice: patients.filter(p => p.hasDevice).length,
      withoutDevice: patients.filter(p => !p.hasDevice).length
    }

    return NextResponse.json({
      success: true,
      patients,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Errore recupero dati monitoraggio:', error)
    return NextResponse.json(
      { error: 'Errore recupero dati monitoraggio', details: error.message },
      { status: 500 }
    )
  }
}
