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

// Sample seed data for demo products
export const DEMO_PRODUCTS = [
  {
    id: "p1",
    name: "Premium California Almonds",
    category: "Almonds",
    description: "Grown in California's San Joaquin Valley under an unbroken 25-year direct-import relationship, these almonds are harvested at peak oil content and vacuum-sealed within 48 hours of shelling. Zero mineral-oil coating. Zero artificial polish. Every kernel passes a hand-sorting check for whole, intact form — split or discoloured pieces are removed before dispatch. The result is an almond that tastes unmistakably raw, clean, and alive.",
    ritual: "Seven premium almonds, soaked overnight in copper water, peeled at dawn — an Ayurvedic practice prescribed in Charaka Samhita for sustained mental clarity and joint nourishment. The almond's skin contains tannins that impede nutrient absorption; peeling is not preference, it is protocol. Practised daily for 90 days, this ritual is documented to improve memory recall and reduce oxidative stress markers in peer-reviewed nutritional literature.",
    images: [
      "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80",
      "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80",
    ],
    variants: [
      { id: "v1a", weight: "250g", price: 380, stock: 50, perDay: "~20 daily servings · ₹19 per day" },
      { id: "v1b", weight: "500g", price: 720, stock: 35, perDay: "~40 daily servings · ₹18 per day" },
      { id: "v1c", weight: "1kg",  price: 1380, stock: 20, perDay: "~80 daily servings · ₹17 per day" },
    ],
    passport: {
      origin: "San Joaquin Valley, California, USA (37.9577° N, 120.3597° W)",
      harvestMonth: "October 2024",
      moisture: "< 4.5% — Verified Dry Protocol (AOAC 925.10)",
      grading: "Supreme Grade — 100% whole kernels, hand-sorted; zero mineral-oil coating; zero artificial polish",
      storage: "Vacuum-sealed; nitrogen-flushed; controlled humidity 40–50% RH at 18°C",
      certifications: "FSSAI Lic. 12720001000027 · APEDA Registered · In-house QA Batch Record",
      batchRef: "JSF-ALM-OCT24-V2",
      dispatchProtocol: "Packed within 48h of order; tamper-evident food-grade zip pouch",
    },
    rating: 4.8,
    reviewCount: 234,
    badge: "Best Seller",
    featured: true,
    tags: ["protein", "healthy", "premium"],
    goals: ["heart", "brain", "energy", "skin", "bones"],
  },
  {
    id: "p2",
    name: "Whole Cashews W320",
    category: "Cashews",
    description: "W320 is the export-quality standard — 320 whole kernels per pound, meaning each piece must meet a strict minimum size. Ours are white-grade: no grey tinge, no broken halves, no steam-treated softening. Sourced from FSSAI-approved processors and sorted a second time in our Jaipur facility, these cashews carry the natural sweetness only truly dry, unprocessed kernels retain. The buttery texture you taste is the fat of a properly cured nut — not moisture added back post-processing.",
    ritual: "Four whole cashews before your morning meal — the oleic acid profile of the W320 grade is structurally identical to extra-virgin olive oil. Rich in magnesium, a mineral that over 68% of urban Indian adults are deficient in. A Jaipur household tradition passed down across three generations of our founding family. The ritual is not about quantity; it is about the quality of what you start your day with.",
    images: [
      "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=600&q=80",
      "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80",
    ],
    variants: [
      { id: "v2a", weight: "250g", price: 480, stock: 40, perDay: "~25 daily servings · ₹19 per day" },
      { id: "v2b", weight: "500g", price: 920, stock: 25, perDay: "~50 daily servings · ₹18 per day" },
    ],
    passport: {
      origin: "Kollam District, Kerala, India (8.8932° N, 76.6141° E) — FSSAI-approved processing unit",
      harvestMonth: "February 2025",
      moisture: "< 4.2% — W320 Export Dry Protocol",
      grading: "W320 Export Grade — 320 whole kernels per pound; white-grade (no grey tinge); zero broken halves; zero steam-treated softening",
      storage: "Nitrogen-flushed barrier pouch; humidity-controlled 38–48% RH",
      certifications: "FSSAI Lic. 12720001000027 · APEDA Export Certified · EIC Approved Processor",
      batchRef: "JSF-CSH-FEB25-W320",
      dispatchProtocol: "Re-sorted at Jaipur facility before dispatch; tamper-evident seal",
    },
    rating: 4.9,
    reviewCount: 187,
    badge: "Premium",
    featured: true,
    tags: ["cashews", "premium", "gift"],
    goals: ["energy", "immunity", "weight", "kids"],
  },
  {
    id: "p3",
    name: "Iranian Green Pistachios",
    category: "Pistachios",
    description: "Imported from Iran's Rafsanjan region — the world's single most concentrated pistachio-growing belt — these are the green-kernel variety prized by Middle Eastern confectioners. The vivid interior colour is natural, not enhanced. We receive them in-shell to preserve freshness, then process only to order quantities. No re-roasting, no added salt, no flavour masking. The bittersweet, resinous note you taste after the initial sweetness is the hallmark of an authentically cured Irani pistachio.",
    ritual: "A closed fist of pistachios with your 4 PM tea — the melatonin content in pistachios is among the highest of any food, making this the one afternoon ritual that pays you back at midnight. The B6 and B1 vitamins accelerate neurotransmitter synthesis. In Persian culinary medicine, pistachios were considered the 'smiling nut' — prescribed for melancholy and mental fatigue, not merely as a snack.",
    images: [
      "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=600&q=80",
    ],
    variants: [
      { id: "v3a", weight: "250g", price: 640, stock: 30, perDay: "~17 daily handfuls · ₹38 per day" },
      { id: "v3b", weight: "500g", price: 1200, stock: 15, perDay: "~33 daily handfuls · ₹36 per day" },
    ],
    passport: {
      origin: "Rafsanjan, Kerman Province, Iran (30.4065° N, 55.9940° E) — World's highest-density pistachio belt",
      harvestMonth: "September 2024",
      moisture: "< 5.0% — In-shell Import Dry Protocol",
      grading: "Green-kernel variety; vivid interior colour unenhanced; processed in-shell to preserve freshness; no re-roasting; zero added salt",
      storage: "In-shell until processing; nitrogen-flushed after shelling; humidity 42–50% RH",
      certifications: "FSSAI Import Clearance · Licensed Exporter (Iran Ministry of Agriculture) · Jai Shree QA Batch",
      batchRef: "JSF-PST-SEP24-GRN",
      dispatchProtocol: "Processed to order quantities only; sealed within 24h of shelling",
    },
    rating: 4.7,
    reviewCount: 142,
    badge: "New",
    featured: false,
    tags: ["pistachios", "imported", "luxury"],
    goals: ["heart", "weight", "skin"],
  },
  {
    id: "p4",
    name: "Kashmiri Walnuts (Akhrot)",
    category: "Walnuts",
    description: "Sourced each October from the Sopore valley in Kashmir — the same farming families, the same orchards, for over a decade. Kashmiri walnuts have a thinner shell and a distinctly lighter, less tannic inner skin compared to Chilean or Californian varieties, which means the omega-3-rich oil sits closer to the surface of every bite. We store them at controlled humidity between 40–50% RH to prevent the rancidity that plagues improperly kept walnuts. What you receive is a walnut that is genuinely fresh — not simply recently packaged.",
    ritual: "Two Kashmiri walnuts, halved, consumed before a deep-work session — a single walnut half mirrors the geometry of a human brain lobe, and the symbolism is not coincidental. The omega-3 ALA content peaks in first-harvest October nuts. Walnuts are the only tree nut with a meaningful source of plant-based omega-3 fatty acids. The neuroscience literature on walnuts and cognitive function is now among the most robust in nutritional psychiatry.",
    images: [
      "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?w=600&q=80",
    ],
    variants: [
      { id: "v4a", weight: "250g", price: 300, stock: 60, perDay: "~17 daily servings · ₹18 per day" },
      { id: "v4b", weight: "500g", price: 560, stock: 45, perDay: "~33 daily servings · ₹17 per day" },
      { id: "v4c", weight: "1kg",  price: 1080, stock: 30, perDay: "~67 daily servings · ₹16 per day" },
    ],
    passport: {
      origin: "Sopore Valley, Baramulla District, Kashmir (34.0836° N, 74.4648° E) — Himalayan orchards, 1,585m elevation",
      harvestMonth: "October 2024 — first-harvest batch",
      moisture: "< 4.8% — Sopore Valley Dry Protocol; stored at 40–50% RH",
      grading: "Thin-shell Kashmiri variety; distinctly lighter inner skin vs Chilean/Californian; 98%+ whole half-kernels; omega-3 ALA peaks in first-harvest stock",
      storage: "Controlled humidity 40–50% RH prevents rancidity; cold-stored at 16°C at Jaipur facility",
      certifications: "FSSAI Lic. 12720001000027 · J&K Horticulture Board Registered · In-house QA",
      batchRef: "JSF-WLN-OCT24-KSH",
      dispatchProtocol: "Same-day packing on order; nitrogen-flushed resealable zip pouch",
    },
    rating: 4.6,
    reviewCount: 98,
    badge: null,
    featured: true,
    tags: ["walnuts", "kashmir", "omega3"],
    goals: ["brain", "heart", "energy", "kids"],
  },
  {
    id: "p5",
    name: "Royal Gift Hamper",
    category: "Gift Hampers",
    description: "Composed in our Jaipur atelier — each variety selected from its finest origin batch of the season, arranged in a hand-finished rigid box with food-safe tissue. The Royal Hamper carries the same nuts we sell individually at full price: no grade-down, no filler variety. A card detailing the provenance of each nut accompanies every hamper. Appropriate for Diwali, corporate gifting, and milestone occasions where the provenance of a gift reflects the standing of the giver.",
    ritual: null,
    images: [
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80",
    ],
    variants: [
      { id: "v5a", weight: "1kg Assorted", price: 1600, stock: 20, perDay: null },
      { id: "v5b", weight: "2kg Assorted", price: 2980, stock: 10, perDay: null },
    ],
    passport: {
      origin: "Multi-origin: Almonds (California) · Cashews (Kerala) · Walnuts (Kashmir) · Pistachios (Iran) — each component carries individual origin batch record",
      harvestMonth: "Mixed: September–October 2024",
      moisture: "< 5.0% across all components — verified before assembly",
      grading: "No grade-down: each component drawn from identical individual-sale stock; zero filler variety; provenance card included",
      storage: "Assembled in Jaipur atelier; food-safe tissue; rigid hand-finished box; nitrogen-flushed inner pouches",
      certifications: "FSSAI Lic. 12720001000027 · Individual component batch records on request",
      batchRef: "JSF-HAM-MIX-OCT24",
      dispatchProtocol: "Assembled per order; tamper-evident outer seal; gift message card included",
    },
    rating: 5.0,
    reviewCount: 67,
    badge: "Limited",
    featured: true,
    tags: ["gift", "hamper", "premium", "luxury"],
    goals: ["immunity", "energy", "kids"],
  },
  {
    id: "p6",
    name: "Premium Mix Dry Fruits",
    category: "Combo Packs",
    description: "Five varieties, one provenance standard: each component in this blend is drawn from the same origin-grade stock we sell individually. The proportions — 30% almonds, 25% cashews, 20% walnuts, 15% pistachios, 10% raisins — are calibrated for flavour balance, not cost. Assembled in our Gangauri Bazar facility and nitrogen-flushed to extend shelf life without preservatives. The mix that 50,000 families reach for daily.",
    ritual: "A small handful of this mix as your first food of the day — before coffee, before screens. Each variety in the blend activates a different metabolic pathway: the almonds provide slow-release energy, the walnuts open cognitive function, the cashews supply magnesium for nerve conductance, and the raisins deliver natural glucose for the first hour. This is not a snack; it is a calibrated morning protocol.",
    images: [
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80",
    ],
    variants: [
      { id: "v6a", weight: "500g", price: 780, stock: 55, perDay: "~33 daily handfuls · ₹24 per day" },
      { id: "v6b", weight: "1kg",  price: 1480, stock: 40, perDay: "~67 daily handfuls · ₹22 per day" },
    ],
    passport: {
      origin: "Multi-origin blend: Almonds (San Joaquin Valley, CA) · Cashews (Kollam, Kerala) · Walnuts (Sopore, Kashmir) · Pistachios (Rafsanjan, Iran) · Raisins (Nashik, Maharashtra)",
      harvestMonth: "Components: September–November 2024",
      moisture: "< 5.0% verified per component before blending",
      grading: "Proportions: 30% Almonds · 25% Cashews · 20% Walnuts · 15% Pistachios · 10% Raisins — calibrated for flavour balance, not cost. Same origin-grade stock as individual products.",
      storage: "Assembled at Gangauri Bazar facility; nitrogen-flushed to extend shelf life without preservatives",
      certifications: "FSSAI Lic. 12720001000027 · Batch test records available for all 5 components",
      batchRef: "JSF-MIX-NOV24-5V",
      dispatchProtocol: "Blended to order; resealable zip pouch; tamper-evident seal",
    },
    rating: 4.8,
    reviewCount: 312,
    badge: "Best Seller",
    featured: true,
    tags: ["combo", "mixed", "value"],
    goals: ["heart", "brain", "energy", "immunity", "weight", "bones", "skin", "kids"],
  },
];
