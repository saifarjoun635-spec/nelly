import React from "react";
import { Clock } from "lucide-react";
import Layout from "@/components/Layout";
import { useBooking } from "@/components/BookingModal";
import { useScrollReveal } from "@/components/useReveal";

function CliniqueInner({ content }) {
  useScrollReveal([content]);
  const { openBooking } = useBooking();
  const intro = content.cliniqueIntro;
  const bio = content.bio;
  return (
    <>
      <section className="pt-44 pb-16 bg-[#0d0d0e] text-center">
        <div className="ng-container">
          <p className="text-[0.7rem] tracking-label uppercase text-gold mb-4 fade-up">La Clinique</p>
          <h1 className="font-serif text-5xl md:text-6xl text-[#efe9e0] mb-6 fade-up" style={{ animationDelay: "0.1s" }}>
            {intro.title}
          </h1>
        </div>
      </section>

      <section className="pb-24 bg-[#0d0d0e]">
        <div className="ng-container grid lg:grid-cols-2 gap-16 items-center">
          <div className="reveal img-zoom rounded-lg overflow-hidden">
            <img src={intro.image} alt="Ambiance clinique" className="w-full h-[520px] object-cover" />
          </div>
          <div>
            <p className="text-[#9a938a] leading-relaxed mb-10 reveal">{intro.text}</p>
            <div className="space-y-8">
              {intro.values.map((v, i) => (
                <div key={v.num} className="flex gap-5 reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                  <span className="font-accent gold-gradient-text text-2xl">{v.num}</span>
                  <div>
                    <h4 className="font-serif text-xl text-[#efe9e0] mb-1">{v.title}</h4>
                    <p className="text-sm text-[#9a938a] leading-relaxed">{v.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#0b0b0c]">
        <div className="ng-container grid lg:grid-cols-2 gap-16 items-center">
          <div className="reveal img-zoom rounded-lg overflow-hidden lg:order-2">
            <img src={bio.image} alt={bio.name} className="w-full h-[560px] object-cover" style={{ objectPosition: "center 20%" }} />
          </div>
          <div className="lg:order-1">
            <p className="text-[0.7rem] tracking-label uppercase text-gold mb-4 reveal">{bio.eyebrow}</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#efe9e0] leading-tight mb-3 reveal">{bio.title}</h2>
            <p className="font-accent gold-gradient-text text-2xl mb-8 reveal">{bio.name}</p>
            <p className="text-[#9a938a] leading-relaxed reveal">{bio.text}</p>
            <button className="btn-gold-solid mt-10 reveal" onClick={() => openBooking()}>Prendre rendez-vous</button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0d0d0e] text-center">
        <div className="ng-container reveal">
          <div className="inline-flex items-center gap-3 text-[#9a938a] mb-2">
            <Clock size={16} className="text-gold" />
            <span className="text-[0.68rem] tracking-label uppercase">Heures d'ouverture</span>
          </div>
          <p className="font-serif text-2xl text-[#efe9e0]">{content.contact.hours}</p>
        </div>
      </section>
    </>
  );
}

export default function Clinique() {
  return <Layout>{({ content }) => <CliniqueInner content={content} />}</Layout>;
}
