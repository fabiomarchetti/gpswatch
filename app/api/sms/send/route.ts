import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { sendSMS } from '@/lib/sms-gateway'
import { identifyCommandType } from '@/lib/sms-parser'

/**
 * POST /api/sms/send
 * Invia SMS a dispositivo GPS
 *
 * Modalità 1: Con device_id (dispositivo registrato)
 *   - Parametri: { device_id, command, user_id? }
 *   - Cerca dispositivo nel DB, salva log, invia SMS
 *
 * Modalità 2: Diretta con phoneNumber (configurazione iniziale)
 *   - Parametri: { phoneNumber, message }
 *   - Invia SMS direttamente senza salvare nel DB
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { device_id, command, user_id, phoneNumber, message } = body

    // ========== MODALITÀ 2: INVIO DIRETTO (configurazione iniziale) ==========
    if (phoneNumber && message) {
      console.log('📱 Invio SMS diretto a:', phoneNumber)

      // Identifica tipo comando
      const commandType = identifyCommandType(message)

      // Invia SMS tramite gateway
      const smsResult = await sendSMS({
        phoneNumber,
        message
      })

      // Salva log su database VPS
      try {
        await pool.query(
          `INSERT INTO sms_logs (
            device_id,
            phone_number,
            direction,
            message,
            command_type,
            status,
            gateway_message_id,
            sent_at
          )
          VALUES (NULL, $1, 'sent', $2, $3, $4, $5, NOW())`,
          [
            phoneNumber,
            message,
            commandType,
            smsResult.success ? 'sent' : 'failed',
            smsResult.messageId || null
          ]
        )
        console.log('✅ Log SMS salvato su DB VPS')
      } catch (logError) {
        console.error('⚠️ Errore salvataggio log:', logError)
        // Continua comunque
      }

      if (smsResult.success) {
        return NextResponse.json(
          {
            success: true,
            message: 'SMS inviato con successo',
            messageId: smsResult.messageId
          },
          { status: 200 }
        )
      } else {
        return NextResponse.json(
          {
            success: false,
            error: smsResult.error || 'Errore invio SMS'
          },
          { status: 500 }
        )
      }
    }

    // ========== MODALITÀ 1: INVIO CON DB (dispositivo registrato) ==========
    // Validazione
    if (!device_id || !command) {
      return NextResponse.json(
        { error: 'Device ID e comando sono obbligatori (oppure phoneNumber e message per invio diretto)' },
        { status: 400 }
      )
    }

    // Recupera dispositivo dal DB
    const deviceResult = await pool.query(
      'SELECT id, phone_number, device_id FROM devices WHERE id = $1',
      [device_id]
    )

    if (deviceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Dispositivo non trovato' },
        { status: 404 }
      )
    }

    const device = deviceResult.rows[0]

    if (!device.phone_number) {
      return NextResponse.json(
        { error: 'Dispositivo senza numero di telefono' },
        { status: 400 }
      )
    }

    // Identifica tipo comando
    const commandType = identifyCommandType(command)

    // Salva log SMS (pending)
    const logResult = await pool.query(
      `INSERT INTO sms_logs (
        device_id,
        phone_number,
        direction,
        message,
        command_type,
        status,
        user_id
      )
      VALUES ($1, $2, 'sent', $3, $4, 'pending', $5)
      RETURNING id`,
      [device_id, device.phone_number, command, commandType, user_id || null]
    )

    const logId = logResult.rows[0].id

    // Invia SMS tramite gateway
    const smsResult = await sendSMS({
      phoneNumber: device.phone_number,
      message: command
    })

    // Aggiorna log con risultato
    if (smsResult.success) {
      await pool.query(
        `UPDATE sms_logs
         SET status = 'sent',
             gateway_message_id = $1,
             sent_at = NOW()
         WHERE id = $2`,
        [smsResult.messageId, logId]
      )

      return NextResponse.json(
        {
          success: true,
          message: 'SMS inviato con successo',
          logId: logId,
          messageId: smsResult.messageId
        },
        { status: 200 }
      )
    } else {
      await pool.query(
        `UPDATE sms_logs
         SET status = 'failed',
             error_message = $1
         WHERE id = $2`,
        [smsResult.error, logId]
      )

      return NextResponse.json(
        {
          success: false,
          error: smsResult.error,
          logId: logId
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Errore invio SMS:', error)
    return NextResponse.json(
      { error: 'Errore del server', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sms/send
 * Stato gateway SMS
 */
export async function GET(request: NextRequest) {
  try {
    const { checkGatewayHealth } = await import('@/lib/sms-gateway')
    const isOnline = await checkGatewayHealth()

    return NextResponse.json({
      gateway: {
        online: isOnline,
        url: process.env.SMS_GATEWAY_URL || 'Non configurato'
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Errore verifica gateway', details: error.message },
      { status: 500 }
    )
  }
}
