'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Heart,
  Activity,
  Thermometer,
  Wind,
  RefreshCw,
  Watch,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  User
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'

interface HealthRecord {
  id: number
  device_id: string
  imei: string
  heart_rate: number | null
  systolic_bp: number | null
  diastolic_bp: number | null
  spo2: number | null
  temperature: number | null
  temperature_mode: string | null
  recorded_at: string
  created_at: string
  phone_number: string | null
  model: string | null
}

interface HealthStats {
  total_records: string
  devices: string
  avg_heart_rate: string
  avg_systolic: string
  avg_diastolic: string
  avg_spo2: string
  avg_temperature: string
  first_record: string
  last_record: string
}

interface Wearer {
  id: number
  nome: string
  cognome: string
  device_imei: string | null
}

export default function HealthDashboard() {
  const [data, setData] = useState<HealthRecord[]>([])
  const [stats, setStats] = useState<HealthStats | null>(null)
  const [latest, setLatest] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [wearers, setWearers] = useState<Wearer[]>([])
  const [selectedWearer, setSelectedWearer] = useState<string>('')

  // Fetch wearers all'avvio
  useEffect(() => {
    const fetchWearers = async () => {
      try {
        const response = await fetch('/api/wearers')
        const result = await response.json()
        if (result.success) {
          setWearers(result.wearers)
        }
      } catch (err) {
        console.error('Errore caricamento pazienti:', err)
      }
    }
    fetchWearers()
  }, [])

  const fetchHealthData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '50' })
      // Usa l'IMEI del paziente selezionato
      if (selectedWearer) params.set('imei', selectedWearer)

      const response = await fetch(`/api/health-data?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setStats(result.stats)
        setLatest(result.latest)
        setError(null)
      } else {
        setError(result.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedWearer])

  useEffect(() => {
    fetchHealthData()

    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 10000) // Refresh ogni 10 secondi
      return () => clearInterval(interval)
    }
  }, [fetchHealthData, autoRefresh])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    // Timestamps are already converted to Rome timezone by the API
    const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
    if (parts) {
      const [, , month, day, hour, minute] = parts
      return `${day}/${month}, ${hour}:${minute}`
    }
    // Fallback
    return new Date(dateStr).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getHeartRateStatus = (hr: number) => {
    if (hr < 60) return { color: 'text-blue-400', status: 'Bassa', icon: TrendingDown }
    if (hr > 100) return { color: 'text-red-400', status: 'Alta', icon: TrendingUp }
    return { color: 'text-green-400', status: 'Normale', icon: Activity }
  }

  const getBPStatus = (systolic: number, diastolic: number) => {
    if (systolic > 140 || diastolic > 90) return { color: 'text-red-400', status: 'Alta' }
    if (systolic < 90 || diastolic < 60) return { color: 'text-blue-400', status: 'Bassa' }
    return { color: 'text-green-400', status: 'Normale' }
  }

  const getSpo2Status = (spo2: number) => {
    if (spo2 < 90) return { color: 'text-red-400', status: 'Critica' }
    if (spo2 < 95) return { color: 'text-yellow-400', status: 'Bassa' }
    return { color: 'text-green-400', status: 'Normale' }
  }

  const getTempStatus = (temp: number) => {
    if (temp > 37.5) return { color: 'text-red-400', status: 'Febbre' }
    if (temp < 36) return { color: 'text-blue-400', status: 'Bassa' }
    return { color: 'text-green-400', status: 'Normale' }
  }

  // Trova l'ultimo valore per ogni tipo
  const getLatestOfType = (type: 'heart' | 'bp' | 'spo2' | 'temp') => {
    for (const record of data) {
      if (type === 'heart' && record.heart_rate) return record
      if (type === 'bp' && record.systolic_bp) return record
      if (type === 'spo2' && record.spo2) return record
      if (type === 'temp' && record.temperature) return record
    }
    return null
  }

  const latestHeart = getLatestOfType('heart')
  const latestBP = getLatestOfType('bp')
  const latestSpo2 = getLatestOfType('spo2')
  const latestTemp = getLatestOfType('temp')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          Caricamento dati sanitari...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Sidebar />
      <main className="ml-64 p-6">
      {/* Dropdown Pazienti */}
      <div className="mb-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-4">
            <User className="w-5 h-5 text-purple-400" />
            <label className="text-gray-300 font-medium">Paziente:</label>
            <select
              value={selectedWearer}
              onChange={(e) => setSelectedWearer(e.target.value)}
              className="flex-1 max-w-md bg-slate-800/50 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Tutti i pazienti</option>
              {wearers.filter(w => w.device_imei).map((wearer) => (
                <option key={wearer.id} value={wearer.device_imei || ''}>
                  {wearer.cognome} {wearer.nome}
                </option>
              ))}
            </select>
            {selectedWearer && (
              <span className="text-sm text-gray-400">
                IMEI: {selectedWearer}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-400" />
            Dashboard Dati Sanitari
          </h1>
          <p className="text-gray-400 mt-1">
            {selectedWearer
              ? `Dati di ${wearers.find(w => w.device_imei === selectedWearer)?.nome || ''} ${wearers.find(w => w.device_imei === selectedWearer)?.cognome || ''}`
              : 'Monitoraggio salute in tempo reale - Tutti i pazienti'
            }
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              autoRefresh
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>

          <button
            onClick={fetchHealthData}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg flex items-center gap-2 hover:bg-blue-500/30 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Aggiorna
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Frequenza Cardiaca */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-400" />
            </div>
            {latestHeart?.heart_rate && (
              <span className={`text-sm font-medium ${getHeartRateStatus(latestHeart.heart_rate).color}`}>
                {getHeartRateStatus(latestHeart.heart_rate).status}
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {latestHeart?.heart_rate || '-'}
            <span className="text-lg text-gray-400 ml-1">bpm</span>
          </div>
          <div className="text-sm text-gray-400">Frequenza Cardiaca</div>
          {latestHeart && (
            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(latestHeart.recorded_at)}
            </div>
          )}
        </div>

        {/* Pressione Sanguigna */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
            {latestBP?.systolic_bp && latestBP?.diastolic_bp && (
              <span className={`text-sm font-medium ${getBPStatus(latestBP.systolic_bp, latestBP.diastolic_bp).color}`}>
                {getBPStatus(latestBP.systolic_bp, latestBP.diastolic_bp).status}
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {latestBP?.systolic_bp || '-'}/{latestBP?.diastolic_bp || '-'}
            <span className="text-lg text-gray-400 ml-1">mmHg</span>
          </div>
          <div className="text-sm text-gray-400">Pressione Arteriosa</div>
          {latestBP && (
            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(latestBP.recorded_at)}
            </div>
          )}
        </div>

        {/* SpO2 */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Wind className="w-6 h-6 text-blue-400" />
            </div>
            {latestSpo2?.spo2 && (
              <span className={`text-sm font-medium ${getSpo2Status(latestSpo2.spo2).color}`}>
                {getSpo2Status(latestSpo2.spo2).status}
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {latestSpo2?.spo2 || '-'}
            <span className="text-lg text-gray-400 ml-1">%</span>
          </div>
          <div className="text-sm text-gray-400">Saturazione Ossigeno</div>
          {latestSpo2 && (
            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(latestSpo2.recorded_at)}
            </div>
          )}
        </div>

        {/* Temperatura */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Thermometer className="w-6 h-6 text-orange-400" />
            </div>
            {latestTemp?.temperature && (
              <span className={`text-sm font-medium ${getTempStatus(latestTemp.temperature).color}`}>
                {getTempStatus(latestTemp.temperature).status}
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {latestTemp?.temperature || '-'}
            <span className="text-lg text-gray-400 ml-1">°C</span>
          </div>
          <div className="text-sm text-gray-400">Temperatura Corporea</div>
          {latestTemp && (
            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(latestTemp.recorded_at)}
            </div>
          )}
        </div>
      </div>

      {/* Statistiche Medie */}
      {stats && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Statistiche Medie
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{stats.avg_heart_rate || '-'}</div>
              <div className="text-sm text-gray-400">Media BPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.avg_systolic || '-'}/{stats.avg_diastolic || '-'}</div>
              <div className="text-sm text-gray-400">Media Pressione</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.avg_spo2 || '-'}%</div>
              <div className="text-sm text-gray-400">Media SpO2</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{stats.avg_temperature || '-'}°</div>
              <div className="text-sm text-gray-400">Media Temp</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.total_records}</div>
              <div className="text-sm text-gray-400">Misurazioni</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabella Storico */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Storico Misurazioni
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Data/Ora</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Dispositivo</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                  <Heart className="w-4 h-4 inline mr-1 text-red-400" />BPM
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                  <Activity className="w-4 h-4 inline mr-1 text-purple-400" />Pressione
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                  <Wind className="w-4 h-4 inline mr-1 text-blue-400" />SpO2
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                  <Thermometer className="w-4 h-4 inline mr-1 text-orange-400" />Temp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Nessun dato sanitario disponibile
                  </td>
                </tr>
              ) : (
                data.map((record) => (
                  <tr key={record.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {formatDate(record.recorded_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Watch className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-mono text-gray-300">{record.imei}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {record.heart_rate ? (
                        <span className={`font-semibold ${getHeartRateStatus(record.heart_rate).color}`}>
                          {record.heart_rate}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {record.systolic_bp && record.diastolic_bp ? (
                        <span className={`font-semibold ${getBPStatus(record.systolic_bp, record.diastolic_bp).color}`}>
                          {record.systolic_bp}/{record.diastolic_bp}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {record.spo2 ? (
                        <span className={`font-semibold ${getSpo2Status(record.spo2).color}`}>
                          {record.spo2}%
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {record.temperature ? (
                        <span className={`font-semibold ${getTempStatus(record.temperature).color}`}>
                          {record.temperature}°
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </main>
    </div>
  )
}
