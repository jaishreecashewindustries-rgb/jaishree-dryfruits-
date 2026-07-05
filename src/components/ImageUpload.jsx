import React, { useRef, useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase/config";
import { Upload, X, Image, Loader2, Link as LinkIcon } from "lucide-react";

/**
 * ImageUpload — drag-drop + click upload to Firebase Storage
 * Props:
 *   value       {string}   current image URL
 *   onChange    {fn}       called with new URL (or "" on remove)
 *   folder      {string}   storage folder, e.g. "products" or "content/team"
 *   label       {string}   optional label above the box
 *   compact     {bool}     smaller variant for inline use
 */
export default function ImageUpload({ value, onChange, folder = "content", label, compact = false }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [broken, setBroken] = useState(false);
  const inputRef = useRef(null);

  // Treat whitespace-only / previously-broken values as empty so the box
  // never renders blank with no upload affordance
  const hasValue = !!(value && value.trim()) && !broken;

  // Re-test a new value (e.g. parent swapped in a different URL/slot)
  useEffect(() => { setBroken(false); }, [value]);

  // Uploads used to go straight to Storage at whatever size the phone/camera
  // produced (routinely 2-4MB PNGs) — that's what was making every product
  // page slow to load. Resizing to a sane max width and re-encoding as JPEG
  // here cuts that by ~95% before it ever leaves the browser.
  const resizeImage = (file) => new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_W = 1200;
      const scale = Math.min(1, MAX_W / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob || file),
        "image/jpeg",
        0.8
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }

    const toUpload = await resizeImage(file);
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    const storageRef = ref(storage, filename);
    const task = uploadBytesResumable(storageRef, toUpload, { contentType: "image/jpeg" });

    setUploading(true);
    setProgress(0);

    task.on(
      "state_changed",
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => { console.error(err); setUploading(false); alert("Upload failed: " + err.message); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setBroken(false);
        onChange(url);
        setUploading(false);
        setProgress(0);
      }
    );
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => { setBroken(false); onChange(""); };

  const handleUrlSave = () => {
    if (urlInput.trim()) { onChange(urlInput.trim()); setUrlInput(""); }
    setUrlMode(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {hasValue ? (
          <div className="relative">
            <img src={value} alt="" onError={() => setBroken(true)} className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-colors"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {uploading && <span className="text-[9px]">{progress}%</span>}
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
      </div>
    );
  }

  return (
    <div>
      {label && <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</p>}

      {hasValue ? (
        <div className="relative rounded-2xl overflow-hidden border border-gray-100 group">
          <img src={value} alt="upload" onError={() => setBroken(true)} className="w-full max-h-48 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white text-brand-brown px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Upload size={12} /> Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <X size={12} /> Remove
            </button>
          </div>
        </div>
      ) : urlMode ? (
        <div className="border-2 border-dashed border-brand-gold/40 rounded-2xl p-4 bg-amber-50/20">
          <p className="text-xs text-gray-500 mb-2">Paste image URL:</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleUrlSave()}
              placeholder="https://example.com/image.jpg"
              className="input-field flex-1 text-xs py-2"
              autoFocus
            />
            <button type="button" onClick={handleUrlSave} className="btn-primary px-3 py-2 text-xs">Save</button>
            <button type="button" onClick={() => setUrlMode(false)} className="px-3 py-2 text-xs border border-gray-200 rounded-lg">Cancel</button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-brand-gold hover:bg-amber-50/20 transition-all group"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="text-brand-gold animate-spin" />
              <p className="text-sm text-gray-500">Uploading… {progress}%</p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 max-w-xs">
                <div className="bg-brand-gold h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-50 transition-colors">
                <Image size={24} className="text-gray-300 group-hover:text-brand-gold transition-colors" />
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Drop image here or click to upload</p>
              <p className="text-xs text-gray-400">JPG, PNG, WebP — max 5MB</p>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setUrlMode(true); }}
                className="mt-3 text-xs text-brand-gold hover:underline flex items-center gap-1 mx-auto"
              >
                <LinkIcon size={11} /> Or paste URL instead
              </button>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
    </div>
  );
}
