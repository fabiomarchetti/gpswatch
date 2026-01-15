'use client'

import Link from 'next/link'
import { Box, ArrowLeft, CheckCircle2, ArrowRight, Smartphone, CreditCard, KeyRound, Power } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

export default function NewDevicePage() {
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
                href="/dashboard/devices"
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Box className="w-8 h-8 text-orange-400" />
                  Configura Orologio GPS
                </h1>
                <p className="text-gray-400 mt-1">Preparazione hardware e inserimento SIM</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="relative z-10 p-8">
          <div className="max-w-4xl mx-auto">

            {/* Intro Box */}
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex-shrink-0">
                  <Box className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Prima di iniziare</h2>
                  <p className="text-gray-300">
                    Segui questi passaggi per preparare l'orologio GPS prima della registrazione.
                    Una volta completato il setup fisico, potrai registrare il dispositivo nella pagina dedicata.
                  </p>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-6">

              {/* Step 1: Unboxing */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xl rounded-xl">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-orange-400" />
                      Unboxing
                    </h3>
                    <p className="text-gray-400 mb-4">Apri la confezione dell'orologio e verifica il contenuto</p>
                    <div className="bg-white/5 rounded-xl p-4">
                      <ul className="text-gray-300 space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span>Orologio GPS C405 KYS S5</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span>Cavo di ricarica USB magnetico</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span>Manuale utente (cinese/inglese)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Preparazione SIM */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xl rounded-xl">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-orange-400" />
                      Preparazione SIM
                    </h3>
                    <p className="text-gray-400 mb-4">Prepara una SIM con piano dati attivo</p>
                    <div className="bg-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">SIM attiva con credito o piano dati (Wind/Tre, Vodafone, TIM)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">Annota il numero di telefono della SIM (ti servirà dopo)</span>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <span className="text-orange-400 font-bold text-lg">!</span>
                        <div>
                          <span className="text-orange-300 font-semibold">IMPORTANTE: </span>
                          <span className="text-gray-300">Disabilita il PIN della SIM dal tuo telefono prima di inserirla nell'orologio</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Disabilita PIN */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xl rounded-xl">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-orange-400" />
                      Disabilita PIN SIM
                    </h3>
                    <p className="text-gray-400 mb-4">Procedura per rimuovere il PIN dalla SIM</p>
                    <div className="bg-white/5 rounded-xl p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                          <h4 className="text-blue-300 font-bold mb-2">iPhone</h4>
                          <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                            <li>Impostazioni → Cellulare</li>
                            <li>PIN SIM → Disattiva</li>
                            <li>Inserisci PIN attuale</li>
                          </ol>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                          <h4 className="text-green-300 font-bold mb-2">Android</h4>
                          <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                            <li>Impostazioni → Sicurezza</li>
                            <li>Blocco SIM → Disattiva</li>
                            <li>Inserisci PIN attuale</li>
                          </ol>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <span className="text-yellow-400 font-bold text-lg">?</span>
                        <div>
                          <span className="text-yellow-300 font-semibold">PIN dimenticato? </span>
                          <span className="text-gray-300">Usa il codice PUK (sulla confezione della SIM) per resettare il PIN</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Inserimento e Accensione */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xl rounded-xl">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <Power className="w-5 h-5 text-orange-400" />
                      Inserimento SIM e Accensione
                    </h3>
                    <p className="text-gray-400 mb-4">Inserisci la SIM nell'orologio e accendilo</p>
                    <div className="bg-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-400 font-bold">1.</span>
                        <span className="text-gray-300">Apri lo sportellino laterale dell'orologio</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-400 font-bold">2.</span>
                        <span className="text-gray-300">Inserisci la nano-SIM nello slot (chip verso il basso)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-400 font-bold">3.</span>
                        <span className="text-gray-300">Chiudi lo sportellino con attenzione</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-400 font-bold">4.</span>
                        <span className="text-gray-300">Tieni premuto il pulsante di accensione per 3-5 secondi</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-orange-400 font-bold">5.</span>
                        <span className="text-gray-300">Attendi che compaia l'icona del segnale GSM (potrebbe richiedere 1-2 minuti)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Box */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="w-12 h-12 text-green-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-green-300 mb-1">Setup Fisico Completato!</h3>
                    <p className="text-gray-300">
                      L'orologio è pronto. Ora puoi procedere alla registrazione del dispositivo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center pt-4">
                <Link
                  href="/dashboard/devices/register"
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-3"
                >
                  <span>Continua con la Registrazione</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
