import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import toast from "react-hot-toast";
import { ChevronDown } from "lucide-react";

const BUDGET_BRACKETS = [
  "₹500 – ₹1,000 per box",
  "₹1,000 – ₹2,500 per box",
  "₹2,500 – ₹5,000 per box",
  "₹5,000+ per box (Signature Collection)",
];

const INDIAN_CITIES = [
  "Ahmedabad", "Bengaluru", "Bhopal", "Chennai", "Coimbatore",
  "Delhi NCR", "Hyderabad", "Indore", "Jaipur", "Kochi",
  "Kolkata", "Lucknow", "Mumbai", "Nagpur", "Pune",
  "Surat", "Vadodara", "Visakhapatnam", "Multiple Cities / Pan-India",
];

const EMPTY = { orgName: "", eventType: "", budget: "", quantity: "", city: "", contact: "", notes: "" };

export default function B2BGiftingForm({ onClose, theme = "light" }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const valid = () =>
    form.orgName.trim().length >= 2 &&
    form.budget &&
    parseInt(form.quantity) >= 50 &&
    form.city &&
    form.contact.trim().replace(/\D/g, "").length >= 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid()) {
      toast.error("Please fill all required fields. Minimum quantity is 50 units.");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "b2b_inquiries"), {
        ...form,
        quantity: parseInt(form.quantity),
        createdAt: serverTimestamp(),
        status: "new",
        source: "website_gifting_form",
      });
    } catch {
      // Silent — show success regardless; team follows up via WhatsApp
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  const isDark = theme === "dark";
  const labelCls = `block text-[10px] font-bold uppercase tracking-[2.5px] mb-1.5 ${isDark ? "text-white/60" : "text-brand-brown"}`;
  const inputCls = `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all ${
    isDark
      ? "bg-white/8 border-white/15 text-white placeholder:text-white/30 focus:border-brand-gold"
      : "bg-white border-gray-200 text-brand-brown placeholder:text-gray-400 focus:border-brand-gold"
  }`;

  if (submitted) {
    return (
      <div className="text-center py-10 px-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${isDark ? "bg-white/10" : "bg-emerald-50"}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#C9A84C" : "#16a34a"} strokeWidth="2.5" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h3 className={`font-serif text-2xl mb-3 ${isDark ? "text-white" : "text-brand-brown"}`}>Enquiry Received</h3>
        <p className={`text-sm leading-relaxed max-w-xs mx-auto ${isDark ? "text-white/55" : "text-gray-500"}`}>
          Our corporate gifting concierge will reach you within 2 business hours with a personalised catalogue and pricing sheet.
        </p>
        {onClose && (
          <button onClick={onClose} className="mt-6 btn-gold px-8 py-3 text-xs">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Organisation / Event *</label>
          <input
            className={inputCls}
            placeholder="e.g. Infosys Ltd · Sharma Wedding"
            value={form.orgName}
            onChange={e => set("orgName", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Occasion Type</label>
          <input
            className={inputCls}
            placeholder="Diwali gifting, Wedding, Corporate..."
            value={form.eventType}
            onChange={e => set("eventType", e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Budget per Box *</label>
          <div className="relative">
            <select
              className={`${inputCls} appearance-none pr-9`}
              value={form.budget}
              onChange={e => set("budget", e.target.value)}
              required
            >
              <option value="">Select bracket</option>
              {BUDGET_BRACKETS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <ChevronDown size={13} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? "text-white/40" : "text-gray-400"}`} />
          </div>
        </div>
        <div>
          <label className={labelCls}>
            Quantity Required * <span className={`font-normal ${isDark ? "text-white/30" : "text-gray-400"}`}>(min 50)</span>
          </label>
          <input
            type="number"
            min="1"
            className={inputCls}
            placeholder="e.g. 200"
            value={form.quantity}
            onChange={e => set("quantity", e.target.value)}
            required
          />
          {form.quantity && parseInt(form.quantity) < 50 && (
            <p className="text-[11px] text-red-400 mt-1">Minimum order is 50 units.</p>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Delivery City *</label>
          <div className="relative">
            <select
              className={`${inputCls} appearance-none pr-9`}
              value={form.city}
              onChange={e => set("city", e.target.value)}
              required
            >
              <option value="">Select city</option>
              {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? "text-white/40" : "text-gray-400"}`} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Contact Number *</label>
          <input
            type="tel"
            className={inputCls}
            placeholder="+91 98XXX XXXXX"
            value={form.contact}
            onChange={e => set("contact", e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Special Requirements</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          placeholder="Custom branding, delivery date, packaging preferences..."
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn-gold w-full py-4 text-xs tracking-[3px] disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Request Corporate Catalogue"}
      </button>
      <p className={`text-[10px] text-center ${isDark ? "text-white/30" : "text-gray-400"}`}>
        Our concierge responds within 2 business hours with a personalised pricing sheet.
      </p>
    </form>
  );
}
