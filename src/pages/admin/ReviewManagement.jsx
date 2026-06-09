import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Star, Trash2, MessageCircle, CheckCircle, XCircle, Search } from "lucide-react";
import { formatDate, DEMO_PRODUCTS } from "../../utils/helpers";
import toast from "react-hot-toast";

const DEMO_REVIEWS = [
  { id: "r1", productId: "p1", productName: "Premium California Almonds", user: "Priya S.", email: "priya@email.com", rating: 5, title: "Absolutely fresh!", body: "Best quality almonds I've ever tasted.", date: new Date("2025-01-12"), verified: true, status: "approved", variant: "500g" },
  { id: "r2", productId: "p2", productName: "Whole Cashews W320", user: "Rahul K.", email: "rahul@email.com", rating: 4, title: "Great product", body: "Very fresh and crunchy.", date: new Date("2025-01-05"), verified: true, status: "approved", variant: "250g" },
  { id: "r3", productId: "p1", productName: "Premium California Almonds", user: "Ananya P.", email: "ananya@email.com", rating: 5, title: "Perfect!", body: "Love the quality.", date: new Date("2025-01-01"), verified: false, status: "pending", variant: "1kg" },
  { id: "r4", productId: "p5", productName: "Royal Gift Hamper", user: "Deepak M.", email: "deepak@email.com", rating: 3, title: "Average packaging", body: "Product is good but packaging was damaged.", date: new Date("2024-12-25"), verified: true, status: "pending", variant: "1kg Assorted" },
];

export default function ReviewManagement() {
  const [reviews, setReviews] = useState(DEMO_REVIEWS);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const filtered = reviews.filter((r) => {
    const matchStatus = filter === "all" || r.status === filter;
    const matchSearch = !search || r.user.toLowerCase().includes(search.toLowerCase()) || r.productName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const setStatus = (id, status) => {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    toast.success(`Review ${status}`);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this review?")) return;
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast.success("Review deleted");
  };

  const sendReply = (id) => {
    if (!replyText.trim()) return;
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, adminReply: replyText, repliedAt: new Date() } : r));
    setReplyingTo(null);
    setReplyText("");
    toast.success("Reply sent!");
  };

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-2xl font-bold text-brand-brown">Review Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: reviews.length, color: "bg-gray-100 text-gray-700" },
          { label: "Approved", value: reviews.filter((r) => r.status === "approved").length, color: "bg-green-100 text-green-700" },
          { label: "Pending", value: reviews.filter((r) => r.status === "pending").length, color: "bg-yellow-100 text-yellow-700" },
          { label: "Avg Rating", value: (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) + "★", color: "bg-amber-100 text-amber-700" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
            <p className="font-bold text-xl">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews..." className="input-field pl-9" />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${filter === s ? "bg-brand-gold text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-brand-gold"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center text-brand-gold font-bold flex-shrink-0">
                  {r.user[0]}
                </div>
                <div>
                  <p className="font-semibold text-brand-brown text-sm">{r.user}</p>
                  <p className="text-xs text-gray-400">{r.email}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map((s) => <Star key={s} size={12} className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${r.status === "approved" ? "bg-green-100 text-green-700" : r.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                  {r.status}
                </span>
                {r.verified && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold">✓ Verified</span>}
                <span className="text-xs text-gray-400">{r.date instanceof Date ? r.date.toLocaleDateString("en-IN") : ""}</span>
              </div>
            </div>

            <div className="ml-13 mb-3">
              <p className="text-xs text-brand-gold font-semibold mb-0.5">{r.productName} • {r.variant}</p>
              <p className="font-semibold text-brand-brown text-sm">{r.title}</p>
              <p className="text-gray-500 text-sm mt-1">{r.body}</p>
            </div>

            {/* Admin reply */}
            {r.adminReply && (
              <div className="ml-13 bg-brand-cream rounded-xl p-3 mb-3 border-l-4 border-brand-gold">
                <p className="text-xs font-semibold text-brand-gold mb-1">JAI SHREE Team replied:</p>
                <p className="text-sm text-gray-600">{r.adminReply}</p>
              </div>
            )}

            {replyingTo === r.id && (
              <div className="ml-13 mb-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  placeholder="Write your reply..."
                  className="input-field text-sm resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => sendReply(r.id)} className="btn-primary py-1.5 px-4 text-sm">Send Reply</button>
                  <button onClick={() => setReplyingTo(null)} className="btn-outline py-1.5 px-4 text-sm">Cancel</button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {r.status !== "approved" && (
                <button onClick={() => setStatus(r.id, "approved")} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors">
                  <CheckCircle size={13} /> Approve
                </button>
              )}
              {r.status !== "rejected" && (
                <button onClick={() => setStatus(r.id, "rejected")} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                  <XCircle size={13} /> Reject
                </button>
              )}
              <button onClick={() => { setReplyingTo(r.id); setReplyText(r.adminReply || ""); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-500 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                <MessageCircle size={13} /> Reply
              </button>
              <button onClick={() => handleDelete(r.id)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors ml-auto">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
