import React, { useState, useEffect } from "react";
import { CreditCard, ExternalLink, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

const FUNCTIONS_BASE_URL =
  process.env.REACT_APP_FUNCTIONS_BASE_URL ||
  "http://127.0.0.1:5001/jaishreedryfruits-973dd/asia-south1";

const STATUS_STYLE = {
  captured: "bg-green-50 text-green-700",
  authorized: "bg-blue-50 text-blue-700",
  failed: "bg-red-50 text-red-600",
  refunded: "bg-gray-100 text-gray-600",
};

export default function PaymentsManagement() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${FUNCTIONS_BASE_URL}/getRazorpayPayments?count=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load payments");
      setPayments(data.items || []);
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const stats = {
    total: payments.length,
    captured: payments.filter((p) => p.status === "captured").length,
    totalAmount: payments.filter((p) => p.status === "captured").reduce((a, p) => a + p.amount / 100, 0),
    failed: payments.filter((p) => p.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-brown flex items-center gap-2">
            <CreditCard size={24} className="text-brand-gold" /> Razorpay Payments
          </h1>
          <p className="text-sm text-gray-400">Live payments from your Razorpay account</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 btn-outline text-sm px-4 py-2">
            <RefreshCw size={14} /> Refresh
          </button>
          <a
            href="https://dashboard.razorpay.com/app/payments"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 btn-primary text-sm px-4 py-2"
          >
            Open Razorpay Dashboard <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Payments", val: stats.total, color: "bg-blue-500" },
          { label: "Captured", val: stats.captured, color: "bg-green-500" },
          { label: "Total Captured (₹)", val: stats.totalAmount.toLocaleString("en-IN"), color: "bg-amber-500" },
          { label: "Failed", val: stats.failed, color: "bg-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4 border border-gray-100 rounded-xl">
            <div className={`w-2 h-2 rounded-full ${s.color} mb-2`} />
            <p className="font-bold text-2xl text-brand-brown">{s.val}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading payments...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 text-sm">{error}</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <CreditCard size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No payments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  {["Payment ID", "Date", "Amount", "Method", "Status", "Email/Contact"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.id}</td>
                    <td className="text-xs">{formatDate(new Date(p.created_at * 1000))}</td>
                    <td className="font-semibold text-brand-brown">₹{(p.amount / 100).toLocaleString("en-IN")}</td>
                    <td className="text-xs uppercase">{p.method}</td>
                    <td>
                      <span className={`inline-flex text-xs px-2 py-1 rounded-full font-semibold ${STATUS_STYLE[p.status] || "bg-gray-100 text-gray-600"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">{p.email || p.contact || "—"}</td>
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
