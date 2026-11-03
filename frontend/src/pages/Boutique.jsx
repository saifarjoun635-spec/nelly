import React, { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import Layout from "@/components/Layout";
import { publicApi } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useScrollReveal } from "@/components/useReveal";

function BoutiqueInner() {
  const [products, setProducts] = useState([]);
  const { addItem } = useCart();
  useScrollReveal([products]);
  useEffect(() => { publicApi.getProducts().then(setProducts).catch(() => {}); }, []);

  return (
    <>
      <section className="pt-44 pb-16 bg-[#0d0d0e] text-center">
        <div className="ng-container">
          <p className="text-[0.7rem] tracking-label uppercase text-gold mb-4 fade-up">Boutique</p>
          <h1 className="font-serif text-5xl md:text-6xl text-[#efe9e0] mb-6 fade-up" style={{ animationDelay: "0.1s" }}>
            Nos <span className="font-accent gold-gradient-text">essentiels</span> beauté
          </h1>
          <p className="text-[#9a938a] max-w-2xl mx-auto fade-up" style={{ animationDelay: "0.2s" }}>
            Une sélection de produits soigneusement choisis pour prolonger les bienfaits de vos soins à la maison.
          </p>
        </div>
      </section>

      <section className="pb-28 bg-[#0d0d0e]">
        <div className="ng-container">
          {products.length === 0 ? (
            <p className="text-center text-[#9a938a]">Aucun produit disponible pour le moment.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p, i) => {
                const out = (p.stock ?? 0) <= 0;
                return (
                  <div key={p.id} className="reveal group" style={{ transitionDelay: `${i * 70}ms` }}>
                    <div className="img-zoom hover-lift rounded-lg overflow-hidden border border-[#c6a15b]/10 bg-[#111113] h-full flex flex-col">
                      <div className="relative h-64 overflow-hidden bg-[#0d0d0e]">
                        {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : null}
                        {p.category ? <span className="absolute top-3 left-3 text-[0.58rem] tracking-label uppercase bg-[#0d0d0e]/80 text-gold px-3 py-1 rounded-full border border-[#c6a15b]/20">{p.category}</span> : null}
                        {out ? <span className="absolute top-3 right-3 text-[0.58rem] tracking-label uppercase bg-red-900/70 text-red-100 px-3 py-1 rounded-full">Rupture</span> : null}
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="font-serif text-xl text-[#efe9e0] mb-2">{p.name}</h3>
                        <p className="text-sm text-[#9a938a] leading-relaxed mb-5 flex-1">{p.description}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="font-serif text-xl text-gold">{p.price}</span>
                          <button disabled={out} onClick={() => addItem(p)}
                            className="btn-gold-solid !py-2.5 !px-5 disabled:opacity-40 flex items-center gap-2">
                            <ShoppingBag size={14} /> {out ? "Épuisé" : "Ajouter"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default function Boutique() {
  return <Layout>{() => <BoutiqueInner />}</Layout>;
}
