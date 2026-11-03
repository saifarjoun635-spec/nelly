import React, { useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";

const inp = "w-full bg-transparent border border-[#c6a15b]/20 rounded px-3 py-2 text-sm text-[#efe9e0] focus:border-gold focus:outline-none";
const lbl = "block text-[0.6rem] tracking-label uppercase text-[#9a938a] mb-1.5";

export default function ProductsEditor() {
  const [products, setProducts] = useState([]);
  const load = () => adminApi.listProducts().then(setProducts).catch(() => {});
  useEffect(() => { load(); }, []);

  const setField = (id, field, val) => setProducts((prev) => prev.map((p) => p.id === id ? { ...p, [field]: val } : p));
  const save = async (p) => {
    await adminApi.updateProduct(p.id, { name: p.name, description: p.description, price: p.price, image: p.image, category: p.category, stock: Number(p.stock) || 0 });
    toast.success("Produit enregistré");
  };
  const remove = async (id) => { await adminApi.deleteProduct(id); toast.success("Produit supprimé"); load(); };
  const add = async () => {
    await adminApi.createProduct({ name: "Nouveau produit", description: "", price: "0 $", image: "", category: "", stock: 0 });
    toast.success("Produit ajouté"); load();
  };

  return (
    <div className="space-y-6">
      <button onClick={add} className="btn-gold-solid flex items-center gap-2"><Plus size={16} /> Ajouter un produit</button>
      <div className="space-y-4">
        {products.map((p) => (
          <div key={p.id} className="bg-[#111113] border border-[#c6a15b]/15 rounded-lg p-6">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div><label className={lbl}>Nom</label><input className={inp} value={p.name} onChange={(e) => setField(p.id, "name", e.target.value)} /></div>
              <div><label className={lbl}>Catégorie</label><input className={inp} value={p.category || ""} onChange={(e) => setField(p.id, "category", e.target.value)} /></div>
              <div><label className={lbl}>Prix</label><input className={inp} value={p.price || ""} onChange={(e) => setField(p.id, "price", e.target.value)} placeholder="89 $" /></div>
              <div><label className={lbl}>Quantité en stock</label><input type="number" className={inp} value={p.stock ?? 0} onChange={(e) => setField(p.id, "stock", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={lbl}>Description</label><textarea rows={3} className={inp} value={p.description || ""} onChange={(e) => setField(p.id, "description", e.target.value)} /></div>
              <div className="sm:col-span-2"><ImageUpload label="Photo du produit" value={p.image} onChange={(url) => setField(p.id, "image", url)} /></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => save(p)} className="btn-gold-solid flex items-center gap-2 !py-2.5"><Save size={15} /> Enregistrer</button>
              <button onClick={() => remove(p.id)} className="px-4 py-2.5 rounded-full border border-red-300/30 text-red-300 hover:bg-red-300/10 text-[0.7rem] tracking-label uppercase flex items-center gap-2"><Trash2 size={15} /> Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
