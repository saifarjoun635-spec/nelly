import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function AdminLogin() {
  const { login, isAuthed, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isAuthed) navigate("/admin/dashboard");
  }, [isAuthed, loading, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Bienvenue");
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Connexion échouée");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0e] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="font-serif gold-gradient-text brand-shimmer text-4xl mb-3">Nelly Glam</div>
          <div className="w-12 h-12 rounded-full border border-gold flex items-center justify-center mx-auto mb-5 text-gold"><Lock size={20} /></div>
          <h1 className="font-serif text-2xl text-[#efe9e0]">Espace Admin</h1>
          <p className="text-sm text-[#9a938a] mt-2">Connectez-vous pour gérer votre clinique</p>
        </div>
        <form onSubmit={submit} className="bg-[#111113] border border-[#c6a15b]/20 rounded-lg p-8 space-y-5">
          <div>
            <label className="block text-[0.68rem] tracking-label uppercase text-[#9a938a] mb-2">Courriel</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-transparent border border-[#c6a15b]/20 rounded px-3 py-2.5 text-sm text-[#efe9e0] focus:border-gold focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-[0.68rem] tracking-label uppercase text-[#9a938a] mb-2">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-transparent border border-[#c6a15b]/20 rounded px-3 py-2.5 text-sm text-[#efe9e0] focus:border-gold focus:outline-none transition-colors" />
          </div>
          <button type="submit" disabled={busy} className="btn-gold-solid w-full">{busy ? "Connexion…" : "Se connecter"}</button>
        </form>
      </div>
    </div>
  );
}
