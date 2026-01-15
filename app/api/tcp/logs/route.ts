import { NextRequest, NextResponse } from 'next/server'

const VPS_URL = 'http://91.99.141.225:3000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const limit = searchParams.get('limit') || '50'

    let url = `${VPS_URL}/api/tcp/logs?limit=${limit}`
    if (deviceId) {
      url += `&deviceId=${deviceId}`
    }

    const response = await fetch(url, {
      cache: 'no-store'
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Errore fetch logs TCP:', error)
    return NextResponse.json(
      { error: 'Errore connessione al server TCP', logs: [] },
      { status: 500 }
    )
  }
}
