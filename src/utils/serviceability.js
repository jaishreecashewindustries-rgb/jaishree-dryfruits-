import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Centralized PIN code serviceability check — same function is used on the
 * Product Page, Cart, and Checkout so a PIN can never be accepted in one
 * place and rejected in another.
 *
 * Allow-list model per spec: a PIN is only serviceable if an admin has
 * explicitly created a `serviceable_pincodes/{pincode}` doc with
 * `serviceable: true`. No doc / any other value = NOT serviceable — this
 * is the safe default (villages/remote/unlisted PINs are rejected unless
 * an admin has actively approved them, not the other way round).
 *
 * Returns:
 *   { serviceable: true,  estimatedDays, codAvailable, courier }
 *   { serviceable: false, reason }
 */
export async function checkPincodeServiceability(pincode) {
  const clean = String(pincode || "").trim();
  if (!/^\d{6}$/.test(clean)) {
    return { serviceable: false, reason: "Enter a valid 6-digit PIN code." };
  }
  try {
    const snap = await getDoc(doc(db, "serviceable_pincodes", clean));
    if (!snap.exists() || snap.data().serviceable !== true) {
      return { serviceable: false, reason: "Delivery not available at this PIN code. Please enter another serviceable PIN code." };
    }
    const data = snap.data();
    return {
      serviceable: true,
      estimatedDays: data.estimatedDays ?? 3,
      codAvailable: data.codAvailable ?? true,
      courier: data.courier || "",
    };
  } catch {
    // Firestore unreachable — fail closed (reject), never fail open and
    // silently accept an unvalidated PIN.
    return { serviceable: false, reason: "Could not verify delivery for this PIN code right now. Please try again." };
  }
}
