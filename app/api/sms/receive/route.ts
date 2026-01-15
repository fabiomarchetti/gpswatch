import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { parseWatchSMS, extractDeviceUpdates } from '@/lib/sms-parser'

/**
 * POST /api/sms/receive
 * Webhook per ricevere SMS in arrivo dal gateway Android
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('📥 SMS ricevuto dal gateway:', JSON.stringify(body, null, 2))

    // Il gateway può inviare in due formati:
    // 1. Nuovo formato con payload: { event, payload: { message, phoneNumber, receivedAt } }
    // 2. Vecchio formato diretto: { message, phoneNumber, receivedAt }
    const payload = body.payload || body

    const {
      message,      // Testo SMS
      phoneNumber,  // Numero mittente (orologio)
      receivedAt    // Timestamp ISO
    } = payload

    if (!message || !phoneNumber) {
      console.error('❌ Dati SMS incompleti:', { message, phoneNumber })
      return NextResponse.json(
        { error: 'Dati SMS incompleti' },
        { status: 400 }
      )
    }

    console.log(`✅ SMS da ${phoneNumber}: ${message.substring(0, 100)}...`)

    // Normalizza numero telefono
    const normalizedPhone = phoneNumber.replace(/\s+/g, '')

    // Trova dispositivo dal numero
    const deviceResult = await pool.query(
      'SELECT id, device_id FROM devices WHERE phone_number = $1',
      [normalizedPhone]
    )

    if (deviceResult.rows.length === 0) {
      console.warn(`⚠️  Dispositivo non trovato per numero: ${normalizedPhone}`)

      // Parse messaggio anche senza device
      const parsed = parseWatchSMS(message)

      const insertQuery = `INSERT INTO sms_logs (
          device_id,
          phone_number,
          direction,
          message,
          command_type,
          parsed_data,
          status,
          received_at
        ) VALUES (
          NULL,
          $1,
          'received',
          $2,
          $3,
          $4,
          'received',
          $5
        )`
      const insertParams = [normalizedPhone, message, parsed.commandType, JSON.stringify(parsed.data), new Date(receivedAt)]

      // Salva su DB VPS
      await pool.query(insertQuery, insertParams)
      console.log('✅ Log SMS salvato su DB VPS (device non trovato)')

      return NextResponse.json(
        { success: true, warning: 'Dispositivo non trovato, log salvato su entrambi i DB' },
        { status: 200 }
      )
    }

    const device = deviceResult.rows[0]

    // Parse messaggio
    const parsed = parseWatchSMS(message)

    console.log('📊 Messaggio parsato:', parsed)

    // Inizia transazione
    await pool.query('BEGIN')

    // Salva log SMS
    await pool.query(
      `INSERT INTO sms_logs (
        device_id,
        phone_number,
        direction,
        message,
        command_type,
        parsed_data,
        status,
        received_at
      ) VALUES ($1, $2, 'received', $3, $4, $5, 'received', $6)`,
      [
        device.id,
        normalizedPhone,
        message,
        parsed.commandType,
        JSON.stringify(parsed.data),
        new Date(receivedAt)
      ]
    )

    // Aggiorna dispositivo con dati parsati
    if (parsed.success) {
      const updates = extractDeviceUpdates(parsed)

      if (Object.keys(updates).length > 0) {
        const setClause = Object.keys(updates)
          .map((key, idx) => `${key} = $${idx + 2}`)
          .join(', ')

        const values = [device.id, ...Object.values(updates)]

        await pool.query(
          `UPDATE devices
           SET ${setClause}, updated_at = NOW()
           WHERE id = $1`,
          values
        )

        console.log(`✅ Device ${device.device_id} aggiornato:`, updates)
      }
    }

    // Commit transazione
    await pool.query('COMMIT')
    console.log('✅ Log SMS salvato su DB VPS')

    return NextResponse.json(
      {
        success: true,
        device: device.device_id,
        commandType: parsed.commandType,
        parsed: parsed.success
      },
      { status: 200 }
    )
  } catch (error: any) {
    // Rollback in caso di errore
    await pool.query('ROLLBACK')
    console.error('❌ Errore ricezione SMS:', error)

    return NextResponse.json(
      { error: 'Errore elaborazione SMS', details: error.message },
      { status: 500 }
    )
  } finally {
    // Pool gestisce le connessioni automaticamente
  }
}

/**
 * GET /api/sms/receive
 * Test endpoint webhook
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Webhook SMS attivo',
    endpoint: '/api/sms/receive',
    method: 'POST',
    expectedFormat: {
      message: 'Testo SMS',
      phoneNumber: '+39123456789',
      receivedAt: '2025-12-27T10:00:00Z'
    }
  })
}
