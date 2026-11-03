import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Calendar, Clock, FileText, Sparkles, Trash2, Check, X, ShoppingBag, Package, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminApi, publicApi } from "@/lib/api";
import { toast } from "sonner";
import ContentEditor from "@/components/admin/ContentEditor";
import ServicesEditor from "@/components/admin/ServicesEditor";
import ProductsEditor from "@/components/admin/ProductsEditor";
import OrdersView from "@/components/admin/OrdersView";
import CredentialsEditor from "@/components/admin/CredentialsEditor";

const WEEKDAYS = [
  ["monday", "Lundi"], ["tuesday", "Mardi"], ["wednesday", "Mercredi"],
  ["thursday", "Jeudi"], ["friday", "Vendredi"], ["saturday", "Samedi"], ["sunday", "Dimanche"],
];

const TABS = [
  { id: "rdv", label: "Rendez-vous", icon: Calendar },
  { id: "commandes", label: "Commandes", icon: ShoppingBag },
  { id: "boutique", label: "Boutique", icon: Package },
  { id: "dispo", label: "Disponibilités", icon: Clock },
  { id: "contenu", label: "Textes & Contact", icon: FileText },
  { id: "soins", label: "Soins & Prix", icon: Sparkles },
  { id: "compte", label: "Mon compte", icon: KeyRound },
];

const STATUS = {
  pending: { label: "En attente", cls: "text-amber-300 border-amber-300/40" },
  confirmed: { label: "Confirmé", cls: "text-emerald-300 border-emerald-300/40" },
  cancelled: { label: "Annulé", cls: "text-red-300 border-red-300/40" },
};

function Appointments() {
  const [items, setItems] = useState([]);
  const load = () => adminApi.listAppointments().then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);
  const setStatus = async (id, status) => { await adminApi.updateAppointment(id, status); toast.success("Statut mis à jour"); load(); };
  const remove = async (id) => { await adminApi.deleteAppointment(id); toast.success("Supprimé"); load(); };
  if (!items.length) return <p className="text-[#9a938a]">Aucun rendez-vous pour le moment.</p>;
  return (
    <div className="space-y-3">
      {items.map((a) => (
        <div key={a.id} className="bg-[#111113] border border-[#c6a15b]/15 rounded-lg p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-serif text-lg text-[#efe9e0]">{a.firstName} {a.lastName}</span>
              <span className={`text-[0.6rem] tracking-label uppercase px-2 py-0.5 rounded-full border ${STATUS[a.status]?.cls}`}>{STATUS[a.status]?.label}</span>
            </div>
            <p className="text-sm text-gold">{a.service}</p>
            <p className="text-xs text-[#9a938a] mt-1">{a.date} · {a.time} · {a.phone} · {a.email}</p>
            {a.note ? <p className="text-xs text-[#9a938a] mt-1 italic">« {a.note} »</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setStatus(a.id, "confirmed")} title="Confirmer" className="p-2 rounded border border-emerald-300/30 text-emerald-300 hover:bg-emerald-300/10"><Check size={16} /></button>
            <button onClick={() => setStatus(a.id, "cancelled")} title="Annuler" className="p-2 rounded border border-amber-300/30 text-amber-300 hover:bg-amber-300/10"><X size={16} /></button>
            <button onClick={() => remove(a.id)} title="Supprimer" className="p-2 rounded border border-red-300/30 text-red-300 hover:bg-red-300/10"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Availability() {
  const [hours, setHours] = useState(null);
  const [blocked, setBlocked] = useState([]);
  const [newDate, setNewDate] = useState("");
  useEffect(() => {
    publicApi.getHours().then(setHours);
    adminApi.getBlocked().then((d) => setBlocked(d.dates || []));
  }, []);
  if (!hours) return <p className="text-[#9a938a]">Chargement…</p>;
  const upd = (day, field, val) => setHours({ ...hours, [day]: { ...hours[day], [field]: val } });
  const saveHours = async () => { await adminApi.updateHours(hours); toast.success("Heures enregistrées"); };
  const addBlocked = async () => {
    if (!newDate || blocked.includes(newDate)) return;
    const next = [...blocked, newDate].sort();
    setBlocked(next); setNewDate(""); await adminApi.updateBlocked(next); toast.success("Date bloquée");
  };
  const removeBlocked = async (d) => { const next = blocked.filter((x) => x !== d); setBlocked(next); await adminApi.updateBlocked(next); toast.success("Date débloquée"); };
  return (
    <div className="space-y-8">
      <div className="bg-[#111113] border border-[#c6a15b]/15 rounded-lg p-6">
        <h3 className="font-serif text-xl text-[#efe9e0] mb-1">Heures d'ouverture</h3>
        <p className="text-xs text-[#9a938a] mb-5">Cochez les jours d'ouverture et ajustez vos heures disponibles.</p>
        <div className="space-y-3">
          {WEEKDAYS.map(([key, label]) => (
            <div key={key} className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 w-32 cursor-pointer">
                <input type="checkbox" checked={hours[key]?.open || false} onChange={(e) => upd(key, "open", e.target.checked)} className="accent-[#c6a15b] w-4 h-4" />
                <span className="text-sm text-[#efe9e0]">{label}</span>
              </label>
              <input type="time" value={hours[key]?.start || "10:00"} disabled={!hours[key]?.open} onChange={(e) => upd(key, "start", e.target.value)} className="bg-transparent border border-[#c6a15b]/20 rounded px-2 py-1.5 text-sm text-[#efe9e0] disabled:opacity-40" />
              <span className="text-[#9a938a]">–</span>
              <input type="time" value={hours[key]?.end || "20:00"} disabled={!hours[key]?.open} onChange={(e) => upd(key, "end", e.target.value)} className="bg-transparent border border-[#c6a15b]/20 rounded px-2 py-1.5 text-sm text-[#efe9e0] disabled:opacity-40" />
            </div>
          ))}
        </div>
        <button onClick={saveHours} className="btn-gold-solid mt-6">Enregistrer les heures</button>
      </div>
      <div className="bg-[#111113] border border-[#c6a15b]/15 rounded-lg p-6">
        <h3 className="font-serif text-xl text-[#efe9e0] mb-1">Journées non disponibles</h3>
        <p className="text-xs text-[#9a938a] mb-5">Bloquez des dates spécifiques (congés, absences). Ces jours n'accepteront aucune réservation.</p>
        <div className="flex items-center gap-3 mb-4">
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="bg-transparent border border-[#c6a15b]/20 rounded px-3 py-2 text-sm text-[#efe9e0]" />
          <button onClick={addBlocked} className="btn-gold"><span>Bloquer</span></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {blocked.map((d) => (
            <span key={d} className="flex items-center gap-2 text-sm text-[#efe9e0] border border-[#c6a15b]/20 rounded-full px-3 py-1">
              {d} <button onClick={() => removeBlocked(d)} className="text-red-300 hover:text-red-200"><X size={13} /></button>
            </span>
          ))}
          {!blocked.length && <span className="text-sm text-[#9a938a]">Aucune date bloquée.</span>}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { isAuthed, loading, logout, email } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("rdv");

  useEffect(() => { if (!loading && !isAuthed) navigate("/admin"); }, [isAuthed, loading, navigate]);
  if (loading || !isAuthed) return <div className="min-h-screen bg-[#0d0d0e]" />;

  return (
    <div className="min-h-screen bg-[#0d0d0e]">
      <header className="border-b border-[#c6a15b]/10 py-5">
        <div className="ng-container flex items-center justify-between">
          <div>
            <div className="font-serif gold-gradient-text text-2xl">Nelly Glam</div>
            <p className="text-[0.62rem] tracking-label uppercase text-[#9a938a]">Espace administrateur</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#9a938a] hidden sm:inline">{email}</span>
            <button onClick={() => { logout(); navigate("/admin"); }} className="flex items-center gap-2 text-sm text-[#efe9e0]/80 hover:text-gold"><LogOut size={16} /> Déconnexion</button>
          </div>
        </div>
      </header>
      <div className="ng-container py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[0.7rem] tracking-label uppercase transition-all ${tab === t.id ? "bg-gold text-[#0d0d0e]" : "border border-[#c6a15b]/20 text-[#efe9e0]/75 hover:border-gold"}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
        {tab === "rdv" && <Appointments />}
        {tab === "commandes" && <OrdersView />}
        {tab === "boutique" && <ProductsEditor />}
        {tab === "dispo" && <Availability />}
        {tab === "contenu" && <ContentEditor />}
        {tab === "soins" && <ServicesEditor />}
        {tab === "compte" && <CredentialsEditor />}
      </div>
    </div>
  );
}
