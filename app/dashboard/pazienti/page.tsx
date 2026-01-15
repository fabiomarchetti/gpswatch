"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  X,
  RefreshCw,
  Search,
  AlertTriangle,
  Watch,
  Phone,
  MapPin,
  Droplets,
  Pill,
  FileText,
  User,
  Calendar,
  Calculator,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { calcolaCodiceFiscale, getComuniDisponibili } from "@/lib/codiceFiscale";

interface Patient {
  id: number;
  nome: string;
  cognome: string;
  data_nascita: string | null;
  luogo_nascita: string | null;
  codice_fiscale: string | null;
  sesso: string | null;
  telefono: string | null;
  email: string | null;
  indirizzo: string | null;
  citta: string | null;
  emergenza_nome: string | null;
  emergenza_telefono: string | null;
  emergenza_relazione: string | null;
  gruppo_sanguigno: string | null;
  allergie: string | null;
  patologie: string | null;
  farmaci: string | null;
  note_mediche: string | null;
  device_id: number | null;
  device_name: string | null;
  device_phone: string | null;
  active: boolean;
  created_at: string;
}

interface Device {
  id: number;
  device_id: string;
  phone_number: string;
  imei: string;
}

export default function PazientiPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: "",
    cognome: "",
    data_nascita: "",
    luogo_nascita: "",
    codice_fiscale: "",
    sesso: "",
    telefono: "",
    email: "",
    indirizzo: "",
    citta: "",
    emergenza_nome: "",
    emergenza_telefono: "",
    emergenza_relazione: "",
    gruppo_sanguigno: "",
    allergie: "",
    patologie: "",
    farmaci: "",
    note_mediche: "",
    device_id: null as number | null,
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [expandedPatient, setExpandedPatient] = useState<number | null>(null);

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/wearers");
      const data = await response.json();
      if (data.success) {
        setPatients(data.wearers);
      }
    } catch (error) {
      console.error("Errore caricamento pazienti:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/devices");
      const data = await response.json();
      if (data.devices) {
        setDevices(data.devices);
      }
    } catch (error) {
      console.error("Errore caricamento dispositivi:", error);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchDevices();
  }, []);

  const handleCreate = () => {
    setIsCreating(true);
    setEditingPatient(null);
    setEditForm({
      nome: "",
      cognome: "",
      data_nascita: "",
      luogo_nascita: "",
      codice_fiscale: "",
      sesso: "",
      telefono: "",
      email: "",
      indirizzo: "",
      citta: "",
      emergenza_nome: "",
      emergenza_telefono: "",
      emergenza_relazione: "",
      gruppo_sanguigno: "",
      allergie: "",
      patologie: "",
      farmaci: "",
      note_mediche: "",
      device_id: null,
    });
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setIsCreating(false);
    setEditForm({
      nome: patient.nome,
      cognome: patient.cognome,
      data_nascita: patient.data_nascita || "",
      luogo_nascita: patient.luogo_nascita || "",
      codice_fiscale: patient.codice_fiscale || "",
      sesso: patient.sesso || "",
      telefono: patient.telefono || "",
      email: patient.email || "",
      indirizzo: patient.indirizzo || "",
      citta: patient.citta || "",
      emergenza_nome: patient.emergenza_nome || "",
      emergenza_telefono: patient.emergenza_telefono || "",
      emergenza_relazione: patient.emergenza_relazione || "",
      gruppo_sanguigno: patient.gruppo_sanguigno || "",
      allergie: patient.allergie || "",
      patologie: patient.patologie || "",
      farmaci: patient.farmaci || "",
      note_mediche: patient.note_mediche || "",
      device_id: patient.device_id,
    });
  };

  // Calcola automaticamente il codice fiscale
  const handleCalcolaCodiceFiscale = () => {
    if (!editForm.nome || !editForm.cognome || !editForm.data_nascita || !editForm.sesso || !editForm.luogo_nascita) {
      setMessage({
        type: "error",
        text: "Compila nome, cognome, data nascita, sesso e luogo di nascita per calcolare il CF",
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const cf = calcolaCodiceFiscale({
      nome: editForm.nome,
      cognome: editForm.cognome,
      dataNascita: editForm.data_nascita,
      sesso: editForm.sesso as "M" | "F",
      luogoNascita: editForm.luogo_nascita,
    });

    if (cf) {
      setEditForm({ ...editForm, codice_fiscale: cf });
      setMessage({ type: "success", text: "Codice fiscale calcolato!" });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleSave = async () => {
    if (!editForm.nome || !editForm.cognome) {
      setMessage({ type: "error", text: "Nome e cognome sono obbligatori" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setSaving(true);
    try {
      const url = isCreating
        ? "/api/wearers"
        : `/api/wearers/${editingPatient?.id}`;
      const method = isCreating ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: isCreating
            ? "Paziente creato con successo"
            : "Paziente aggiornato con successo",
        });
        setEditingPatient(null);
        setIsCreating(false);
        fetchPatients();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Errore durante il salvataggio",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Errore di connessione" });
    } finally {
      setSaving(false);
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = async (patientId: number) => {
    try {
      const response = await fetch(`/api/wearers/${patientId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Paziente eliminato" });
        fetchPatients();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Errore eliminazione",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Errore di connessione" });
    }

    setDeleteConfirm(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cognome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.codice_fiscale &&
        patient.codice_fiscale
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (patient.device_name &&
        patient.device_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const availableDevices = devices.filter((device) => {
    // Se stiamo modificando un paziente e questo è il suo dispositivo attuale, includilo
    if (editingPatient && editingPatient.device_id === device.id) {
      return true;
    }
    // Altrimenti, includi solo i dispositivi non assegnati ad alcun paziente
    return !patients.some((p) => p.device_id === device.id);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        </div>
      </div>

      <Sidebar />

      <main className="ml-64 transition-all duration-300">
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
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Heart className="w-8 h-8 text-pink-400" />
                  Gestione Pazienti
                </h1>
                <p className="text-gray-400 mt-1">
                  {patients.length} pazienti registrati
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca pazienti..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                />
              </div>

              <button
                onClick={fetchPatients}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              >
                <RefreshCw
                  className={`w-5 h-5 text-white ${
                    loading ? "animate-spin" : ""
                  }`}
                />
              </button>

              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Nuovo Paziente
              </button>
            </div>
          </div>
        </header>

        <div className="relative z-10 p-8">
          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-green-500/20 border border-green-500/30 text-green-300"
                  : "bg-red-500/20 border border-red-500/30 text-red-300"
              }`}
            >
              {message.type === "success" ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              {message.text}
            </div>
          )}

          {/* Patients Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-pink-400 animate-spin mb-3" />
                <p className="text-gray-400">Caricamento pazienti...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <Heart className="w-12 h-12 text-gray-500 mb-3" />
                <p className="text-gray-400">Nessun paziente trovato</p>
                <button
                  onClick={handleCreate}
                  className="mt-4 px-4 py-2 bg-pink-500/20 text-pink-300 rounded-xl hover:bg-pink-500/30 transition-all"
                >
                  Aggiungi il primo paziente
                </button>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden hover:border-pink-500/30 transition-all"
                >
                  {/* Patient Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {patient.nome[0]}
                          {patient.cognome[0]}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {patient.nome} {patient.cognome}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {patient.sesso && (
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  patient.sesso === "M"
                                    ? "bg-blue-500/20 text-blue-300"
                                    : "bg-pink-500/20 text-pink-300"
                                }`}
                              >
                                {patient.sesso === "M"
                                  ? "Maschio"
                                  : patient.sesso === "F"
                                  ? "Femmina"
                                  : "Altro"}
                              </span>
                            )}
                            {patient.data_nascita && (
                              <span className="text-gray-400 text-sm">
                                {calculateAge(patient.data_nascita)} anni
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(patient)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all"
                          title="Modifica"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {deleteConfirm === patient.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(patient.id)}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(patient.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="p-6 space-y-3">
                    {/* Device */}
                    <div className="flex items-center gap-3">
                      <Watch className="w-4 h-4 text-gray-400" />
                      {patient.device_name ? (
                        <span className="text-green-300 text-sm font-medium">
                          {patient.device_name} ({patient.device_phone})
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          Nessun dispositivo assegnato
                        </span>
                      )}
                    </div>

                    {/* Phone */}
                    {patient.telefono && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">
                          {patient.telefono}
                        </span>
                      </div>
                    )}

                    {/* Emergency Contact */}
                    {patient.emergenza_nome && (
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <span className="text-orange-300 text-sm">
                          {patient.emergenza_nome} (
                          {patient.emergenza_relazione}) -{" "}
                          {patient.emergenza_telefono}
                        </span>
                      </div>
                    )}

                    {/* Blood Type */}
                    {patient.gruppo_sanguigno && (
                      <div className="flex items-center gap-3">
                        <Droplets className="w-4 h-4 text-red-400" />
                        <span className="text-gray-300 text-sm">
                          Gruppo: {patient.gruppo_sanguigno}
                        </span>
                      </div>
                    )}

                    {/* Expand Button */}
                    <button
                      onClick={() =>
                        setExpandedPatient(
                          expandedPatient === patient.id ? null : patient.id
                        )
                      }
                      className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-white transition-all"
                    >
                      {expandedPatient === patient.id
                        ? "Mostra meno"
                        : "Mostra dettagli medici"}
                    </button>

                    {/* Expanded Medical Info */}
                    {expandedPatient === patient.id && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                        {patient.allergie && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase">
                              Allergie
                            </span>
                            <p className="text-gray-300 text-sm mt-1">
                              {patient.allergie}
                            </p>
                          </div>
                        )}
                        {patient.patologie && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase">
                              Patologie
                            </span>
                            <p className="text-gray-300 text-sm mt-1">
                              {patient.patologie}
                            </p>
                          </div>
                        )}
                        {patient.farmaci && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase">
                              Farmaci
                            </span>
                            <p className="text-gray-300 text-sm mt-1">
                              {patient.farmaci}
                            </p>
                          </div>
                        )}
                        {patient.note_mediche && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase">
                              Note Mediche
                            </span>
                            <p className="text-gray-300 text-sm mt-1">
                              {patient.note_mediche}
                            </p>
                          </div>
                        )}
                        {!patient.allergie &&
                          !patient.patologie &&
                          !patient.farmaci &&
                          !patient.note_mediche && (
                            <p className="text-gray-500 text-sm italic">
                              Nessuna informazione medica registrata
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Edit/Create Modal */}
        {(editingPatient || isCreating) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
            <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-5xl mx-4 my-auto">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                {isCreating ? (
                  <UserPlus className="w-5 h-5 text-pink-400" />
                ) : (
                  <Edit2 className="w-5 h-5 text-pink-400" />
                )}
                {isCreating ? "Nuovo Paziente" : "Modifica Paziente"}
              </h2>

              <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={editForm.nome}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nome: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Cognome *
                    </label>
                    <input
                      type="text"
                      value={editForm.cognome}
                      onChange={(e) =>
                        setEditForm({ ...editForm, cognome: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Data di Nascita
                    </label>
                    <input
                      type="date"
                      value={editForm.data_nascita}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          data_nascita: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Luogo di Nascita
                    </label>
                    <input
                      type="text"
                      value={editForm.luogo_nascita}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          luogo_nascita: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="es. ROMA, MILANO..."
                      list="comuni-list"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                    />
                    <datalist id="comuni-list">
                      {getComuniDisponibili().map((comune) => (
                        <option key={comune} value={comune} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Sesso
                    </label>
                    <select
                      value={editForm.sesso}
                      onChange={(e) =>
                        setEditForm({ ...editForm, sesso: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="" className="bg-slate-800">
                        Seleziona...
                      </option>
                      <option value="M" className="bg-slate-800">
                        Maschio
                      </option>
                      <option value="F" className="bg-slate-800">
                        Femmina
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Codice Fiscale
                      <span className="text-pink-400 ml-2 text-xs">(auto-calcolabile)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editForm.codice_fiscale}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            codice_fiscale: e.target.value.toUpperCase(),
                          })
                        }
                        maxLength={16}
                        className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white uppercase focus:outline-none focus:border-pink-500"
                        placeholder="RSSMRA80A01H501X"
                      />
                      <button
                        type="button"
                        onClick={handleCalcolaCodiceFiscale}
                        className="px-3 py-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-300 rounded-lg transition-all flex items-center gap-1"
                        title="Calcola automaticamente"
                      >
                        <Calculator className="w-4 h-4" />
                        Calcola
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Gruppo Sanguigno
                    </label>
                    <select
                      value={editForm.gruppo_sanguigno}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          gruppo_sanguigno: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="" className="bg-slate-800">
                        Non specificato
                      </option>
                      <option value="A+" className="bg-slate-800">
                        A+
                      </option>
                      <option value="A-" className="bg-slate-800">
                        A-
                      </option>
                      <option value="B+" className="bg-slate-800">
                        B+
                      </option>
                      <option value="B-" className="bg-slate-800">
                        B-
                      </option>
                      <option value="AB+" className="bg-slate-800">
                        AB+
                      </option>
                      <option value="AB-" className="bg-slate-800">
                        AB-
                      </option>
                      <option value="0+" className="bg-slate-800">
                        0+
                      </option>
                      <option value="0-" className="bg-slate-800">
                        0-
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Telefono
                    </label>
                    <div className="flex">
                      <span className="px-3 py-2 bg-white/5 border border-white/20 border-r-0 rounded-l-lg text-gray-400 text-sm flex items-center">
                        +39
                      </span>
                      <input
                        type="tel"
                        value={editForm.telefono.replace(/^\+39/, '')}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setEditForm({ ...editForm, telefono: digits });
                        }}
                        placeholder="3331234567"
                        maxLength={10}
                        className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-r-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Indirizzo Residenza
                    </label>
                    <input
                      type="text"
                      value={editForm.indirizzo}
                      onChange={(e) =>
                        setEditForm({ ...editForm, indirizzo: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      Citta Residenza
                    </label>
                    <input
                      type="text"
                      value={editForm.citta}
                      onChange={(e) =>
                        setEditForm({ ...editForm, citta: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* Contatto di Emergenza */}
                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    Contatto di Emergenza
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Nome
                      </label>
                      <input
                        type="text"
                        value={editForm.emergenza_nome}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            emergenza_nome: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Telefono
                      </label>
                      <div className="flex">
                        <span className="px-3 py-2 bg-white/5 border border-white/20 border-r-0 rounded-l-lg text-gray-400 text-sm flex items-center">
                          +39
                        </span>
                        <input
                          type="tel"
                          value={editForm.emergenza_telefono.replace(/^\+39/, '')}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setEditForm({
                              ...editForm,
                              emergenza_telefono: digits,
                            });
                          }}
                          placeholder="3331234567"
                          maxLength={10}
                          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-r-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Relazione
                      </label>
                      <input
                        type="text"
                        value={editForm.emergenza_relazione}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            emergenza_relazione: e.target.value,
                          })
                        }
                        placeholder="es. Figlio, Moglie"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Informazioni Mediche */}
                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-pink-400" />
                    Informazioni Mediche
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Allergie
                      </label>
                      <textarea
                        value={editForm.allergie}
                        onChange={(e) =>
                          setEditForm({ ...editForm, allergie: e.target.value })
                        }
                        rows={2}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Patologie
                      </label>
                      <textarea
                        value={editForm.patologie}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            patologie: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Farmaci in uso
                      </label>
                      <textarea
                        value={editForm.farmaci}
                        onChange={(e) =>
                          setEditForm({ ...editForm, farmaci: e.target.value })
                        }
                        rows={2}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Note Mediche
                      </label>
                      <textarea
                        value={editForm.note_mediche}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            note_mediche: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Dispositivo GPS - Spostato in fondo */}
                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Watch className="w-4 h-4 text-green-400" />
                    Dispositivo GPS
                  </h3>
                  <select
                    value={editForm.device_id || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        device_id: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="" className="bg-slate-800">
                      Nessun dispositivo
                    </option>
                    {availableDevices.map((device) => (
                      <option
                        key={device.id}
                        value={device.id}
                        className="bg-slate-800"
                      >
                        {device.phone_number || device.device_id} - IMEI: {device.imei}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setEditingPatient(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-all"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isCreating ? "Crea Paziente" : "Salva Modifiche"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
