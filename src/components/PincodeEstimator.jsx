import React, { useState } from "react";
import { MapPin, Calendar, XCircle, Loader2 } from "lucide-react";
import { checkPincodeServiceability } from "../utils/serviceability";

/**
 * Checks delivery serviceability for a PIN code against the centralized
 * `serviceable_pincodes` collection (same check used on Cart/Checkout —
 * see src/utils/serviceability.js). Reports the result up via
 * onServiceabilityChange so the page can disable Buy Now when a checked
 * PIN comes back non-serviceable.
 */
export default function PincodeEstimator({ onServiceabilityChange }) {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [checking, setChecking] = useState(false);

  const check = async () => {
    const p = pin.trim();
    if (!/^\d{6}$/.test(p)) {
      setErr("Please enter a valid 6-digit pincode.");
      setResult(null);
      return;
    }
    setErr("");
    setResult(null);
    setChecking(true);
    const res = await checkPincodeServiceability(p);
    setChecking(false);
    if (!res.serviceable) {
      setErr(res.reason);
      onServiceabilityChange?.({ checked: true, serviceable: false });
      return;
    }
    setResult(res);
    onServiceabilityChange?.({ checked: true, serviceable: true, codAvailable: res.codAvailable });
  };

  return (
    <div className="border border-gray-100 rounded-2xl p-5 bg-white">
      <p className="text-[10px] font-bold uppercase tracking-[3px] text-brand-brown mb-3 flex items-center gap-2">
        <MapPin size={12} className="text-brand-gold flex-shrink-0" />
        Check Delivery &amp; Availability
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter 6-digit pincode"
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setResult(null); setErr(""); }}
          onKeyDown={(e) => e.key === "Enter" && check()}
          className="input-field flex-1 py-2.5 text-sm"
        />
        <button
          onClick={check}
          disabled={checking}
          className="px-4 py-2.5 rounded-xl bg-brand-brown text-white text-sm font-semibold hover:bg-brand-gold transition-colors whitespace-nowrap disabled:opacity-60 flex items-center gap-1.5"
        >
          {checking ? <Loader2 size={14} className="animate-spin" /> : "Check"}
        </button>
      </div>
      {err && (
        <div className="mt-3 rounded-xl p-3.5 bg-red-50 border border-red-100 flex gap-3 items-start">
          <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700 leading-snug">{err}</p>
        </div>
      )}
      {result && (
        <div className="mt-3 rounded-xl p-3.5 bg-emerald-50 border border-emerald-100 flex gap-3 items-start">
          <Calendar size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Delivery available — arrives in {result.estimatedDays} day{result.estimatedDays === 1 ? "" : "s"}</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {result.codAvailable ? "Cash on Delivery available" : "Prepaid only for this PIN code"}
              {result.courier ? ` · ${result.courier}` : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
