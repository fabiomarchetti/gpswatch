'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Activity, Heart, Thermometer, Droplets, Battery,
  RefreshCw, Clock, User, Phone, AlertTriangle,
  MapPin, Footprints, ChevronRight, X
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'

interface Patient {
  id: number
  nome: string
  cognome: string
  nomeCompleto: string
  foto: string | null
  telefono: string | null
  dataNascita: string | null
  sesso: string | null
  gruppoSanguigno: string | null
  allergie: string | null
  patologie: string | null
  emergenzaNome: string | null
  emergenzaTelefono: string | null
  deviceModel: string
  hasDevice: boolean
  isOnline: boolean
  lastSeen: string | null
  health: {
    heartRate: number | null
    systolicBp: number | null
    diastolicBp: number | null
    spo2: number | null
    temperature: number | null
    recordedAt: string | null
  }
  location: {
    latitude: number | null
    longitude: number | null
    gpsValid: boolean | null
    recordedAt: string | null
  }
  battery: number | null
  steps: number | null
}

interface Stats {
  totalPatients: number
  online: number
  offline: number
  withDevice: number
  withoutDevice: number
}

export default function MonitoringPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const fetchData = async () => {
    try {
      const response = await fetch('/api/monitoring')
      const data = await response.json()
      if (data.success) {
        setPatients(data.patients)
        setStats(data.stats)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Errore caricamento dati:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    if (autoRefresh) {
      const interval = setInterval(fetchData, 10000) // Refresh ogni 10 secondi
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '--'
    const date = new Date(dateStr)
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }

  const getAge = (birthDate: string | null) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getBatteryColor = (battery: number | null) => {
    if (battery === null) return 'text-gray-500'
    if (battery <= 20) return 'text-red-400'
    if (battery <= 50) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getBatteryIcon = (battery: number | null) => {
    if (battery === null) return <Battery className="w-4 h-4" />
    // Simula diverse icone in base al livello
    return <Battery className={`w-4 h-4 ${getBatteryColor(battery)}`} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated Background */}
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
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Monitoraggio Pazienti
                  {stats && (
                    <span className="text-sm font-normal px-2 py-1 bg-green-500/20 text-green-300 rounded-lg">
                      {stats.online} online
                    </span>
                  )}
                </h1>
                <p className="text-gray-400 text-sm">
                  {lastUpdate && `Ultimo aggiornamento: ${formatTime(lastUpdate.toISOString())}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Stats */}
              {stats && (
                <div className="flex items-center gap-4 mr-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{stats.totalPatients}</p>
                    <p className="text-xs text-gray-400">Pazienti</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{stats.online}</p>
                    <p className="text-xs text-gray-400">Online</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-500">{stats.offline}</p>
                    <p className="text-xs text-gray-400">Offline</p>
                  </div>
                </div>
              )}

              {/* Auto-refresh Toggle */}
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
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Aggiorna
              </button>
            </div>
          </div>
        </header>

        {/* Patient Grid */}
        <div className="relative z-10 p-6">
          {loading && patients.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <User className="w-16 h-16 text-gray-500 mb-4" />
              <p className="text-gray-400 text-lg">Nessun paziente registrato</p>
              <Link
                href="/dashboard/pazienti"
                className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-all"
              >
                Aggiungi Paziente
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
                >
                  {/* Header con foto e nome */}
                  <div className="flex items-start gap-3 mb-4">
                    {/* Foto */}
                    <div className="relative">
                      {patient.foto ? (
                        <img
                          src={patient.foto}
                          alt={patient.nomeCompleto}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center border-2 border-white/20">
                          <User className="w-7 h-7 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Nome e device */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {patient.nomeCompleto}
                      </h3>
                      <p className="text-gray-500 text-xs truncate">
                        {patient.hasDevice ? patient.deviceModel : 'No device'}
                      </p>
                    </div>

                    {/* Indicatore online/offline */}
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      patient.isOnline ? 'bg-green-400' : 'bg-gray-500'
                    }`} />
                  </div>

                  {/* Metriche Salute */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Temperatura */}
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-red-400" />
                      <span className="text-white text-sm font-medium">
                        {patient.health.temperature
                          ? `${patient.health.temperature}°C`
                          : '--'}
                      </span>
                    </div>

                    {/* SpO2 */}
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-cyan-400" />
                      <span className="text-white text-sm font-medium">
                        {patient.health.spo2
                          ? `${patient.health.spo2}%`
                          : '--'}
                      </span>
                    </div>

                    {/* Pressione */}
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-green-400" />
                      <span className="text-white text-sm font-medium">
                        {patient.health.systolicBp && patient.health.diastolicBp
                          ? `${patient.health.systolicBp}/${patient.health.diastolicBp}`
                          : '--'}
                      </span>
                    </div>

                    {/* Battito */}
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-yellow-400" />
                      <span className="text-white text-sm font-medium">
                        {patient.health.heartRate
                          ? `${patient.health.heartRate} bpm`
                          : '--'}
                      </span>
                    </div>

                    {/* Batteria */}
                    <div className="flex items-center gap-2 col-span-2">
                      {getBatteryIcon(patient.battery)}
                      <span className={`text-sm font-medium ${getBatteryColor(patient.battery)}`}>
                        {patient.battery !== null
                          ? `${patient.battery}%`
                          : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Dettaglio Paziente - Design pulito come screenshot */}
      {selectedPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedPatient(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header scuro */}
            <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{selectedPatient.nomeCompleto}</h2>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${selectedPatient.isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
                <span className={`text-sm font-medium ${selectedPatient.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                  {selectedPatient.isOnline ? 'Online' : 'Offline'}
                </span>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="ml-4 p-1 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Contenuto */}
            <div className="p-6 bg-gray-100">
              <div className="flex gap-6">
                {/* Colonna sinistra - Foto */}
                <div className="flex flex-col items-center">
                  {selectedPatient.foto ? (
                    <img
                      src={selectedPatient.foto}
                      alt={selectedPatient.nomeCompleto}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="w-16 h-16 text-gray-500" />
                    </div>
                  )}
                  <p className="mt-3 text-gray-600 text-sm font-medium">
                    {selectedPatient.telefono || selectedPatient.deviceModel}
                  </p>
                </div>

                {/* Colonna destra - Metriche */}
                <div className="flex-1">
                  {/* Prima riga: Batteria, Temperatura, SpO2 */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {/* Batteria */}
                    <div className="bg-white rounded-xl border-2 border-blue-400 p-4 text-center">
                      <Battery className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Batteria</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {selectedPatient.battery !== null ? `${selectedPatient.battery} %` : '-- %'}
                      </p>
                    </div>

                    {/* Temperatura */}
                    <div className="bg-white rounded-xl border-2 border-red-400 p-4 text-center">
                      <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Temperatura</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {selectedPatient.health.temperature ? `${selectedPatient.health.temperature} °C` : '-- °C'}
                      </p>
                    </div>

                    {/* SpO2 */}
                    <div className="bg-white rounded-xl border-2 border-cyan-400 p-4 text-center">
                      <Droplets className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">SpO2</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {selectedPatient.health.spo2 ? `${selectedPatient.health.spo2} %` : '-- %'}
                      </p>
                    </div>
                  </div>

                  {/* Seconda riga: Pressione, Battito */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Pressione */}
                    <div className="bg-white rounded-xl border-2 border-green-400 p-4 text-center">
                      <Heart className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Pressione (SYS/DIA)</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {selectedPatient.health.systolicBp && selectedPatient.health.diastolicBp
                          ? `${selectedPatient.health.systolicBp}/${selectedPatient.health.diastolicBp}`
                          : '--/--'}
                      </p>
                    </div>

                    {/* Battito */}
                    <div className="bg-white rounded-xl border-2 border-yellow-400 p-4 text-center">
                      <Activity className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Frequenza Cardiaca</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {selectedPatient.health.heartRate ? `${selectedPatient.health.heartRate} bpm` : '-- bpm'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con timestamp */}
            <div className="bg-gray-200 px-6 py-3 flex items-center justify-between">
              <p className="text-gray-500 text-sm">
                Ultimo aggiornamento: {selectedPatient.health.recordedAt ? formatTime(selectedPatient.health.recordedAt) : '--:--'}
              </p>
              {selectedPatient.location.latitude && selectedPatient.location.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${selectedPatient.location.latitude},${selectedPatient.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  Vedi su Mappa
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
