"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Activity,
  Bell,
  Shield,
  Settings,
  BarChart3,
  Database,
  MessageSquare,
  Watch,
  Heart,
  Wifi,
  RefreshCw,
} from "lucide-react";
import SendCommandPanel from "@/components/SendCommandPanel";
import WatchLogsPanel from "@/components/WatchLogsPanel";

interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalDevices: number;
  activeDevices: number;
  connectedDevices: number;
  connectedDevicesList: string[];
  healthMeasurementsToday: number;
  healthMeasurementsTotal: number;
  smsToday: number;
  systemStatus: string;
}

export default function SviluppatoreDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Errore caricamento statistiche:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Aggiorna ogni 30 secondi
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative z-10 p-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Pazienti"
          value={loading ? "..." : String(stats?.totalPatients || 0)}
          icon={<Users className="w-6 h-6" />}
          color="from-blue-500 to-cyan-500"
          subtitle="indossano l'orologio"
        />
        <StatsCard
          title="Dispositivi"
          value={loading ? "..." : String(stats?.totalDevices || 0)}
          icon={<Watch className="w-6 h-6" />}
          color="from-green-500 to-emerald-500"
          subtitle={`${stats?.activeDevices || 0} attivi (ultima ora)`}
        />
        <StatsCard
          title="Connessi TCP"
          value={loading ? "..." : String(stats?.connectedDevices || 0)}
          icon={<Wifi className="w-6 h-6" />}
          color="from-yellow-500 to-orange-500"
          subtitle="orologi online"
        />
        <StatsCard
          title="Misurazioni Salute"
          value={loading ? "..." : String(stats?.healthMeasurementsTotal || 0)}
          icon={<Heart className="w-6 h-6" />}
          color="from-purple-500 to-pink-500"
          subtitle={`${stats?.healthMeasurementsToday || 0} oggi`}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            icon={<MessageSquare className="w-8 h-8" />}
            title="Invia Comandi"
            description="Invia comandi SMS agli orologi"
            href="#send-command"
            color="from-blue-500 to-purple-600"
          />
          <ActionCard
            icon={<Heart className="w-8 h-8" />}
            title="Gestisci Pazienti"
            description="Chi indossa l'orologio GPS"
            href="/dashboard/pazienti"
            color="from-pink-500 to-rose-600"
          />
          <ActionCard
            icon={<Users className="w-8 h-8" />}
            title="Gestisci Staff"
            description="Operatori del portale"
            href="/dashboard/users"
            color="from-orange-500 to-red-600"
          />
          <ActionCard
            icon={<UserPlus className="w-8 h-8" />}
            title="Nuovo Staff"
            description="Aggiungi operatore al sistema"
            href="/register"
            color="from-green-500 to-emerald-600"
          />
        </div>
      </div>

      {/* Send Command Panel */}
      <div id="send-command" className="mb-8">
        <SendCommandPanel />
      </div>

      {/* Watch Logs Panel */}
      <div id="watch-logs" className="mb-8">
        <WatchLogsPanel />
      </div>

      {/* System Health */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          Stato del Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Database</h3>
                <p className="text-sm text-gray-400">PostgreSQL 16.11</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Connessioni attive
                </span>
                <span className="text-sm font-semibold text-green-400">
                  12/100
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Storage utilizzato
                </span>
                <span className="text-sm font-semibold text-blue-400">
                  245 MB / 10 GB
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Ultimo backup</span>
                <span className="text-sm font-semibold text-gray-300">
                  2 ore fa
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">API Server</h3>
                <p className="text-sm text-gray-400">Next.js 16.1.1</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Uptime</span>
                <span className="text-sm font-semibold text-green-400">
                  99.9%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Richieste/min</span>
                <span className="text-sm font-semibold text-blue-400">142</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Tempo medio risposta
                </span>
                <span className="text-sm font-semibold text-gray-300">
                  45ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Attività Recente</h2>
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
          <div className="space-y-4">
            <ActivityItem
              icon="👤"
              text="Nuovo utente registrato: Michele Ciccola (Animatore Digitale)"
              time="2 minuti fa"
            />
            <ActivityItem
              icon="⚙️"
              text="Configurazione dispositivo GPS-001 aggiornata"
              time="1 ora fa"
            />
            <ActivityItem
              icon="🔔"
              text="Allarme geofencing attivato per utente #23"
              time="3 ore fa"
            />
            <ActivityItem
              icon="📊"
              text="Report giornaliero generato con successo"
              time="5 ore fa"
            />
            <ActivityItem
              icon="🔧"
              text="Manutenzione database completata"
              time="1 giorno fa"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 bg-gradient-to-r ${color} rounded-xl`}>{icon}</div>
        {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  href,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:-translate-y-1"
    >
      <div
        className={`inline-flex p-3 bg-gradient-to-r ${color} rounded-xl mb-4 group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </Link>
  );
}

function ActivityItem({
  icon,
  text,
  time,
}: {
  icon: string;
  text: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-4 pb-4 border-b border-white/10 last:border-0 last:pb-0">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="text-white font-medium">{text}</p>
        <p className="text-sm text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  );
}
