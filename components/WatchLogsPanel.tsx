"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  MessageSquare,
  ArrowDown,
  ArrowUp,
  Clock,
  Smartphone,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface WatchLog {
  id: number;
  device_id: number | null;
  phone_number: string;
  direction: "sent" | "received";
  message: string;
  command_type: string | null;
  parsed_data: string | null;
  status: "pending" | "sent" | "failed" | "received";
  error_message: string | null;
  sent_at: string | null;
  received_at: string | null;
  created_at: string;
}

export default function WatchLogsPanel() {
  const [logs, setLogs] = useState<WatchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");

  const loadLogs = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/sms/logs");
      const data = await response.json();
      const logList = Array.isArray(data) ? data : (data.logs || []);
      setLogs(logList);
    } catch (error) {
      console.error("Errore caricamento log:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    return log.direction === filter;
  });

  const getDirectionIcon = (direction: string) => {
    return direction === "sent" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const getDirectionColor = (direction: string) => {
    return direction === "sent" ? "text-blue-400" : "text-green-400";
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { text: string; color: string; icon: React.ReactNode }
    > = {
      pending: {
        text: "In attesa",
        color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
        icon: <Clock className="w-4 h-4" />,
      },
      sent: {
        text: "Inviato",
        color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        icon: <CheckCircle className="w-4 h-4" />,
      },
      failed: {
        text: "Fallito",
        color: "bg-red-500/20 text-red-300 border-red-500/30",
        icon: <XCircle className="w-4 h-4" />,
      },
      received: {
        text: "Ricevuto",
        color: "bg-green-500/20 text-green-300 border-green-500/30",
        icon: <CheckCircle className="w-4 h-4" />,
      },
    };
    const badge = statusMap[status] || statusMap.pending;
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded border flex items-center gap-1 ${badge.color}`}
      >
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const parseParsedData = (parsedData: string | null) => {
    if (!parsedData) return null;
    try {
      return JSON.parse(parsedData);
    } catch {
      return parsedData;
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            📋 Log Orologio
          </h3>
          <p className="text-sm text-gray-400">
            Storico comandi SMS inviati e ricevuti
          </p>
        </div>
        <button
          onClick={loadLogs}
          disabled={refreshing}
          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 transition-all"
        >
          <RefreshCw
            className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Filtri */}
      <div className="mb-4">
        <div className="flex gap-2">
          {[
            {
              id: "all",
              label: "Tutti",
              icon: <MessageSquare className="w-4 h-4" />,
            },
            {
              id: "sent",
              label: "Inviati",
              icon: <ArrowUp className="w-4 h-4" />,
            },
            {
              id: "received",
              label: "Ricevuti",
              icon: <ArrowDown className="w-4 h-4" />,
            },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                filter === f.id
                  ? "bg-blue-500/30 border-2 border-blue-500/50 text-white"
                  : "bg-white/10 border border-white/20 text-gray-400 hover:text-white hover:bg-white/20"
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Log */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Nessun log trovato</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`p-2 rounded-lg ${
                      log.direction === "sent"
                        ? "bg-blue-500/20"
                        : "bg-green-500/20"
                    }`}
                  >
                    {getDirectionIcon(log.direction)}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${getDirectionColor(
                          log.direction
                        )}`}
                      >
                        {log.direction === "sent" ? "INVIATO" : "RICEVUTO"}
                      </span>
                      {getStatusBadge(log.status)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {log.command_type
                        ? `Tipo: ${log.command_type}`
                        : "Tipo: Sconosciuto"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {formatDateTime(log.sent_at || log.received_at)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {log.phone_number}
                  </p>
                </div>
              </div>

              {/* Messaggio */}
              <div className="mb-3">
                <div className="bg-black/30 rounded-lg p-3 font-mono text-sm">
                  <span className="text-green-400">{log.message}</span>
                </div>
              </div>

              {/* Dati Parsati */}
              {log.parsed_data && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs text-blue-300 mb-2 font-semibold">
                    Dati Parsati:
                  </p>
                  <pre className="text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(parseParsedData(log.parsed_data), null, 2)}
                  </pre>
                </div>
              )}

              {/* Errore */}
              {log.error_message && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-xs text-red-300">
                    <strong>Errore:</strong> {log.error_message}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-white mb-1">Informazioni Log:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>I log mostrano tutti i comandi SMS inviati e ricevuti</li>
              <li>
                I dati ricevuti vengono automaticamente parsati e salvati nel
                database
              </li>
              <li>Usa il pulsante di refresh per aggiornare la lista</li>
              <li>I log più recenti sono in cima alla lista</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
