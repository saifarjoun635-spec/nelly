import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";

export default function Footer({ contact }) {
  const c = contact || {};
  return (
    <footer className="border-t border-[#c6a15b]/10 bg-[#0b0b0c] pt-16 pb-8">
      <div className="ng-container">
        <div className="grid md:grid-cols-3 gap-10 mb-12">
          <div>
            <div className="font-serif gold-gradient-text brand-shimmer text-3xl mb-4">Nelly Glam</div>
            <p className="text-sm text-[#9a938a] leading-relaxed max-w-xs">
              Clinique esthétique médicale &amp; cosmétique. Des soins d'exception pour révéler votre beauté naturelle.
            </p>
          </div>
          <div>
            <div className="text-[0.68rem] tracking-label uppercase text-gold mb-5">Navigation</div>
            <ul className="space-y-3 text-sm text-[#efe9e0]/75">
              <li><Link to="/" className="link-underline">Accueil</Link></li>
              <li><Link to="/soins" className="link-underline">Soins</Link></li>
              <li><Link to="/la-clinique" className="link-underline">La Clinique</Link></li>
              <li><Link to="/admin" className="link-underline text-[#9a938a]">Espace Admin</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[0.68rem] tracking-label uppercase text-gold mb-5">Contact</div>
            <ul className="space-y-3 text-sm text-[#efe9e0]/75">
              <li><a href={`tel:${(c.phone||'').replace(/\s/g,'')}`} className="link-underline">{c.phone}</a></li>
              <li><a href={`mailto:${c.email}`} className="link-underline">{c.email}</a></li>
              <li><a href={c.websiteUrl || '#'} className="link-underline">{c.website}</a></li>
              <li className="text-[#9a938a]">{c.hours}</li>
            </ul>
            <div className="flex gap-4 mt-5 text-gold">
              <a href="#" aria-label="Instagram" className="hover:text-[#e7d0a1] transition-colors"><Instagram size={18} /></a>
              <a href="#" aria-label="Facebook" className="hover:text-[#e7d0a1] transition-colors"><Facebook size={18} /></a>
            </div>
          </div>
        </div>
        <div className="gold-line mb-6" />
        <p className="text-center text-xs text-[#6d675e] tracking-wide">
          © {new Date().getFullYear()} Clinique Nelly Glam · Tous droits réservés
        </p>
      </div>
    </footer>
  );
}
