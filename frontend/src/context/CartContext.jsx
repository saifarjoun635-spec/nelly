import React, { createContext, useContext, useEffect, useState } from "react";
import { X, ShoppingBag, Minus, Plus, Trash2, Check } from "lucide-react";
import { publicApi } from "@/lib/api";
import { toast } from "sonner";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export const parsePrice = (p) => {
  if (typeof p === "number") return p;
  const n = parseFloat(String(p).replace(/[^0-9.,]/g, "").replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ng_cart") || "[]"); } catch { return []; }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => { localStorage.setItem("ng_cart", JSON.stringify(items)); }, [items]);

  const addItem = (product) => {
    setItems((prev) => {
      const found = prev.find((i) => i.productId === product.id);
      if (found) return prev.map((i) => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, image: product.image, qty: 1 }];
    });
    toast.success("Ajouté au panier");
    setOpen(true);
  };
  const setQty = (id, qty) => setItems((prev) => qty <= 0 ? prev.filter((i) => i.productId !== id) : prev.map((i) => i.productId === id ? { ...i, qty } : i));
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.productId !== id));
  const clear = () => setItems([]);
  const count = items.reduce((a, i) => a + i.qty, 0);
  const subtotal = items.reduce((a, i) => a + parsePrice(i.price) * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, setQty, removeItem, clear, count, subtotal, open, openCart: () => setOpen(true), closeCart: () => setOpen(false) }}>
      {children}
      {open && <CartDrawer />}
    </CartContext.Provider>
  );
}

function CartDrawer() {
  const { items, setQty, removeItem, clear, subtotal, closeCart } = useCart();
  const [checkout, setCheckout] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", address: "", note: "" });

  const submit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone) { toast.error("Veuillez remplir les champs requis"); return; }
    setBusy(true);
    try {
      await publicApi.createOrder({
        items: items.map((i) => ({ productId: i.productId, name: i.name, price: String(i.price), qty: i.qty })),
        total: `${subtotal} $`, ...form,
      });
      clear(); setDone(true);
    } catch (e) { toast.error(e?.response?.data?.detail || "Une erreur est survenue"); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-sm fade-in" onClick={closeCart}>
      <div className="w-full max-w-md h-full bg-[#111113] border-l border-[#c6a15b]/20 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-[#c6a15b]/15">
          <div className="flex items-center gap-2 text-[#efe9e0]"><ShoppingBag size={18} className="text-gold" /><span className="font-serif text-xl">Votre panier</span></div>
          <button onClick={closeCart} className="text-[#9a938a] hover:text-gold"><X size={22} /></button>
        </div>

        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full border border-gold flex items-center justify-center mb-6 text-gold"><Check size={30} /></div>
            <h3 className="font-serif text-2xl text-[#efe9e0] mb-3">Commande envoyée</h3>
            <p className="text-sm text-[#9a938a] mb-8">Merci ! Votre commande a bien été reçue. La clinique vous contactera pour la suite.</p>
            <button className="btn-gold-solid" onClick={closeCart}>Fermer</button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <ShoppingBag size={38} className="text-[#3a352c] mb-4" />
            <p className="text-[#9a938a]">Votre panier est vide.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.map((i) => (
                <div key={i.productId} className="flex gap-4 border-b border-[#c6a15b]/10 pb-4">
                  <img src={i.image} alt={i.name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <p className="text-sm text-[#efe9e0]">{i.name}</p>
                    <p className="text-sm text-gold mb-2">{i.price}</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setQty(i.productId, i.qty - 1)} className="w-6 h-6 rounded border border-[#c6a15b]/30 text-gold flex items-center justify-center"><Minus size={12} /></button>
                      <span className="text-sm text-[#efe9e0] w-5 text-center">{i.qty}</span>
                      <button onClick={() => setQty(i.productId, i.qty + 1)} className="w-6 h-6 rounded border border-[#c6a15b]/30 text-gold flex items-center justify-center"><Plus size={12} /></button>
                    </div>
                  </div>
                  <button onClick={() => removeItem(i.productId)} className="text-red-300/70 hover:text-red-300 self-start"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-[#c6a15b]/15">
              <div className="flex justify-between items-center mb-5">
                <span className="text-[0.68rem] tracking-label uppercase text-[#9a938a]">Sous-total</span>
                <span className="font-serif text-2xl text-gold">{subtotal} $</span>
              </div>
              {!checkout ? (
                <button className="btn-gold-solid w-full" onClick={() => setCheckout(true)}>Passer à la caisse</button>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[["firstName","Prénom"],["lastName","Nom"],["email","Courriel"],["phone","Téléphone"]].map(([k,l]) => (
                      <input key={k} placeholder={l} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="bg-transparent border border-[#c6a15b]/20 rounded px-3 py-2 text-sm text-[#efe9e0] focus:border-gold focus:outline-none" />
                    ))}
                  </div>
                  <input placeholder="Adresse (optionnel)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full bg-transparent border border-[#c6a15b]/20 rounded px-3 py-2 text-sm text-[#efe9e0] focus:border-gold focus:outline-none" />
                  <textarea placeholder="Message (optionnel)" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full bg-transparent border border-[#c6a15b]/20 rounded px-3 py-2 text-sm text-[#efe9e0] focus:border-gold focus:outline-none" />
                  <button className="btn-gold-solid w-full" disabled={busy} onClick={submit}>{busy ? "Envoi…" : "Confirmer la commande"}</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
