import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

// Metro areas by first 3 digits of PIN — used only to estimate delivery
// days when there's no admin-configured Firestore record for this PIN.
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

function estimateDays(pincode) {
  const prefix3 = pincode.slice(0, 3);
  if (prefix3 === "302" || prefix3 === "303" || prefix3 === "304") return 1; // Jaipur — same city
  if (METRO[prefix3]) return 2; // metro
  return 4; // rest of India
}

/**
 * Centralized PIN code serviceability check — same function is used on the
 * Product Page, Cart, and Checkout so a PIN can never be accepted in one
 * place and rejected in another.
 *
 * Source of truth is India Post's own PIN code directory (api.postalpincode.in
 * — free, no key) so every real, deliverable Indian PIN works out of the box
 * without an admin having to pre-populate every single one (that was the
 * earlier bug: a hard allow-list meant even Jaipur's own PINs were rejected
 * because nobody had added them yet). Firestore `serviceable_pincodes` is
 * now an OVERRIDE layer on top of that, for two cases:
 *   - `serviceable: false`  → admin has explicitly blocked a real PIN
 *     (e.g. a genuinely unreachable pocket courier won't cover)
 *   - `serviceable: true` with custom estimatedDays/codAvailable/courier
 *     → admin wants specific delivery terms for that PIN
 * No Firestore doc at all = fall through to the India Post check, not an
 * automatic reject.
 */
export async function checkPincodeServiceability(pincode) {
  const clean = String(pincode || "").trim();
  if (!/^\d{6}$/.test(clean)) {
    return { serviceable: false, reason: "Enter a valid 6-digit PIN code." };
  }

  // 1. Admin override, if one exists for this exact PIN.
  try {
    const snap = await getDoc(doc(db, "serviceable_pincodes", clean));
    if (snap.exists()) {
      const data = snap.data();
      if (data.serviceable === false) {
        return { serviceable: false, reason: "Delivery not available at this PIN code. Please enter another serviceable PIN code." };
      }
      return {
        serviceable: true,
        estimatedDays: data.estimatedDays ?? estimateDays(clean),
        codAvailable: data.codAvailable ?? true,
        courier: data.courier || "",
      };
    }
  } catch {
    // Firestore unreachable — fall through to the postal check below rather
    // than failing the whole PIN just because the override lookup failed.
  }

  // 2. No override — verify against India Post's real PIN code directory.
  //
  // India Post PINs don't cleanly separate "village" from "small town" —
  // one PIN often bundles a real town with the villages around it (e.g.
  // 303801 lists 8 "Branch Post Office" villages PLUS "Kaladera", itself a
  // real town, as a "Sub Post Office" — BranchType alone can't tell them
  // apart; both signals appear on genuinely rural PINs too). The one
  // reliable marker is a "Head Post Office" record — that only exists for
  // an actual city/town hub, never a village cluster. So: Head Post
  // Office present → auto-serviceable. Otherwise → NOT serviceable by
  // default, even if it has Sub Post Office entries (a real small town
  // without its own Head PO will also land here) — add it via the admin
  // override above once you've confirmed your courier actually covers it.
  // This trades some false rejects (legitimate small towns) for zero
  // false accepts (no village ships by accident), which is the safer
  // default for a food-delivery business.
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
    const data = await res.json();
    const offices = data?.[0]?.Status === "Success" ? data[0].PostOffice || [] : [];
    if (offices.length === 0) {
      return { serviceable: false, reason: "This PIN code could not be found. Please double-check and try again." };
    }
    const hasHeadOffice = offices.some((o) => o.BranchType === "Head Post Office");
    if (!hasHeadOffice) {
      return { serviceable: false, reason: "Delivery not available at this PIN code. Please enter another serviceable PIN code." };
    }
    return {
      serviceable: true,
      estimatedDays: estimateDays(clean),
      codAvailable: true,
      courier: "",
    };
  } catch {
    // Network/API unreachable — fail closed (never silently accept an
    // unverified PIN), but this only happens on a real connectivity issue
    // now, not on every ordinary PIN.
    return { serviceable: false, reason: "Could not verify delivery for this PIN code right now. Please try again." };
  }
}
