/**
 * SMS Gateway Client
 * Integrazione con SMS Gateway for Android
 */

import axios, { AxiosError } from 'axios'

// Configurazione gateway dal .env
const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL || 'http://192.168.0.106:8080'
const SMS_GATEWAY_USERNAME = process.env.SMS_GATEWAY_USERNAME || 'stlone SMS'
const SMS_GATEWAY_PASSWORD = process.env.SMS_GATEWAY_PASSWORD || 'ohori11!'

interface SendSMSOptions {
  phoneNumber: string
  message: string
}

interface SendSMSResponse {
  success: boolean
  messageId?: string
  error?: string
  details?: any
}

/**
 * Invia SMS tramite gateway Android
 */
export async function sendSMS({ phoneNumber, message }: SendSMSOptions): Promise<SendSMSResponse> {
  try {
    console.log(`📤 Invio SMS a ${phoneNumber}: "${message}"`)

    const response = await axios.post(
      `${SMS_GATEWAY_URL}/message`,
      {
        phoneNumbers: [phoneNumber],
        message: message
      },
      {
        auth: {
          username: SMS_GATEWAY_USERNAME,
          password: SMS_GATEWAY_PASSWORD
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 secondi timeout
      }
    )

    console.log('✅ SMS inviato con successo:', response.data)

    return {
      success: true,
      messageId: response.data.id || response.data.messageId,
      details: response.data
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError

      console.error('❌ Errore invio SMS:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message
      })

      return {
        success: false,
        error: axiosError.message,
        details: axiosError.response?.data
      }
    }

    console.error('❌ Errore sconosciuto invio SMS:', error)
    return {
      success: false,
      error: 'Errore sconosciuto durante invio SMS'
    }
  }
}

/**
 * Comandi SMS predefiniti per orologi GPS
 */
export const WatchCommands = {
  /**
   * Leggi configurazione completa
   */
  readConfig: (password: string = '123456') => `pw,${password},ts#`,

  /**
   * Reset orologio
   */
  reset: (password: string = '123456') => `pw,${password},reset#`,

  /**
   * Reboot orologio
   */
  reboot: (password: string = '123456') => `pw,${password},restart#`,

  /**
   * Leggi posizione GPS
   */
  readGPS: (password: string = '123456') => `pw,${password},url#`,

  /**
   * Leggi batteria
   */
  readBattery: (password: string = '123456') => `pw,${password},bat#`,

  /**
   * Configura server
   */
  setServer: (ip: string, port: number, password: string = '123456') =>
    `pw,${password},ip,${ip},${port}#`,

  /**
   * Configura APN
   */
  setAPN: (apn: string, username: string = '', password: string = '123456', simPassword: string = '') =>
    `pw,${password},apn,${apn},${username},${simPassword}#`,

  /**
   * Configura zona GPS (12 = Italia)
   */
  setGPSZone: (zone: number, password: string = '123456') =>
    `pw,${password},lz,${zone}#`,

  /**
   * Configura intervallo upload (minuti)
   */
  setUploadInterval: (minutes: number, password: string = '123456') =>
    `pw,${password},upload,${minutes}#`,

  /**
   * Configura numero SOS
   */
  setSOS: (sosNumber: 1 | 2 | 3, phoneNumber: string, password: string = '123456') =>
    `pw,${password},sos${sosNumber},${phoneNumber}#`,

  /**
   * Test GPS
   */
  testGPS: (password: string = '123456') => `pw,${password},gps#`,
}

/**
 * Invia comando predefinito a orologio
 */
export async function sendWatchCommand(
  phoneNumber: string,
  command: string
): Promise<SendSMSResponse> {
  return sendSMS({
    phoneNumber,
    message: command
  })
}

/**
 * Verifica stato gateway (health check)
 */
export async function checkGatewayHealth(): Promise<boolean> {
  try {
    // Prova endpoint /health o fallback a /message con GET
    const response = await axios.get(`${SMS_GATEWAY_URL}/health`, {
      auth: {
        username: SMS_GATEWAY_USERNAME,
        password: SMS_GATEWAY_PASSWORD
      },
      timeout: 5000
    })

    return response.status === 200
  } catch (error) {
    // Se /health non esiste, gateway potrebbe essere comunque online
    console.warn('⚠️ Health check non disponibile (endpoint /health non trovato)')
    return false
  }
}
