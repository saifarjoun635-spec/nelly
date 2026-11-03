import React, { useEffect, useState } from "react";
import { adminApi, publicApi } from "@/lib/api";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";

function Field({ label, value, onChange, textarea }) {
  return (
    <div>
      <label className="block text-[0.62rem] tracking-label uppercase text-[#9a938a] mb-2">{label}</label>
      {textarea ? (
        <textarea rows={4} value={value || ""} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border border-[#c6a15b]/20 rounded px-3 py-2 text-sm text-[#efe9e0] focus:border-gold focus:outline-none" />
      ) : (
        <input value={value || ""} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border border-[#c6a15b]/20 rounded px-3 py-2 text-sm text-[#efe9e0] focus:border-gold focus:outline-none" />
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-[#111113] border border-[#c6a15b]/15 rounded-lg p-6">
      <h3 className="font-serif text-xl text-gold mb-5">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export default function ContentEditor() {
  const [c, setC] = useState(null);
  useEffect(() => { publicApi.getContent().then(setC); }, []);
  if (!c) return <p className="text-[#9a938a]">Chargement…</p>;

  const set = (path, val) => {
    setC((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      let o = next; for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
      o[path[path.length - 1]] = val; return next;
    });
  };
  const save = async () => {
    const { _id, ...data } = c;
    await adminApi.updateContent(data);
    toast.success("Contenu enregistré");
  };

  return (
    <div className="space-y-6">
      <Section title="Section héro (accueil)">
        <Field label="Sur-titre" value={c.hero.eyebrow} onChange={(v) => set(["hero", "eyebrow"], v)} />
        <Field label="Titre ligne 1" value={c.hero.titleLine1} onChange={(v) => set(["hero", "titleLine1"], v)} />
        <Field label="Titre ligne 2" value={c.hero.titleLine2} onChange={(v) => set(["hero", "titleLine2"], v)} />
        <Field label="Mot en doré" value={c.hero.titleAccent} onChange={(v) => set(["hero", "titleAccent"], v)} />
        <div className="sm:col-span-2"><Field label="Sous-titre" textarea value={c.hero.subtitle} onChange={(v) => set(["hero", "subtitle"], v)} /></div>
        <div className="sm:col-span-2"><ImageUpload label="Photo d'accueil (héro)" value={c.hero.image} onChange={(url) => set(["hero", "image"], url)} /></div>
      </Section>

      <Section title="Coordonnées">
        <Field label="Téléphone" value={c.contact.phone} onChange={(v) => set(["contact", "phone"], v)} />
        <Field label="Courriel" value={c.contact.email} onChange={(v) => set(["contact", "email"], v)} />
        <Field label="Site web (affiché)" value={c.contact.website} onChange={(v) => set(["contact", "website"], v)} />
        <Field label="Site web (lien complet)" value={c.contact.websiteUrl} onChange={(v) => set(["contact", "websiteUrl"], v)} />
        <div className="sm:col-span-2"><Field label="Heures d'ouverture" value={c.contact.hours} onChange={(v) => set(["contact", "hours"], v)} /></div>
      </Section>

      <Section title="Section « La Clinique »">
        <div className="sm:col-span-2"><Field label="Titre" value={c.cliniqueIntro.title} onChange={(v) => set(["cliniqueIntro", "title"], v)} /></div>
        <div className="sm:col-span-2"><Field label="Texte" textarea value={c.cliniqueIntro.text} onChange={(v) => set(["cliniqueIntro", "text"], v)} /></div>
        <div className="sm:col-span-2"><ImageUpload label="Image de la clinique" value={c.cliniqueIntro.image} onChange={(url) => set(["cliniqueIntro", "image"], url)} /></div>
      </Section>

      <Section title="Biographie (Neila Mouelhi)">
        <Field label="Titre" value={c.bio.title} onChange={(v) => set(["bio", "title"], v)} />
        <Field label="Nom" value={c.bio.name} onChange={(v) => set(["bio", "name"], v)} />
        <div className="sm:col-span-2"><ImageUpload label="Photo de Neila Mouelhi" value={c.bio.image} onChange={(url) => set(["bio", "image"], url)} /></div>
        <div className="sm:col-span-2"><Field label="Texte biographie" textarea value={c.bio.text} onChange={(v) => set(["bio", "text"], v)} /></div>
      </Section>

      <button onClick={save} className="btn-gold-solid">Enregistrer les modifications</button>
    </div>
  );
}
