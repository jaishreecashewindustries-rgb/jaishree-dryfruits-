import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";
import toast from "react-hot-toast";
import { MessageSquare, Phone, Mail, Calendar } from "lucide-react";

const STATUS_COLORS = { new: "bg-yellow-50 text-yellow-700", contacted: "bg-blue-50 text-blue-700", closed: "bg-green-50 text-green-700" };

export default function InquiryManagement() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "inquiries"), orderBy("timestamp", "desc")));
      setInquiries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { setInquiries([]); }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "inquiries", id), { status });
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      toast.success(`Marked as ${status}`);
    } catch (e) { toast.error("Update failed"); }
  };

  const filtered = filter === "all" ? inquiries : inquiries.filter(i => (i.status || "new") === filter);
  const counts = { new: inquiries.filter(i => !i.status || i.status === "new").length, contacted: inquiries.filter(i => i.status === "contacted").length, closed: inquiries.filter(i => i.status === "closed").length };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-brown">Inquiry Management</h1>
        <p className="text-sm text-gray-400">Contact form and WhatsApp inquiry submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "New", val: counts.new, color: "bg-yellow-500" },
          { label: "Contacted", val: counts.contacted, color: "bg-blue-500" },
          { label: "Closed", val: counts.closed, color: "bg-green-500" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className={`w-2 h-2 rounded-full ${s.color} mb-2`} />
            <p className="font-bold text-2xl text-brand-brown">{s.val}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "new", "contacted", "closed"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${filter === f ? "bg-brand-brown text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
            {f === "all" ? "All" : f} {f !== "all" && `(${counts[f] || 0})`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p>No inquiries found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inq => (
            <div key={inq.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="p-4 flex items-start justify-between gap-4 cursor-pointer" onClick={() => setExpanded(expanded === inq.id ? null : inq.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-brand-brown text-sm">{inq.name || "Anonymous"}</p>
                    <span className={`text-xs px-2 py-0.5 font-semibold rounded ${STATUS_COLORS[inq.status || "new"]}`}>{inq.status || "new"}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {inq.phone && <span className="flex items-center gap-1"><Phone size={10} />{inq.phone}</span>}
                    {inq.email && <span className="flex items-center gap-1"><Mail size={10} />{inq.email}</span>}
                    {inq.timestamp && <span className="flex items-center gap-1"><Calendar size={10} />{inq.timestamp?.toDate?.().toLocaleDateString("en-IN") || inq.timestamp}</span>}
                  </div>
                  {inq.message && <p className="text-xs text-gray-500 mt-1 truncate">"{inq.message}"</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {inq.phone && (
                    <a href={`https://wa.me/91${inq.phone}?text=Hello ${inq.name}, regarding your inquiry...`} target="_blank" rel="noreferrer"
                      className="bg-[#25D366] text-white text-xs px-3 py-1.5 font-semibold hover:bg-[#20B858] transition-colors" onClick={e => e.stopPropagation()}>
                      WhatsApp
                    </a>
                  )}
                  <select
                    value={inq.status || "new"}
                    onChange={e => { e.stopPropagation(); updateStatus(inq.id, e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    className="text-xs border border-gray-200 px-2 py-1.5 bg-white text-gray-700 font-semibold"
                  >
                    <option value="new">🟡 New</option>
                    <option value="contacted">🔵 Contacted</option>
                    <option value="closed">🟢 Closed</option>
                  </select>
                </div>
              </div>
              {expanded === inq.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 text-sm space-y-2">
                  {inq.message && <div><span className="font-semibold text-gray-700">Message: </span><span className="text-gray-600">{inq.message}</span></div>}
                  {inq.subject && <div><span className="font-semibold text-gray-700">Subject: </span><span className="text-gray-600">{inq.subject}</span></div>}
                  {inq.type && <div><span className="font-semibold text-gray-700">Type: </span><span className="text-gray-600">{inq.type}</span></div>}
                  {inq.source && <div><span className="font-semibold text-gray-700">Source: </span><span className="text-gray-600">{inq.source}</span></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
