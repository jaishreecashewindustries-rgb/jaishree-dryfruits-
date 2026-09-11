export const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

export const formatDate = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export const discountPercent = (original, sale) =>
  Math.round(((original - sale) / original) * 100);

// Price per 100g — used for cross-product comparison (Compare page, product cards)
export const per100g = (price, weight) => {
  const grams = typeof weight === "number" ? weight : parseFloat(weight);
  if (!grams) return null;
  const unit = String(weight).toLowerCase().includes("kg") ? grams * 1000 : grams;
  return Math.round((price / unit) * 100);
};

export const truncate = (str, n = 80) =>
  str.length > n ? str.slice(0, n) + "…" : str;

export const slugify = (str) =>
  str.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

export const WHATSAPP_NUMBER = "917568577968";

export const whatsappOrderLink = (orderDetails) => {
  const msg = encodeURIComponent(
    `Hello JAI SHREE DRYFRUITS! 🌰\n\nI would like to enquire about my order:\n${orderDetails}`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
};

export const whatsappProductLink = (productName) => {
  const msg = encodeURIComponent(
    `Hello! I'm interested in *${productName}* from JAI SHREE DRYFRUITS. Please share more details.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
};

export const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  { value: "processing", label: "Processing", color: "bg-purple-100 text-purple-800" },
  { value: "shipped", label: "Shipped", color: "bg-orange-100 text-orange-800" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
  { value: "returned", label: "Returned", color: "bg-gray-200 text-gray-700" },
];

export const getStatusStyle = (status) =>
  ORDER_STATUSES.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-800";

export const PRODUCT_CATEGORIES = [
  "Almonds", "Cashews", "Pistachios", "Walnuts", "Raisins",
  "Dates", "Figs", "Apricots", "Combo Packs", "Gift Hampers",
  "Seeds", "Mixed Nuts",
];

// Health goal slugs — must match the ?goal= param values used in Home.jsx
export const HEALTH_GOALS = ["heart", "brain", "energy", "immunity", "weight", "bones", "skin", "kids"];

// Demo/placeholder products removed once real catalogue products existed
// for their categories (Almonds, Cashews, Pistachios, Walnuts, Gift
// Hampers, Mixed Nuts) — add real products via Admin > Products instead.
export const DEMO_PRODUCTS = [];
