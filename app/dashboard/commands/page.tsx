'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Terminal, Send, RefreshCw, Wifi, WifiOff, Watch, Heart,
  Thermometer, Activity, MapPin, Phone, Server, Volume2,
  Power, RotateCcw, Clock, Shield, ChevronDown, ChevronUp,
  ExternalLink, Navigation, Battery, Signal
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'

interface ConnectedDevice {
  deviceId: string
  imei?: string
  phone_number?: string
  wearer_nome?: string
  wearer_cognome?: string
}

interface Wearer {
  id: number
  nome: string
  cognome: string
  device_name: string | null
  device_phone: string | null
}

interface CommandLog {
  id: number
  timestamp: string
  deviceId: string
  command: string
  response: string
  success: boolean
}

interface DbLog {
  id: number
  device_id: string
  direction: string
  command: string
  full_packet: string
  data: string
  created_at: string
}

// Mappa descrizioni comandi
const commandDescriptions: { [key: string]: string } = {
  'LK': 'Keep-alive (verifica connessione)',
  'UD': 'Posizione GPS',
  'UD2': 'Posizione GPS v2',
  'UD_LTE': 'Posizione GPS via LTE',
  'AL': 'Allarme SOS',
  'CR': 'Richiesta stato dispositivo',
  'FIND': 'Trova orologio (suona)',
  'UPLOAD': 'Intervallo invio posizione',
  'IP': 'Configurazione IP server',
  'PORT': 'Configurazione porta server',
  'CENTER': 'Numero admin',
  'SOS1': 'Numero SOS 1',
  'SOS2': 'Numero SOS 2',
  'SOS3': 'Numero SOS 3',
  'POWEROFF': 'Spegnimento',
  'RESET': 'Riavvio',
  'FACTORY': 'Reset fabbrica',
  'hrtstart': 'Avvio misurazione battito cardiaco',
  'bpstart': 'Avvio misurazione pressione',
  'oxstart': 'Avvio misurazione SpO2',
  'tempstart': 'Avvio misurazione temperatura',
  'hrtint': 'Intervallo auto battito cardiaco',
  'bpint': 'Intervallo auto pressione',
  'oxyint': 'Intervallo auto SpO2',
  'btemp2int': 'Intervallo auto temperatura',
  'bphrt': 'Dati pressione/battito',
  'oxygen': 'Dati saturazione O2',
  'btemp2': 'Dati temperatura',
  'CONFIG': 'Configurazione dispositivo',
  'ICCID': 'Info SIM',
  'RYIMEI': 'Conferma IMEI',
  'LZ': 'Impostazione timezone',
  'LANG': 'Impostazione lingua',
  'LANG,12': 'Lingua Italiana',
  'LANG,1': 'Lingua Inglese',
  'GPSOFF': 'Modalità GPS',
}

// Parser per dati posizione (UD, UD_LTE, CR response)
interface ParsedLocationData {
  date: string
  time: string
  gpsValid: boolean
  latitude: number
  longitude: number
  speed: number
  altitude: number
  satellites: number
  gsm: number
  battery: number
  mapsUrl: string
}

function parseLocationData(data: string): ParsedLocationData | null {
  if (!data) return null

  const parts = data.split(',')
  if (parts.length < 14) return null

  try {
    const dateStr = parts[0] // 030126 = DDMMYY
    const timeStr = parts[1] // 105701 = HHMMSS
    const valid = parts[2]   // V=invalid, A=valid
    const lat = parseFloat(parts[3]) || 0
    const latDir = parts[4]  // N/S
    const lon = parseFloat(parts[5]) || 0
    const lonDir = parts[6]  // E/W
    const speed = parseFloat(parts[7]) || 0
    const direction = parseFloat(parts[8]) || 0
    const altitude = parseFloat(parts[9]) || 0
    const satellites = parseInt(parts[10]) || 0
    const gsm = parseInt(parts[11]) || 0
    const battery = parseInt(parts[12]) || 0

    // Converti coordinate
    const finalLat = latDir === 'S' ? -lat : lat
    const finalLon = lonDir === 'W' ? -lon : lon

    // Formatta data/ora - i dati dall'orologio sono già in UTC
    // toLocaleString converte automaticamente al fuso orario locale del browser
    let formattedDate = dateStr
    let formattedTime = timeStr

    if (dateStr.length === 6 && timeStr.length === 6) {
      // Crea data UTC (i dati GPS sono sempre in UTC)
      const day = parseInt(dateStr.slice(0, 2))
      const month = parseInt(dateStr.slice(2, 4)) - 1 // 0-indexed
      const year = 2000 + parseInt(dateStr.slice(4, 6))
      const hour = parseInt(timeStr.slice(0, 2))
      const minute = parseInt(timeStr.slice(2, 4))
      const second = parseInt(timeStr.slice(4, 6))

      // Crea data UTC - toLocaleString farà la conversione automatica al fuso locale
      const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second))

      formattedDate = utcDate.toLocaleDateString('it-IT')
      formattedTime = utcDate.toLocaleTimeString('it-IT')
    }

    // Google Maps URL
    const mapsUrl = `https://www.google.com/maps?q=${finalLat},${finalLon}&z=17`

    return {
      date: formattedDate,
      time: formattedTime,
      gpsValid: valid === 'A',
      latitude: finalLat,
      longitude: finalLon,
      speed,
      altitude,
      satellites,
      gsm,
      battery,
      mapsUrl
    }
  } catch {
    return null
  }
}

// Parser per risposta LK (keep-alive)
interface ParsedLKData {
  steps: number
  rolls: number
  battery: number
}

function parseLKData(data: string): ParsedLKData | null {
  if (!data) return null

  const parts = data.split(',')
  if (parts.length < 3) return null

  try {
    return {
      steps: parseInt(parts[0]) || 0,
      rolls: parseInt(parts[1]) || 0,
      battery: parseInt(parts[2]) || 0
    }
  } catch {
    return null
  }
}

// Decoder Unicode esadecimale (es: 0056006900640065006F → Video)
function decodeUnicodeHex(hex: string): string {
  if (!hex || hex.length < 4) return hex

  // Verifica se è in formato Unicode hex (004X004X...)
  if (!/^00[0-9A-F]{2}/.test(hex)) return hex

  try {
    let decoded = ''
    for (let i = 0; i < hex.length; i += 4) {
      const hexChar = hex.substr(i, 4)
      const charCode = parseInt(hexChar, 16)
      if (charCode > 0) {
        decoded += String.fromCharCode(charCode)
      }
    }
    return decoded || hex
  } catch {
    return hex
  }
}

// Parser per APPANDFNREPORT (lista app installate)
interface AppInfo {
  code: string
  name: string
  rawHex: string
}

function parseAppReport(data: string): AppInfo[] | null {
  if (!data) return null

  try {
    const parts = data.split(',')
    const apps: AppInfo[] = []

    for (let i = 0; i < parts.length; i += 2) {
      if (i + 1 < parts.length) {
        const code = parts[i]
        const hexName = parts[i + 1]
        const decodedName = decodeUnicodeHex(hexName)

        apps.push({
          code,
          name: decodedName,
          rawHex: hexName
        })
      }
    }

    return apps.length > 0 ? apps : null
  } catch {
    return null
  }
}

interface CommandCategory {
  name: string
  icon: React.ReactNode
  commands: {
    code: string
    name: string
    description: string
    params?: string
  }[]
}

const commandCategories: CommandCategory[] = [
  {
    name: 'Stato Dispositivo',
    icon: <Watch className="w-5 h-5" />,
    commands: [
      { code: 'CR', name: 'Richiedi Stato', description: 'Ottiene lo stato completo del dispositivo (come ts# via SMS)' },
      { code: 'FIND', name: 'Trova Orologio', description: 'Fa suonare e vibrare l\'orologio' },
      { code: 'LK', name: 'Keep-alive', description: 'Ping per verificare che il dispositivo sia connesso' },
    ]
  },
  {
    name: 'Misurazioni Salute',
    icon: <Heart className="w-5 h-5" />,
    commands: [
      { code: 'hrtstart', name: 'Misura Battito', description: 'Avvia misurazione frequenza cardiaca' },
      { code: 'bpstart', name: 'Misura Pressione', description: 'Avvia misurazione pressione sanguigna' },
      { code: 'oxstart', name: 'Misura SpO2', description: 'Avvia misurazione saturazione ossigeno' },
      { code: 'tempstart', name: 'Misura Temperatura', description: 'Avvia misurazione temperatura corporea' },
    ]
  },
  {
    name: 'Misurazioni Automatiche',
    icon: <Clock className="w-5 h-5" />,
    commands: [
      { code: 'hrtint,15', name: 'Auto Battito 15min', description: 'Misura battito ogni 15 minuti automaticamente' },
      { code: 'hrtint,30', name: 'Auto Battito 30min', description: 'Misura battito ogni 30 minuti automaticamente' },
      { code: 'hrtint,60', name: 'Auto Battito 1 ora', description: 'Misura battito ogni ora automaticamente' },
      { code: 'hrtint,0', name: 'Disattiva Auto Battito', description: 'Disabilita misurazione automatica battito' },
      { code: 'bpint,30', name: 'Auto Pressione 30min', description: 'Misura pressione ogni 30 minuti automaticamente' },
      { code: 'bpint,60', name: 'Auto Pressione 1 ora', description: 'Misura pressione ogni ora automaticamente' },
      { code: 'bpint,0', name: 'Disattiva Auto Pressione', description: 'Disabilita misurazione automatica pressione' },
      { code: 'oxyint,30', name: 'Auto SpO2 30min', description: 'Misura ossigenazione ogni 30 minuti automaticamente' },
      { code: 'oxyint,60', name: 'Auto SpO2 1 ora', description: 'Misura ossigenazione ogni ora automaticamente' },
      { code: 'oxyint,0', name: 'Disattiva Auto SpO2', description: 'Disabilita misurazione automatica ossigenazione' },
      { code: 'btemp2int,60', name: 'Auto Temperatura 1 ora', description: 'Misura temperatura ogni ora automaticamente' },
      { code: 'btemp2int,0', name: 'Disattiva Auto Temp', description: 'Disabilita misurazione automatica temperatura' },
    ]
  },
  {
    name: 'Posizione GPS',
    icon: <MapPin className="w-5 h-5" />,
    commands: [
      { code: 'CR', name: 'Richiedi Posizione', description: 'Richiede posizione GPS corrente' },
      { code: 'UPLOAD,30', name: 'Upload 30 sec', description: 'Invia posizione ogni 30 secondi (alta precisione)', params: '30' },
      { code: 'UPLOAD,60', name: 'Upload 1 min', description: 'Invia posizione ogni 60 secondi', params: '60' },
      { code: 'UPLOAD,180', name: 'Upload 3 min', description: 'Invia posizione ogni 3 minuti', params: '180' },
      { code: 'UPLOAD,300', name: 'Upload 5 min', description: 'Invia posizione ogni 5 minuti', params: '300' },
      { code: 'UPLOAD,600', name: 'Upload 10 min', description: 'Invia posizione ogni 10 minuti (risparmio batteria)', params: '600' },
      { code: 'GPSOFF,0', name: 'GPS Sempre Attivo', description: 'Mantiene il GPS sempre attivo per massima precisione' },
      { code: 'GPSOFF,1', name: 'GPS in Risparmio', description: 'Spegne GPS tra una rilevazione e l\'altra' },
    ]
  },
  {
    name: 'Configurazione Dispositivo',
    icon: <Server className="w-5 h-5" />,
    commands: [
      { code: 'IP,91.99.141.225', name: 'Imposta IP Server', description: 'Configura IP del nostro server' },
      { code: 'PORT,8001', name: 'Imposta Porta', description: 'Configura porta TCP 8001' },
      { code: 'LZ,1,1.0', name: 'Timezone Italia (+1)', description: 'Imposta fuso orario italiano' },
      { code: 'LANG,12', name: 'Lingua Italiana', description: 'Imposta lingua italiana sull\'orologio' },
      { code: 'LANG,1', name: 'Lingua Inglese', description: 'Imposta lingua inglese sull\'orologio' },
    ]
  },
  {
    name: 'Numeri Emergenza',
    icon: <Phone className="w-5 h-5" />,
    commands: [
      { code: 'CENTER,', name: 'Numero Admin', description: 'Imposta numero amministratore (aggiungi numero)', params: 'NUMERO' },
      { code: 'SOS1,', name: 'SOS 1', description: 'Imposta primo numero SOS', params: 'NUMERO' },
      { code: 'SOS2,', name: 'SOS 2', description: 'Imposta secondo numero SOS', params: 'NUMERO' },
      { code: 'SOS3,', name: 'SOS 3', description: 'Imposta terzo numero SOS', params: 'NUMERO' },
    ]
  },
  {
    name: 'Controllo Sistema',
    icon: <Power className="w-5 h-5" />,
    commands: [
      { code: 'POWEROFF', name: 'Spegni', description: 'Spegne l\'orologio' },
      { code: 'RESET', name: 'Reset', description: 'Riavvia il dispositivo' },
      { code: 'FACTORY', name: 'Factory Reset', description: 'Ripristina impostazioni di fabbrica' },
    ]
  },
]

export default function CommandsPage() {
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [customCommand, setCustomCommand] = useState('')
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Stato Dispositivo')
  const [dbLogs, setDbLogs] = useState<DbLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [wearers, setWearers] = useState<Wearer[]>([])
  const logContainerRef = useRef<HTMLDivElement>(null)
  const logIdRef = useRef(0)
  const selectedDeviceRef = useRef<string>('')

  // Mantieni il ref sincronizzato con lo state
  useEffect(() => {
    selectedDeviceRef.current = selectedDevice
  }, [selectedDevice])

  // Fetch connected devices via local API proxy
  const fetchConnectedDevices = async () => {
    setRefreshing(true)
    try {
      // Ottieni dispositivi connessi dal server TCP
      const statusResponse = await fetch('/api/tcp/status')
      const statusData = await statusResponse.json()

      // Ottieni wearers (pazienti) dal database
      const wearersResponse = await fetch('/api/wearers')
      const wearersData = await wearersResponse.json()
      if (wearersData.wearers) {
        setWearers(wearersData.wearers)
      }

      if (statusData.connectedDevices && statusData.connectedDevices.length > 0) {
        // Ottieni dettagli dispositivi dal database
        const devicesResponse = await fetch('/api/devices')
        const devicesData = await devicesResponse.json()

        // Mappa i dispositivi connessi con i loro dettagli e info paziente
        const connectedWithDetails = statusData.connectedDevices.map((id: string) => {
          const deviceInfo = devicesData.devices?.find(
            (d: any) => d.device_id === id || d.imei === id || d.device_internal_id === id
          )
          // Trova il paziente associato al dispositivo
          const wearer = wearersData.wearers?.find(
            (w: any) => w.device_name === id || w.device_name === deviceInfo?.device_id
          )
          return {
            deviceId: id,
            imei: deviceInfo?.imei || id,
            phone_number: deviceInfo?.phone_number || null,
            wearer_nome: wearer?.nome || null,
            wearer_cognome: wearer?.cognome || null
          }
        })

        setConnectedDevices(connectedWithDetails)

        // Auto-select first device SOLO se non c'è già una selezione
        // e SOLO al primo caricamento (selectedDeviceRef è vuoto)
        if (!selectedDeviceRef.current && connectedWithDetails.length > 0) {
          setSelectedDevice(connectedWithDetails[0].deviceId)
        }
      } else {
        setConnectedDevices([])
      }
    } catch (error) {
      console.error('Errore fetch dispositivi:', error)
      addLog('SYSTEM', 'STATUS', 'Errore connessione al server TCP', false)
    } finally {
      setRefreshing(false)
    }
  }

  // Fetch logs from database
  const fetchDbLogs = async () => {
    setLoadingLogs(true)
    try {
      let url = '/api/tcp/logs?limit=500'
      if (selectedDevice) {
        url += `&deviceId=${selectedDevice}`
      }
      const response = await fetch(url)
      const data = await response.json()
      if (data.logs) {
        setDbLogs(data.logs)
      }
    } catch (error) {
      console.error('Errore fetch logs:', error)
    } finally {
      setLoadingLogs(false)
    }
  }

  // Add log entry
  const addLog = (deviceId: string, command: string, response: string, success: boolean) => {
    const newLog: CommandLog = {
      id: logIdRef.current++,
      timestamp: new Date().toLocaleTimeString('it-IT'),
      deviceId,
      command,
      response,
      success
    }
    setCommandLogs(prev => [newLog, ...prev].slice(0, 50)) // Keep last 50 logs
  }

  // Send TCP command
  const sendCommand = async (command: string) => {
    if (!selectedDevice) {
      addLog('N/A', command, 'Nessun dispositivo selezionato', false)
      return
    }

    setLoading(true)
    addLog(selectedDevice, command, 'Invio in corso...', true)

    try {
      const response = await fetch('/api/tcp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice,
          command: command,
          protocol: '3G'
        })
      })

      const data = await response.json()

      addLog(selectedDevice, command, data.message || JSON.stringify(data), data.success)

      // Ricarica i log dopo 2 secondi per vedere le risposte
      setTimeout(() => fetchDbLogs(), 2000)
    } catch (error: any) {
      addLog(selectedDevice, command, `Errore: ${error.message}`, false)
    } finally {
      setLoading(false)
    }
  }

  // Send custom command
  const handleSendCustom = () => {
    if (customCommand.trim()) {
      sendCommand(customCommand.trim())
      setCustomCommand('')
    }
  }

  // Auto-refresh connected devices and logs
  useEffect(() => {
    fetchConnectedDevices()
    fetchDbLogs()
    const interval = setInterval(() => {
      fetchConnectedDevices()
      fetchDbLogs()
    }, 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [selectedDevice]) // Ricarica quando cambia il paziente selezionato

  // Fetch logs when device changes
  useEffect(() => {
    if (selectedDevice) {
      fetchDbLogs()
    }
  }, [selectedDevice])

  // Scroll to top on new log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0
    }
  }, [commandLogs])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>
      </div>

      <Sidebar />

      <main className="ml-64 transition-all duration-300">
        {/* Header */}
        <header className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-white/10 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Terminal className="w-8 h-8 text-cyan-400" />
                Comandi TCP
              </h1>
              <p className="text-gray-400 mt-1">Invia comandi agli orologi connessi al server</p>
            </div>
            <button
              onClick={fetchConnectedDevices}
              disabled={refreshing}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </button>
          </div>
        </header>

        <div className="relative z-10 p-8">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

            {/* Left Column - Device Selection & Commands */}
            <div className="xl:col-span-2 space-y-4">

              {/* Device Selection Dropdown - Compact Version */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  {connectedDevices.length > 0 ? (
                    <Wifi className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}

                  {connectedDevices.length === 0 ? (
                    <p className="text-gray-400 text-sm flex-1">Nessun dispositivo connesso</p>
                  ) : (
                    <div className="relative flex-1">
                      <select
                        value={selectedDevice}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-cyan-500 pr-8"
                      >
                        <option value="" className="bg-slate-800">Seleziona paziente</option>
                        {connectedDevices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId} className="bg-slate-800">
                            {device.wearer_nome && device.wearer_cognome
                              ? `${device.wearer_nome} ${device.wearer_cognome}`
                              : device.phone_number
                                ? `${device.phone_number} (${device.deviceId})`
                                : device.deviceId
                            }
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  )}

                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                    connectedDevices.length > 0
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {connectedDevices.length}
                  </span>
                </div>
              </div>

              {/* Command Categories */}
              <div className="space-y-4">
                {commandCategories.map((category) => (
                  <div
                    key={category.name}
                    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden"
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => setExpandedCategory(
                        expandedCategory === category.name ? null : category.name
                      )}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-cyan-400">{category.icon}</div>
                        <span className="text-white font-semibold">{category.name}</span>
                        <span className="text-gray-500 text-sm">({category.commands.length} comandi)</span>
                      </div>
                      {expandedCategory === category.name ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {/* Commands */}
                    {expandedCategory === category.name && (
                      <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {category.commands.map((cmd) => (
                          <button
                            key={cmd.code}
                            onClick={() => sendCommand(cmd.code)}
                            disabled={loading || !selectedDevice}
                            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white font-semibold">{cmd.name}</span>
                              <code className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded font-mono">
                                {cmd.code}
                              </code>
                            </div>
                            <p className="text-gray-400 text-sm">{cmd.description}</p>
                            {loading && (
                              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin absolute top-2 right-2" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Custom Command */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  Comando Personalizzato
                </h2>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendCustom()}
                    placeholder="Es: CR, FIND, UPLOAD,300, hrtstart..."
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleSendCustom}
                    disabled={loading || !selectedDevice || !customCommand.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Invia
                  </button>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Formato: COMANDO o COMANDO,parametro1,parametro2
                </p>
              </div>
            </div>

            {/* Right Column - Database Logs */}
            <div className="xl:col-span-3">
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 sticky top-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Cronologia Comandi
                  </h2>
                  <button
                    onClick={fetchDbLogs}
                    disabled={loadingLogs}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-400 ${loadingLogs ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Layout a 2 colonne: Comandi Inviati | Risposte Ricevute */}
                {dbLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Terminal className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>Nessun comando registrato</p>
                    <p className="text-xs mt-1">I comandi appariranno qui</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Colonna SINISTRA: Comandi Inviati */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/30">
                        <span className="text-blue-400 font-semibold">📤 Comandi Inviati</span>
                      </div>
                      <div ref={logContainerRef} className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                        {dbLogs.filter(log => log.direction === 'sent').map((log) => {
                          const device = connectedDevices.find(d => d.deviceId === log.device_id)
                          const wearer = wearers.find(w => w.device_name === log.device_id)
                          const patientName = device?.wearer_nome && device?.wearer_cognome
                            ? `${device.wearer_nome} ${device.wearer_cognome}`
                            : wearer?.nome && wearer?.cognome
                              ? `${wearer.nome} ${wearer.cognome}`
                              : null

                          return (
                            <div key={log.id} className="p-3 rounded-lg border bg-blue-500/10 border-blue-500/30">
                              {patientName && (
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                                  <Watch className="w-3 h-3 text-purple-400" />
                                  <span className="text-white font-semibold text-xs">{patientName}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-cyan-400 font-mono text-sm font-bold">{log.command}</code>
                              </div>
                              <div className="text-gray-300 text-xs mb-1">
                                {commandDescriptions[log.command] || 'Comando personalizzato'}
                              </div>
                              <div className="text-gray-500 text-xs">
                                🕐 {new Date(log.created_at).toLocaleTimeString('it-IT')}
                              </div>
                              {log.data && (
                                <div className="mt-2 p-2 bg-black/30 rounded text-xs font-mono text-gray-400 break-all">
                                  {log.data.substring(0, 50)}{log.data.length > 50 ? '...' : ''}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Colonna DESTRA: Risposte Ricevute */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-500/30">
                        <span className="text-green-400 font-semibold">📥 Risposte Ricevute</span>
                      </div>
                      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                        {dbLogs.filter(log => log.direction === 'received').map((log) => {
                          const device = connectedDevices.find(d => d.deviceId === log.device_id)
                          const wearer = wearers.find(w => w.device_name === log.device_id)
                          const patientName = device?.wearer_nome && device?.wearer_cognome
                            ? `${device.wearer_nome} ${device.wearer_cognome}`
                            : wearer?.nome && wearer?.cognome
                              ? `${wearer.nome} ${wearer.cognome}`
                              : null

                          return (
                            <div key={log.id} className="p-3 rounded-lg border bg-green-500/10 border-green-500/30">
                              {patientName && (
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                                  <Watch className="w-3 h-3 text-purple-400" />
                                  <span className="text-white font-semibold text-xs">{patientName}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-cyan-400 font-mono text-sm font-bold">{log.command}</code>
                              </div>
                              <div className="text-gray-300 text-xs mb-1">
                                {commandDescriptions[log.command] || 'Risposta'}
                              </div>
                              <div className="text-gray-500 text-xs mb-2">
                                🕐 {new Date(log.created_at).toLocaleTimeString('it-IT')}
                              </div>

                              {/* Parser dati */}
                              {log.data && (() => {
                                // Parser GPS
                                const locationCommands = ['UD', 'UD2', 'UD_LTE', 'CR']
                                if (locationCommands.includes(log.command)) {
                                  const parsed = parseLocationData(log.data)
                                  if (parsed) {
                                    const isGpsUnreliable = parsed.satellites === 0 || !parsed.gpsValid
                                    return (
                                      <div className="mt-2 p-3 bg-black/30 rounded-lg space-y-2">
                                        {isGpsUnreliable && (
                                          <div className="flex items-center gap-2 p-2 bg-orange-500/20 border border-orange-500/40 rounded-lg text-orange-300 text-xs">
                                            ⚠️ GPS non affidabile ({parsed.satellites} satelliti)
                                          </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-300 text-xs">
                                            📍 {parsed.latitude.toFixed(6)}, {parsed.longitude.toFixed(6)}
                                          </span>
                                          <a
                                            href={parsed.mapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-xs"
                                          >
                                            🗺️ Mappa
                                          </a>
                                        </div>
                                        <div className="flex gap-2 text-xs text-gray-400">
                                          <span>🔋 {parsed.battery}%</span>
                                          <span>🛰️ {parsed.satellites}</span>
                                          <span>📶 {parsed.gsm}</span>
                                        </div>
                                      </div>
                                    )
                                  }
                                }

                                // Parser LK (keep-alive)
                                if (log.command === 'LK') {
                                  const lkData = parseLKData(log.data)
                                  if (lkData) {
                                    return (
                                      <div className="mt-2 p-2 bg-black/30 rounded-lg flex gap-3 text-xs">
                                        <span className="text-green-400">✓ Online</span>
                                        <span>🔋 {lkData.battery}%</span>
                                        <span>👣 {lkData.steps}</span>
                                      </div>
                                    )
                                  }
                                }

                                // Parser APPANDFNREPORT (app installate)
                                if (log.command === 'APPANDFNREPORT') {
                                  const apps = parseAppReport(log.data)
                                  if (apps) {
                                    return (
                                      <div className="mt-2 p-3 bg-black/30 rounded-lg space-y-2">
                                        <div className="text-cyan-400 text-xs font-semibold mb-2">📱 App Installate:</div>
                                        {apps.map((app, idx) => (
                                          <div key={idx} className="flex items-center gap-2 text-xs">
                                            <span className="text-gray-500">{app.code}:</span>
                                            <span className="text-white font-semibold">{app.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )
                                  }
                                }

                                // Fallback: dati raw
                                return (
                                  <div className="mt-2 p-2 bg-black/30 rounded text-xs font-mono text-gray-400 break-all">
                                    {log.data.substring(0, 100)}{log.data.length > 100 ? '...' : ''}
                                  </div>
                                )
                              })()}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-gray-500 text-xs text-center">
                    Aggiornamento automatico ogni 10 secondi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
