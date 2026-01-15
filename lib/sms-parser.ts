/**
 * Parser risposte SMS dagli orologi GPS
 */

export interface ParsedSMSResponse {
  commandType: string
  data: Record<string, any>
  raw: string
  success: boolean
}

/**
 * Parse risposta configurazione (TS)
 * Formato: TS:52.28.132.157,80,0#,12,0,0,0...
 */
function parseTSResponse(sms: string): ParsedSMSResponse | null {
  if (!sms.startsWith('TS:')) return null

  try {
    const content = sms.substring(3) // Rimuovi 'TS:'
    const parts = content.split(',')

    return {
      commandType: 'TS',
      success: true,
      data: {
        server_ip: parts[0] || null,
        server_port: parts[1] ? parseInt(parts[1]) : null,
        apn: parts[2] || null,
        gps_zone: parts[3] ? parseInt(parts[3]) : null,
        battery_level: parts[4] ? parseInt(parts[4]) : null,
        signal_strength: parts[5] ? parseInt(parts[5]) : null,
      },
      raw: sms
    }
  } catch (error) {
    console.error('Errore parsing TS:', error)
    return null
  }
}

/**
 * Parse risposta URL GPS
 * Formato: http://maps.google.com/maps?q=41.123456,12.654321
 */
function parseURLResponse(sms: string): ParsedSMSResponse | null {
  if (!sms.startsWith('http')) return null

  try {
    const match = sms.match(/q=([-\d.]+),([-\d.]+)/)

    if (!match) return null

    return {
      commandType: 'URL',
      success: true,
      data: {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
        maps_url: sms
      },
      raw: sms
    }
  } catch (error) {
    console.error('Errore parsing URL:', error)
    return null
  }
}

/**
 * Parse risposta batteria
 * Formato: battery:85% o Battery level: 85%
 */
function parseBatteryResponse(sms: string): ParsedSMSResponse | null {
  const lowerSMS = sms.toLowerCase()

  if (!lowerSMS.includes('batt')) return null

  try {
    const match = sms.match(/(\d+)%/)

    return {
      commandType: 'BAT',
      success: true,
      data: {
        battery_level: match ? parseInt(match[1]) : 0
      },
      raw: sms
    }
  } catch (error) {
    console.error('Errore parsing Battery:', error)
    return null
  }
}

/**
 * Parse risposta LK (heartbeat/location)
 * Formato: LK,0,17,56,230922,93,15,6262,647,1,0,93,100,1000,0,0,10026,12
 */
function parseLKResponse(sms: string): ParsedSMSResponse | null {
  if (!sms.startsWith('LK,')) return null

  try {
    const parts = sms.split(',')

    return {
      commandType: 'LK',
      success: true,
      data: {
        steps: parts[1] ? parseInt(parts[1]) : 0,
        battery_level: parts[17] ? parseInt(parts[17]) : null,
        signal_strength: parts[13] ? parseInt(parts[13]) : null,
      },
      raw: sms
    }
  } catch (error) {
    console.error('Errore parsing LK:', error)
    return null
  }
}

/**
 * Parse risposta UD (location data)
 * Formato: UD,DDMMYY,HHMMSS,V/A,lat,N/S,lon,E/W,speed,course,altitude,satellites,gsm,battery,steps,tumble,0
 */
function parseUDResponse(sms: string): ParsedSMSResponse | null {
  if (!sms.startsWith('UD,')) return null

  try {
    const parts = sms.split(',')

    // Parse coordinate GPS
    const latDegrees = parts[3] ? parseFloat(parts[3]) : null
    const latDirection = parts[4] // N o S
    const lonDegrees = parts[5] ? parseFloat(parts[5]) : null
    const lonDirection = parts[6] // E o W

    // Converti in decimali
    let latitude = latDegrees
    let longitude = lonDegrees

    if (latDirection === 'S' && latitude) latitude = -latitude
    if (lonDirection === 'W' && longitude) longitude = -longitude

    return {
      commandType: 'UD',
      success: true,
      data: {
        date: parts[1],
        time: parts[2],
        gps_valid: parts[3] === 'A', // A=valid, V=invalid
        latitude: latitude,
        longitude: longitude,
        speed: parts[7] ? parseFloat(parts[7]) : null,
        course: parts[8] ? parseFloat(parts[8]) : null,
        altitude: parts[9] ? parseFloat(parts[9]) : null,
        satellites: parts[10] ? parseInt(parts[10]) : null,
        gsm_signal: parts[11] ? parseInt(parts[11]) : null,
        battery_level: parts[12] ? parseInt(parts[12]) : null,
        steps: parts[13] ? parseInt(parts[13]) : null,
      },
      raw: sms
    }
  } catch (error) {
    console.error('Errore parsing UD:', error)
    return null
  }
}

/**
 * Parse risposta OK generica
 */
function parseOKResponse(sms: string): ParsedSMSResponse | null {
  const lowerSMS = sms.toLowerCase().trim()

  if (lowerSMS === 'ok' || lowerSMS.startsWith('ok,')) {
    return {
      commandType: 'OK',
      success: true,
      data: { confirmed: true },
      raw: sms
    }
  }

  return null
}

/**
 * Parser principale
 * Prova tutti i parser in sequenza
 */
export function parseWatchSMS(sms: string): ParsedSMSResponse {
  const trimmedSMS = sms.trim()

  // Prova parser specifici
  const parsers = [
    parseTSResponse,
    parseURLResponse,
    parseBatteryResponse,
    parseLKResponse,
    parseUDResponse,
    parseOKResponse
  ]

  for (const parser of parsers) {
    const result = parser(trimmedSMS)
    if (result) return result
  }

  // Risposta non riconosciuta
  return {
    commandType: 'UNKNOWN',
    success: false,
    data: {},
    raw: trimmedSMS
  }
}

/**
 * Identifica tipo di comando inviato
 */
export function identifyCommandType(command: string): string {
  const cmd = command.toLowerCase()

  if (cmd.includes('ts#')) return 'TS'
  if (cmd.includes('reset#')) return 'RESET'
  if (cmd.includes('restart#')) return 'REBOOT'
  if (cmd.includes('url#')) return 'URL'
  if (cmd.includes('bat#')) return 'BAT'
  if (cmd.includes('ip,')) return 'SET_SERVER'
  if (cmd.includes('apn,')) return 'SET_APN'
  if (cmd.includes('lz,')) return 'SET_ZONE'
  if (cmd.includes('upload,')) return 'SET_INTERVAL'
  if (cmd.includes('sos')) return 'SET_SOS'
  if (cmd.includes('gps#')) return 'GPS_TEST'

  return 'CUSTOM'
}

/**
 * Aggiorna device con dati parsati
 */
export function extractDeviceUpdates(parsed: ParsedSMSResponse): Record<string, any> {
  const updates: Record<string, any> = {}

  if (parsed.data.server_ip) updates.server_ip = parsed.data.server_ip
  if (parsed.data.server_port) updates.server_port = parsed.data.server_port
  if (parsed.data.gps_zone) updates.gps_zone = parsed.data.gps_zone
  if (parsed.data.battery_level !== undefined) updates.battery_level = parsed.data.battery_level
  if (parsed.data.signal_strength !== undefined) updates.signal_strength = parsed.data.signal_strength
  if (parsed.data.latitude && parsed.data.longitude) {
    updates.last_latitude = parsed.data.latitude
    updates.last_longitude = parsed.data.longitude
  }

  return updates
}
