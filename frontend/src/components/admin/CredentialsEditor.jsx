import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const inp = "w-full bg-transparent border border-[#c6a15b]/20 rounded px-3 py-2 text-sm text-[#efe9e0] focus:border-gold focus:outline-none";
const lbl = "block text-[0.62rem] tracking-label uppercase text-[#9a938a] mb-2";

export default function CredentialsEditor() {
  const { email, applyAuth } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!currentPassword) { toast.error("Entrez votre mot de passe actuel"); return; }
    if (newPassword && newPassword !== confirm) { toast.error("Les mots de passe ne correspondent pas"); return; }
    if (!newEmail && !newPassword) { toast.error("Indiquez un nouvel email ou un nouveau mot de passe"); return; }
    setBusy(true);
    try {
      const res = await adminApi.changeCredentials({
        currentPassword,
        newEmail: newEmail || null,
        newPassword: newPassword || null,
      });
      applyAuth(res.token, res.email);
      toast.success("Identifiants mis à jour");
      setCurrentPassword(""); setNewEmail(""); setNewPassword(""); setConfirm("");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Une erreur est survenue");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-xl">
      <div className="bg-[#111113] border border-[#c6a15b]/15 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-1 text-gold"><KeyRound size={18} /><h3 className="font-serif text-xl">Mes identifiants</h3></div>
        <p className="text-xs text-[#9a938a] mb-6">Modifiez votre adresse courriel et/ou votre mot de passe de connexion. Compte actuel : <span className="text-[#efe9e0]">{email}</span></p>
        <div className="space-y-4">
          <div>
            <label className={lbl}>Mot de passe actuel (requis)</label>
            <input type="password" className={inp} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Nouvel email (optionnel)</label>
            <input type="email" className={inp} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder={email} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Nouveau mot de passe (optionnel)</label>
              <input type="password" className={inp} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Confirmer le mot de passe</label>
              <input type="password" className={inp} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </div>
          <button onClick={submit} disabled={busy} className="btn-gold-solid">{busy ? "Enregistrement…" : "Mettre à jour mes identifiants"}</button>
        </div>
      </div>
    </div>
  );
}
