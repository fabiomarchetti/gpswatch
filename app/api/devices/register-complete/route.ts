import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// POST - Registra dispositivo + wearer in un'unica operazione
export async function POST(request: NextRequest) {
  const client = await pool.connect()

  try {
    const body = await request.json()
    const { device, wearer } = body

    // Validazione dati dispositivo
    if (!device || !device.device_id || !device.imei) {
      return NextResponse.json(
        { error: 'Device ID e IMEI sono obbligatori' },
        { status: 400 }
      )
    }

    // Validazione dati wearer (se presente)
    if (wearer && (!wearer.nome || !wearer.cognome)) {
      return NextResponse.json(
        { error: 'Nome e cognome del wearer sono obbligatori' },
        { status: 400 }
      )
    }

    // Inizia transazione
    await client.query('BEGIN')

    // Verifica se device_id esiste già
    const checkDeviceId = await client.query(
      'SELECT id FROM devices WHERE device_id = $1',
      [device.device_id]
    )

    if (checkDeviceId.rows.length > 0) {
      await client.query('ROLLBACK')
      return NextResponse.json(
        { error: 'Device ID già esistente' },
        { status: 409 }
      )
    }

    // Verifica se IMEI esiste già
    const checkImei = await client.query(
      'SELECT id FROM devices WHERE imei = $1',
      [device.imei]
    )

    if (checkImei.rows.length > 0) {
      await client.query('ROLLBACK')
      return NextResponse.json(
        { error: 'IMEI già esistente' },
        { status: 409 }
      )
    }

    // Inserimento dispositivo con sim_pin
    const deviceResult = await client.query(
      `INSERT INTO devices (
        device_id,
        imei,
        phone_number,
        sim_pin,
        model,
        notes,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'inactive')
      RETURNING *`,
      [
        device.device_id,
        device.imei,
        device.phone_number || null,
        device.sim_pin || null,
        device.model || null,
        device.notes || null
      ]
    )

    const newDevice = deviceResult.rows[0]
    let newWearer = null

    // Inserimento wearer (se presente)
    if (wearer) {
      const wearerResult = await client.query(
        `INSERT INTO wearers (
          nome,
          cognome,
          data_nascita,
          luogo_nascita,
          codice_fiscale,
          sesso,
          indirizzo,
          citta,
          provincia,
          cap,
          telefono,
          email,
          emergenza_nome,
          emergenza_telefono,
          emergenza_relazione,
          emergenza2_nome,
          emergenza2_telefono,
          emergenza2_relazione,
          gruppo_sanguigno,
          allergie,
          patologie,
          farmaci,
          note_mediche,
          device_id,
          device_assigned_date,
          active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), TRUE)
        RETURNING *`,
        [
          wearer.nome,
          wearer.cognome,
          wearer.data_nascita || null,
          wearer.luogo_nascita || null,
          wearer.codice_fiscale || null,
          wearer.sesso || null,
          wearer.indirizzo || null,
          wearer.citta || null,
          wearer.provincia || null,
          wearer.cap || null,
          wearer.telefono || null,
          wearer.email || null,
          wearer.emergenza_nome || null,
          wearer.emergenza_telefono || null,
          wearer.emergenza_relazione || null,
          wearer.emergenza2_nome || null,
          wearer.emergenza2_telefono || null,
          wearer.emergenza2_relazione || null,
          wearer.gruppo_sanguigno || null,
          wearer.allergie || null,
          wearer.patologie || null,
          wearer.farmaci || null,
          wearer.note_mediche || null,
          newDevice.id
        ]
      )

      newWearer = wearerResult.rows[0]
    }

    // Commit transazione
    await client.query('COMMIT')

    return NextResponse.json(
      {
        message: wearer
          ? 'Dispositivo e wearer registrati con successo'
          : 'Dispositivo registrato con successo',
        device: {
          id: newDevice.id,
          device_id: newDevice.device_id,
          imei: newDevice.imei,
          phone_number: newDevice.phone_number,
          sim_pin: newDevice.sim_pin,
          model: newDevice.model,
          status: newDevice.status,
          created_at: newDevice.created_at
        },
        wearer: newWearer ? {
          id: newWearer.id,
          nome: newWearer.nome,
          cognome: newWearer.cognome,
          data_nascita: newWearer.data_nascita,
          telefono: newWearer.telefono,
          email: newWearer.email,
          device_id: newWearer.device_id,
          created_at: newWearer.created_at
        } : null
      },
      { status: 201 }
    )
  } catch (error: any) {
    // Rollback in caso di errore
    await client.query('ROLLBACK')
    console.error('Errore durante la registrazione completa:', error)
    return NextResponse.json(
      { error: 'Errore del server durante la registrazione', details: error.message },
      { status: 500 }
    )
  } finally {
    // Rilascia il client
    client.release()
  }
}
