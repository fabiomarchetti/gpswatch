import { NextResponse } from 'next/server'

const VPS_URL = 'http://91.99.141.225:3000'

export async function GET() {
  try {
    const response = await fetch(`${VPS_URL}/api/tcp/status`, {
      cache: 'no-store'
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Errore fetch status TCP:', error)
    return NextResponse.json(
      { error: 'Errore connessione al server TCP', totalConnections: 0, connectedDevices: [] },
      { status: 500 }
    )
  }
}
