import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { X, Clock, ArrowLeft, Check } from "lucide-react";
import { publicApi } from "@/lib/api";
import { toast } from "sonner";

const BookingContext = createContext(null);
export const useBooking = () => useContext(BookingContext);

const MONTHS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const DOW = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export function BookingProvider({ children, services = [] }) {
  const [open, setOpen] = useState(false);
  const [preselect, setPreselect] = useState(null);

  const openBooking = (serviceName) => { setPreselect(serviceName || null); setOpen(true); };

  return (
    <BookingContext.Provider value={{ openBooking }}>
      {children}
      {open && <BookingModal onClose={() => setOpen(false)} services={services} preselect={preselect} />}
    </BookingContext.Provider>
  );
}

function BookingModal({ onClose, services, preselect }) {
  const [step, setStep] = useState(1);
  const [service, setService] = useState(preselect || "");
  const [monthDate, setMonthDate] = useState(new Date());
  const [selDate, setSelDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [time, setTime] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", note: "" });
  const [submitting, setSubmitting] = useState(false);

  const serviceNames = useMemo(() => services.flatMap((c) => c.services.map((s) => s.name)), [services]);

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  useEffect(() => {
    if (!selDate) return;
    setLoadingSlots(true); setTime("");
    publicApi.getAvailability(fmt(selDate))
      .then((d) => setSlots(d.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selDate]);

  const daysGrid = useMemo(() => {
    const y = monthDate.getFullYear(), m = monthDate.getMonth();
    const first = new Date(y, m, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday first
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
    return cells;
  }, [monthDate]);

  const today = new Date(); today.setHours(0,0,0,0);

  const submit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      toast.error("Veuillez remplir tous les champs requis"); return;
    }
    setSubmitting(true);
    try {
      await publicApi.createAppointment({ service, date: fmt(selDate), time, ...form });
      setStep(4);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Une erreur est survenue");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111113] border border-[#c6a15b]/20 rounded-lg p-8 md:p-10" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 text-[#9a938a] hover:text-gold transition-colors"><X size={22} /></button>

        {step < 4 && (
          <div className="mb-8">
            <div className="text-[0.68rem] tracking-label uppercase text-gold mb-2">Rendez-vous</div>
            <h3 className="font-serif text-3xl text-[#efe9e0]">
              {step === 1 && "Choisissez votre soin"}
              {step === 2 && "Choisissez la date"}
              {step === 3 && "Vos coordonnées"}
            </h3>
            <div className="gold-line mt-4" />
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="text-[0.68rem] tracking-label uppercase text-[#9a938a] mb-4">Soin souhaité</div>
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {serviceNames.map((name) => (
                <button key={name} onClick={() => setService(name)}
                  className={`text-left px-4 py-3 rounded border text-sm transition-all ${service === name ? "border-gold bg-[#c6a15b]/10 text-gold" : "border-[#c6a15b]/20 text-[#efe9e0]/80 hover:border-[#c6a15b]/50"}`}>
                  {name}
                </button>
              ))}
            </div>
            <button className="btn-gold-solid w-full" disabled={!service} onClick={() => setStep(2)}>Continuer</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="text-[0.68rem] tracking-label uppercase text-[#9a938a] mb-4">Date</div>
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth()-1, 1))} className="text-gold px-2">&#8249;</button>
                  <span className="font-serif text-lg capitalize">{MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}</span>
                  <button onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth()+1, 1))} className="text-gold px-2">&#8250;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#9a938a] mb-2">
                  {DOW.map((d) => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {daysGrid.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const past = d < today;
                    const active = selDate && fmt(d) === fmt(selDate);
                    return (
                      <button key={i} disabled={past} onClick={() => setSelDate(d)}
                        className={`h-9 rounded text-sm transition-all ${active ? "bg-gold text-[#0d0d0e]" : past ? "text-[#4a453d] cursor-not-allowed" : "text-[#efe9e0]/80 hover:bg-[#c6a15b]/15"}`}>
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-[0.68rem] tracking-label uppercase text-[#9a938a] mb-4">Heure</div>
                {!selDate && <p className="text-sm text-[#9a938a]">Sélectionnez d'abord une date.</p>}
                {selDate && loadingSlots && <p className="text-sm text-[#9a938a]">Chargement…</p>}
                {selDate && !loadingSlots && slots.length === 0 && <p className="text-sm text-[#9a938a]">Aucune disponibilité ce jour.</p>}
                <div className="grid grid-cols-3 gap-2">
                  {selDate && !loadingSlots && slots.map((s) => (
                    <button key={s} onClick={() => setTime(s)}
                      className={`py-2 rounded border text-sm transition-all ${time === s ? "border-gold bg-[#c6a15b]/10 text-gold" : "border-[#c6a15b]/20 text-[#efe9e0]/80 hover:border-[#c6a15b]/50"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button className="btn-gold" onClick={() => setStep(1)}><span className="flex items-center gap-2"><ArrowLeft size={14}/>Retour</span></button>
              <button className="btn-gold-solid flex-1" disabled={!time} onClick={() => setStep(3)}>Continuer</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="mb-5 p-4 rounded border border-[#c6a15b]/20 text-sm text-[#efe9e0]/80 flex items-center gap-3">
              <Clock size={16} className="text-gold" />
              <span>{service} · {fmt(selDate)} · {time}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[["firstName","Prénom"],["lastName","Nom"],["email","Courriel"],["phone","Téléphone"]].map(([k,l]) => (
                <div key={k}>
                  <label className="block text-[0.68rem] tracking-label uppercase text-[#9a938a] mb-2">{l}</label>
                  <input value={form[k]} onChange={(e) => setForm({...form,[k]:e.target.value})}
                    className="w-full bg-transparent border border-[#c6a15b]/20 rounded px-3 py-2 text-sm text-[#efe9e0] focus:border-gold focus:outline-none transition-colors" />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-[0.68rem] tracking-label uppercase text-[#9a938a] mb-2">Message (optionnel)</label>
              <textarea value={form.note} onChange={(e) => setForm({...form,note:e.target.value})} rows={3}
                className="w-full bg-transparent border border-[#c6a15b]/20 rounded px-3 py-2 text-sm text-[#efe9e0] focus:border-gold focus:outline-none transition-colors" />
            </div>
            <div className="flex gap-3 mt-8">
              <button className="btn-gold" onClick={() => setStep(2)}><span className="flex items-center gap-2"><ArrowLeft size={14}/>Retour</span></button>
              <button className="btn-gold-solid flex-1" disabled={submitting} onClick={submit}>{submitting ? "Envoi…" : "Confirmer le rendez-vous"}</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full border border-gold flex items-center justify-center mx-auto mb-6 text-gold"><Check size={30} /></div>
            <h3 className="font-serif text-3xl text-[#efe9e0] mb-3">Demande envoyée</h3>
            <p className="text-sm text-[#9a938a] max-w-md mx-auto mb-8">Merci ! Votre demande de rendez-vous pour <span className="text-gold">{service}</span> le {fmt(selDate)} à {time} a bien été reçue. Nous vous contacterons pour confirmation.</p>
            <button className="btn-gold-solid" onClick={onClose}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}
