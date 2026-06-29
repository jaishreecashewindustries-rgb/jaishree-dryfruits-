import React, { useState } from "react";
import { MapPin, Calendar } from "lucide-react";

// Metro areas by first 3 digits of PIN
const METRO = {
  "110": "Delhi NCR", "120": "Delhi NCR", "121": "Delhi NCR", "122": "Delhi NCR",
  "124": "Delhi NCR", "125": "Delhi NCR", "131": "Delhi NCR", "132": "Delhi NCR",
  "400": "Mumbai", "401": "Mumbai", "402": "Mumbai", "403": "Goa",
  "410": "Pune", "411": "Pune", "412": "Pune", "413": "Pune",
  "560": "Bengaluru", "562": "Bengaluru", "563": "Bengaluru",
  "600": "Chennai", "602": "Chennai", "603": "Chennai", "604": "Chennai",
  "500": "Hyderabad", "501": "Hyderabad", "502": "Hyderabad",
  "700": "Kolkata", "711": "Kolkata", "712": "Kolkata",
  "380": "Ahmedabad", "382": "Ahmedabad", "383": "Ahmedabad",
  "302": "Jaipur", "303": "Jaipur", "304": "Jaipur",
  "226": "Lucknow", "227": "Lucknow",
  "440": "Nagpur", "441": "Nagpur",
  "452": "Indore", "453": "Indore",
  "462": "Bhopal", "463": "Bhopal",
  "682": "Kochi", "683": "Kochi", "684": "Kochi",
  "641": "Coimbatore", "642": "Coimbatore",
  "395": "Surat", "396": "Surat",
  "390": "Vadodara", "391": "Vadodara",
  "208": "Kanpur", "209": "Kanpur",
  "160": "Chandigarh", "140": "Chandigarh",
  "530": "Visakhapatnam", "531": "Visakhapatnam",
  "751": "Bhubaneswar", "752": "Bhubaneswar",
};

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

function computeDeliveryDate(pincode) {
  const prefix3 = pincode.slice(0, 3);
  const firstDigit = parseInt(pincode[0]);

  let city = METRO[prefix3] || null;
  let days, tier;

  if (prefix3 === "302" || prefix3 === "303") {
    days = 1; tier = "Same-City Express";
    city = "Jaipur";
  } else if (city) {
    days = 2; tier = "Premium Air Express";
  } else if (firstDigit >= 1 && firstDigit <= 8) {
    days = 4; tier = "Tracked Courier";
  } else {
    return null; // unserviceable
  }

  // IST = UTC + 5:30
  const nowUTC = Date.now();
  const istMs = nowUTC + 5.5 * 60 * 60 * 1000;
  const istNow = new Date(istMs);
  const afterCutoff = istNow.getHours() >= 14; // 2 PM IST dispatch cutoff

  // Start from tomorrow (or day after if past cutoff)
  const delivery = new Date(istNow);
  delivery.setDate(delivery.getDate() + (afterCutoff ? 2 : 1));

  // Walk forward skipping Sundays for remaining days
  let added = 0;
  const target = days - 1;
  while (added < target) {
    delivery.setDate(delivery.getDate() + 1);
    if (delivery.getDay() !== 0) added++;
  }
  // If landing on Sunday, push to Monday
  if (delivery.getDay() === 0) delivery.setDate(delivery.getDate() + 1);

  return {
    city,
    tier,
    days,
    dateStr: `${DAY_NAMES[delivery.getDay()]}, ${MONTH_NAMES[delivery.getMonth()]} ${delivery.getDate()}`,
    afterCutoff,
  };
}

export default function PincodeEstimator() {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const check = () => {
    const p = pin.trim();
    if (!/^\d{6}$/.test(p)) {
      setErr("Please enter a valid 6-digit pincode."); setResult(null); return;
    }
    const first = parseInt(p[0]);
    if (first === 0 || first === 9) {
      setErr("This pincode is not currently serviceable. Please contact us for remote deliveries."); setResult(null); return;
    }
    setErr("");
    const est = computeDeliveryDate(p);
    if (!est) { setErr("Pincode not serviceable — please contact us."); return; }
    setResult(est);
  };

  return (
    <div className="border border-gray-100 rounded-2xl p-5 bg-white">
      <p className="text-[10px] font-bold uppercase tracking-[3px] text-brand-brown mb-3 flex items-center gap-2">
        <MapPin size={12} className="text-brand-gold flex-shrink-0" />
        Delivery Estimate
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter 6-digit pincode"
          value={pin}
          onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setResult(null); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && check()}
          className="input-field flex-1 py-2.5 text-sm"
        />
        <button
          onClick={check}
          className="px-4 py-2.5 rounded-xl bg-brand-brown text-white text-sm font-semibold hover:bg-brand-gold transition-colors whitespace-nowrap"
        >
          Check
        </button>
      </div>
      {err && <p className="text-xs text-red-500 mt-2 leading-snug">{err}</p>}
      {result && (
        <div className="mt-3 rounded-xl p-3.5 bg-emerald-50 border border-emerald-100 flex gap-3 items-start">
          <Calendar size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Arrives by&nbsp;<span className="text-emerald-700">{result.dateStr}</span>
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {result.tier}{result.city ? ` · ${result.city}` : ""}
            </p>
            {result.afterCutoff && (
              <p className="text-[10px] text-emerald-500 mt-1">
                Orders placed before 2:00 PM IST are dispatched same day (Mon–Sat).
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
