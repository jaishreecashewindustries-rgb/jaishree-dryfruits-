import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Plus, Trash2, Edit2, Check, X, Tag } from "lucide-react";
import toast from "react-hot-toast";

const EMPTY = { code: "", discount: "", minOrder: "", maxUses: "", active: true, expiry: "" };

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "coupons"), orderBy("code")));
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { toast.error("Failed to load coupons"); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!form.code || !form.discount) { toast.error("Code and discount % are required"); return; }
    const data = {
      code: form.code.trim().toUpperCase(),
      discount: parseInt(form.discount) || 0,
      minOrder: parseInt(form.minOrder) || 0,
      maxUses: parseInt(form.maxUses) || 0,
      active: form.active,
      uses: editing?.uses || 0,
      expiry: form.expiry ? new Date(form.expiry) : null,
      type: "percent",
    };
    try {
      if (editing) {
        await updateDoc(doc(db, "coupons", editing.id), data);
        toast.success("Coupon updated!");
      } else {
        await addDoc(collection(db, "coupons"), data);
        toast.success("Coupon created!");
      }
      setShowForm(false); setEditing(null); setForm(EMPTY); load();
    } catch (e) { toast.error("Save failed"); }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    await deleteDoc(doc(db, "coupons", id));
    toast.success("Deleted");
    load();
  };

  const edit = (c) => { setEditing(c); setForm({ ...c, expiry: c.expiry?.toDate ? c.expiry.toDate().toISOString().split("T")[0] : "" }); setShowForm(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-brown">Coupon Management</h1>
          <p className="text-sm text-gray-400">Create and manage promo codes</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY); }} className="flex items-center gap-2 btn-primary text-sm px-4 py-2">
          <Plus size={16} /> Add Coupon
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Coupons", val: coupons.length, color: "bg-blue-500" },
          { label: "Active", val: coupons.filter(c => c.active).length, color: "bg-green-500" },
          { label: "Total Uses", val: coupons.reduce((a, c) => a + (c.uses || 0), 0), color: "bg-amber-500" },
        ].map(s => (
          <div key={s.label} className="bg-white p-4 border border-gray-100 rounded-xl">
            <div className={`w-2 h-2 rounded-full ${s.color} mb-2`} />
            <p className="font-bold text-2xl text-brand-brown">{s.val}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-brand-brown mb-4">{editing ? "Edit Coupon" : "New Coupon"}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Code *</label>
              <input className="input-field text-sm uppercase" placeholder="WELCOME15" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Discount % *</label>
              <input className="input-field text-sm" type="number" placeholder="15" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Min Order (₹)</label>
              <input className="input-field text-sm" type="number" placeholder="499" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Max Uses (0 = unlimited)</label>
              <input className="input-field text-sm" type="number" placeholder="100" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Expiry Date</label>
              <input className="input-field text-sm" type="date" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
              <select className="input-field text-sm" value={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.value === "true" }))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} className="btn-primary text-sm px-5 py-2">Save Coupon</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-outline text-sm px-5 py-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Tag size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No coupons yet. Create your first one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  {["Code", "Discount", "Min Order", "Uses", "Expiry", "Status", "Actions"].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id}>
                    <td><span className="font-mono font-bold text-brand-brown bg-brand-cream px-2 py-1 text-sm">{c.code}</span></td>
                    <td><span className="text-green-600 font-semibold">{c.discount}% OFF</span></td>
                    <td>₹{c.minOrder || 0}</td>
                    <td>{c.uses || 0}{c.maxUses ? ` / ${c.maxUses}` : " / ∞"}</td>
                    <td className="text-xs">{c.expiry?.toDate ? c.expiry.toDate().toLocaleDateString("en-IN") : "No expiry"}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 font-semibold ${c.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {c.active ? <Check size={12} /> : <X size={12} />} {c.active ? "Active" : "Off"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => edit(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                        <button onClick={() => deleteCoupon(c.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
