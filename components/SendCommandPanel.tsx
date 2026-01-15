"use client";

import { useState, useEffect } from "react";
import {
  Send,
  Smartphone,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Wifi,
} from "lucide-react";

interface Device {
  id: number;
  device_id: string;
  imei: string;
  phone_number: string;
  name: string;
  status: string;
  battery_level: number | null;
  assigned_user_name: string | null;
  assigned_user_surname: string | null;
}

interface SMSCommand {
  cmdId: string;
  name: string;
  command: string;
  description?: string;
  category: string;
  expectedResponse: string;
}

interface TCPCommand {
  cmdId?: string;
  command: string;
  description: string;
  category: string;
}

const smsCommands: SMSCommand[] = [
  // Comandi Base
  {
    cmdId: "ts",
    name: "Configurazione Completa",
    command: "pw,123456,ts#",
    category: "base",
    expectedResponse: "ver:..., imei:..., ip_url:...",
  },
  {
    cmdId: "url",
    name: "Configurazione URL",
    command: "pw,123456,url#",
    category: "base",
    expectedResponse: "ip_url:...",
  },
  {
    cmdId: "bat",
    name: "Stato Batteria",
    command: "pw,123456,bat#",
    category: "base",
    expectedResponse: "battery:XX%",
  },
  {
    cmdId: "ver",
    name: "Versione Firmware",
    command: "pw,123456,ver#",
    category: "base",
    expectedResponse: "C405_KYS_S5_V1.3...",
  },
  {
    cmdId: "reboot",
    name: "Riavvio Orologio",
    command: "pw,123456,reboot#",
    category: "base",
    expectedResponse: "Rebooting...",
  },

  // Comandi Salute
  {
    cmdId: "hrt",
    name: "Frequenza Cardiaca",
    command: "pw,123456,hrt#",
    category: "health",
    expectedResponse: "hr:XXbpm",
  },
  {
    cmdId: "bp",
    name: "Pressione Sanguigna",
    command: "pw,123456,bp#",
    category: "health",
    expectedResponse: "bp:XXX/YYmmHg",
  },
  {
    cmdId: "oxygen",
    name: "Saturazione Ossigeno",
    command: "pw,123456,oxygen#",
    category: "health",
    expectedResponse: "oxygen:XX%",
  },
  {
    cmdId: "temp",
    name: "Temperatura Corporea",
    command: "pw,123456,temp#",
    category: "health",
    expectedResponse: "temp:XX.X°C",
  },

  // Comandi Configurazione
  {
    cmdId: "ip",
    name: "Configura Server",
    command: "pw,123456,ip,91.99.141.225,8001#",
    category: "config",
    expectedResponse: "IP set successfully",
  },
  {
    cmdId: "upload",
    name: "Intervallo Upload (30s)",
    command: "pw,123456,upload,30000#",
    category: "config",
    expectedResponse: "Upload interval set",
  },
  {
    cmdId: "lz",
    name: "Zona GPS Italia",
    command: "pw,123456,lz,12#",
    category: "config",
    expectedResponse: "GPS zone set",
  },
];

const tcpCommands: TCPCommand[] = [
  // Comandi Posizione
  { command: "CR", description: "Posizione Immediata", category: "position" },
  { command: "LK", description: "Heartbeat/Status", category: "position" },

  // Comandi Salute
  { command: "bphrt", description: "Pressione e Battito", category: "health" },
  {
    command: "oxygen",
    description: "Saturazione Ossigeno",
    category: "health",
  },
  { command: "btemp2", description: "Temperatura", category: "health" },

  // Comandi Configurazione
  { command: "VERNO", description: "Versione Firmware", category: "config" },
  { command: "RESET", description: "Reset Fabbrica", category: "config" },
  { command: "POWEROFF", description: "Spegni Orologio", category: "config" },
  {
    command: "UPLOAD,300",
    description: "Intervallo Upload (5 min)",
    category: "config",
  },
];

const categories = [
  { id: "all", name: "Tutti" },
  { id: "base", name: "SMS Base" },
  { id: "health", name: "SMS Salute" },
  { id: "config", name: "SMS Configurazione" },
  { id: "position", name: "TCP Posizione" },
  { id: "tcp_health", name: "TCP Salute" },
  { id: "tcp_config", name: "TCP Configurazione" },
];

export default function SendCommandPanel() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedCommand, setSelectedCommand] = useState<
    SMSCommand | TCPCommand | null
  >(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [commandType, setCommandType] = useState<"sms" | "tcp">("sms");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Carica dispositivi
  const loadDevices = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/devices");
      const data = await response.json();
      const deviceList = Array.isArray(data) ? data : (data.devices || []);
      setDevices(deviceList.filter((d: Device) => d.phone_number));
    } catch (error) {
      console.error("Errore caricamento dispositivi:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const filteredCommands =
    commandType === "sms"
      ? smsCommands.filter(
          (cmd) => activeCategory === "all" || cmd.category === activeCategory
        )
      : tcpCommands.filter(
          (cmd) => activeCategory === "all" || cmd.category === activeCategory
        );

  const handleSendCommand = async () => {
    if (!selectedDevice || !selectedCommand) return;

    setSending(true);
    setResult(null);

    try {
      let response, data;

      if (commandType === "sms") {
        // Invia comando SMS
        response = await fetch("/api/sms/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device_id: selectedDevice.id,
            command: (selectedCommand as SMSCommand).command,
          }),
        });
        data = await response.json();

        if (data.success) {
          setResult({
            success: true,
            message: `Comando SMS inviato con successo! Log ID: ${data.logId}`,
          });
        } else {
          setResult({
            success: false,
            message: `Errore SMS: ${data.error}`,
          });
        }
      } else {
        // Invia comando TCP
        response = await fetch("/api/tcp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId: selectedDevice.imei,
            command: (selectedCommand as TCPCommand).command,
          }),
        });
        data = await response.json();

        if (data.success) {
          setResult({
            success: true,
            message: `Comando TCP inviato con successo! ${data.message}`,
          });
        } else {
          setResult({
            success: false,
            message: `Errore TCP: ${data.error || data.message}`,
          });
        }
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Errore di comunicazione: ${error}`,
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      active: {
        text: "Attivo",
        color: "bg-green-500/20 text-green-300 border-green-500/30",
      },
      inactive: {
        text: "Inattivo",
        color: "bg-gray-500/20 text-gray-300 border-gray-500/30",
      },
      offline: {
        text: "Offline",
        color: "bg-red-500/20 text-red-300 border-red-500/30",
      },
      maintenance: {
        text: "Manutenzione",
        color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      },
    };
    const badge = statusMap[status] || statusMap.inactive;
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded border ${badge.color}`}
      >
        {badge.text}
      </span>
    );
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            📤 Invia Comando
          </h3>
          <p className="text-sm text-gray-400">
            Invia comandi SMS o TCP agli orologi GPS
          </p>
        </div>
        <button
          onClick={loadDevices}
          disabled={refreshing}
          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 transition-all"
        >
          <RefreshCw
            className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Seleziona Dispositivo */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-white mb-2">
          Seleziona Dispositivo
        </label>
        <select
          value={selectedDevice?.id || ""}
          onChange={(e) =>
            setSelectedDevice(
              devices.find((d) => d.id === parseInt(e.target.value)) || null
            )
          }
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading || sending}
        >
          <option value="">-- Seleziona un dispositivo --</option>
          {devices.map((device) => {
            const wearerInfo = device.assigned_user_name && device.assigned_user_surname
              ? `${device.assigned_user_name} ${device.assigned_user_surname}`
              : "Non assegnato";
            return (
              <option key={device.id} value={device.id}>
                {device.phone_number} - {wearerInfo}
              </option>
            );
          })}
        </select>
      </div>

      {/* Info Dispositivo Selezionato */}
      {selectedDevice && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Indossato da:</span>
              <p className="text-white font-semibold">
                {selectedDevice.assigned_user_name && selectedDevice.assigned_user_surname
                  ? `${selectedDevice.assigned_user_name} ${selectedDevice.assigned_user_surname}`
                  : "Non assegnato"}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Telefono:</span>
              <p className="text-white font-mono">
                {selectedDevice.phone_number}
              </p>
            </div>
            <div>
              <span className="text-gray-400">IMEI:</span>
              <p className="text-white font-mono">{selectedDevice.imei}</p>
            </div>
            <div>
              <span className="text-gray-400">Device ID:</span>
              <p className="text-white font-mono">
                {selectedDevice.device_id}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Stato:</span>
              {getStatusBadge(selectedDevice.status)}
            </div>
          </div>
        </div>
      )}

      {/* Seleziona Tipo Comando */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-white mb-2">
          Tipo Comando
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => setCommandType("sms")}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              commandType === "sms"
                ? "bg-blue-500/30 border-2 border-blue-500/50 text-white"
                : "bg-white/10 border border-white/20 text-gray-400 hover:text-white hover:bg-white/20"
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span>SMS</span>
          </button>
          <button
            onClick={() => setCommandType("tcp")}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              commandType === "tcp"
                ? "bg-purple-500/30 border-2 border-purple-500/50 text-white"
                : "bg-white/10 border border-white/20 text-gray-400 hover:text-white hover:bg-white/20"
            }`}
          >
            <Wifi className="w-5 h-5" />
            <span>TCP</span>
          </button>
        </div>
      </div>

      {/* Categorie Comandi */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-white mb-2">
          Categoria Comandi
        </label>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              disabled={
                !commandType ||
                (commandType === "sms" &&
                  ["position", "tcp_health", "tcp_config"].includes(cat.id)) ||
                (commandType === "tcp" &&
                  ["base", "health", "config"].includes(cat.id))
              }
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeCategory === cat.id
                  ? "bg-blue-500/30 border-2 border-blue-500/50 text-white"
                  : "bg-white/10 border border-white/20 text-gray-400 hover:text-white hover:bg-white/20"
              } ${
                !commandType ||
                (commandType === "sms" &&
                  ["position", "tcp_health", "tcp_config"].includes(cat.id)) ||
                (commandType === "tcp" &&
                  ["base", "health", "config"].includes(cat.id))
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Comandi */}
      <div className="mb-6 space-y-2 max-h-[300px] overflow-y-auto">
        {filteredCommands.map((cmd, index) => (
          <button
            key={cmd.cmdId || cmd.command}
            onClick={() => setSelectedCommand(cmd)}
            disabled={!selectedDevice || sending}
            className={`w-full text-left p-4 rounded-xl transition-all ${
              selectedCommand === cmd
                ? "bg-blue-500/30 border-2 border-blue-500/50"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            } ${!selectedDevice ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-white font-semibold mb-1">
                  {cmd.description}
                </p>
                <code className="text-xs text-green-400 font-mono bg-black/30 px-2 py-1 rounded">
                  {cmd.command}
                </code>
              </div>
              <Smartphone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>

      {/* Pulsante Invia */}
      <button
        onClick={handleSendCommand}
        disabled={!selectedDevice || !selectedCommand || sending}
        className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Invio in corso...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span>Invia Comando</span>
          </>
        )}
      </button>

      {/* Risultato */}
      {result && (
        <div
          className={`mt-4 p-4 rounded-xl flex items-start gap-3 ${
            result.success
              ? "bg-green-500/10 border border-green-500/30"
              : "bg-red-500/10 border border-red-500/30"
          }`}
        >
          {result.success ? (
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
          )}
          <div>
            <p
              className={`font-semibold ${
                result.success ? "text-green-300" : "text-red-300"
              }`}
            >
              {result.success ? "✅ Successo" : "❌ Errore"}
            </p>
            <p className="text-sm text-gray-300 mt-1">{result.message}</p>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <p className="text-sm text-yellow-200">
          <strong>Nota:</strong>
          {commandType === "sms"
            ? "Dopo aver inviato un comando SMS, attendi 10-30 secondi per la risposta dell'orologio. La risposta verrà salvata nei log SMS."
            : "I comandi TCP richiedono che l'orologio sia connesso al server (91.99.141.225:8001). La risposta verrà ricevuta automaticamente dal server TCP."}
        </p>
      </div>
    </div>
  );
}
