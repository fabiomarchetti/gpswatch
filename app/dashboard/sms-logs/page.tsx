'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Send, Download, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

type SmsLog = {
  id: number
  device_id: number | null
  device_name: string | null
  phone_number: string
  direction: 'sent' | 'received'
  message: string
  command_type: string | null
  parsed_data: any
  status: string
  error_message: string | null
  created_at: string
  sent_at: string | null
  received_at: string | null
}

export default function SmsLogsPage() {
  const [logs, setLogs] = useState<SmsLog[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/sms/logs')
      const data = await response.json()
      if (data.success) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Errore caricamento log:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()

    // Auto-refresh ogni 5 secondi se attivo
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    // Timestamps are already converted to Rome timezone by the API
    const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
    if (parts) {
      const [, year, month, day, hour, minute, second] = parts
      return `${day}/${month}/${year}, ${hour}:${minute}:${second}`
    }
    // Fallback
    const date = new Date(dateStr)
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 transition-all duration-300">
        {/* Top Bar */}
        <header className="relative z-10 bg-white/5 backdrop-blur-lg border-b border-white/10 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">Log SMS</h1>
                <p className="text-gray-400 mt-1">Messaggi inviati e ricevuti</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
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
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </button>

              {/* Refresh Button */}
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Aggiorna
              </button>
            </div>
          </div>
        </header>

        {/* Logs Content */}
        <div className="relative z-10 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Totale Messaggi</p>
                    <p className="text-3xl font-bold text-white">{logs.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Inviati</p>
                    <p className="text-3xl font-bold text-white">
                      {logs.filter(l => l.direction === 'sent').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Ricevuti</p>
                    <p className="text-3xl font-bold text-white">
                      {logs.filter(l => l.direction === 'received').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Data/Ora</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Direzione</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Numero</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Messaggio</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Tipo</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Stato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                          <p className="text-gray-400">Caricamento log...</p>
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                          <p className="text-gray-400 text-lg">Nessun messaggio SMS</p>
                          <p className="text-gray-500 text-sm mt-2">Invia un comando per vedere i log qui</p>
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-all">
                          <td className="px-6 py-4">
                            <p className="text-white text-sm font-mono">
                              {formatDate(log.sent_at || log.received_at || log.created_at)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            {log.direction === 'sent' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold">
                                <Send className="w-3 h-3" />
                                Inviato
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-semibold">
                                <Download className="w-3 h-3" />
                                Ricevuto
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-white text-sm font-mono">{log.phone_number}</p>
                            {log.device_name && (
                              <p className="text-gray-400 text-xs mt-1">{log.device_name}</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-white text-sm font-mono max-w-md truncate" title={log.message}>
                              {log.message}
                            </p>
                            {log.parsed_data && Object.keys(log.parsed_data).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                                  Dati parsati
                                </summary>
                                <pre className="text-xs text-gray-400 mt-2 p-2 bg-black/30 rounded overflow-x-auto">
                                  {JSON.stringify(log.parsed_data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {log.command_type ? (
                              <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs font-semibold">
                                {log.command_type}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {log.status === 'sent' || log.status === 'received' ? (
                              <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                {log.status}
                              </span>
                            ) : log.status === 'failed' ? (
                              <span className="inline-flex items-center gap-1 text-red-400 text-sm">
                                <XCircle className="w-4 h-4" />
                                Fallito
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">{log.status}</span>
                            )}
                            {log.error_message && (
                              <p className="text-red-400 text-xs mt-1">{log.error_message}</p>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
