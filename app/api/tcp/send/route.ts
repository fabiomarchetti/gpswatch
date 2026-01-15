import { NextRequest, NextResponse } from 'next/server'

// URL del server TCP sulla VPS - HTTP API per inviare comandi
const VPS_TCP_SERVER = process.env.VPS_TCP_SERVER || 'http://91.99.141.225:3000'

/**
 * POST /api/tcp/send
 * Invia comando TCP all'orologio tramite il server Node.js sulla VPS
 *
 * NOTA: Questa funzionalità richiede che il server TCP sia in esecuzione
 * sulla VPS (91.99.141.225:8001) e che l'orologio sia connesso.
 *
 * Il server Node.js sulla VPS espone un endpoint HTTP sulla porta 3000
 * che inoltra i comandi alle connessioni TCP attive.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, command, protocol = '3G' } = body

    if (!deviceId || !command) {
      return NextResponse.json(
        { error: 'Device ID e comando sono obbligatori' },
        { status: 400 }
      )
    }

    console.log(`📤 Richiesta invio comando TCP: deviceId=${deviceId}, command=${command}`)

    // Invia comando al server TCP sulla VPS
    const serverUrl = `${VPS_TCP_SERVER}/api/tcp/send`

    console.log(`📡 Chiamando VPS TCP Server: ${serverUrl}`)

    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, command, protocol }),
      // Timeout di 10 secondi
      signal: AbortSignal.timeout(10000)
    })

    const data = await response.json()

    if (response.ok) {
      console.log(`✅ Comando TCP inviato con successo:`, data)
    } else {
      console.log(`⚠️ Risposta dal server TCP:`, data)
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('❌ Errore invio comando TCP:', error)

    // Messaggio più specifico per errori di connessione
    if (error.name === 'AbortError' || error.cause?.code === 'ETIMEDOUT') {
      return NextResponse.json(
        {
          error: 'Timeout connessione al server TCP',
          details: 'Il server VPS non risponde. Verifica che sia in esecuzione e che la porta 3000 sia aperta.',
          vpsUrl: VPS_TCP_SERVER
        },
        { status: 504 }
      )
    }

    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        {
          error: 'Connessione rifiutata dal server TCP',
          details: 'Il server TCP sulla VPS non è raggiungibile. Verifica che PM2 sia attivo.',
          vpsUrl: VPS_TCP_SERVER
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Errore del server', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tcp/send
 * Stato server TCP - Ottiene lista dispositivi connessi
 */
export async function GET(request: NextRequest) {
  try {
    // Ottieni stato connessioni dal server TCP sulla VPS
    const serverUrl = `${VPS_TCP_SERVER}/api/tcp/status`

    console.log(`📡 Verificando stato server TCP: ${serverUrl}`)

    const response = await fetch(serverUrl, {
      signal: AbortSignal.timeout(5000)
    })
    const data = await response.json()

    return NextResponse.json({
      ...data,
      vpsServer: VPS_TCP_SERVER,
      tcpPort: 8001,
      httpPort: 3000,
      note: 'Server TCP attivo sulla VPS'
    })
  } catch (error: any) {
    console.error('❌ Errore connessione server TCP:', error)

    return NextResponse.json(
      {
        error: 'Impossibile connettersi al server TCP sulla VPS',
        vpsServer: VPS_TCP_SERVER,
        details: error.message,
        suggestions: [
          'Verifica che PM2 sia attivo: pm2 status',
          'Verifica che la porta 3000 sia aperta: ufw status',
          'Riavvia il server: pm2 restart gps-server'
        ]
      },
      { status: 503 }
    )
  }
}
