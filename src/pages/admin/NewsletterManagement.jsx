import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Mail, MessageCircle, Send, Copy, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const FUNCTIONS_BASE_URL =
  process.env.REACT_APP_FUNCTIONS_BASE_URL ||
  "http://127.0.0.1:5001/jaishreedryfruits-973dd/asia-south1";

export default function NewsletterManagement() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const withEmail = customers.filter((c) => c.email);
  const withPhone = customers.filter((c) => c.phone);

  const sendBroadcast = async () => {
    if (!subject.trim() || !body.trim()) { toast.error("Subject aur message dono chahiye"); return; }
    if (withEmail.length === 0) { toast.error("Koi email subscriber nahi mila"); return; }
    if (!window.confirm(`${withEmail.length} customers ko email bhejni hai?`)) return;

    setSending(true);
    setResult(null);
    try {
      const token = await user.getIdToken();
      const html = body.split("\n").map((line) => `<p style="margin:0 0 12px;font-family:sans-serif;color:#222;">${line}</p>`).join("");
      const res = await fetch(`${FUNCTIONS_BASE_URL}/sendBulkEmail`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject,
          html,
          recipients: withEmail.map((c) => ({ email: c.email, name: c.displayName })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setResult(data);
      toast.success(`${data.sent} emails sent!`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const copyPhoneNumbers = () => {
    const numbers = withPhone.map((c) => c.phone).join(", ");
    navigator.clipboard.writeText(numbers);
    toast.success(`${withPhone.length} phone numbers copied! Paste into a WhatsApp Broadcast List (WhatsApp Business app → New Broadcast).`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-brown flex items-center gap-2">
          <Mail size={24} className="text-brand-gold" /> Newsletter & Broadcast
        </h1>
        <p className="text-sm text-gray-400">Send bulk email or prep a WhatsApp broadcast to all customers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="bg-white p-4 border border-gray-100 rounded-xl">
          <p className="font-bold text-2xl text-brand-brown">{loading ? "…" : withEmail.length}</p>
          <p className="text-xs text-gray-400">Customers with email</p>
        </div>
        <div className="bg-white p-4 border border-gray-100 rounded-xl">
          <p className="font-bold text-2xl text-brand-brown">{loading ? "…" : withPhone.length}</p>
          <p className="text-xs text-gray-400">Customers with phone</p>
        </div>
      </div>

      {/* Email broadcast */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-brand-brown flex items-center gap-2"><Mail size={16} /> Email Broadcast</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field text-sm" placeholder="e.g. Diwali Sale — 20% off everything!" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Message</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="input-field text-sm resize-none" placeholder="Write your message here — each line becomes a paragraph." />
        </div>
        <button onClick={sendBroadcast} disabled={sending} className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
          <Send size={16} /> {sending ? "Sending..." : `Send to ${withEmail.length} customers`}
        </button>
        {result && (
          <p className="text-sm text-gray-500">
            ✅ {result.sent} sent{result.failed?.length ? `, ❌ ${result.failed.length} failed (${result.failed.join(", ")})` : ""}
          </p>
        )}
      </div>

      {/* WhatsApp broadcast */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
        <h2 className="font-semibold text-brand-brown flex items-center gap-2"><MessageCircle size={16} /> WhatsApp Broadcast</h2>
        <p className="text-sm text-gray-500">
          WhatsApp doesn't allow automated bulk sending without Meta's official Business API (separate paid setup).
          The practical workaround: copy all customer numbers below, then in your WhatsApp Business app go to
          <strong> Chats → New Broadcast</strong>, paste the numbers as contacts, and send your message —
          it delivers as an individual message to each person (not a group).
        </p>
        <button onClick={copyPhoneNumbers} className="btn-outline flex items-center gap-2 text-sm px-5 py-2.5">
          <Copy size={14} /> Copy {withPhone.length} phone numbers
        </button>
      </div>
    </div>
  );
}
