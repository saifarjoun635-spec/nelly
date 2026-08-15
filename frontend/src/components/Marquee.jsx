import React from "react";

const ITEMS = [
  "Nelly Glam",
  "Clinique Esthétique",
  "Beauté Sur Mesure",
  "Montréal",
  "Soins Médico-Esthétiques",
];

export default function Marquee() {
  const seq = [...ITEMS, ...ITEMS];
  return (
    <div className="py-8 border-y border-[#c6a15b]/10 overflow-hidden bg-[#0b0b0c]">
      <div className="marquee-track">
        {seq.map((t, i) => (
          <span key={i} className="flex items-center whitespace-nowrap">
            <span className="font-serif text-2xl md:text-3xl text-[#efe9e0]/85 px-8">{t}</span>
            <span className="text-gold text-lg">&#10022;</span>
          </span>
        ))}
      </div>
    </div>
  );
}
