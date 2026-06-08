export const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

export const formatDate = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export const discountPercent = (original, sale) =>
  Math.round(((original - sale) / original) * 100);

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

// Sample seed data for demo products
export const DEMO_PRODUCTS = [
  {
    id: "p1",
    name: "Premium California Almonds",
    category: "Almonds",
    description: "Sourced from the finest California farms, our premium almonds are rich in protein, healthy fats, and essential vitamins. Perfect for snacking, cooking, or gifting.",
    images: [
      "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80",
      "https://images.unsplash.com/photo-1574734758476-7dc34729b13d?w=600&q=80",
    ],
    variants: [
      { id: "v1a", weight: "250g", price: 349, originalPrice: 399, stock: 50 },
      { id: "v1b", weight: "500g", price: 649, originalPrice: 749, stock: 35 },
      { id: "v1c", weight: "1kg", price: 1199, originalPrice: 1399, stock: 20 },
    ],
    rating: 4.8,
    reviewCount: 234,
    badge: "Best Seller",
    featured: true,
    tags: ["protein", "healthy", "premium"],
  },
  {
    id: "p2",
    name: "Whole Cashews W320",
    category: "Cashews",
    description: "Grade W320 whole cashews — the finest grade available. Creamy, buttery texture with a rich, satisfying flavor. Ideal for gifting and gourmet cooking.",
    images: [
      "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=600&q=80",
      "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600&q=80",
    ],
    variants: [
      { id: "v2a", weight: "250g", price: 449, originalPrice: 499, stock: 40 },
      { id: "v2b", weight: "500g", price: 849, originalPrice: 949, stock: 25 },
    ],
    rating: 4.9,
    reviewCount: 187,
    badge: "Premium",
    featured: true,
    tags: ["cashews", "premium", "gift"],
  },
  {
    id: "p3",
    name: "Iranian Green Pistachios",
    category: "Pistachios",
    description: "Hand-picked Iranian pistachios with a vibrant green color and natural sweetness. A delicacy for true nut connoisseurs.",
    images: [
      "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=600&q=80",
    ],
    variants: [
      { id: "v3a", weight: "250g", price: 599, originalPrice: 699, stock: 30 },
      { id: "v3b", weight: "500g", price: 1099, originalPrice: 1299, stock: 15 },
    ],
    rating: 4.7,
    reviewCount: 142,
    badge: "New",
    featured: false,
    tags: ["pistachios", "imported", "luxury"],
  },
  {
    id: "p4",
    name: "Kashmiri Walnuts (Akhrot)",
    category: "Walnuts",
    description: "Fresh from the valleys of Kashmir, these walnuts are known for their rich omega-3 content and exceptional taste. A true Kashmiri treasure.",
    images: [
      "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?w=600&q=80",
    ],
    variants: [
      { id: "v4a", weight: "250g", price: 279, originalPrice: 319, stock: 60 },
      { id: "v4b", weight: "500g", price: 519, originalPrice: 599, stock: 45 },
      { id: "v4c", weight: "1kg", price: 999, originalPrice: 1149, stock: 30 },
    ],
    rating: 4.6,
    reviewCount: 98,
    badge: null,
    featured: true,
    tags: ["walnuts", "kashmir", "omega3"],
  },
  {
    id: "p5",
    name: "Royal Gift Hamper",
    category: "Gift Hampers",
    description: "A luxuriously curated hamper with our finest selection of almonds, cashews, pistachios, and walnuts in premium packaging. Perfect for gifting on every occasion.",
    images: [
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80",
    ],
    variants: [
      { id: "v5a", weight: "1kg Assorted", price: 1499, originalPrice: 1799, stock: 20 },
      { id: "v5b", weight: "2kg Assorted", price: 2799, originalPrice: 3299, stock: 10 },
    ],
    rating: 5.0,
    reviewCount: 67,
    badge: "Limited",
    featured: true,
    tags: ["gift", "hamper", "premium", "luxury"],
  },
  {
    id: "p6",
    name: "Premium Mix Dry Fruits",
    category: "Combo Packs",
    description: "Our best-selling assorted mix — almonds, cashews, raisins, pistachios, and walnuts in perfect proportions. The ultimate healthy snack.",
    images: [
      "https://images.unsplash.com/photo-1611575521605-a4f30ee6d5d0?w=600&q=80",
    ],
    variants: [
      { id: "v6a", weight: "500g", price: 749, originalPrice: 849, stock: 55 },
      { id: "v6b", weight: "1kg", price: 1399, originalPrice: 1599, stock: 40 },
    ],
    rating: 4.8,
    reviewCount: 312,
    badge: "Best Seller",
    featured: true,
    tags: ["combo", "mixed", "value"],
  },
];
