'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MessageSquare, Heart, MapPin, Terminal,
  RefreshCw, CheckCircle2, XCircle, Clock, Activity,
  Thermometer, Droplets, Watch, Send, Download, Timer,
  Zap, Gauge, AlertTriangle, Bell, Battery, FileText,
  Filter, Calendar, User, TrendingUp, ChevronDown,
  Shield, Wifi, WifiOff, Footprints, Navigation, Target,
  Circle, Phone, Play, Square, Loader2, ExternalLink
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'

type LogEntry = {
  id: number
  log_type: 'sms' | 'health' | 'location' | 'tcp_command'
  created_at: string
  phone_number?: string
  direction?: string
  message?: string
  command_type?: string
  status?: string
  imei?: string
  heart_rate?: number
  systolic_bp?: number
  diastolic_bp?: number
  spo2?: number
  temperature?: number
  latitude?: number
  longitude?: number
  altitude?: number
  speed?: number
  battery?: number
  satellites?: number
  gps_valid?: boolean
  command?: string
  data?: string
}

type Alert = {
  id: string
  type: 'sos' | 'fall' | 'low_battery' | 'abnormal_health' | 'geofence' | 'offline'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  patientName: string
  timestamp: string
  value?: string
}

type Patient = {
  id: number
  nome: string
  cognome: string
  telefono?: string
  device_phone?: string
  imei?: string
  device_id?: number
  last_latitude?: number
  last_longitude?: number
}

type Stats = {
  sms: number
  health: number
  locations: number
  tcp_commands: number
  total: number
}

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'reports' | 'debug' | 'location'>('alerts')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [stats, setStats] = useState<Stats>({ sms: 0, health: 0, locations: 0, tcp_commands: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedPatient, setSelectedPatient] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [tcpStatus, setTcpStatus] = useState<{ totalConnections: number, connectedDevices: string[] } | null>(null)

  // Location tab state
  const [locationPatient, setLocationPatient] = useState<string>('')
  const [sendingCommand, setSendingCommand] = useState<string | null>(null)
  const [commandResult, setCommandResult] = useState<{ success: boolean; message: string } | null>(null)
  const [geofenceRadius, setGeofenceRadius] = useState<number>(500)
  const [geofenceEnabled, setGeofenceEnabled] = useState<boolean>(false)

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs/all')
      const data = await response.json()
      if (data.success) {
        setLogs(data.logs)
        setStats(data.stats)
        generateAlerts(data.logs)
      }
    } catch (error) {
      console.error('Errore caricamento log:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/monitoring')
      const data = await response.json()
      if (data.success) {
        setPatients(data.patients.map((p: any) => ({
          id: p.id,
          nome: p.nome,
          cognome: p.cognome,
          telefono: p.telefono,
          device_phone: p.telefono,
          imei: p.imei,
          last_latitude: p.location?.latitude,
          last_longitude: p.location?.longitude
        })))
      }
    } catch (error) {
      console.error('Errore caricamento pazienti:', error)
    }
  }

  // Converte IMEI 15 cifre nel formato device ID TCP (10 cifre, posizioni 4-13)
  const imeiToTcpDeviceId = (imei: string): string => {
    if (imei.length === 15) {
      return imei.substring(4, 14)
    }
    return imei // Se già nel formato corto, usa così com'è
  }

  const sendTcpCommand = async (command: string, patientImei: string) => {
    setSendingCommand(command)
    setCommandResult(null)
    try {
      const tcpDeviceId = imeiToTcpDeviceId(patientImei)
      console.log(`Invio comando ${command} a device ${tcpDeviceId} (IMEI: ${patientImei})`)

      const response = await fetch('/api/tcp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: tcpDeviceId,
          command: command
        })
      })
      const data = await response.json()
      if (data.success) {
        setCommandResult({ success: true, message: `Comando ${command} inviato con successo` })
        // Dopo invio comando posizione, aggiorna i dati del paziente dopo qualche secondo
        if (command === 'UD' || command === 'UD2') {
          setTimeout(() => fetchPatients(), 3000)
        }
      } else {
        setCommandResult({ success: false, message: data.message || data.error || 'Errore invio comando' })
      }
    } catch (error) {
      setCommandResult({ success: false, message: 'Errore di connessione' })
    } finally {
      setSendingCommand(null)
    }
  }

  const getSelectedPatientData = () => {
    return patients.find(p => p.id.toString() === locationPatient)
  }

  const fetchTcpStatus = async () => {
    try {
      const response = await fetch('/api/tcp/send')
      const data = await response.json()
      if (data.connectedDevices) {
        setTcpStatus(data)
      } else {
        setTcpStatus(null)
      }
    } catch (error) {
      setTcpStatus(null)
    }
  }

  const generateAlerts = (logsData: LogEntry[]) => {
    const newAlerts: Alert[] = []

    logsData.forEach((log, index) => {
      // Low battery alerts
      if (log.log_type === 'location' && log.battery && log.battery < 20) {
        newAlerts.push({
          id: `battery-${log.id}`,
          type: 'low_battery',
          severity: log.battery < 10 ? 'critical' : 'warning',
          title: 'Batteria Scarica',
          description: `Livello batteria: ${log.battery}%`,
          patientName: getPatientByImei(log.imei || '') || 'Dispositivo sconosciuto',
          timestamp: log.created_at,
          value: `${log.battery}%`
        })
      }

      // Abnormal heart rate
      if (log.log_type === 'health' && log.heart_rate) {
        if (log.heart_rate < 50 || log.heart_rate > 120) {
          newAlerts.push({
            id: `hr-${log.id}`,
            type: 'abnormal_health',
            severity: log.heart_rate < 40 || log.heart_rate > 140 ? 'critical' : 'warning',
            title: log.heart_rate < 50 ? 'Bradicardia' : 'Tachicardia',
            description: `Frequenza cardiaca: ${log.heart_rate} bpm`,
            patientName: getPatientByImei(log.imei || '') || 'Dispositivo sconosciuto',
            timestamp: log.created_at,
            value: `${log.heart_rate} bpm`
          })
        }
      }

      // Abnormal SpO2
      if (log.log_type === 'health' && log.spo2 && log.spo2 < 95) {
        newAlerts.push({
          id: `spo2-${log.id}`,
          type: 'abnormal_health',
          severity: log.spo2 < 90 ? 'critical' : 'warning',
          title: 'SpO2 Basso',
          description: `Saturazione ossigeno: ${log.spo2}%`,
          patientName: getPatientByImei(log.imei || '') || 'Dispositivo sconosciuto',
          timestamp: log.created_at,
          value: `${log.spo2}%`
        })
      }

      // High blood pressure
      if (log.log_type === 'health' && log.systolic_bp && log.systolic_bp > 140) {
        newAlerts.push({
          id: `bp-${log.id}`,
          type: 'abnormal_health',
          severity: log.systolic_bp > 180 ? 'critical' : 'warning',
          title: 'Pressione Alta',
          description: `Pressione: ${log.systolic_bp}/${log.diastolic_bp} mmHg`,
          patientName: getPatientByImei(log.imei || '') || 'Dispositivo sconosciuto',
          timestamp: log.created_at,
          value: `${log.systolic_bp}/${log.diastolic_bp}`
        })
      }

      // SOS command detection
      if (log.log_type === 'tcp_command' && log.command === 'AL') {
        newAlerts.push({
          id: `sos-${log.id}`,
          type: 'sos',
          severity: 'critical',
          title: 'SOS Premuto!',
          description: 'Il paziente ha premuto il pulsante SOS',
          patientName: getPatientByImei(log.imei || '') || 'Dispositivo sconosciuto',
          timestamp: log.created_at
        })
      }
    })

    // Sort by timestamp descending
    newAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setAlerts(newAlerts.slice(0, 50)) // Keep last 50 alerts
  }

  const getPatientByImei = (imei: string): string | null => {
    const patient = patients.find(p => p.imei === imei)
    return patient ? `${patient.nome} ${patient.cognome}` : null
  }

  useEffect(() => {
    fetchLogs()
    fetchPatients()
    fetchTcpStatus()

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLogs()
        fetchTcpStatus()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
    if (parts) {
      const [, year, month, day, hour, minute, second] = parts
      return `${day}/${month}/${year}, ${hour}:${minute}:${second}`
    }
    const date = new Date(dateStr)
    return date.toLocaleString('it-IT')
  }

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.log_type !== filter) return false
    if (selectedPatient !== 'all') {
      const patient = patients.find(p => p.id.toString() === selectedPatient)
      if (patient && log.imei !== patient.imei) return false
    }
    return true
  })

  const exportToCSV = () => {
    const headers = ['Data', 'Tipo', 'Paziente', 'Battito', 'Pressione', 'SpO2', 'Temperatura', 'Batteria', 'Posizione']
    const rows = filteredLogs.map(log => [
      formatDate(log.created_at),
      log.log_type,
      getPatientByImei(log.imei || '') || log.imei || '-',
      log.heart_rate || '-',
      log.systolic_bp ? `${log.systolic_bp}/${log.diastolic_bp}` : '-',
      log.spo2 || '-',
      log.temperature || '-',
      log.battery || '-',
      log.latitude ? `${log.latitude},${log.longitude}` : '-'
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `log-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 border-red-500/50 text-red-300'
      case 'warning': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
      default: return 'bg-blue-500/20 border-blue-500/50 text-blue-300'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'sos': return <AlertTriangle className="w-5 h-5" />
      case 'fall': return <Activity className="w-5 h-5" />
      case 'low_battery': return <Battery className="w-5 h-5" />
      case 'abnormal_health': return <Heart className="w-5 h-5" />
      case 'geofence': return <MapPin className="w-5 h-5" />
      case 'offline': return <WifiOff className="w-5 h-5" />
      default: return <Bell className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>
      </div>

      <Sidebar />

      <main className="ml-64 transition-all duration-300">
        {/* Header */}
        <header className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-white/10 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <ArrowLeft className="w-6 h-6 text-white" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Log & Monitoraggio</h1>
                <p className="text-gray-400 text-sm">Allarmi, Report e Debug</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {tcpStatus && (
                <div className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 ${
                  (tcpStatus?.totalConnections ?? 0) > 0
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  <Watch className="w-4 h-4" />
                  {(tcpStatus?.totalConnections ?? 0) > 0
                    ? `${tcpStatus.totalConnections} Online`
                    : 'Nessuno Online'}
                </div>
              )}

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                  autoRefresh
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-white/10 text-gray-400 border border-white/20'
                }`}
              >
                <Clock className="w-4 h-4" />
                {autoRefresh ? 'Auto ON' : 'Auto OFF'}
              </button>

              <button
                onClick={() => { fetchLogs(); fetchTcpStatus(); }}
                disabled={loading}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Aggiorna
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'alerts'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Bell className="w-5 h-5" />
              Allarmi & Eventi
              {alerts.filter(a => a.severity === 'critical').length > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {alerts.filter(a => a.severity === 'critical').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'reports'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <FileText className="w-5 h-5" />
              Report & Esportazione
            </button>

            <button
              onClick={() => setActiveTab('debug')}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'debug'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Terminal className="w-5 h-5" />
              Log Tecnico
            </button>

            <button
              onClick={() => setActiveTab('location')}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'location'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Navigation className="w-5 h-5" />
              Dove si trova?
            </button>
          </div>
        </header>

        <div className="relative z-10 p-6">
          {/* TAB 1: Allarmi & Eventi */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                    <div>
                      <p className="text-3xl font-bold text-white">{alerts.filter(a => a.severity === 'critical').length}</p>
                      <p className="text-red-300 text-sm">Critici</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="w-8 h-8 text-yellow-400" />
                    <div>
                      <p className="text-3xl font-bold text-white">{alerts.filter(a => a.severity === 'warning').length}</p>
                      <p className="text-yellow-300 text-sm">Avvisi</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="text-3xl font-bold text-white">{stats.health}</p>
                      <p className="text-blue-300 text-sm">Letture Salute</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-3xl font-bold text-white">{stats.locations}</p>
                      <p className="text-green-300 text-sm">Posizioni GPS</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerts List */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Bell className="w-5 h-5 text-red-400" />
                    Ultimi Allarmi & Eventi
                  </h3>
                </div>
                <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <p className="text-gray-400">Nessun allarme attivo</p>
                      <p className="text-gray-500 text-sm">Tutti i parametri sono nella norma</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className={`p-4 ${alert.severity === 'critical' ? 'bg-red-500/5' : ''}`}>
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-white font-semibold">{alert.title}</h4>
                              <span className={`px-2 py-0.5 text-xs rounded ${getSeverityColor(alert.severity)}`}>
                                {alert.severity === 'critical' ? 'CRITICO' : alert.severity === 'warning' ? 'AVVISO' : 'INFO'}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm">{alert.description}</p>
                            <p className="text-gray-500 text-xs mt-1">
                              <User className="w-3 h-3 inline mr-1" />
                              {alert.patientName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 text-xs">{formatShortDate(alert.timestamp)}</p>
                            {alert.value && (
                              <p className="text-white font-mono text-lg mt-1">{alert.value}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Report & Esportazione */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-400" />
                    <select
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="all">Tutti i pazienti</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id.toString()}>{p.nome} {p.cognome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="all">Tutti i tipi</option>
                      <option value="health">Solo Salute</option>
                      <option value="location">Solo GPS</option>
                      <option value="sms">Solo SMS</option>
                    </select>
                  </div>

                  <div className="flex-1" />

                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded-xl font-semibold transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Esporta CSV
                  </button>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <Heart className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.health}</p>
                  <p className="text-gray-400 text-sm">Dati Salute</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <MapPin className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.locations}</p>
                  <p className="text-gray-400 text-sm">Posizioni GPS</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <MessageSquare className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.sms}</p>
                  <p className="text-gray-400 text-sm">SMS</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <Activity className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-gray-400 text-sm">Totale Log</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-white font-semibold">
                    Dati Filtrati ({filteredLogs.length} record)
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Data</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Paziente</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Battito</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Pressione</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">SpO2</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Temp</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Batteria</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredLogs.slice(0, 100).map((log) => (
                        <tr key={`${log.log_type}-${log.id}`} className="hover:bg-white/5">
                          <td className="px-4 py-3 text-xs text-gray-300">{formatShortDate(log.created_at)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded ${
                              log.log_type === 'health' ? 'bg-pink-500/20 text-pink-300' :
                              log.log_type === 'location' ? 'bg-green-500/20 text-green-300' :
                              log.log_type === 'sms' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-purple-500/20 text-purple-300'
                            }`}>
                              {log.log_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-white">
                            {getPatientByImei(log.imei || '') || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-white font-mono">{log.heart_rate || '-'}</td>
                          <td className="px-4 py-3 text-sm text-white font-mono">
                            {log.systolic_bp ? `${log.systolic_bp}/${log.diastolic_bp}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-white font-mono">{log.spo2 ? `${log.spo2}%` : '-'}</td>
                          <td className="px-4 py-3 text-sm text-white font-mono">{log.temperature ? `${log.temperature}°` : '-'}</td>
                          <td className="px-4 py-3 text-sm text-white font-mono">{log.battery ? `${log.battery}%` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Log Tecnico/Debug */}
          {activeTab === 'debug' && (
            <div className="space-y-4">
              {/* Filter buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    filter === 'all' ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Tutti ({stats.total})
                </button>
                <button
                  onClick={() => setFilter('tcp_command')}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    filter === 'tcp_command' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  TCP ({stats.tcp_commands})
                </button>
                <button
                  onClick={() => setFilter('sms')}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    filter === 'sms' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  SMS ({stats.sms})
                </button>
                <button
                  onClick={() => setFilter('health')}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    filter === 'health' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  Salute ({stats.health})
                </button>
                <button
                  onClick={() => setFilter('location')}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    filter === 'location' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  GPS ({stats.locations})
                </button>
              </div>

              {/* Raw Logs */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-purple-400" />
                    Log Raw / Debug
                  </h3>
                  <span className="text-gray-500 text-sm">{filteredLogs.length} record</span>
                </div>
                <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto font-mono text-sm">
                  {filteredLogs.slice(0, 200).map((log) => (
                    <div key={`${log.log_type}-${log.id}`} className="p-3 hover:bg-white/5">
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          log.log_type === 'tcp_command' ? 'bg-purple-500/20 text-purple-300' :
                          log.log_type === 'health' ? 'bg-pink-500/20 text-pink-300' :
                          log.log_type === 'location' ? 'bg-green-500/20 text-green-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {log.log_type}
                        </span>
                        <span className="text-gray-500 text-xs">{formatDate(log.created_at)}</span>
                        <span className="text-gray-600 text-xs">IMEI: {log.imei || '-'}</span>
                      </div>
                      <div className="mt-1 text-gray-300 break-all">
                        {log.log_type === 'tcp_command' && (
                          <span><span className="text-purple-400">{log.command}</span>: {log.data}</span>
                        )}
                        {log.log_type === 'sms' && (
                          <span><span className="text-blue-400">{log.direction}</span> {log.phone_number}: {log.message}</span>
                        )}
                        {log.log_type === 'health' && (
                          <span>HR:{log.heart_rate} BP:{log.systolic_bp}/{log.diastolic_bp} SpO2:{log.spo2} T:{log.temperature}</span>
                        )}
                        {log.log_type === 'location' && (
                          <span>LAT:{log.latitude} LNG:{log.longitude} SPD:{log.speed} BAT:{log.battery}% SAT:{log.satellites}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Dove si trova? */}
          {activeTab === 'location' && (
            <div className="space-y-6">
              {/* Patient Selection */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-cyan-400" />
                  Seleziona Paziente
                </h3>
                <select
                  value={locationPatient}
                  onChange={(e) => {
                    setLocationPatient(e.target.value)
                    setCommandResult(null)
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-lg"
                >
                  <option value="">-- Seleziona un paziente --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id.toString()}>
                      {p.cognome} {p.nome} - {p.telefono || p.device_phone || 'N/D'}
                    </option>
                  ))}
                </select>

                {/* Selected patient info */}
                {locationPatient && getSelectedPatientData() && (
                  <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">
                          {getSelectedPatientData()?.nome} {getSelectedPatientData()?.cognome}
                        </p>
                        <p className="text-cyan-300 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {getSelectedPatientData()?.telefono || getSelectedPatientData()?.device_phone || 'Telefono non disponibile'}
                        </p>
                        {getSelectedPatientData()?.imei && (
                          <p className="text-gray-400 text-sm">IMEI: {getSelectedPatientData()?.imei}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Location Commands */}
              {locationPatient && getSelectedPatientData()?.imei && (
                <>
                  {/* Command Result */}
                  {commandResult && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${
                      commandResult.success
                        ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                        : 'bg-red-500/20 border border-red-500/30 text-red-300'
                    }`}>
                      {commandResult.success ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      {commandResult.message}
                    </div>
                  )}

                  {/* Last Known Position */}
                  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-green-400" />
                      Ultima Posizione Conosciuta
                    </h3>
                    {getSelectedPatientData()?.last_latitude && getSelectedPatientData()?.last_longitude ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-gray-400 text-sm">Latitudine</p>
                            <p className="text-white font-mono text-lg">{getSelectedPatientData()?.last_latitude}</p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-gray-400 text-sm">Longitudine</p>
                            <p className="text-white font-mono text-lg">{getSelectedPatientData()?.last_longitude}</p>
                          </div>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${getSelectedPatientData()?.last_latitude},${getSelectedPatientData()?.last_longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded-xl font-semibold transition-all"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Apri in Google Maps
                        </a>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">Nessuna posizione disponibile</p>
                        <p className="text-gray-500 text-sm">Richiedi la posizione tramite i comandi TCP</p>
                      </div>
                    )}
                  </div>

                  {/* TCP Location Commands */}
                  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                      <Navigation className="w-5 h-5 text-cyan-400" />
                      Comandi Localizzazione
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => sendTcpCommand('UD', getSelectedPatientData()!.imei!)}
                        disabled={sendingCommand !== null}
                        className="p-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-xl transition-all disabled:opacity-50"
                      >
                        <div className="flex items-center justify-center gap-3">
                          {sendingCommand === 'UD' ? (
                            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                          ) : (
                            <Navigation className="w-6 h-6 text-cyan-400" />
                          )}
                          <div className="text-left">
                            <p className="text-white font-semibold">Richiedi Posizione</p>
                            <p className="text-gray-400 text-sm">Comando UD</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => sendTcpCommand('UD2', getSelectedPatientData()!.imei!)}
                        disabled={sendingCommand !== null}
                        className="p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all disabled:opacity-50"
                      >
                        <div className="flex items-center justify-center gap-3">
                          {sendingCommand === 'UD2' ? (
                            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                          ) : (
                            <Target className="w-6 h-6 text-blue-400" />
                          )}
                          <div className="text-left">
                            <p className="text-white font-semibold">Posizione Dettagliata</p>
                            <p className="text-gray-400 text-sm">Comando UD2</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Geofence Configuration */}
                  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                      <Circle className="w-5 h-5 text-orange-400" />
                      Configurazione Geofence
                    </h3>

                    {/* Geofence Status */}
                    <div className="flex items-center justify-between mb-6 p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${geofenceEnabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <span className="text-white font-medium">
                          Geofence {geofenceEnabled ? 'Attivo' : 'Disattivo'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            sendTcpCommand('FENCE,ON', getSelectedPatientData()!.imei!)
                            setGeofenceEnabled(true)
                          }}
                          disabled={sendingCommand !== null || geofenceEnabled}
                          className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                            geofenceEnabled
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          } disabled:opacity-50`}
                        >
                          {sendingCommand === 'FENCE,ON' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          Attiva
                        </button>
                        <button
                          onClick={() => {
                            sendTcpCommand('FENCE,OFF', getSelectedPatientData()!.imei!)
                            setGeofenceEnabled(false)
                          }}
                          disabled={sendingCommand !== null || !geofenceEnabled}
                          className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                            !geofenceEnabled
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          } disabled:opacity-50`}
                        >
                          {sendingCommand === 'FENCE,OFF' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                          Disattiva
                        </button>
                      </div>
                    </div>

                    {/* Geofence Radius */}
                    <div className="mb-6">
                      <label className="block text-gray-400 text-sm mb-2">
                        Raggio Geofence: <span className="text-white font-semibold">{geofenceRadius} metri</span>
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="2000"
                        step="100"
                        value={geofenceRadius}
                        onChange={(e) => setGeofenceRadius(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>100m</span>
                        <span>500m</span>
                        <span>1000m</span>
                        <span>1500m</span>
                        <span>2000m</span>
                      </div>
                    </div>

                    {/* Set Geofence Center */}
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          // CR command sets center at current position
                          sendTcpCommand(`CR`, getSelectedPatientData()!.imei!)
                        }}
                        disabled={sendingCommand !== null}
                        className="p-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-xl transition-all disabled:opacity-50"
                      >
                        <div className="flex items-center justify-center gap-3">
                          {sendingCommand === 'CR' ? (
                            <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                          ) : (
                            <Target className="w-6 h-6 text-orange-400" />
                          )}
                          <div className="text-left">
                            <p className="text-white font-semibold">Imposta Centro</p>
                            <p className="text-gray-400 text-sm">Posizione attuale come centro</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          // Send PHB command to set geofence radius
                          sendTcpCommand(`PHB,${geofenceRadius}`, getSelectedPatientData()!.imei!)
                        }}
                        disabled={sendingCommand !== null}
                        className="p-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl transition-all disabled:opacity-50"
                      >
                        <div className="flex items-center justify-center gap-3">
                          {sendingCommand?.startsWith('PHB') ? (
                            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                          ) : (
                            <Circle className="w-6 h-6 text-purple-400" />
                          )}
                          <div className="text-left">
                            <p className="text-white font-semibold">Imposta Raggio</p>
                            <p className="text-gray-400 text-sm">{geofenceRadius}m</p>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Info box */}
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                      <p className="text-yellow-300 text-sm flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Nota:</strong> Il geofence genera un allarme quando il dispositivo esce dall'area configurata.
                          Assicurati di impostare prima il centro e poi il raggio desiderato.
                        </span>
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* No patient selected message */}
              {!locationPatient && (
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center">
                  <Navigation className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white font-semibold text-xl mb-2">Seleziona un Paziente</h3>
                  <p className="text-gray-400">
                    Scegli un paziente dal menu sopra per visualizzare la sua posizione e inviare comandi TCP.
                  </p>
                </div>
              )}

              {/* Patient without device */}
              {locationPatient && !getSelectedPatientData()?.imei && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
                  <WifiOff className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold text-xl mb-2">Dispositivo Non Associato</h3>
                  <p className="text-gray-400">
                    Questo paziente non ha un dispositivo GPS associato.
                    Configura prima un orologio GPS per poter tracciare la posizione.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
