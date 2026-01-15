'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import SviluppatoreDashboard from '@/components/dashboards/SviluppatoreDashboard'
import AnimatoreDigitaleDashboard from '@/components/dashboards/AnimatoreDigitaleDashboard'

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Determina quale dashboard mostrare in base al ruolo
  const renderDashboard = () => {
    switch (user.ruolo.nome) {
      case 'sviluppatore':
        return <SviluppatoreDashboard />
      case 'animatore_digitale':
        return <AnimatoreDigitaleDashboard />
      case 'assistente_control':
        return <div className="p-8 text-white">Dashboard Assistente Control - In sviluppo</div>
      case 'controllo_parentale':
        return <div className="p-8 text-white">Dashboard Controllo Parentale - In sviluppo</div>
      case 'utente_base':
        return <div className="p-8 text-white">Dashboard Utente Base - In sviluppo</div>
      default:
        return <div className="p-8 text-white">Dashboard non trovata</div>
    }
  }

  const getRoleBadge = () => {
    const badges = {
      sviluppatore: { text: '🔧 Livello 5 - Accesso Completo', color: 'from-purple-500/20 to-pink-600/20 border-purple-500/30 text-purple-300' },
      animatore_digitale: { text: '💻 Livello 4 - Configurazione Dispositivi', color: 'from-blue-500/20 to-cyan-600/20 border-blue-500/30 text-blue-300' },
      assistente_control: { text: '📊 Livello 3 - Control Room', color: 'from-green-500/20 to-emerald-600/20 border-green-500/30 text-green-300' },
      controllo_parentale: { text: '👨‍👩‍👧 Livello 2 - Controllo Parentale', color: 'from-yellow-500/20 to-orange-600/20 border-yellow-500/30 text-yellow-300' },
      utente_base: { text: '👤 Livello 1 - Utente Base', color: 'from-gray-500/20 to-slate-600/20 border-gray-500/30 text-gray-300' },
    }
    return badges[user.ruolo.nome as keyof typeof badges] || badges.utente_base
  }

  const getDashboardTitle = () => {
    const titles = {
      sviluppatore: 'Dashboard Sviluppatore',
      animatore_digitale: 'Dashboard Animatore Digitale',
      assistente_control: 'Dashboard Assistente Control',
      controllo_parentale: 'Dashboard Controllo Parentale',
      utente_base: 'Dashboard Utente',
    }
    return titles[user.ruolo.nome as keyof typeof titles] || 'Dashboard'
  }

  const badge = getRoleBadge()

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
            <div>
              <h1 className="text-3xl font-bold text-white">{getDashboardTitle()}</h1>
              <p className="text-gray-400 mt-1">Benvenuto, {user.nome}!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 bg-gradient-to-r ${badge.color} border rounded-lg`}>
                <span className="text-sm font-semibold">{badge.text}</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg transition-all flex items-center gap-2 font-semibold hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Esci
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        {renderDashboard()}
      </main>
    </div>
  )
}
