import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../../firebase/config";
import { Search, MessageCircle, User, Mail, ShoppingBag, ShieldCheck, ShieldOff } from "lucide-react";
import { formatDate, WHATSAPP_NUMBER } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const toggleAdmin = async (c) => {
    const makingAdmin = c.role !== "admin";
    if (!window.confirm(`${makingAdmin ? "Make" : "Remove"} ${c.displayName || c.email} ${makingAdmin ? "an admin" : "as admin"}?`)) return;
    try {
      await updateDoc(doc(db, "users", c.id), { role: makingAdmin ? "admin" : "customer" });
      setCustomers((prev) => prev.map((u) => (u.id === c.id ? { ...u, role: makingAdmin ? "admin" : "customer" } : u)));
      toast.success(makingAdmin ? "Made admin" : "Admin access removed");
    } catch {
      toast.error("Failed to update role");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { setCustomers([]); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = customers.filter((c) =>
    !search ||
    (c.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-2xl font-bold text-brand-brown">Customer Management</h1>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="input-field pl-9" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-14 skeleton rounded-lg" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <User size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Customer", "Email", "Phone", "Role", "Loyalty Points", "Joined", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.photoURL ? (
                          <img src={c.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-brand-gold rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {(c.displayName || c.email || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <p className="font-medium text-brand-brown">{c.displayName || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.email}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.role === "admin" ? "bg-brand-gold text-white" : "bg-gray-100 text-gray-500"}`}>
                        {c.role || "customer"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-gold">{c.loyaltyPoints || 0} pts</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {c.phone && (
                          <a
                            href={`https://wa.me/${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent("Hello! This is JAI SHREE DRYFRUITS team.")}`}
                            target="_blank" rel="noreferrer"
                            className="p-1.5 hover:bg-green-50 text-green-500 rounded-lg inline-flex"
                            title="WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </a>
                        )}
                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg inline-flex"
                            title="Email"
                          >
                            <Mail size={14} />
                          </a>
                        )}
                        <Link
                          to={`/admin/orders?search=${encodeURIComponent(c.email || "")}`}
                          className="p-1.5 hover:bg-amber-50 text-brand-gold rounded-lg inline-flex"
                          title="View Orders"
                        >
                          <ShoppingBag size={14} />
                        </Link>
                        <button
                          onClick={() => toggleAdmin(c)}
                          className={`p-1.5 rounded-lg inline-flex ${c.role === "admin" ? "hover:bg-red-50 text-red-500" : "hover:bg-purple-50 text-purple-500"}`}
                          title={c.role === "admin" ? "Remove admin access" : "Make admin"}
                        >
                          {c.role === "admin" ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                        </button>
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
