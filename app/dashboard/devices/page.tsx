'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Watch, Plus, Search, Edit, Trash2, Battery, Wifi, RefreshCw,
  X, Save, Check, AlertTriangle, User, Thermometer, Heart, Activity,
  Wind, Camera
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'

interface Device {
  id: number
  device_id: string
  imei: string
  phone_number: string | null
  model: string | null
  password: string | null
  notes: string | null
  battery_level: number | null
  status: string
  network_status: string | null
  wearer_id: number | null
  assigned_user_name: string | null
  assigned_user_surname: string | null
  created_at: string
}

interface Wearer {
  id: number
  nome: string
  cognome: string
  device_id: number | null
  foto_url?: string | null
}

interface HealthData {
  imei: string
  heart_rate: number | null
  systolic_bp: number | null
  diastolic_bp: number | null
  spo2: number | null
  temperature: number | null
  recorded_at: string
}

interface ConnectedDevice {
  deviceId: string
  imei?: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [wearers, setWearers] = useState<Wearer[]>([])
  const [healthData, setHealthData] = useState<HealthData[]>([])
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [editForm, setEditForm] = useState({
    device_id: '',
    phone_number: '',
    model: '',
    password: '',
    notes: '',
    status: '',
    wearer_id: ''
  })
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null)

  // Handle photo upload
  const handlePhotoUpload = async (wearerId: number, file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Seleziona un file immagine valido')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'immagine deve essere inferiore a 2MB')
      return
    }

    setUploadingPhoto(wearerId)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string

        // Resize image if needed
        const resizedBase64 = await resizeImage(base64, 200, 200)

        // Update wearer photo
        const response = await fetch(`/api/wearers/${wearerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foto_url: resizedBase64 })
        })

        if (response.ok) {
          fetchAll() // Refresh data
        } else {
          alert('Errore durante il caricamento della foto')
        }
        setUploadingPhoto(null)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Errore upload foto:', error)
      alert('Errore durante il caricamento')
      setUploadingPhoto(null)
    }
  }

  // Resize image helper
  const resizeImage = (base64: string, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = base64
    })
  }

  const fetchAll = useCallback(async () => {
    try {
      const [devicesRes, wearersRes, healthRes, tcpRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/wearers'),
        fetch('/api/health-data?limit=200'),
        fetch('/api/tcp/status')
      ])

      const devicesData = await devicesRes.json()
      const wearersData = await wearersRes.json()
      const healthDataRes = await healthRes.json()
      const tcpData = await tcpRes.json()

      setDevices(devicesData.devices || [])
      setWearers(wearersData.wearers || [])
      setHealthData(healthDataRes.latest || [])
      setConnectedDevices(tcpData.connectedDevices || [])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Errore caricamento dati:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  // Get wearer for a device
  const getWearer = (deviceId: number) => {
    return wearers.find(w => w.device_id === deviceId)
  }

  // Get latest health data for a device
  const getHealthForDevice = (imei: string) => {
    return healthData.find(h => h.imei === imei)
  }

  // Check if device is online
  const isDeviceOnline = (device: Device) => {
    return connectedDevices.some(
      cd => cd.deviceId === device.device_id || cd.imei === device.imei
    )
  }

  const filteredDevices = devices.filter(device =>
    device.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.imei.includes(searchTerm) ||
    (device.phone_number && device.phone_number.includes(searchTerm)) ||
    (device.assigned_user_name && device.assigned_user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (device.assigned_user_surname && device.assigned_user_surname.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Open edit modal
  const handleEdit = (device: Device) => {
    setEditingDevice(device)
    const assignedWearer = wearers.find(w => w.device_id === device.id)
    setEditForm({
      device_id: device.device_id,
      phone_number: device.phone_number || '',
      model: device.model || '',
      password: device.password || '123456',
      notes: device.notes || '',
      status: device.status,
      wearer_id: assignedWearer?.id?.toString() || ''
    })
    setSaveError('')
    setSaveSuccess(false)
    setShowEditModal(true)
  }

  // Save device changes
  const handleSaveDevice = async () => {
    if (!editingDevice) return
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      const response = await fetch('/api/devices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDevice.id,
          device_id: editForm.device_id,
          phone_number: editForm.phone_number || null,
          model: editForm.model || null,
          password: editForm.password || '123456',
          notes: editForm.notes || null,
          status: editForm.status
        })
      })

      const data = await response.json()
      if (!response.ok) {
        setSaveError(data.error || 'Errore durante il salvataggio')
        return
      }

      if (editForm.wearer_id) {
        await fetch('/api/wearers/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wearer_id: parseInt(editForm.wearer_id),
            device_id: editingDevice.id
          })
        })
      }

      setSaveSuccess(true)
      fetchAll()
      setTimeout(() => {
        setShowEditModal(false)
        setSaveSuccess(false)
      }, 1500)
    } catch (error) {
      setSaveError('Errore di connessione')
    } finally {
      setSaving(false)
    }
  }

  // Delete handlers
  const handleDeleteClick = (device: Device) => {
    setDeletingDevice(device)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingDevice) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/devices/${deletingDevice.id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchAll()
        setShowDeleteModal(false)
        setDeletingDevice(null)
      } else {
        const data = await response.json()
        alert(data.error || 'Errore durante l\'eliminazione')
      }
    } catch (error) {
      alert('Errore di connessione')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <Sidebar />

      <main className="ml-64 transition-all duration-300">
        {/* Header */}
        <header className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-white/10 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Monitoraggio Pazienti</h1>
              <p className="text-gray-400 mt-1">
                {filteredDevices.length} dispositivi • {connectedDevices.length} online
                {lastUpdate && (
                  <span className="ml-3 text-xs">
                    Aggiornato: {lastUpdate.toLocaleTimeString('it-IT')}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAll}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                title="Aggiorna"
              >
                <RefreshCw className="w-5 h-5 text-white" />
              </button>
              <Link
                href="/dashboard/devices/register"
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nuovo Dispositivo
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="relative z-10 p-8">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca paziente o dispositivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Patient Cards Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white mt-4">Caricamento...</p>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-12 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl">
              <Watch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nessun dispositivo trovato</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm ? 'Prova a cercare con altri termini' : 'Inizia registrando il primo orologio GPS'}
              </p>
              {!searchTerm && (
                <Link
                  href="/dashboard/devices/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold"
                >
                  <Plus className="w-5 h-5" />
                  Registra Primo Dispositivo
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredDevices.map((device) => {
                const wearer = getWearer(device.id)
                const health = getHealthForDevice(device.imei)
                const online = isDeviceOnline(device)

                return (
                  <div
                    key={device.id}
                    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all group"
                  >
                    {/* Header with name and status */}
                    <div className="bg-slate-800/80 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar - Clickable to upload photo */}
                        <div className="relative flex-shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`photo-upload-${device.id}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file && wearer) {
                                handlePhotoUpload(wearer.id, file)
                              }
                              e.target.value = '' // Reset input
                            }}
                            disabled={!wearer || uploadingPhoto === wearer?.id}
                          />
                          <label
                            htmlFor={`photo-upload-${device.id}`}
                            className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden cursor-pointer group/avatar relative ${!wearer ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {uploadingPhoto === wearer?.id ? (
                              <RefreshCw className="w-6 h-6 text-white animate-spin" />
                            ) : wearer?.foto_url ? (
                              <>
                                <img src={wearer.foto_url} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                  <Camera className="w-5 h-5 text-white" />
                                </div>
                              </>
                            ) : (
                              <>
                                <User className="w-6 h-6 text-white group-hover/avatar:hidden" />
                                <Camera className="w-6 h-6 text-white hidden group-hover/avatar:block" />
                              </>
                            )}
                          </label>
                        </div>
                        {/* Name */}
                        <div className="min-w-0">
                          <h3 className="text-white font-semibold truncate text-sm">
                            {wearer ? `${wearer.nome} ${wearer.cognome}` : 'Non assegnato'}
                          </h3>
                          <p className="text-gray-400 text-xs truncate">
                            {device.phone_number ? `+39 ${device.phone_number.replace(/^\+39/, '')}` : 'Nessun numero'}
                          </p>
                        </div>
                      </div>
                      {/* Online indicator */}
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${online ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-500'}`}></div>
                    </div>

                    {/* Health Metrics */}
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Temperature */}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                          <Thermometer className="w-4 h-4 text-red-400" />
                          <span className="text-white text-sm font-medium">
                            {health?.temperature ? `${health.temperature}°C` : '--'}
                          </span>
                        </div>

                        {/* SpO2 */}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                          <Wind className="w-4 h-4 text-cyan-400" />
                          <span className="text-white text-sm font-medium">
                            {health?.spo2 ? `${health.spo2}%` : '--'}
                          </span>
                        </div>

                        {/* Blood Pressure */}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                          <Heart className="w-4 h-4 text-green-400" />
                          <span className="text-white text-sm font-medium">
                            {health?.systolic_bp && health?.diastolic_bp
                              ? `${health.systolic_bp}/${health.diastolic_bp}`
                              : '--'}
                          </span>
                        </div>

                        {/* Heart Rate */}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <Activity className="w-4 h-4 text-yellow-400" />
                          <span className="text-white text-sm font-medium">
                            {health?.heart_rate ? `${health.heart_rate}` : '--'}
                            {health?.heart_rate && <span className="text-xs text-gray-400 ml-0.5">bpm</span>}
                          </span>
                        </div>
                      </div>

                      {/* Battery */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Battery className={`w-4 h-4 ${
                            device.battery_level === null ? 'text-gray-500' :
                            device.battery_level < 20 ? 'text-red-400' :
                            device.battery_level < 50 ? 'text-yellow-400' : 'text-blue-400'
                          }`} />
                          <span className="text-gray-300 text-sm">
                            {device.battery_level !== null ? `${device.battery_level}%` : '--'}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(device)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                            title="Modifica"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(device)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                            title="Elimina"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && editingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-400" />
                Modifica Dispositivo
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {saveSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-green-300 font-semibold">Dispositivo aggiornato!</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Device ID</label>
                    <input
                      type="text"
                      value={editForm.device_id}
                      onChange={(e) => setEditForm({ ...editForm, device_id: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-1">IMEI</label>
                    <input
                      type="text"
                      value={editingDevice.imei}
                      disabled
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Numero Telefono</label>
                    <div className="flex">
                      <span className="px-3 py-2 bg-white/5 border border-white/20 border-r-0 rounded-l-lg text-gray-400 text-sm flex items-center">
                        +39
                      </span>
                      <input
                        type="tel"
                        value={editForm.phone_number.replace(/^\+39/, '')}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setEditForm({ ...editForm, phone_number: digits });
                        }}
                        placeholder="3331234567"
                        maxLength={10}
                        className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-r-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Modello</label>
                    <select
                      value={editForm.model}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Seleziona modello</option>
                      <option value="C405_KYS_S5">C405 KYS S5</option>
                      <option value="C405_KYS_S5_04R6">C405 KYS S5 04R6</option>
                      <option value="Y6 Ultra">Y6 Ultra</option>
                      <option value="Other">Altro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Password</label>
                    <input
                      type="text"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="123456"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Stato</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="active">Attivo</option>
                      <option value="inactive">Inattivo</option>
                      <option value="offline">Offline</option>
                      <option value="maintenance">Manutenzione</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Paziente assegnato</label>
                    <select
                      value={editForm.wearer_id}
                      onChange={(e) => setEditForm({ ...editForm, wearer_id: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Nessuno</option>
                      {wearers.map(wearer => (
                        <option
                          key={wearer.id}
                          value={wearer.id}
                          disabled={wearer.device_id !== null && wearer.device_id !== editingDevice?.id}
                        >
                          {wearer.nome} {wearer.cognome}
                          {wearer.device_id !== null && wearer.device_id !== editingDevice?.id ? ' (già assegnato)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Note</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {saveError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                      {saveError}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleSaveDevice}
                    disabled={saving}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salva
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Conferma Eliminazione</h2>
              <p className="text-gray-400 mb-6">
                Eliminare <span className="text-white font-semibold">{deletingDevice.device_id}</span>?
                <br />
                <span className="text-red-400 text-sm">Questa azione non può essere annullata.</span>
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingDevice(null) }}
                  className="px-6 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30"
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Elimina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
