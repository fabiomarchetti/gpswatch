import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// GET - Lista tutti i dispositivi
export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT
        d.*,
        w.id as wearer_id,
        w.nome as assigned_user_name,
        w.cognome as assigned_user_surname
       FROM devices d
       LEFT JOIN wearers w ON w.device_id = d.id
       ORDER BY d.created_at DESC`
    )

    return NextResponse.json(
      {
        devices: result.rows,
        count: result.rows.length
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Errore durante il recupero dispositivi:', error)
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    )
  }
}

// POST - Registra nuovo dispositivo (o aggiorna se già esiste)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      device_id,
      device_internal_id,
      imei,
      firmware_version,
      phone_number,
      model,
      password,
      notes,
      server_ip,
      server_port,
      profile,
      upload_interval,
      battery_level,
      language_code,
      timezone,
      network_status,
      network_signal,
      gps_status,
      apn,
      mcc,
      mnc,
      status
    } = body

    // Validazione input
    if (!imei) {
      return NextResponse.json(
        { error: 'IMEI è obbligatorio' },
        { status: 400 }
      )
    }

    // Genera device_id se non fornito
    const finalDeviceId = device_id || `DEV-${imei.slice(-6)}`

    // Cerca dispositivo esistente per:
    // 1. device_internal_id (ID usato dall'orologio quando si connette)
    // 2. IMEI
    // 3. device_id che corrisponde al device_internal_id
    const checkExisting = await pool.query(
      `SELECT id, device_id, imei, phone_number FROM devices
       WHERE device_internal_id = $1
          OR imei = $2
          OR device_id = $1
       LIMIT 1`,
      [device_internal_id || device_id, imei]
    )

    // Se esiste già, aggiorna invece di creare
    if (checkExisting.rows.length > 0) {
      const existingDevice = checkExisting.rows[0]

      const updateResult = await pool.query(
        `UPDATE devices SET
          device_id = $1,
          device_internal_id = $2,
          imei = $3,
          firmware_version = COALESCE($4, firmware_version),
          phone_number = COALESCE($5, phone_number),
          model = COALESCE($6, model),
          password = COALESCE($7, password),
          notes = COALESCE($8, notes),
          server_ip = COALESCE($9, server_ip),
          server_port = COALESCE($10, server_port),
          profile = COALESCE($11, profile),
          upload_interval = COALESCE($12, upload_interval),
          battery_level = COALESCE($13, battery_level),
          language_code = COALESCE($14, language_code),
          timezone = COALESCE($15, timezone),
          network_status = COALESCE($16, network_status),
          network_signal = COALESCE($17, network_signal),
          gps_status = COALESCE($18, gps_status),
          apn = COALESCE($19, apn),
          mcc = COALESCE($20, mcc),
          mnc = COALESCE($21, mnc),
          status = COALESCE($22, status),
          updated_at = NOW()
        WHERE id = $23
        RETURNING *`,
        [
          finalDeviceId,
          device_internal_id || existingDevice.device_id,
          imei,
          firmware_version,
          phone_number,
          model,
          password,
          notes,
          server_ip,
          server_port,
          profile,
          upload_interval,
          battery_level,
          language_code,
          timezone,
          network_status,
          network_signal,
          gps_status,
          apn,
          mcc,
          mnc,
          status || 'active',
          existingDevice.id
        ]
      )

      return NextResponse.json(
        {
          success: true,
          updated: true,
          message: `Dispositivo esistente aggiornato (era già registrato con ID: ${existingDevice.device_id})`,
          device: updateResult.rows[0]
        },
        { status: 200 }
      )
    }

    // Verifica conflitto phone_number
    if (phone_number) {
      const checkPhone = await pool.query(
        'SELECT id, device_id FROM devices WHERE phone_number = $1',
        [phone_number]
      )
      if (checkPhone.rows.length > 0) {
        return NextResponse.json(
          { error: `Numero di telefono già assegnato al dispositivo ${checkPhone.rows[0].device_id}` },
          { status: 409 }
        )
      }
    }

    // Inserimento nuovo dispositivo
    const result = await pool.query(
      `INSERT INTO devices (
        device_id,
        device_internal_id,
        imei,
        firmware_version,
        phone_number,
        model,
        password,
        notes,
        server_ip,
        server_port,
        profile,
        upload_interval,
        battery_level,
        language_code,
        timezone,
        network_status,
        network_signal,
        gps_status,
        apn,
        mcc,
        mnc,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        finalDeviceId,
        device_internal_id || null,
        imei,
        firmware_version || null,
        phone_number || null,
        model || null,
        password || '123456',
        notes || null,
        server_ip || null,
        server_port || null,
        profile || null,
        upload_interval || null,
        battery_level || null,
        language_code || null,
        timezone || null,
        network_status || null,
        network_signal || null,
        gps_status || null,
        apn || null,
        mcc || null,
        mnc || null,
        status || 'inactive'
      ]
    )

    const device = result.rows[0]

    return NextResponse.json(
      {
        success: true,
        updated: false,
        message: 'Nuovo dispositivo registrato con successo',
        device: device
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Errore durante la registrazione dispositivo:', error)
    return NextResponse.json(
      { error: 'Errore del server durante la registrazione', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna dispositivo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      device_id,
      phone_number,
      model,
      password,
      notes,
      status,
      assigned_user_id
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID dispositivo richiesto' },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `UPDATE devices SET
        device_id = COALESCE($1, device_id),
        phone_number = $2,
        model = $3,
        password = COALESCE($4, password),
        notes = $5,
        status = COALESCE($6, status),
        assigned_user_id = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *`,
      [device_id, phone_number, model, password, notes, status, assigned_user_id, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Dispositivo non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        message: 'Dispositivo aggiornato con successo',
        device: result.rows[0]
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Errore durante aggiornamento dispositivo:', error)
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    )
  }
}
