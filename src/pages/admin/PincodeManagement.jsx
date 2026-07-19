import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "../../firebase/config";
import { MapPin, Plus, Trash2, Upload, Download, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";

const EMPTY = { pincode: "", serviceable: true, estimatedDays: 3, codAvailable: true, courier: "" };

// Admin CRUD for src/utils/serviceability.js's allow-list — Product Page,
// Cart and Checkout all read `serviceable_pincodes/{pincode}` from here.
// Enable/disable individual PINs, bulk import (CSV paste), export (CSV
// download). "Courier-specific serviceability" and "future API
// integration" per the spec are represented by the `courier` field and the
// plain Firestore doc shape — swapping in a live courier API later only
// means changing how this collection gets populated, not the read side.
export default function PincodeManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "serviceable_pincodes"));
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.id.localeCompare(b.id)));
    } catch {
      toast.error("Failed to load pincodes");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    const clean = form.pincode.trim();
    if (!/^\d{6}$/.test(clean)) { toast.error("Enter a valid 6-digit PIN code"); return; }
    try {
      await setDoc(doc(db, "serviceable_pincodes", clean), {
        serviceable: !!form.serviceable,
        estimatedDays: parseInt(form.estimatedDays) || 3,
        codAvailable: !!form.codAvailable,
        courier: form.courier.trim(),
      });
      toast.success(`PIN ${clean} saved`);
      setShowForm(false);
      setForm(EMPTY);
      load();
    } catch {
      toast.error("Save failed");
    }
  };

  const toggleServiceable = async (row) => {
    try {
      await setDoc(doc(db, "serviceable_pincodes", row.id), { ...row, serviceable: !row.serviceable }, { merge: true });
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, serviceable: !r.serviceable } : r)));
    } catch {
      toast.error("Update failed");
    }
  };

  const remove = async (id) => {
    if (!window.confirm(`Remove PIN ${id}?`)) return;
    await deleteDoc(doc(db, "serviceable_pincodes", id));
    toast.success("Removed");
    load();
  };

  // Bulk import — CSV rows: pincode,serviceable,estimatedDays,codAvailable,courier
  const runImport = async () => {
    const lines = importText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const batch = writeBatch(db);
    let count = 0;
    for (const line of lines) {
      const [pincode, serviceable, days, cod, courier] = line.split(",").map((s) => (s || "").trim());
      if (!/^\d{6}$/.test(pincode)) continue;
      batch.set(doc(db, "serviceable_pincodes", pincode), {
        serviceable: serviceable ? serviceable.toLowerCase() !== "false" && serviceable !== "0" : true,
        estimatedDays: parseInt(days) || 3,
        codAvailable: cod ? cod.toLowerCase() !== "false" && cod !== "0" : true,
        courier: courier || "",
      });
      count++;
    }
    if (!count) { toast.error("No valid rows found (format: pincode,serviceable,days,cod,courier)"); return; }
    try {
      await batch.commit();
      toast.success(`Imported ${count} PIN codes`);
      setImportText("");
      setShowImport(false);
      load();
    } catch {
      toast.error("Import failed");
    }
  };

  const exportCSV = () => {
    const header = "pincode,serviceable,estimatedDays,codAvailable,courier";
    const lines = rows.map((r) => `${r.id},${r.serviceable},${r.estimatedDays ?? 3},${r.codAvailable ?? true},${r.courier || ""}`);
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "serviceable_pincodes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = rows.filter((r) => r.id.includes(search.trim()));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-brown flex items-center gap-2">
            <MapPin size={22} className="text-brand-gold" /> Pincode Serviceability
          </h1>
          <p className="text-sm text-gray-500 mt-1">Only PIN codes listed here as serviceable can complete a purchase.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn-outline flex items-center gap-2 text-sm px-4 py-2">
            <Upload size={15} /> Bulk Import
          </button>
          <button onClick={exportCSV} className="btn-outline flex items-center gap-2 text-sm px-4 py-2">
            <Download size={15} /> Export
          </button>
          <button onClick={() => { setForm(EMPTY); setShowForm(true); }} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            <Plus size={15} /> Add PIN
          </button>
        </div>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search PIN code..."
        className="input-field mb-4 max-w-xs"
      />

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>PIN Code</th>
              <th>Status</th>
              <th>Est. Days</th>
              <th>COD</th>
              <th>Courier</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="font-semibold">{r.id}</td>
                <td>
                  <button onClick={() => toggleServiceable(r)} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: r.serviceable ? "#16a34a" : "#dc2626" }}>
                    {r.serviceable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    {r.serviceable ? "Serviceable" : "Blocked"}
                  </button>
                </td>
                <td>{r.estimatedDays ?? 3} days</td>
                <td>{r.codAvailable === false ? "No" : "Yes"}</td>
                <td>{r.courier || "—"}</td>
                <td>
                  <button onClick={() => remove(r.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-8">No PIN codes yet — add one or bulk import.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3">
            <h3 className="font-semibold text-brand-brown mb-2">Add / Update PIN Code</h3>
            <input type="text" placeholder="6-digit PIN code" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className="input-field" maxLength={6} />
            <label className="flex items-center gap-2 text-sm min-h-[44px]">
              <input type="checkbox" checked={form.serviceable} onChange={(e) => setForm({ ...form, serviceable: e.target.checked })} className="accent-brand-gold w-4 h-4" />
              Serviceable
            </label>
            <input type="number" placeholder="Estimated delivery days" value={form.estimatedDays} onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })} className="input-field" />
            <label className="flex items-center gap-2 text-sm min-h-[44px]">
              <input type="checkbox" checked={form.codAvailable} onChange={(e) => setForm({ ...form, codAvailable: e.target.checked })} className="accent-brand-gold w-4 h-4" />
              COD Available
            </label>
            <input type="text" placeholder="Courier (optional)" value={form.courier} onChange={(e) => setForm({ ...form, courier: e.target.value })} className="input-field" />
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={save} className="btn-primary flex-1">Save</button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-3">
            <h3 className="font-semibold text-brand-brown mb-1">Bulk Import</h3>
            <p className="text-xs text-gray-400 mb-2">One PIN per line: pincode,serviceable,estimatedDays,codAvailable,courier</p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={8}
              placeholder={"302001,true,1,true,Delhivery\n110001,true,2,true,Shiprocket"}
              className="input-field resize-none font-mono text-xs"
            />
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowImport(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={runImport} className="btn-primary flex-1">Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
