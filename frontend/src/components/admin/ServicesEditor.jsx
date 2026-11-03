import React, { useEffect, useState } from "react";
import { adminApi, publicApi } from "@/lib/api";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";

export default function ServicesEditor() {
  const [cats, setCats] = useState(null);
  useEffect(() => { publicApi.getServices().then(setCats); }, []);
  if (!cats) return <p className="text-[#9a938a]">Chargement…</p>;

  const update = (ci, si, field, val) => {
    setCats((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[ci].services[si][field] = val; return next;
    });
  };
  const updateRow = (ci, si, ri, field, val) => {
    setCats((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[ci].services[si].priceTable[ri][field] = val; return next;
    });
  };
  const save = async () => { await adminApi.updateServices(cats); toast.success("Soins enregistrés"); };

  const inp = "w-full bg-transparent border border-[#c6a15b]/20 rounded px-3 py-2 text-sm text-[#efe9e0] focus:border-gold focus:outline-none";
  const lbl = "block text-[0.6rem] tracking-label uppercase text-[#9a938a] mb-1.5";

  return (
    <div className="space-y-8">
      {cats.map((cat, ci) => (
        <div key={cat.id}>
          <h3 className="font-serif text-2xl text-gold mb-4">{cat.title}</h3>
          <div className="space-y-4">
            {cat.services.map((s, si) => (
              <div key={s.id} className="bg-[#111113] border border-[#c6a15b]/15 rounded-lg p-6">
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div><label className={lbl}>Nom du soin</label><input className={inp} value={s.name} onChange={(e) => update(ci, si, "name", e.target.value)} /></div>
                  <div><label className={lbl}>Sous-titre</label><input className={inp} value={s.subtitle} onChange={(e) => update(ci, si, "subtitle", e.target.value)} /></div>
                  <div><label className={lbl}>Durée</label><input className={inp} value={s.duration || ""} onChange={(e) => update(ci, si, "duration", e.target.value)} /></div>
                  <div><label className={lbl}>Prix</label><input className={inp} value={s.price || ""} onChange={(e) => update(ci, si, "price", e.target.value)} /></div>
                  {s.extraPrice !== undefined && (
                    <div className="sm:col-span-2"><label className={lbl}>Prix additionnel</label><input className={inp} value={s.extraPrice || ""} onChange={(e) => update(ci, si, "extraPrice", e.target.value)} /></div>
                  )}
                  <div className="sm:col-span-2"><ImageUpload label="Photo du soin" value={s.image} onChange={(url) => update(ci, si, "image", url)} /></div>
                  <div className="sm:col-span-2"><label className={lbl}>Description</label><textarea rows={4} className={inp} value={s.description} onChange={(e) => update(ci, si, "description", e.target.value)} /></div>
                </div>
                {s.priceTable && (
                  <div>
                    <label className={lbl}>Tableau de tarifs</label>
                    <div className="space-y-2">
                      {s.priceTable.map((r, ri) => (
                        <div key={ri} className="grid grid-cols-[1fr_140px] gap-2">
                          <input className={inp} value={r.zone} onChange={(e) => updateRow(ci, si, ri, "zone", e.target.value)} />
                          <input className={inp} value={r.price} onChange={(e) => updateRow(ci, si, ri, "price", e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={save} className="btn-gold-solid">Enregistrer les soins</button>
    </div>
  );
}
