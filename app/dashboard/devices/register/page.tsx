'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createWorker } from 'tesseract.js'
import {
  ArrowLeft, Upload, Camera, FileImage, Check, X, RefreshCw,
  Watch, Wifi, Battery, Phone, Server, AlertTriangle, Scan,
  MessageSquare, Send, Copy, CheckCircle2
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'

interface DeviceData {
  firmware_version: string
  device_id: string
  imei: string
  server_ip: string
  server_port: string
  profile: string
  upload_interval: string
  battery_level: string
  language: string
  timezone: string
  network_status: string
  network_signal: string
  gps_type: string
  apn: string
  mcc: string
  mnc: string
  phone_number: string
}

const initialDeviceData: DeviceData = {
  firmware_version: '',
  device_id: '',
  imei: '',
  server_ip: '',
  server_port: '',
  profile: '',
  upload_interval: '',
  battery_level: '',
  language: '',
  timezone: '',
  network_status: '',
  network_signal: '',
  gps_type: '',
  apn: '',
  mcc: '',
  mnc: '',
  phone_number: ''
}

export default function RegisterDevicePage() {
  const [deviceData, setDeviceData] = useState<DeviceData>(initialDeviceData)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState('')
  const [rawText, setRawText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string; updated?: boolean } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [copiedTs, setCopiedTs] = useState(false)
  const [copiedApn, setCopiedApn] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Comandi SMS
  const tsCommand = 'pw,123456,ts#'
  const apnCommand = 'pw,123456,apn,internet.wind,,,#'

  const copyTsToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tsCommand)
      setCopiedTs(true)
      setTimeout(() => setCopiedTs(false), 2000)
    } catch (err) {
      console.error('Errore copia:', err)
    }
  }

  const copyApnToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apnCommand)
      setCopiedApn(true)
      setTimeout(() => setCopiedApn(false), 2000)
    } catch (err) {
      console.error('Errore copia:', err)
    }
  }

  // Parse the OCR text to extract device data
  const parseOcrText = (text: string): Partial<DeviceData> => {
    const data: Partial<DeviceData> = {}

    // Firmware version (ver:...)
    const verMatch = text.match(/ver[:\s]*([A-Z0-9_\.]+)/i)
    if (verMatch) data.firmware_version = verMatch[1]

    // Device ID (ID:...)
    const idMatch = text.match(/ID[:\s]*([a-zA-Z0-9]+)/i)
    if (idMatch) data.device_id = idMatch[1]

    // IMEI (imei:...)
    const imeiMatch = text.match(/imei[:\s]*(\d{15})/i)
    if (imeiMatch) data.imei = imeiMatch[1]

    // Server IP and Port (ip_url:...; port:...)
    const ipMatch = text.match(/ip_url[:\s]*([0-9\.]+)/i)
    if (ipMatch) data.server_ip = ipMatch[1]

    const portMatch = text.match(/port[:\s]*(\d+)/i)
    if (portMatch) data.server_port = portMatch[1]

    // Profile
    const profileMatch = text.match(/profile[:\s]*(\d+)/i)
    if (profileMatch) data.profile = profileMatch[1]

    // Upload interval
    const uploadMatch = text.match(/upload[:\s]*(\d+)S?/i)
    if (uploadMatch) data.upload_interval = uploadMatch[1]

    // Battery level
    const batteryMatch = text.match(/bat\s*level[:\s]*(\d+)/i)
    if (batteryMatch) data.battery_level = batteryMatch[1]

    // Language
    const langMatch = text.match(/language[:\s]*(\d+)/i)
    if (langMatch) data.language = langMatch[1]

    // Timezone
    const zoneMatch = text.match(/zone[:\s]*([\d\.]+)/i)
    if (zoneMatch) data.timezone = zoneMatch[1]

    // Network status (NET:OK(XX) or NET:NO(XX))
    const netMatch = text.match(/NET[:\s]*(OK|NO)\s*\((\d+)\)/i)
    if (netMatch) {
      data.network_status = netMatch[1]
      data.network_signal = netMatch[2]
    }

    // GPS type
    const gpsMatch = text.match(/GPS[:\s]*([A-Z]+)/i)
    if (gpsMatch) data.gps_type = gpsMatch[1]

    // APN
    const apnMatch = text.match(/apn[:\s]*([a-zA-Z0-9\.]+)/i)
    if (apnMatch) data.apn = apnMatch[1]

    // MCC
    const mccMatch = text.match(/mcc[:\s]*(\d+)/i)
    if (mccMatch) data.mcc = mccMatch[1]

    // MNC
    const mncMatch = text.match(/mnc[:\s]*(\d+)/i)
    if (mncMatch) data.mnc = mncMatch[1]

    return data
  }

  // Process image with Tesseract OCR
  const processImage = async (imageData: string) => {
    setIsProcessing(true)
    setOcrProgress(0)
    setOcrStatus('Inizializzazione OCR...')
    setRawText('')

    try {
      const worker = await createWorker('ita+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100))
            setOcrStatus('Riconoscimento testo...')
          } else {
            setOcrStatus(m.status)
          }
        }
      })

      const { data: { text } } = await worker.recognize(imageData)
      await worker.terminate()

      setRawText(text)

      // Parse the extracted text
      const parsedData = parseOcrText(text)
      setDeviceData(prev => ({ ...prev, ...parsedData }))

      setOcrStatus('Completato!')
      setOcrProgress(100)
    } catch (error) {
      console.error('Errore OCR:', error)
      setOcrStatus('Errore durante il riconoscimento')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Per favore seleziona un\'immagine')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
      processImage(result)
    }
    reader.readAsDataURL(file)
  }

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }, [])

  // Handle paste from clipboard
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) handleFileSelect(file)
        break
      }
    }
  }, [])

  // Save device to database
  const handleSave = async () => {
    if (!deviceData.imei) {
      setSaveResult({ success: false, message: 'IMEI è obbligatorio' })
      return
    }

    setIsSaving(true)
    setSaveResult(null)

    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceData.device_id || `DEV-${deviceData.imei.slice(-6)}`,
          device_internal_id: deviceData.device_id,
          imei: deviceData.imei,
          firmware_version: deviceData.firmware_version,
          phone_number: deviceData.phone_number?.replace(/\s/g, '') || null,
          server_ip: deviceData.server_ip,
          server_port: deviceData.server_port ? parseInt(deviceData.server_port) : null,
          profile: deviceData.profile ? parseInt(deviceData.profile) : null,
          upload_interval: deviceData.upload_interval ? parseInt(deviceData.upload_interval) : null,
          battery_level: deviceData.battery_level ? parseInt(deviceData.battery_level) : null,
          language_code: deviceData.language ? parseInt(deviceData.language) : null,
          timezone: deviceData.timezone ? parseFloat(deviceData.timezone) : null,
          network_status: deviceData.network_status === 'OK' ? `NET:OK(${deviceData.network_signal})` : `NET:NO(${deviceData.network_signal})`,
          network_signal: deviceData.network_signal ? parseInt(deviceData.network_signal) : null,
          gps_status: deviceData.gps_type,
          apn: deviceData.apn,
          mcc: deviceData.mcc,
          mnc: deviceData.mnc,
          status: deviceData.network_status === 'OK' ? 'active' : 'inactive'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Mostra messaggio appropriato (nuovo o aggiornato)
        const message = data.updated
          ? `Dispositivo aggiornato! ${data.message}`
          : 'Nuovo dispositivo registrato con successo!'
        setSaveResult({ success: true, message, updated: data.updated })
        // Reset form after 3 seconds
        setTimeout(() => {
          setDeviceData(initialDeviceData)
          setImagePreview(null)
          setRawText('')
          setSaveResult(null)
        }, 3000)
      } else {
        setSaveResult({ success: false, message: data.error || 'Errore durante il salvataggio' })
      }
    } catch (error) {
      setSaveResult({ success: false, message: 'Errore di connessione' })
    } finally {
      setIsSaving(false)
    }
  }

  // Reset form
  const handleReset = () => {
    setDeviceData(initialDeviceData)
    setImagePreview(null)
    setRawText('')
    setSaveResult(null)
    setOcrProgress(0)
    setOcrStatus('')
  }

  const isServerCorrect = deviceData.server_ip === '91.99.141.225' && deviceData.server_port === '8001'
  const isNetworkOk = deviceData.network_status === 'OK'

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
      onPaste={handlePaste}
    >
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
        <header className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-white/10 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/devices" className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <ArrowLeft className="w-6 h-6 text-white" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Scan className="w-8 h-8 text-cyan-400" />
                  Registra Dispositivo (OCR)
                </h1>
                <p className="text-gray-400 mt-1">Carica uno screenshot della risposta ts# per registrare automaticamente</p>
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Left Column - Image Upload */}
              <div className="space-y-6">
                {/* Step 1: Comando ts# */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Passo 1: Invia SMS all'orologio</h3>
                      <p className="text-gray-400 text-sm">Ottieni le informazioni del dispositivo</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Comandi SMS */}
                    <div className="bg-black/30 rounded-xl p-4 space-y-3">
                      {/* Comando ts# */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-gray-400 text-xs mb-1">Richiedi stato dispositivo:</p>
                          <code className="text-cyan-300 font-mono text-lg">{tsCommand}</code>
                        </div>
                        <button
                          onClick={copyTsToClipboard}
                          className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all text-sm ${
                            copiedTs
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                          }`}
                        >
                          {copiedTs ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copiedTs ? 'Copiato!' : 'Copia'}
                        </button>
                      </div>

                      <div className="border-t border-white/10"></div>

                      {/* Comando APN */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-gray-400 text-xs mb-1">Configura APN Wind/Tre:</p>
                          <code className="text-orange-300 font-mono text-sm">{apnCommand}</code>
                        </div>
                        <button
                          onClick={copyApnToClipboard}
                          className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all text-sm ${
                            copiedApn
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                          }`}
                        >
                          {copiedApn ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copiedApn ? 'Copiato!' : 'Copia'}
                        </button>
                      </div>
                    </div>

                    {/* Istruzioni */}
                    <div className="text-sm text-gray-300 space-y-2">
                      <p className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">1.</span>
                        <span>Apri l'app SMS sul tuo telefono</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">2.</span>
                        <span>Invia <strong className="text-orange-300">prima il comando APN</strong> per configurare la rete dati</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">3.</span>
                        <span>Invia <strong className="text-cyan-300">il comando ts#</strong> per ottenere i dati del dispositivo</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">4.</span>
                        <span>Attendi la risposta SMS (10-30 secondi)</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">5.</span>
                        <span>Fai uno <strong className="text-cyan-300">screenshot</strong> della risposta ts#</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 2: Drop Zone */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                    <FileImage className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Passo 2: Carica lo screenshot</h3>
                    <p className="text-gray-400 text-sm">L'OCR estrarrà automaticamente i dati</p>
                  </div>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : 'border-white/20 hover:border-white/40 bg-white/5'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Screenshot"
                        className="max-h-64 mx-auto rounded-lg shadow-lg"
                      />
                      <p className="text-gray-400 text-sm">Clicca o trascina per cambiare immagine</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                        <FileImage className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">Trascina qui lo screenshot</p>
                        <p className="text-gray-400 text-sm mt-1">oppure clicca per selezionare</p>
                        <p className="text-cyan-400 text-xs mt-3">Puoi anche incollare con Ctrl+V / Cmd+V</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* OCR Progress */}
                {isProcessing && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                      <span className="text-white font-semibold">{ocrStatus}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${ocrProgress}%` }}
                      />
                    </div>
                    <p className="text-gray-400 text-sm mt-2">{ocrProgress}% completato</p>
                  </div>
                )}

                {/* Raw Text */}
                {rawText && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <FileImage className="w-4 h-4 text-gray-400" />
                      Testo Estratto
                    </h3>
                    <pre className="text-gray-300 text-xs whitespace-pre-wrap bg-black/30 p-3 rounded-lg max-h-48 overflow-y-auto">
                      {rawText}
                    </pre>
                  </div>
                )}
              </div>

              {/* Right Column - Form */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Watch className="w-6 h-6 text-cyan-400" />
                  Dati Dispositivo
                </h2>

                <div className="space-y-4">
                  {/* Phone Number - Manual Input */}
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                    <label className="block text-cyan-300 text-sm font-semibold mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Numero Telefono SIM *
                    </label>
                    <input
                      type="tel"
                      value={deviceData.phone_number}
                      onChange={(e) => setDeviceData({ ...deviceData, phone_number: e.target.value })}
                      placeholder="es. 3933169794"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-gray-400 text-xs mt-1">Inserisci manualmente il numero della SIM</p>
                  </div>

                  {/* IMEI */}
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">IMEI *</label>
                    <input
                      type="text"
                      value={deviceData.imei}
                      onChange={(e) => setDeviceData({ ...deviceData, imei: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Device ID */}
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Device ID</label>
                    <input
                      type="text"
                      value={deviceData.device_id}
                      onChange={(e) => setDeviceData({ ...deviceData, device_id: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Firmware */}
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Firmware</label>
                    <input
                      type="text"
                      value={deviceData.firmware_version}
                      onChange={(e) => setDeviceData({ ...deviceData, firmware_version: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Server IP & Port */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Server IP</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={deviceData.server_ip}
                          onChange={(e) => setDeviceData({ ...deviceData, server_ip: e.target.value })}
                          className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white focus:outline-none ${
                            deviceData.server_ip && (isServerCorrect ? 'border-green-500' : 'border-red-500')
                          } ${!deviceData.server_ip && 'border-white/20'}`}
                        />
                        {deviceData.server_ip && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            {deviceData.server_ip === '91.99.141.225' ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Porta</label>
                      <input
                        type="text"
                        value={deviceData.server_port}
                        onChange={(e) => setDeviceData({ ...deviceData, server_port: e.target.value })}
                        className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white focus:outline-none ${
                          deviceData.server_port && (deviceData.server_port === '8001' ? 'border-green-500' : 'border-red-500')
                        } ${!deviceData.server_port && 'border-white/20'}`}
                      />
                    </div>
                  </div>

                  {/* Network Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Network</label>
                      <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        isNetworkOk ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        <Wifi className="w-4 h-4" />
                        {deviceData.network_status ? `NET:${deviceData.network_status}(${deviceData.network_signal})` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Batteria</label>
                      <div className="px-4 py-2 bg-white/10 rounded-lg flex items-center gap-2 text-white">
                        <Battery className="w-4 h-4 text-green-400" />
                        {deviceData.battery_level ? `${deviceData.battery_level}%` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* APN & MCC/MNC */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">APN</label>
                      <input
                        type="text"
                        value={deviceData.apn}
                        onChange={(e) => setDeviceData({ ...deviceData, apn: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">MCC</label>
                      <input
                        type="text"
                        value={deviceData.mcc}
                        onChange={(e) => setDeviceData({ ...deviceData, mcc: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">MNC</label>
                      <input
                        type="text"
                        value={deviceData.mnc}
                        onChange={(e) => setDeviceData({ ...deviceData, mnc: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Upload & Timezone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Upload Interval</label>
                      <input
                        type="text"
                        value={deviceData.upload_interval}
                        onChange={(e) => setDeviceData({ ...deviceData, upload_interval: e.target.value })}
                        className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white focus:outline-none ${
                          deviceData.upload_interval && (deviceData.upload_interval === '300' ? 'border-green-500' : 'border-yellow-500')
                        } ${!deviceData.upload_interval && 'border-white/20'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Timezone</label>
                      <input
                        type="text"
                        value={deviceData.timezone}
                        onChange={(e) => setDeviceData({ ...deviceData, timezone: e.target.value })}
                        className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white focus:outline-none ${
                          deviceData.timezone && (deviceData.timezone === '1.00' ? 'border-green-500' : 'border-yellow-500')
                        } ${!deviceData.timezone && 'border-white/20'}`}
                      />
                    </div>
                  </div>

                  {/* Status Summary */}
                  {deviceData.imei && (
                    <div className={`p-4 rounded-xl ${isServerCorrect && isNetworkOk ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                      <h4 className={`font-semibold mb-2 ${isServerCorrect && isNetworkOk ? 'text-green-300' : 'text-yellow-300'}`}>
                        Riepilogo Stato
                      </h4>
                      <ul className="text-sm space-y-1">
                        <li className={isServerCorrect ? 'text-green-300' : 'text-red-300'}>
                          {isServerCorrect ? '✅' : '❌'} Server: {deviceData.server_ip}:{deviceData.server_port}
                        </li>
                        <li className={isNetworkOk ? 'text-green-300' : 'text-red-300'}>
                          {isNetworkOk ? '✅' : '❌'} Rete: {deviceData.network_status || 'N/A'}
                        </li>
                        <li className={deviceData.upload_interval === '300' ? 'text-green-300' : 'text-yellow-300'}>
                          {deviceData.upload_interval === '300' ? '✅' : '⚠️'} Upload: {deviceData.upload_interval || 'N/A'}S
                        </li>
                        <li className={deviceData.timezone === '1.00' ? 'text-green-300' : 'text-yellow-300'}>
                          {deviceData.timezone === '1.00' ? '✅' : '⚠️'} Timezone: {deviceData.timezone || 'N/A'}
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Save Result */}
                  {saveResult && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${
                      saveResult.success
                        ? saveResult.updated
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          : 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {saveResult.success
                        ? saveResult.updated
                          ? <RefreshCw className="w-5 h-5" />
                          : <Check className="w-5 h-5" />
                        : <AlertTriangle className="w-5 h-5" />
                      }
                      <span>{saveResult.message}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleReset}
                      className="flex-1 px-4 py-3 bg-gray-500/20 text-gray-300 rounded-xl font-semibold hover:bg-gray-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-5 h-5" />
                      Reset
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !deviceData.imei}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                      Registra Dispositivo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
