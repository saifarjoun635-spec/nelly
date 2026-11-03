import React, { useRef, useState } from "react";
import { Upload, ImageIcon, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";

async function resizeImage(file, maxDim = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) { height = Math.round(height * maxDim / width); width = maxDim; }
          else { width = Math.round(width * maxDim / height); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageUpload({ value, onChange, label = "Photo" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Veuillez choisir une image"); return; }
    setBusy(true);
    try {
      const dataUrl = await resizeImage(file);
      const url = await adminApi.uploadImage(dataUrl);
      onChange(url);
      toast.success("Photo téléversée");
    } catch (e) {
      toast.error("Échec du téléversement");
    } finally { setBusy(false); }
  };

  return (
    <div>
      <label className="block text-[0.6rem] tracking-label uppercase text-[#9a938a] mb-2">{label}</label>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-lg border border-[#c6a15b]/20 overflow-hidden bg-[#0d0d0e] flex items-center justify-center flex-shrink-0">
          {value ? <img src={value} alt="aperçu" className="w-full h-full object-cover" /> : <ImageIcon size={22} className="text-[#3a352c]" />}
        </div>
        <div className="flex-1">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
            className="flex items-center gap-2 px-4 py-2 rounded border border-[#c6a15b]/30 text-gold text-[0.7rem] tracking-label uppercase hover:bg-[#c6a15b]/10 transition-colors disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {busy ? "Téléversement…" : "Téléverser une photo"}
          </button>
          <p className="text-[0.65rem] text-[#6d675e] mt-2">JPG ou PNG depuis votre appareil.</p>
        </div>
      </div>
    </div>
  );
}
