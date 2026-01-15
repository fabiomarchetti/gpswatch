'use client'

import { useState } from 'react'
import { Copy, Check, MessageSquare, Smartphone, Settings as SettingsIcon, Heart, MapPin, Battery, Info } from 'lucide-react'

interface SMSCommand {
  command: string
  description: string
  response: string
  category: string
}

const smsCommands: SMSCommand[] = [
  // Comandi Base
  { command: 'pw,123456,ts#', description: 'Configurazione Completa Orologio', response: 'ver,ID,imei,ip_url,port,profile,upload,bat,language,zone,NET,GPS,apn...', category: 'base' },
  { command: 'pw,123456,status#', description: 'Stato Connessione', response: 'signal:4,gps:yes', category: 'base' },
  { command: 'pw,123456,bat#', description: 'Stato Batteria', response: 'battery:85%,charging:no', category: 'base' },
  { command: 'pw,123456,info#', description: 'Info Dispositivo', response: 'imei:863737078055392,model:C405', category: 'base' },
  { command: 'pw,123456,ver#', description: 'Versione Firmware', response: 'C405_KYS_S5_V1.3_2025', category: 'base' },

  // Comandi Salute
  { command: 'pw,123456,health#', description: 'Dati Sanitari Completi', response: 'hr:72,bp:120/80,spo2:98,temp:36.5', category: 'health' },
  { command: 'pw,123456,hrt#', description: 'Solo Frequenza Cardiaca', response: 'hr:72bpm', category: 'health' },
  { command: 'pw,123456,bp#', description: 'Solo Pressione Sanguigna', response: 'bp:120/80mmHg', category: 'health' },
  { command: 'pw,123456,spo2#', description: 'Saturazione Ossigeno', response: 'spo2:98%', category: 'health' },
  { command: 'pw,123456,oxygen#', description: 'Saturazione Ossigeno (alternativo)', response: 'oxygen:98%', category: 'health' },
  { command: 'pw,123456,temp#', description: 'Temperatura Corporea', response: 'temp:36.5°C', category: 'health' },

  // Comandi Configurazione
  { command: 'pw,123456,ip,91.99.141.225,8001#', description: 'Configura Server IP e Porta', response: 'IP set successfully', category: 'config' },
  { command: 'pw,123456,reboot#', description: 'Riavvia Dispositivo', response: 'Rebooting...', category: 'config' },
  { command: 'pw,123456,upload,30000#', description: 'Intervallo Upload (30 sec)', response: 'Upload interval:30000ms', category: 'config' },
  { command: 'pw,123456,UL,30000#', description: 'Upload Interval (alternativo)', response: 'UL:30000', category: 'config' },
]

const categories = [
  { id: 'all', name: 'Tutti i Comandi', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'base', name: 'Comandi Base', icon: <Smartphone className="w-4 h-4" /> },
  { id: 'health', name: 'Dati Sanitari', icon: <Heart className="w-4 h-4" /> },
  { id: 'config', name: 'Configurazione', icon: <SettingsIcon className="w-4 h-4" /> },
]

export default function SMSCommandsPanel() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCommands = smsCommands.filter(cmd => {
    const matchesCategory = activeCategory === 'all' || cmd.category === activeCategory
    const matchesSearch = cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cmd.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const copyToClipboard = (command: string) => {
    navigator.clipboard.writeText(command)
    setCopiedCommand(command)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'base':
        return <Smartphone className="w-4 h-4 text-blue-400" />
      case 'health':
        return <Heart className="w-4 h-4 text-red-400" />
      case 'config':
        return <SettingsIcon className="w-4 h-4 text-orange-400" />
      default:
        return <Info className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">📱 Comandi SMS Orologio GPS</h3>
          <p className="text-sm text-gray-400">Password default: <span className="text-yellow-400 font-mono">123456</span></p>
        </div>
        <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
          <span className="text-sm font-semibold text-green-300">{filteredCommands.length} comandi</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cerca comando..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeCategory === cat.id
                ? 'bg-blue-500/30 border-2 border-blue-500/50 text-white'
                : 'bg-white/10 border border-white/20 text-gray-400 hover:text-white hover:bg-white/20'
            }`}
          >
            {cat.icon}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Commands Grid */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {filteredCommands.map((cmd, index) => (
          <div
            key={index}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryIcon(cmd.category)}
                  <h4 className="text-white font-bold">{cmd.description}</h4>
                </div>
                <div className="bg-black/30 rounded-lg p-3 mb-2 font-mono text-sm">
                  <span className="text-green-400">{cmd.command}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Risposta:</span>
                  <code className="bg-white/10 px-2 py-1 rounded text-blue-300">{cmd.response}</code>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(cmd.command)}
                className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 transition-all flex items-center gap-2"
              >
                {copiedCommand === cmd.command ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-xs">Copiato!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-xs">Copia</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-white mb-1">Come inviare un comando SMS:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Copia il comando desiderato</li>
              <li>Invia SMS al numero della SIM installata nell'orologio</li>
              <li>Attendi la risposta (può richiedere 10-30 secondi)</li>
              <li>Verifica il risultato nella risposta ricevuta</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
