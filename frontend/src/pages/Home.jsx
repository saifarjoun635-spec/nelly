import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock, Phone, Mail, Globe } from "lucide-react";
import Layout from "@/components/Layout";
import Marquee from "@/components/Marquee";
import { useBooking } from "@/components/BookingModal";
import { useScrollReveal } from "@/components/useReveal";

function HeroBrand() {
  return (
    <div className="absolute top-24 md:top-28 left-0 right-0 z-20 flex justify-center pointer-events-none">
      <h2 className="font-serif gold-gradient-text brand-shimmer float-slow text-4xl md:text-6xl tracking-wide fade-up">
        Nelly Glam
      </h2>
    </div>
  );
}

function Hero({ hero }) {
  const { openBooking } = useBooking();
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden bg-[#0d0d0e]">
      <div className="absolute inset-0">
        <img src={hero.image} alt="Soin esthétique"
          className="w-full h-full object-cover"
          style={{ objectPosition: "82% 58%" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0e] via-[#0d0d0e]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0e] via-transparent to-[#0d0d0e]/60" />
      </div>
      <HeroBrand />
      <div className="ng-container relative z-10 pb-28 pt-40">
        <div className="max-w-2xl">
          <p className="text-[0.7rem] tracking-label uppercase text-gold mb-6 fade-up">{hero.eyebrow}</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] text-[#efe9e0] mb-8 fade-up" style={{ animationDelay: "0.15s" }}>
            {hero.titleLine1}<br />{hero.titleLine2}<br />
            <span className="font-accent gold-gradient-text brand-shimmer">{hero.titleAccent}</span>
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 fade-up" style={{ animationDelay: "0.3s" }}>
            <button className="btn-gold-solid" onClick={() => openBooking()}>Prendre rendez-vous</button>
            <p className="text-sm text-[#efe9e0]/70 max-w-xs leading-relaxed">{hero.subtitle}</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-[#9a938a]">
        <span className="text-[0.6rem] tracking-label uppercase">Défiler</span>
        <div className="w-px h-10 bg-gradient-to-b from-gold to-transparent" />
      </div>
    </section>
  );
}

function ServicesPreview({ services }) {
  const { openBooking } = useBooking();
  const featured = services.flatMap((c) => c.services).filter((s) => s.featured).slice(0, 6);
  return (
    <section className="py-28 bg-[#0d0d0e]">
      <div className="ng-container">
        <div className="max-w-2xl mb-16 reveal">
          <p className="text-[0.7rem] tracking-label uppercase text-gold mb-4">Nos Soins</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#efe9e0] leading-tight mb-5">Une expertise dédiée à votre éclat</h2>
          <p className="text-[#9a938a] leading-relaxed">Chaque soin est réalisé avec rigueur et raffinement, dans le respect de votre peau et de vos attentes.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((s, i) => (
            <div key={s.id} className="reveal group" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="img-zoom hover-lift rounded-lg overflow-hidden border border-[#c6a15b]/10 bg-[#111113] h-full flex flex-col">
                <div className="relative h-60 overflow-hidden">
                  <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111113] to-transparent" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-[0.62rem] tracking-label uppercase text-gold mb-2">{s.subtitle}</p>
                  <h3 className="font-serif text-2xl text-[#efe9e0] mb-3">{s.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-[#9a938a] mb-5 mt-auto">
                    {s.duration ? <span className="flex items-center gap-1.5"><Clock size={13} className="text-gold" />{s.duration}</span> : null}
                    <span className="text-gold">{s.price}</span>
                  </div>
                  <button onClick={() => openBooking(s.name)} className="text-[0.7rem] tracking-label uppercase text-[#efe9e0]/80 hover:text-gold transition-colors flex items-center gap-2 self-start">
                    Réserver ce soin <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-14 text-center reveal">
          <Link to="/soins" className="btn-gold inline-block"><span>Voir tous les soins</span></Link>
        </div>
      </div>
    </section>
  );
}

function CliniquePreview({ intro }) {
  return (
    <section className="py-28 bg-[#0b0b0c]">
      <div className="ng-container grid lg:grid-cols-2 gap-16 items-center">
        <div className="reveal img-zoom rounded-lg overflow-hidden">
          <img src={intro.image} alt="La clinique" className="w-full h-[540px] object-cover" />
        </div>
        <div>
          <p className="text-[0.7rem] tracking-label uppercase text-gold mb-4 reveal">{intro.eyebrow}</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#efe9e0] leading-tight mb-6 reveal">{intro.title}</h2>
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
          <Link to="/la-clinique" className="btn-gold inline-block mt-10 reveal"><span>Découvrir la clinique</span></Link>
        </div>
      </div>
    </section>
  );
}

function Contact({ contact }) {
  const { openBooking } = useBooking();
  const items = [
    { icon: Phone, label: "Téléphone", value: contact.phone, href: `tel:${(contact.phone||'').replace(/\s/g,'')}` },
    { icon: Mail, label: "Courriel", value: contact.email, href: `mailto:${contact.email}` },
    { icon: Globe, label: "Site web", value: contact.website, href: contact.websiteUrl || "#" },
  ];
  return (
    <section id="contact" className="py-28 bg-[#0d0d0e]">
      <div className="ng-container">
        <div className="text-center max-w-2xl mx-auto mb-14 reveal">
          <p className="text-[0.7rem] tracking-label uppercase text-gold mb-4">Contact</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#efe9e0] leading-tight mb-8">Prenons rendez-vous dès aujourd'hui</h2>
          <button className="btn-gold-solid" onClick={() => openBooking()}>Réserver une consultation</button>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {items.map((it, i) => (
            <a key={it.label} href={it.href} className="reveal hover-lift p-7 rounded-lg border border-[#c6a15b]/15 bg-[#111113] text-center block" style={{ transitionDelay: `${i * 80}ms` }}>
              <it.icon size={20} className="text-gold mx-auto mb-4" />
              <div className="text-[0.62rem] tracking-label uppercase text-[#9a938a] mb-2">{it.label}</div>
              <div className="text-[#efe9e0] text-sm">{it.value}</div>
            </a>
          ))}
        </div>
        <div className="mt-12 text-center reveal">
          <div className="inline-flex items-center gap-3 text-[#9a938a]">
            <Clock size={16} className="text-gold" />
            <span className="text-[0.68rem] tracking-label uppercase">Heures d'ouverture</span>
          </div>
          <p className="font-serif text-xl text-[#efe9e0] mt-2">{contact.hours}</p>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout>
      {({ content, services }) => <HomeInner content={content} services={services} />}
    </Layout>
  );
}

function HomeInner({ content, services }) {
  useScrollReveal([services]);
  return (
    <>
      <Hero hero={content.hero} />
      <Marquee />
      <ServicesPreview services={services} />
      <CliniquePreview intro={content.cliniqueIntro} />
      <Contact contact={content.contact} />
    </>
  );
}
