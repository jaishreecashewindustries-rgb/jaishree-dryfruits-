import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Star, Plus, Edit2, Trash2, Check, X, MessageSquare, Search } from "lucide-react";
import toast from "react-hot-toast";

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({
    userName: "", userCity: "", userEmail: "", productName: "",
    rating: 5, text: "", status: "approved", verified: true, adminReply: ""
  });

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc")));
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { setReviews([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ userName: "", userCity: "", userEmail: "", productName: "", rating: 5, text: "", status: "approved", verified: true, adminReply: "" });
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditing(r.id);
    setForm({ userName: r.userName || "", userCity: r.userCity || "", userEmail: r.userEmail || "", productName: r.productName || "", rating: r.rating || 5, text: r.text || "", status: r.status || "approved", verified: r.verified || false, adminReply: r.adminReply || "" });
    setShowModal(true);
  };

  const save = async () => {
    try {
      if (editing) {
        await updateDoc(doc(db, "reviews", editing), { ...form, updatedAt: serverTimestamp() });
        toast.success("Review updated");
      } else {
        await addDoc(collection(db, "reviews"), { ...form, createdAt: serverTimestamp() });
        toast.success("Review added");
      }
      setShowModal(false);
      load();
    } catch { toast.error("Error saving review"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    await deleteDoc(doc(db, "reviews", id));
    toast.success("Deleted");
    load();
  };

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "reviews", id), { status });
    load();
    toast.success(status === "approved" ? "Approved" : "Rejected");
  };

  const filtered = reviews.filter(r => {
    const matchSearch = !search || (r.userName || "").toLowerCase().includes(search.toLowerCase()) || (r.productName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.status === "approved").length,
    pending: reviews.filter(r => r.status === "pending").length,
    rejected: reviews.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage customer reviews from Firestore</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-brand-gold text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-gold-dark transition">
          <Plus size={16} /> Add Review
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", val: stats.total, color: "blue" },
          { label: "Approved", val: stats.approved, color: "green" },
          { label: "Pending", val: stats.pending, color: "yellow" },
          { label: "Rejected", val: stats.rejected, color: "red" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-900">{s.val}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading reviews...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Customer", "Product", "Rating", "Review", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.userName}</p>
                    <p className="text-xs text-gray-400">{r.userCity}</p>
                    {r.verified && <span className="text-xs text-green-600 font-medium">✓ Verified</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.productName}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-gray-600 text-xs line-clamp-2">{r.text}</p>
                    {r.adminReply && <p className="text-xs text-blue-600 mt-1 italic">Reply: {r.adminReply}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.status === "approved" ? "bg-green-100 text-green-700" : r.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {r.status || "pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.status !== "approved" && (
                        <button onClick={() => updateStatus(r.id, "approved")} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Approve"><Check size={14} /></button>
                      )}
                      {r.status !== "rejected" && (
                        <button onClick={() => updateStatus(r.id, "rejected")} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Reject"><X size={14} /></button>
                      )}
                      <button onClick={() => openEdit(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => remove(r.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No reviews found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editing ? "Edit Review" : "Add Review"}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Customer Name *</label>
                  <input value={form.userName} onChange={e => setForm(f => ({...f, userName: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">City</label>
                  <input value={form.userCity} onChange={e => setForm(f => ({...f, userCity: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Product Name</label>
                <input value={form.productName} onChange={e => setForm(f => ({...f, productName: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setForm(f => ({...f, rating: n}))} className={`p-1 ${n <= form.rating ? "text-amber-400" : "text-gray-200"}`}>
                      <Star size={20} className={n <= form.rating ? "fill-amber-400" : ""} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Review Text *</label>
                <textarea value={form.text} onChange={e => setForm(f => ({...f, text: e.target.value}))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="verified" checked={form.verified} onChange={e => setForm(f => ({...f, verified: e.target.checked}))} />
                  <label htmlFor="verified" className="text-sm text-gray-600">Verified Purchase</label>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Admin Reply (optional)</label>
                <textarea value={form.adminReply} onChange={e => setForm(f => ({...f, adminReply: e.target.value}))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} className="flex-1 bg-brand-gold text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-brand-gold-dark">Save Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
