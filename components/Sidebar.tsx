"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  Users,
  UserPlus,
  Settings,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
  Home,
  Shield,
  Activity,
  Watch,
  Wifi,
  MessageSquare,
  Heart,
  Key,
  Check,
  AlertTriangle,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleEmoji } from "@/lib/permissions";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  roles: string[]; // Ruoli che possono vedere questo menu item
  dividerAfter?: boolean; // Mostra una linea di separazione dopo questo elemento
}

const menuItems: MenuItem[] = [
  {
    icon: <Home className="w-5 h-5" />,
    label: "Dashboard",
    href: "/dashboard",
    roles: [
      "sviluppatore",
      "animatore_digitale",
      "assistente_control",
      "controllo_parentale",
      "utente_base",
    ],
    dividerAfter: true,
  },
  {
    icon: <Users className="w-5 h-5" />,
    label: "Gestione Staff",
    href: "/dashboard/users",
    roles: ["sviluppatore"], // Solo sviluppatore
    dividerAfter: true,
  },
  {
    icon: <Wifi className="w-5 h-5" />,
    label: "Configura Orologi",
    href: "/dashboard/devices/new",
    roles: ["sviluppatore", "animatore_digitale"], // Sviluppatore e animatore
  },
  {
    icon: <Terminal className="w-5 h-5" />,
    label: "Comandi TCP",
    href: "/dashboard/commands",
    roles: ["sviluppatore", "animatore_digitale"], // Sviluppatore e animatore
    dividerAfter: true,
  },
  {
    icon: <Watch className="w-5 h-5" />,
    label: "Dispositivi GPS",
    href: "/dashboard/devices",
    roles: ["sviluppatore", "animatore_digitale"], // Sviluppatore e animatore
    dividerAfter: true,
  },
  {
    icon: <Heart className="w-5 h-5" />,
    label: "Gestione Pazienti",
    href: "/dashboard/pazienti",
    roles: ["sviluppatore", "animatore_digitale", "assistente_control"], // Staff che gestisce pazienti
    dividerAfter: true,
  },
  {
    icon: <Bell className="w-5 h-5" />,
    label: "Centro Controllo",
    href: "/dashboard/logs",
    roles: ["sviluppatore", "animatore_digitale"], // Sviluppatore e animatore
  },
  {
    icon: <Activity className="w-5 h-5" />,
    label: "Monitoraggio",
    href: "/dashboard/monitoring",
    roles: [
      "sviluppatore",
      "animatore_digitale",
      "assistente_control",
      "controllo_parentale",
    ],
  },
  {
    icon: <Heart className="w-5 h-5" />,
    label: "Dati Sanitari",
    href: "/dashboard/health",
    roles: [
      "sviluppatore",
      "animatore_digitale",
      "assistente_control",
      "controllo_parentale",
    ],
  },
];

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const userRole = user.ruolo.nome;
  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (passwords.newPassword.length < 6) {
      setPasswordError("La password deve essere di almeno 6 caratteri");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("Le password non coincidono");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwords.newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordSuccess(true);
        setPasswords({ newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(false);
        }, 2000);
      } else {
        setPasswordError(data.error || "Errore durante il cambio password");
      }
    } catch (error) {
      setPasswordError("Errore di connessione");
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white/5 backdrop-blur-xl border-r border-white/10 transition-all duration-300 z-20 ${
        sidebarOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <span className="text-xl font-bold text-white">GPS Watch</span>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {visibleMenuItems.map((item, index) => (
            <div key={item.href}>
              <SidebarMenuItem
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={pathname === item.href}
                sidebarOpen={sidebarOpen}
              />
              {item.dividerAfter && (
                <div className="my-3 border-t border-white/10"></div>
              )}
            </div>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="p-4 border-t border-white/10">
          {/* Cambio Password Button */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className={`w-full px-4 py-2 mb-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all flex items-center ${
              sidebarOpen ? "gap-2" : "justify-center"
            }`}
          >
            <Key className="w-4 h-4" />
            {sidebarOpen && (
              <span className="text-sm font-semibold">Cambia Password</span>
            )}
          </button>

          <button
            onClick={logout}
            className={`w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all flex items-center ${
              sidebarOpen ? "gap-2" : "justify-center"
            }`}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="text-sm font-semibold">Esci</span>}
          </button>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-400" />
                Cambia Password
              </h2>

              {passwordSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-green-300 font-semibold">
                    Password cambiata con successo!
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Nuova Password
                      </label>
                      <input
                        type="password"
                        value={passwords.newPassword}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            newPassword: e.target.value,
                          })
                        }
                        placeholder="Inserisci nuova password"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Conferma Password
                      </label>
                      <input
                        type="password"
                        value={passwords.confirmPassword}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Ripeti nuova password"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Password Match Indicator */}
                    {passwords.confirmPassword && (
                      <div
                        className={`flex items-center gap-2 text-sm ${
                          passwords.newPassword === passwords.confirmPassword
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {passwords.newPassword === passwords.confirmPassword ? (
                          <>
                            <Check className="w-4 h-4" />
                            Le password coincidono
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            Le password non coincidono
                          </>
                        )}
                      </div>
                    )}

                    {passwordError && (
                      <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                        {passwordError}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswords({ newPassword: "", confirmPassword: "" });
                        setPasswordError("");
                      }}
                      className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-all"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={handlePasswordChange}
                      disabled={
                        saving ||
                        !passwords.newPassword ||
                        !passwords.confirmPassword
                      }
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Salva
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-6 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
      >
        {sidebarOpen ? (
          <X className="w-4 h-4 text-white" />
        ) : (
          <Menu className="w-4 h-4 text-white" />
        )}
      </button>
    </aside>
  );
}

function SidebarMenuItem({
  icon,
  label,
  href,
  active = false,
  sidebarOpen,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  sidebarOpen: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active
          ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30"
          : "text-gray-400 hover:text-white hover:bg-white/10"
      } ${sidebarOpen ? "" : "justify-center"}`}
    >
      {icon}
      {sidebarOpen && <span className="font-semibold">{label}</span>}
    </Link>
  );
}
