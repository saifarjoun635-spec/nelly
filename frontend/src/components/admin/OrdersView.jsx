import React, { useEffect, useState } from "react";
import { Trash2, Check, Package } from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

const STATUS = {
  nouvelle: { label: "Nouvelle", cls: "text-amber-300 border-amber-300/40" },
  "trait\u00e9e": { label: "Trait\u00e9e", cls: "text-emerald-300 border-emerald-300/40" },
};

export default function OrdersView() {
  const [orders, setOrders] = useState([]);
  const load = () => adminApi.listOrders().then(setOrders).catch(() => {});
  useEffect(() => { load(); }, []);
  const setStatus = async (id, status) => { await adminApi.updateOrder(id, status); toast.success("Statut mis \u00e0 jour"); load(); };
  const remove = async (id) => { await adminApi.deleteOrder(id); toast.success("Commande supprim\u00e9e"); load(); };

  if (!orders.length) return <p className="text-[#9a938a]">Aucune commande pour le moment.</p>;
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="bg-[#111113] border border-[#c6a15b]/15 rounded-lg p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-serif text-lg text-[#efe9e0]">{o.firstName} {o.lastName}</span>
                <span className={`text-[0.6rem] tracking-label uppercase px-2 py-0.5 rounded-full border ${STATUS[o.status]?.cls || "text-[#9a938a] border-[#c6a15b]/30"}`}>{STATUS[o.status]?.label || o.status}</span>
              </div>
              <p className="text-xs text-[#9a938a] mb-3">{o.email} \u00b7 {o.phone}{o.address ? ` \u00b7 ${o.address}` : ""}</p>
              <div className="space-y-1 mb-2">
                {(o.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-[#efe9e0]/85">
                    <Package size={13} className="text-gold" /> {it.qty} \u00d7 {it.name} <span className="text-[#9a938a]">({it.price})</span>
                  </div>
                ))}
              </div>
              {o.note ? <p className="text-xs text-[#9a938a] italic">\u00ab {o.note} \u00bb</p> : null}
              <p className="font-serif text-gold text-lg mt-2">Total : {o.total}</p>
            </div>
            <div className="flex md:flex-col items-center gap-2">
              <button onClick={() => setStatus(o.id, "trait\u00e9e")} title="Marquer trait\u00e9e" className="p-2 rounded border border-emerald-300/30 text-emerald-300 hover:bg-emerald-300/10"><Check size={16} /></button>
              <button onClick={() => remove(o.id)} title="Supprimer" className="p-2 rounded border border-red-300/30 text-red-300 hover:bg-red-300/10"><Trash2 size={16} /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
