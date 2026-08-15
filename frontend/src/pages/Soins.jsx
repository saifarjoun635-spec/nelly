import React from "react";
import { ArrowUpRight, Clock } from "lucide-react";
import Layout from "@/components/Layout";
import { useBooking } from "@/components/BookingModal";
import { useScrollReveal } from "@/components/useReveal";

function PriceTable({ rows }) {
  return (
    <div className="mt-6 rounded-lg border border-[#c6a15b]/20 overflow-hidden">
      <div className="grid grid-cols-[1fr_auto] bg-[#c6a15b]/10 px-5 py-3 text-[0.62rem] tracking-label uppercase text-gold">
        <span>Zone</span><span>Prix par séance</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className={`grid grid-cols-[1fr_auto] px-5 py-3 text-sm ${i % 2 ? "bg-[#131315]" : "bg-[#0f0f11]"}`}>
          <span className="text-[#efe9e0]/85 pr-4">{r.zone}</span>
          <span className="text-gold whitespace-nowrap">{r.price}</span>
        </div>
      ))}
    </div>
  );
}

function ServiceRow({ s, index }) {
  const { openBooking } = useBooking();
  const reversed = index % 2 === 1;
  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-14 border-b border-[#c6a15b]/10">
      <div className={`img-zoom rounded-lg overflow-hidden reveal ${reversed ? "lg:order-2" : ""}`}>
        <img src={s.image} alt={s.name} className="w-full h-[420px] object-cover" />
      </div>
      <div className={`reveal ${reversed ? "lg:order-1" : ""}`}>
        <p className="text-[0.62rem] tracking-label uppercase text-gold mb-3">{s.subtitle}</p>
        <h3 className="font-serif text-3xl md:text-4xl text-[#efe9e0] mb-5">{s.name}</h3>
        <p className="text-[#9a938a] leading-relaxed mb-6">{s.description}</p>
        <div className="flex flex-wrap items-center gap-5 text-sm mb-2">
          {s.duration ? <span className="flex items-center gap-1.5 text-[#9a938a]"><Clock size={14} className="text-gold" />{s.duration}</span> : null}
          <span className="text-gold">{s.price}</span>
        </div>
        {s.extraPrice ? <p className="text-sm text-[#9a938a] mb-2">{s.extraPrice}</p> : null}
        {s.priceTable ? <PriceTable rows={s.priceTable} /> : null}
        <button onClick={() => openBooking(s.name)} className="mt-7 text-[0.7rem] tracking-label uppercase text-[#efe9e0]/85 hover:text-gold transition-colors flex items-center gap-2">
          Réserver ce soin <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  );
}

function SoinsInner({ services }) {
  useScrollReveal([services]);
  return (
    <>
      <section className="pt-44 pb-16 bg-[#0d0d0e] text-center">
        <div className="ng-container">
          <p className="text-[0.7rem] tracking-label uppercase text-gold mb-4 fade-up">Nos Soins</p>
          <h1 className="font-serif text-5xl md:text-6xl text-[#efe9e0] mb-6 fade-up" style={{ animationDelay: "0.1s" }}>
            L'excellence <span className="font-accent gold-gradient-text">au service</span> de votre peau
          </h1>
          <p className="text-[#9a938a] max-w-2xl mx-auto fade-up" style={{ animationDelay: "0.2s" }}>
            Découvrez notre gamme complète de soins médico-esthétiques, conçus pour révéler et préserver votre beauté naturelle.
          </p>
        </div>
      </section>
      {services.map((cat) => (
        <section key={cat.id} className="py-10 bg-[#0d0d0e]">
          <div className="ng-container">
            <div className="flex items-center gap-5 mb-4 reveal">
              <h2 className="font-serif text-2xl md:text-3xl text-gold whitespace-nowrap">{cat.title}</h2>
              <div className="gold-line flex-1" />
            </div>
            {cat.services.map((s, i) => <ServiceRow key={s.id} s={s} index={i} />)}
          </div>
        </section>
      ))}
    </>
  );
}

export default function Soins() {
  return <Layout>{({ services }) => <SoinsInner services={services} />}</Layout>;
}
