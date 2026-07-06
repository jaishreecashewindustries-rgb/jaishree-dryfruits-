import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase/config";
import { Truck, CheckCircle2, Star, MapPin } from "lucide-react";
import SEO from "../components/SEO";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductsContext";

// Top-20-city delivery data — tier classification matches what's already
// promised in FAQ.jsx ("Metro: 2-3 days, Tier-2: 3-5 days"), so these pages
// never contradict the FAQ page a visitor might also read.
export const CITIES = {
  mumbai: { name: "Mumbai", state: "Maharashtra", tier: "metro", days: "2-3" },
  delhi: { name: "Delhi", state: "Delhi", tier: "metro", days: "2-3" },
  bangalore: { name: "Bangalore", state: "Karnataka", tier: "metro", days: "2-3" },
  hyderabad: { name: "Hyderabad", state: "Telangana", tier: "metro", days: "2-3" },
  chennai: { name: "Chennai", state: "Tamil Nadu", tier: "metro", days: "2-3" },
  pune: { name: "Pune", state: "Maharashtra", tier: "metro", days: "2-3" },
  kolkata: { name: "Kolkata", state: "West Bengal", tier: "metro", days: "2-3" },
  ahmedabad: { name: "Ahmedabad", state: "Gujarat", tier: "tier2", days: "3-5" },
  surat: { name: "Surat", state: "Gujarat", tier: "tier2", days: "3-5" },
  jaipur: { name: "Jaipur", state: "Rajasthan", tier: "tier2", days: "1-2" },
  lucknow: { name: "Lucknow", state: "Uttar Pradesh", tier: "tier2", days: "3-5" },
  kanpur: { name: "Kanpur", state: "Uttar Pradesh", tier: "tier2", days: "3-5" },
  nagpur: { name: "Nagpur", state: "Maharashtra", tier: "tier2", days: "3-5" },
  indore: { name: "Indore", state: "Madhya Pradesh", tier: "tier2", days: "3-5" },
  thane: { name: "Thane", state: "Maharashtra", tier: "metro", days: "2-3" },
  bhopal: { name: "Bhopal", state: "Madhya Pradesh", tier: "tier2", days: "3-5" },
  visakhapatnam: { name: "Visakhapatnam", state: "Andhra Pradesh", tier: "tier2", days: "3-5" },
  patna: { name: "Patna", state: "Bihar", tier: "tier2", days: "3-5" },
  vadodara: { name: "Vadodara", state: "Gujarat", tier: "tier2", days: "3-5" },
  ghaziabad: { name: "Ghaziabad", state: "Uttar Pradesh", tier: "metro", days: "2-3" },
};

export default function CityLanding() {
  const { city } = useParams();
  const cityData = CITIES[city];
  const { products } = useProducts();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cityData) return;
    (async () => {
      try {
        const q = query(
          collection(db, "reviews"),
          where("userCity", "==", cityData.name),
          where("status", "==", "approved"),
          limit(3)
        );
        const snap = await getDocs(q);
        setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [city]);

  if (!cityData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center min-h-screen">
        <h1 className="font-serif text-2xl text-brand-brown mb-2">City not found</h1>
        <Link to="/products" className="btn-primary inline-block mt-4">Browse All Products</Link>
      </div>
    );
  }

  const bestsellers = products.filter((p) => p.badge === "Best Seller" || p.featured).slice(0, 4);

  return (
    <div className="min-h-screen" data-prerender-ready={loading ? "false" : "true"}>
      <SEO
        title={`Dry Fruits Delivery in ${cityData.name} — Order Online`}
        description={`Buy premium dry fruits online in ${cityData.name}, ${cityData.state}. FSSAI certified almonds, cashews, pistachios & walnuts delivered in ${cityData.days} days. Free shipping above ₹499.`}
        keywords={`dry fruits ${cityData.name.toLowerCase()}, buy dry fruits online ${cityData.name.toLowerCase()}, almonds ${cityData.name.toLowerCase()}, cashews ${cityData.name.toLowerCase()}, dry fruits delivery ${cityData.name.toLowerCase()}`}
        breadcrumb={[
          { name: "Home", url: "https://jaishreedryfruits.com/" },
          { name: `Delivery in ${cityData.name}`, url: `https://jaishreedryfruits.com/dry-fruits-delivery/${city}` },
        ]}
      />

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0D1B2A 0%, #1B2E4B 60%, #243D63 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 py-16 text-center relative">
          <p className="text-brand-gold text-xs font-bold tracking-[3px] uppercase mb-4 flex items-center justify-center gap-2">
            <MapPin size={14} /> {cityData.name}, {cityData.state}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
            Premium Dry Fruits Delivered in {cityData.name}
          </h1>
          <p className="text-white/60 max-w-xl mx-auto mb-6">
            FSSAI certified almonds, cashews, pistachios & walnuts — direct-sourced from Kashmir, California & Iran,
            delivered to your doorstep in {cityData.name} within {cityData.days} days.
          </p>
          <Link to="/products" className="btn-gold inline-block px-8 py-3">Shop Now</Link>
        </div>
      </div>

      {/* Trust strip */}
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Truck, text: `${cityData.days} day delivery to ${cityData.name}` },
          { icon: CheckCircle2, text: "FSSAI Certified, 100% Authentic" },
          { icon: Star, text: "25+ years, 50,000+ happy families" },
        ].map((t, i) => (
          <div key={i} className="flex items-center gap-3 bg-brand-cream rounded-xl p-4">
            <t.icon size={20} className="text-brand-gold flex-shrink-0" />
            <span className="text-sm font-medium text-brand-brown">{t.text}</span>
          </div>
        ))}
      </div>

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="font-serif text-2xl font-bold text-brand-brown mb-6 text-center">
            Popular with {cityData.name} Customers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bestsellers.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Real reviews from this city, if any */}
      {reviews.length > 0 && (
        <div className="bg-brand-cream py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="font-serif text-2xl font-bold text-brand-brown mb-6 text-center">
              What {cityData.name} Customers Say
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-xl p-5">
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className={i < (r.rating || 5) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">"{r.text}"</p>
                  <p className="text-xs font-semibold text-brand-brown">{r.userName} · {r.userCity}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Other cities we deliver to — internal linking for crawl discovery */}
      <div className="max-w-5xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">We also deliver dry fruits to</p>
        <div className="flex flex-wrap justify-center gap-2">
          {Object.entries(CITIES).filter(([slug]) => slug !== city).slice(0, 12).map(([slug, c]) => (
            <Link key={slug} to={`/dry-fruits-delivery/${slug}`} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-brand-cream text-gray-600 hover:text-brand-brown rounded-full transition-colors">
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
