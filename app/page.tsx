import Link from 'next/link'
import { Activity, Heart, MapPin, Bell, ChevronRight, Shield, Zap, Users } from 'lucide-react'

export default function Home() {
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

      {/* Navbar */}
      <nav className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">GPS Watch</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Accedi
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full mb-6">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-white font-semibold">Monitoraggio in tempo reale</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            GPS Watch Tracker
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              per la tua salute
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Monitora la posizione e i parametri vitali in tempo reale.
            Sistema completo di tracking GPS con dati sanitari avanzati.
          </p>

          <div className="flex items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-2xl hover:shadow-blue-500/50 flex items-center gap-2"
            >
              Accedi al Sistema
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-gray-400">Monitoraggio</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">100%</div>
              <div className="text-gray-400">Sicuro</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">Real-time</div>
              <div className="text-gray-400">Tracking GPS</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Funzionalità Avanzate</h2>
            <p className="text-xl text-gray-400">Tutto quello che ti serve per un monitoraggio completo</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<MapPin className="w-8 h-8" />}
              title="Posizione GPS"
              description="Tracking in tempo reale con precisione millimetrica"
              color="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={<Heart className="w-8 h-8" />}
              title="Dati Sanitari"
              description="Monitora pressione, battito cardiaco e altri parametri vitali"
              color="from-red-500 to-pink-500"
            />
            <FeatureCard
              icon={<Activity className="w-8 h-8" />}
              title="Statistiche"
              description="Analisi avanzate con grafici e report dettagliati"
              color="from-green-500 to-emerald-500"
            />
            <FeatureCard
              icon={<Bell className="w-8 h-8" />}
              title="Allarmi"
              description="Notifiche intelligenti e geofencing personalizzato"
              color="from-yellow-500 to-orange-500"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <BenefitCard
              icon={<Shield className="w-12 h-12 text-blue-400" />}
              title="Sicuro e Affidabile"
              description="I tuoi dati sono protetti con crittografia end-to-end. Privacy garantita al 100%."
            />
            <BenefitCard
              icon={<Zap className="w-12 h-12 text-yellow-400" />}
              title="Veloce e Reattivo"
              description="Interfaccia moderna e veloce. Aggiornamenti in tempo reale senza ritardi."
            />
            <BenefitCard
              icon={<Users className="w-12 h-12 text-purple-400" />}
              title="Multi-utente"
              description="Gestisci più dispositivi e utenti da un'unica dashboard centralizzata."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © 2025 GPS Watch Tracker. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description, color }: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}) {
  return (
    <div className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2">
      <div className={`inline-flex p-3 bg-gradient-to-r ${color} rounded-xl mb-4 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}

function BenefitCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="text-center p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-2xl mb-4">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}
