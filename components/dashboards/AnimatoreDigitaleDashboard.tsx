'use client'

import Link from 'next/link'
import {
  Watch,
  Settings,
  Users,
  Activity,
  Wifi,
  Battery,
  MapPin,
  Clock,
  Plus,
  Search
} from 'lucide-react'
import SMSCommandsPanel from '@/components/SMSCommandsPanel'
import { useState } from 'react'

export default function AnimatoreDigitaleDashboard() {
  const [showSMSPanel, setShowSMSPanel] = useState(false)

  return (
    <div className="relative z-10 p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Orologi Attivi"
          value="38"
          icon={<Watch className="w-6 h-6" />}
          color="from-blue-500 to-cyan-500"
          change="+5"
        />
        <StatsCard
          title="Dispositivi Offline"
          value="2"
          icon={<Wifi className="w-6 h-6" />}
          color="from-red-500 to-orange-500"
          change="-1"
        />
        <StatsCard
          title="Batteria Bassa"
          value="4"
          icon={<Battery className="w-6 h-6" />}
          color="from-yellow-500 to-orange-500"
          change="+2"
        />
        <StatsCard
          title="Configurazioni Oggi"
          value="7"
          icon={<Settings className="w-6 h-6" />}
          color="from-green-500 to-emerald-500"
          change="+7"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ActionCard
            icon={<Plus className="w-8 h-8" />}
            title="Configura Nuovo Orologio"
            description="Aggiungi e configura un nuovo dispositivo GPS"
            href="/dashboard/devices/new"
            color="from-blue-500 to-purple-600"
          />
          <ActionCard
            icon={<Settings className="w-8 h-8" />}
            title="Gestisci Dispositivi"
            description="Modifica configurazioni dispositivi esistenti"
            href="/dashboard/devices"
            color="from-green-500 to-emerald-600"
          />
          <ActionCard
            icon={<Users className="w-8 h-8" />}
            title="Assegna Orologi"
            description="Assegna dispositivi agli utenti"
            href="/dashboard/devices/assign"
            color="from-orange-500 to-red-600"
          />
          <button
            onClick={() => setShowSMSPanel(!showSMSPanel)}
            className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:-translate-y-1 text-left"
          >
            <div className="inline-flex p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {showSMSPanel ? 'Nascondi Comandi SMS' : 'Mostra Comandi SMS'}
            </h3>
            <p className="text-sm text-gray-400">
              {showSMSPanel ? 'Chiudi il pannello comandi' : 'Visualizza tutti i comandi SMS disponibili'}
            </p>
          </button>
        </div>
      </div>

      {/* SMS Commands Panel */}
      {showSMSPanel && (
        <div className="mb-8">
          <SMSCommandsPanel />
        </div>
      )}

      {/* Dispositivi in Allerta */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Dispositivi in Allerta</h2>
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
          <div className="space-y-4">
            <DeviceAlert
              deviceId="GPS-001"
              userName="Mario Rossi"
              issue="Batteria al 15%"
              status="warning"
              icon="🔋"
            />
            <DeviceAlert
              deviceId="GPS-023"
              userName="Laura Bianchi"
              issue="Offline da 2 ore"
              status="error"
              icon="📡"
            />
            <DeviceAlert
              deviceId="GPS-015"
              userName="Giuseppe Verdi"
              issue="Segnale GPS debole"
              status="warning"
              icon="📍"
            />
            <DeviceAlert
              deviceId="GPS-032"
              userName="Anna Neri"
              issue="Batteria al 8%"
              status="error"
              icon="🔋"
            />
          </div>
        </div>
      </div>

      {/* Lista Dispositivi */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Tutti i Dispositivi</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Cerca dispositivo..."
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 transition-all">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">ID Dispositivo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Utente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Stato</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Batteria</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Ultimo Aggiornamento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <DeviceRow
                id="GPS-001"
                user="Mario Rossi"
                status="online"
                battery={15}
                lastUpdate="2 min fa"
              />
              <DeviceRow
                id="GPS-002"
                user="Anna Verdi"
                status="online"
                battery={85}
                lastUpdate="1 min fa"
              />
              <DeviceRow
                id="GPS-003"
                user="Luca Bianchi"
                status="online"
                battery={92}
                lastUpdate="30 sec fa"
              />
              <DeviceRow
                id="GPS-023"
                user="Laura Bianchi"
                status="offline"
                battery={45}
                lastUpdate="2 ore fa"
              />
              <DeviceRow
                id="GPS-015"
                user="Giuseppe Verdi"
                status="online"
                battery={67}
                lastUpdate="5 min fa"
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon, color, change }: {
  title: string
  value: string
  icon: React.ReactNode
  color: string
  change: string
}) {
  const isPositive = change.startsWith('+')
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 bg-gradient-to-r ${color} rounded-xl`}>
          {icon}
        </div>
        <span className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {change}
        </span>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </div>
  )
}

function ActionCard({ icon, title, description, href, color }: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  color: string
}) {
  return (
    <Link
      href={href}
      className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:-translate-y-1"
    >
      <div className={`inline-flex p-3 bg-gradient-to-r ${color} rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </Link>
  )
}

function DeviceAlert({ deviceId, userName, issue, status, icon }: {
  deviceId: string
  userName: string
  issue: string
  status: 'warning' | 'error'
  icon: string
}) {
  const statusColor = status === 'error' ? 'border-red-500/30 bg-red-500/10' : 'border-yellow-500/30 bg-yellow-500/10'
  const textColor = status === 'error' ? 'text-red-400' : 'text-yellow-400'

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${statusColor}`}>
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-white">{deviceId}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-300">{userName}</span>
        </div>
        <p className={`text-sm font-semibold ${textColor}`}>{issue}</p>
      </div>
      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-semibold transition-all">
        Risolvi
      </button>
    </div>
  )
}

function DeviceRow({ id, user, status, battery, lastUpdate }: {
  id: string
  user: string
  status: 'online' | 'offline'
  battery: number
  lastUpdate: string
}) {
  const statusColor = status === 'online' ? 'bg-green-500' : 'bg-red-500'
  const batteryColor = battery < 20 ? 'text-red-400' : battery < 50 ? 'text-yellow-400' : 'text-green-400'

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="px-6 py-4">
        <span className="font-semibold text-white">{id}</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-gray-300">{user}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
          <span className="text-sm text-gray-300 capitalize">{status}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`font-semibold ${batteryColor}`}>{battery}%</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-400">{lastUpdate}</span>
      </td>
      <td className="px-6 py-4">
        <button className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 text-sm font-semibold transition-all">
          Configura
        </button>
      </td>
    </tr>
  )
}
