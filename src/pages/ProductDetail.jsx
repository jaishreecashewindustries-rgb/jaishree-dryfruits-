import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Heart, ShoppingCart, Zap, Shield, Truck, MessageCircle, ChevronRight, Minus, Plus, Share2, CheckCircle, XCircle, Award, Leaf, Package, Flame, ThumbsUp, BadgeCheck } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import SEO from "../components/SEO";
import B2BGiftingForm from "../components/B2BGiftingForm";
import { formatPrice, discountPercent, whatsappProductLink, per100g } from "../utils/helpers";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ImageLightbox from "../components/ImageLightbox";
import MobileCartSheet from "../components/MobileCartSheet";
import PincodeEstimator from "../components/PincodeEstimator";
import MagneticButton from "../components/MagneticButton";
import SlotCounter from "../components/SlotCounter";
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useProducts } from "../context/ProductsContext";

// Small curated fallback — shown only when a product has no live Firestore reviews yet
const FALLBACK_REVIEWS = [
  { id: "fb1", user: "Priya S.",  city: "Mumbai",    rating: 5, title: "Unmistakably fresh",          body: "I've ordered from two other premium dry fruit brands online. Nothing compares. The freshness is on another level.", date: "2026-05-24", verified: true, variant: "500g", helpful: 24 },
  { id: "fb2", user: "Rahul K.",  city: "Delhi",     rating: 5, title: "The packaging speaks volumes", body: "Every detail signals quality — the vacuum seal, the batch number, the resealable zip. Genuinely impressed.", date: "2026-05-10", verified: true, variant: "250g", helpful: 18 },
  { id: "fb3", user: "Ananya P.", city: "Bengaluru", rating: 5, title: "Great for corporate gifting",  body: "Ordered hampers for our Diwali client gifts. The feedback we received was extraordinary.", date: "2026-04-28", verified: true, variant: "1kg", helpful: 31 },
];

function useProductReviews(productName) {
  const [reviews, setReviews] = useState(null); // null = loading
  useEffect(() => {
    let cancelled = false;
    if (!productName) { setReviews(FALLBACK_REVIEWS); return; }
    (async () => {
      try {
        const q = query(
          collection(db, "reviews"),
          where("productName", "==", productName),
          where("status", "==", "approved"),
          orderBy("createdAt", "desc"),
          limit(6)
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        if (snap.empty) {
          setReviews(FALLBACK_REVIEWS);
        } else {
          setReviews(snap.docs.map((d) => {
            const r = d.data();
            return {
              id: d.id,
              user: r.userName || "Verified Buyer",
              city: r.userCity || "",
              rating: r.rating || 5,
              title: r.title || "",
              body: r.text || "",
              date: r.createdAt?.toDate ? r.createdAt.toDate().toISOString() : new Date().toISOString(),
              verified: !!r.verified,
              variant: r.variant || "",
              helpful: r.helpful || 0,
            };
          }));
        }
      } catch {
        if (!cancelled) setReviews(FALLBACK_REVIEWS);
      }
    })();
    return () => { cancelled = true; };
  }, [productName]);
  return reviews || [];
}

function relativeDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now - d) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function ProductDetail() {
  const { id } = useParams();
  const { products: DEMO_PRODUCTS, loading: productsLoading } = useProducts();
  const product = DEMO_PRODUCTS.find((p) => p.id === id) || DEMO_PRODUCTS[0];
  // True only once Firestore has loaded AND the requested id actually matched a
  // real product — used as an explicit "safe to prerender" signal (see
  // scripts/prerender.js), since this page renders fallback data immediately
  // on mount, before that fallback is replaced with the real product.
  const productReadyForPrerender = !productsLoading && DEMO_PRODUCTS.some((p) => p.id === id);
  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [wishlist, setWishlist] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState({});
  const [showB2BForm, setShowB2BForm] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [localReviews, setLocalReviews] = useState([]);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);
  const [viewerCount, setViewerCount] = useState(() => 8 + (product.id.charCodeAt(0) % 18));
  const DUMMY_REVIEWS = useProductReviews(product.name);
  const buyRef = useRef(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const related = DEMO_PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
  const discount = selectedVariant?.originalPrice ? discountPercent(selectedVariant.originalPrice, selectedVariant.price) : 0;

  // `selectedVariant` is seeded from whatever `product` is at mount time —
  // which is the DEMO_PRODUCTS[0] fallback if Firestore hasn't resolved yet.
  // Without this, the price/variant shown stays stuck on the fallback
  // product forever once the real product loads, since useState's initial
  // value is only read once.
  useEffect(() => {
    setSelectedVariant(product.variants[0]);
  }, [product.id]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setStickyVisible(!entry.isIntersecting), { threshold: 0 });
    if (buyRef.current) observer.observe(buyRef.current);
    return () => observer.disconnect();
  }, []);

  // Gentle viewer-count fluctuation — urgency signal, resets per product
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((c) => Math.max(5, c + (Math.random() > 0.5 ? 1 : -1)));
    }, 6000);
    return () => clearInterval(interval);
  }, [product.id]);

  // Track recently viewed — skip while the real product is still loading, so we
  // don't pollute this list with the transient fallback product's id.
  useEffect(() => {
    if (productsLoading || !productReadyForPrerender) return;
    if (!product?.id) return;
    try {
      const existing = JSON.parse(localStorage.getItem("jsd_recently_viewed") || "[]");
      const updated = [product.id, ...existing.filter((id) => id !== product.id)].slice(0, 6);
      localStorage.setItem("jsd_recently_viewed", JSON.stringify(updated));
    } catch {}
  }, [product?.id]);

  const recentlyViewed = (() => {
    try {
      const ids = JSON.parse(localStorage.getItem("jsd_recently_viewed") || "[]");
      return ids.filter((id) => id !== product.id).map((id) => DEMO_PRODUCTS.find((p) => p.id === id)).filter(Boolean).slice(0, 4);
    } catch { return []; }
  })();

  const handleAddToCart = () => {
    addToCart({ id: product.id, variantId: selectedVariant.id, name: product.name, variant: selectedVariant.weight, price: selectedVariant.price, image: product.images[0], qty });
  };

  const handleNotifyMe = async () => {
    if (notifying || notified) return;
    const email = window.prompt("Enter your email — we'll let you know when this is back in stock:");
    if (!email) return;
    setNotifying(true);
    try {
      await addDoc(collection(db, "stock_notifications"), {
        email,
        productId: product.id,
        productName: product.name,
        variant: selectedVariant?.weight || "",
        notified: false,
        createdAt: serverTimestamp(),
      });
      setNotified(true);
      toast.success("We'll email you when it's back!");
    } catch {
      toast.error("Could not save your request — please try again");
    } finally {
      setNotifying(false);
    }
  };

  const handleBuyNow = () => {
    addToCart({ id: product.id, variantId: selectedVariant.id, name: product.name, variant: selectedVariant.weight, price: selectedVariant.price, image: product.images[0], qty });
    navigate("/checkout");
  };

  const avgRating = (DUMMY_REVIEWS.reduce((s, r) => s + r.rating, 0) / DUMMY_REVIEWS.length).toFixed(1);

  // While the real product is still loading, `product` above is a transient
  // fallback (DEMO_PRODUCTS[0]) — showing it, even for a moment, risks a
  // customer seeing/adding the wrong item. Show a skeleton instead.
  if (productsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen animate-pulse">
        <div className="h-3 w-48 bg-gray-100 rounded mb-6" />
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 aspect-square bg-gray-100 rounded-2xl" />
          <div className="flex-1 space-y-4">
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-8 w-3/4 bg-gray-100 rounded" />
            <div className="h-10 w-1/3 bg-gray-100 rounded" />
            <div className="h-24 bg-gray-100 rounded" />
            <div className="h-12 w-full bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Firestore has loaded and the requested id genuinely doesn't exist — a real
  // 404, not the fallback-flash case above. Don't silently show DEMO_PRODUCTS[0].
  if (!DEMO_PRODUCTS.some((p) => p.id === id)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center min-h-screen">
        <XCircle size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="font-serif text-2xl text-brand-brown mb-2">Product not found</h1>
        <p className="text-gray-500 mb-6">This product may have been removed, or the link is incorrect.</p>
        <Link to="/products" className="btn-primary inline-block">Browse All Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen" data-prerender-ready={productReadyForPrerender ? "true" : "false"}>
      <SEO
        title={product.name}
        description={`${product.description} Buy ${product.name} online from Jai Shree Dryfruits. FSSAI certified. Free shipping above ₹499.`}
        image={product.images?.[0]}
        type="product"
        product={product}
        keywords={`buy ${product.name.toLowerCase()}, ${product.category.toLowerCase()} online India, ${product.category.toLowerCase()} price, premium ${product.category.toLowerCase()}, FSSAI certified ${product.category.toLowerCase()}, Jai Shree Dryfruits`}
        breadcrumb={[
          { name: "Home", url: "https://jaishreedryfruits.com/" },
          { name: "Products", url: "https://jaishreedryfruits.com/products" },
          { name: product.category, url: `https://jaishreedryfruits.com/products?category=${encodeURIComponent(product.category)}` },
          { name: product.name, url: `https://jaishreedryfruits.com/product/${product.id}` },
        ]}
      />
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link to="/" className="hover:text-brand-gold">Home</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-brand-gold">Products</Link>
        <ChevronRight size={12} />
        <Link to={`/products?category=${product.category}`} className="hover:text-brand-gold">{product.category}</Link>
        <ChevronRight size={12} />
        <span className="text-brand-brown font-medium">{product.name}</span>
      </div>

      <motion.div
        className="grid md:grid-cols-2 gap-10 mb-16"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Image gallery with lightbox */}
        <div className="relative">
          {discount >= 5 && (
            <div className="absolute top-4 left-4 z-10 badge-sale text-sm px-3 py-1">-{discount}% OFF</div>
          )}
          {product.badge && (
            <div className={`absolute top-4 right-4 z-10 text-sm px-3 py-1 ${
              { "Best Seller": "badge-gold", Premium: "badge-premium", New: "badge-new", Limited: "badge-limited", Sale: "badge-sale" }[product.badge] || "badge-gold"
            }`}>{product.badge}</div>
          )}
          <ImageLightbox images={product.images} alt={product.name} />
        </div>

        {/* Product info */}
        <div className="space-y-5">
          <div>
            <p className="text-brand-gold text-xs font-bold uppercase tracking-widest">{product.category}</p>
            <h1 className="font-serif text-3xl font-bold text-brand-brown mt-1">{product.name}</h1>
            {/* Rating row */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={16} className={s <= Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />
                ))}
              </div>
              <span className="text-sm font-semibold text-brand-brown">{avgRating}</span>
              <a href="#reviews" className="text-sm text-blue-500 hover:underline">{DUMMY_REVIEWS.length} reviews</a>
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Flame size={10} /> Popular</span>
              <span className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle size={13} /> In Stock</span>
            </div>
            <p className="text-xs text-orange-500 font-medium mt-2 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              <SlotCounter value={viewerCount} /> people viewing now
            </p>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 py-3 border-y border-gray-100" style={{ perspective: 400 }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={selectedVariant.id}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="font-serif font-semibold text-3xl text-brand-brown inline-block"
                style={{ transformOrigin: "center" }}
              >
                {formatPrice(selectedVariant.price)}
              </motion.span>
            </AnimatePresence>
            {selectedVariant.originalPrice > selectedVariant.price && (
              <>
                <span className="text-lg text-gray-400 line-through font-sans">{formatPrice(selectedVariant.originalPrice)}</span>
                <span className="text-sm font-bold text-green-600">{discount}% OFF</span>
              </>
            )}
          </div>

          {/* Variants */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[2.5px] text-brand-brown mb-3">Size / Weight — <span className="font-normal normal-case text-gray-400">larger packs save more</span></p>
            <div className="flex gap-2 flex-wrap">
              {(() => {
                const best = product.variants.reduce((min, v) => {
                  const pp = per100g(v.price, v.weight);
                  return pp != null && (min == null || pp < min) ? pp : min;
                }, null);
                return product.variants.map((v, i) => {
                  const pp = per100g(v.price, v.weight);
                  const isBest = pp != null && pp === best && product.variants.length > 1;
                  return (
                    <button
                      key={v.id || `${product.id}-${i}`}
                      onClick={() => setSelectedVariant(v)}
                      className={`relative px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${selectedVariant.id === v.id ? "border-brand-gold bg-brand-cream text-brand-brown font-bold" : "border-gray-200 text-gray-600 hover:border-brand-gold"}`}
                    >
                      {isBest && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-brand-gold text-white whitespace-nowrap">
                          Best Value
                        </span>
                      )}
                      <div className="font-serif">{v.weight}</div>
                      <div className="text-xs text-gray-500 font-sans">{formatPrice(v.price)}</div>
                      {pp != null && <div className="text-[10px] text-gray-400 font-sans">₹{pp}/100g</div>}
                    </button>
                  );
                });
              })()}
            </div>
            {selectedVariant.perDay && (
              <p className="text-[11px] text-gray-400 italic mt-2.5 font-serif">{selectedVariant.perDay}</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <p className="text-sm font-semibold text-brand-brown mb-2">Quantity</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-brand-cream transition-colors">
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center font-semibold text-brand-brown">{qty}</span>
                <button onClick={() => setQty(Math.min(selectedVariant.stock, qty + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-brand-cream transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              {selectedVariant.stock <= 10 && selectedVariant.stock > 0 && (
                <p className="font-serif text-xs text-gray-400 italic leading-snug max-w-xs">
                  Due to our strict artisan sorting criteria, fewer than {selectedVariant.stock} packs remain of this batch.
                </p>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div ref={buyRef} className="flex gap-3 flex-wrap">
            {selectedVariant.stock > 0 ? (
              <>
                <MagneticButton className="flex-1" strength={0.25} onClick={handleAddToCart}>
                  <span className="btn-brown flex items-center justify-center gap-2 py-3.5 w-full">
                    <ShoppingCart size={18} /> Add to Cart
                  </span>
                </MagneticButton>
                <button onClick={handleBuyNow} className="flex-1 btn-primary flex items-center justify-center gap-2 py-3.5">
                  <Zap size={18} /> Buy Now
                </button>
              </>
            ) : (
              <button onClick={handleNotifyMe} disabled={notifying || notified} className="flex-1 btn-brown flex items-center justify-center gap-2 py-3.5">
                {notified ? "We'll notify you" : notifying ? "Saving..." : "Notify Me When Available"}
              </button>
            )}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`w-12 h-12 border-2 rounded-xl flex items-center justify-center transition-all ${wishlisted ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-brand-gold"}`}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart size={20} className={wishlisted ? "fill-red-500 text-red-500" : "text-gray-400"} />
            </button>
            <a
              href={whatsappProductLink(product.name)}
              target="_blank" rel="noreferrer"
              className="w-12 h-12 border-2 border-green-400 bg-green-50 rounded-xl flex items-center justify-center hover:bg-green-100 transition-colors"
              title="Enquire on WhatsApp"
            >
              <MessageCircle size={20} className="text-green-600" />
            </a>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 py-4 border-t border-gray-100">
            {[
              { icon: <Truck size={18} />, text: "Free shipping ₹499+" },
              { icon: <Shield size={18} />, text: "100% Authentic" },
              { icon: <Share2 size={18} />, text: "Easy Returns" },
            ].map((b) => (
              <div key={b.text} className="flex flex-col items-center gap-1.5 text-center">
                <div className="text-brand-gold">{b.icon}</div>
                <span className="text-xs text-gray-500">{b.text}</span>
              </div>
            ))}
          </div>

          {/* Delivery estimate by pincode */}
          <div className="mt-4">
            <PincodeEstimator />
          </div>
        </div>
      </motion.div>

      {/* Tabs: Description / Nutrition / Reviews */}
      <div className="mb-16">
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {["description", "nutrition", "reviews", "passport"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px whitespace-nowrap ${activeTab === tab ? "border-brand-gold text-brand-gold" : "border-transparent text-gray-500 hover:text-brand-brown"}`}
            >
              {tab === "passport" ? "Provenance Passport" : tab}
              {tab === "reviews" ? ` (${DUMMY_REVIEWS.length})` : ""}
            </button>
          ))}
        </div>

        {activeTab === "description" && (
          <div className="max-w-3xl">
            <p className="text-gray-600 leading-relaxed mb-4">{product.description}</p>
            <ul className="space-y-2 mt-4">
              {[
                "Zero mineral-oil coating — 100% natural surface",
                "Zero artificial preservatives, colours, or sulphites",
                "Hand-sorted for kernel integrity before dispatch",
                "Moisture content verified below 5% per batch",
                "Vacuum-sealed in food-grade nitrogen-flushed pouches",
                "FSSAI certified — batch test record available on request",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <span className="w-1 h-1 rounded-full bg-brand-gold mt-2 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "nutrition" && (
          <div className="max-w-md">
            <p className="text-sm text-gray-500 mb-4">Approximate nutritional values per 100g</p>
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-brand-cream">
                <tr><th className="text-left px-4 py-2 text-brand-brown">Nutrient</th><th className="text-right px-4 py-2 text-brand-brown">Per 100g</th></tr>
              </thead>
              <tbody>
                {[["Energy", "579 kcal"], ["Protein", "21.2g"], ["Carbohydrates", "21.7g"], ["Fat", "49.9g"], ["Fiber", "12.5g"], ["Calcium", "264mg"], ["Iron", "3.7mg"]].map(([n, v]) => (
                  <tr key={n} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-600">{n}</td>
                    <td className="px-4 py-2 text-right font-medium text-brand-brown">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "reviews" && (
          <div id="reviews" className="max-w-3xl">
            {/* Summary */}
            <div className="flex items-center gap-6 mb-8 p-4 bg-brand-cream rounded-2xl">
              <div className="text-center">
                <p className="font-serif text-5xl font-bold text-brand-brown">{avgRating}</p>
                <div className="flex gap-0.5 justify-center my-1">
                  {[1,2,3,4,5].map((s) => <Star key={s} size={14} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-xs text-gray-500">{DUMMY_REVIEWS.length} reviews</p>
              </div>
              <div className="flex-1">
                {[5,4,3,2,1].map((s) => {
                  const count = DUMMY_REVIEWS.filter((r) => r.rating === s).length;
                  return (
                    <div key={s} className="flex items-center gap-2 mb-1">
                      <span className="text-xs w-4 text-gray-500">{s}</span>
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="bg-amber-400 h-2 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(count / DUMMY_REVIEWS.length) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, delay: (5 - s) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-4">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Reviews list */}
            <div className="space-y-5">
              {/* Local (just-submitted) reviews first */}
              {localReviews.map((r) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="p-5 border-2 border-brand-gold/30 rounded-xl bg-brand-cream/30">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex gap-0.5 mb-1">
                        {[1,2,3,4,5].map((s) => <Star key={s} size={13} className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />)}
                      </div>
                      <p className="font-semibold text-brand-brown text-sm">{r.title}</p>
                    </div>
                    <span className="text-xs text-gray-400">Just now</span>
                  </div>
                  <p className="text-gray-600 text-sm">{r.body}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs font-semibold text-gray-600">{r.user}</span>
                    <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <BadgeCheck size={10} /> Verified Purchase
                    </span>
                  </div>
                </motion.div>
              ))}
              {DUMMY_REVIEWS.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="p-5 border border-gray-100 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex gap-0.5 mb-1">
                        {[1,2,3,4,5].map((s) => <Star key={s} size={13} className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />)}
                      </div>
                      <p className="font-semibold text-brand-brown text-sm">{r.title}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-3">{relativeDate(r.date)}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{r.body}</p>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="text-xs font-semibold text-gray-600">{r.user}</span>
                    <span className="text-xs text-gray-400">{r.city}</span>
                    {r.verified && (
                      <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <BadgeCheck size={10} /> Verified via Razorpay
                      </span>
                    )}
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{r.variant}</span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className="ml-auto text-xs text-gray-400 hover:text-brand-gold transition-colors flex items-center gap-1"
                      onClick={() => setHelpfulVotes(v => ({ ...v, [r.id]: !v[r.id] }))}>
                      <ThumbsUp size={11} className={helpfulVotes[r.id] ? "fill-brand-gold text-brand-gold" : ""} /> Helpful ({(helpfulVotes[r.id] ? 1 : 0) + r.helpful})
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Provenance & Batch Passport ── */}
        {activeTab === "passport" && (
          <div className="max-w-3xl">
            {product.passport ? (
              <>
                {/* Header */}
                <div className="mb-8">
                  <p className="text-[10px] font-bold uppercase tracking-[4px] text-brand-gold mb-2 flex items-center gap-2">
                    <span className="w-6 h-px bg-brand-gold/50 inline-block" />
                    Single-Origin Transparency
                  </p>
                  <h3 className="font-serif text-2xl text-brand-brown font-normal">Provenance &amp; Batch Passport</h3>
                  <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                    Every batch we dispatch carries a full chain-of-custody record. The data below is exact — no marketing language.
                    Rooted in our 25-year physical retail legacy at <span className="font-medium text-brand-brown">41 Barah Ji Ki Gali, Gangauri Bazar, Jaipur</span>.
                  </p>
                </div>

                {/* Passport Grid */}
                <div className="rounded-2xl overflow-hidden border border-gray-100">
                  {[
                    { label: "Orchard / Sourcing Coordinates", value: product.passport.origin, icon: "📍" },
                    { label: "Harvest Month", value: product.passport.harvestMonth, icon: "🌾" },
                    { label: "Moisture Threshold", value: product.passport.moisture, icon: "💧" },
                    { label: "Hand-Grading & Batch Standard", value: product.passport.grading, icon: "✋" },
                    { label: "Storage Protocol", value: product.passport.storage, icon: "❄️" },
                    { label: "Certifications", value: product.passport.certifications, icon: "🏛️" },
                    { label: "Batch Reference", value: product.passport.batchRef, icon: "🔖" },
                    { label: "Dispatch Protocol", value: product.passport.dispatchProtocol, icon: "📦" },
                  ].map((row, i) => (
                    <div key={row.label} className={`grid grid-cols-5 gap-0 ${i % 2 === 0 ? "bg-white" : "bg-brand-cream/40"} border-b border-gray-100 last:border-0`}>
                      <div className="col-span-2 px-5 py-4 flex items-start gap-2.5">
                        <span className="text-base flex-shrink-0 mt-0.5">{row.icon}</span>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 leading-snug mt-0.5">{row.label}</p>
                      </div>
                      <div className="col-span-3 px-5 py-4 border-l border-gray-100">
                        <p className="text-sm text-brand-brown leading-relaxed">{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Heritage anchor */}
                <div className="mt-6 p-5 rounded-xl flex gap-4 items-start"
                  style={{ background: "linear-gradient(135deg, #F4F0E8, #EDE8DC)", border: "1px solid rgba(201,168,76,0.18)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)" }}>
                    <span className="text-lg">🏛️</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-1">25-Year Physical Legacy</p>
                    <p className="text-sm text-brand-brown font-medium">Gangauri Bazar, Jaipur — since 1999</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      One of Rajasthan's oldest trading districts. Our physical store at 41, Barah Ji Ki Gali has been
                      inspected, licensed, and continuously operated since 1999. Not a digital-only brand — a provenance-backed family institution.
                    </p>
                  </div>
                </div>

                {/* Batch record request */}
                <p className="text-xs text-gray-400 mt-4 text-center">
                  Full lab test certificate for Batch <span className="font-mono font-semibold text-brand-brown">{product.passport.batchRef}</span> available on request —
                  <a href="https://wa.me/917568577968?text=Please share the lab test certificate for batch: {product.passport.batchRef}" target="_blank" rel="noreferrer" className="text-brand-gold font-semibold ml-1 underline">WhatsApp us</a>
                </p>
              </>
            ) : (
              <p className="text-gray-400 text-sm italic">Provenance passport not available for this product. Contact us for sourcing details.</p>
            )}
          </div>
        )}
      </div>

      {/* ═══ WHY JAI SHREE IS THE BEST ═══════════════════════════ */}
      <div className="mb-16 rounded-3xl overflow-hidden" style={{ background: "linear-gradient(160deg, #0D1B35 0%, #1A2744 100%)" }}>
        <div className="px-6 py-8 md:px-10">
          <div className="text-center mb-8">
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3"
              style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", color: "#E8C97A" }}>
              Why We're Different
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mt-2">
              Why Jai Shree {product.category} Wins Every Time
            </h2>
            <p className="text-white/50 text-sm mt-2">Honest comparison — see what makes us #1</p>
          </div>

          {/* Visual comparison table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-white/50 font-medium text-xs uppercase tracking-wide w-1/4">What We Compare</th>
                  <th className="py-3 px-4 text-center rounded-t-xl" style={{ background: "rgba(201,168,76,0.12)", borderBottom: "2px solid #C9A84C" }}>
                    <div className="flex flex-col items-center gap-1">
                      <img src="/logo.png" className="h-8 w-auto" alt="Jai Shree" />
                      <span className="text-brand-gold font-bold text-xs">JAI SHREE</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center text-white/60 font-medium">Local Market</th>
                  <th className="py-3 px-4 text-center text-white/60 font-medium">Supermarket</th>
                  <th className="py-3 px-4 text-center text-white/60 font-medium hidden md:table-cell">Other Online</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Sourcing", us: "Direct from Kashmir / California", them: ["Unknown origin", "Imported bulk", "Third-party supplier"] },
                  { label: "Freshness", us: "Packed within 48h of processing", them: ["Months old stock", "Weeks in warehouse", "Variable freshness"] },
                  { label: "Quality Grade", us: "Premium A-grade, hand-sorted", them: ["Mixed grades", "B/C grade", "Not disclosed"] },
                  { label: "Preservatives", us: "Zero additives, 100% natural", them: ["Sulphites added", "Mineral oil coating", "May contain additives"] },
                  { label: "Packaging", us: "Vacuum sealed, resealable zip", them: ["Open trays", "Basic plastic bag", "Standard pouch"] },
                  { label: "Certification", us: "FSSAI + Lab tested every batch", them: ["No certification", "FSSAI only", "Varies"] },
                  { label: "Price/Value", us: "Best price for premium grade", them: ["Cheap but low quality", "High margin, avg quality", "Similar or higher price"] },
                ].map((row, i) => (
                  <tr key={row.label} className="border-t border-white/8" style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                    <td className="py-3.5 px-4 text-white/60 text-xs font-semibold uppercase tracking-wide">{row.label}</td>
                    <td className="py-3.5 px-4 text-center rounded" style={{ background: "rgba(201,168,76,0.06)" }}>
                      <div className="flex flex-col items-center gap-1">
                        <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                        <span className="text-white text-xs font-medium leading-tight">{row.us}</span>
                      </div>
                    </td>
                    {row.them.map((t, j) => (
                      <td key={j} className={`py-3.5 px-4 text-center ${j === 2 ? "hidden md:table-cell" : ""}`}>
                        <div className="flex flex-col items-center gap-1">
                          <XCircle size={14} className="text-red-400/70 flex-shrink-0" />
                          <span className="text-white/40 text-xs leading-tight">{t}</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Key differentiators — visual cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { icon: <Leaf size={20} />, stat: "0%", label: "Preservatives", sub: "100% natural always" },
              { icon: <Award size={20} />, stat: "A+", label: "Quality Grade", sub: "Hand sorted, premium only" },
              { icon: <Package size={20} />, stat: "48h", label: "Packed Fresh", sub: "Farm to door speed" },
              { icon: <Shield size={20} />, stat: "100%", label: "FSSAI Certified", sub: "Every batch tested" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl p-4 text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.15)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-brand-gold mx-auto mb-2"
                  style={{ background: "rgba(201,168,76,0.12)" }}>
                  {item.icon}
                </div>
                <p className="font-bold text-2xl text-brand-gold">{item.stat}</p>
                <p className="text-white text-xs font-semibold mt-0.5">{item.label}</p>
                <p className="text-white/40 text-[10px] mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CORPORATE GIFTING CONCIERGE ═══════════════════════ */}
      <div className="mb-16 rounded-3xl overflow-hidden" style={{ background: "linear-gradient(160deg, #0D1B35 0%, #1A2744 100%)", border: "1px solid rgba(201,168,76,0.12)" }}>
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left: Copy */}
          <div className="px-8 py-10 md:px-12 md:py-14 border-b md:border-b-0 md:border-r border-white/8">
            <p className="text-[10px] font-bold uppercase tracking-[4px] text-brand-gold mb-6">Corporate & Wedding Gifting</p>
            <h2 className="font-serif text-3xl font-normal text-white leading-tight mb-5">
              The Concierge<br />
              <em style={{ color: "#E8C97A" }}>Gifting Programme</em>
            </h2>
            <p className="text-white/50 text-sm leading-relaxed mb-7">
              For organisations, wedding planners, and procurement teams seeking premium branded gift boxes at scale. Minimum 50 units. Full customisation available — logo, message card, custom weight assortments.
            </p>
            <div className="space-y-2.5 mb-8">
              {[
                "Custom packaging with your logo or occasion message",
                "Budget brackets from ₹500 to ₹5,000+ per box",
                "Pan-India bulk delivery coordinated from Jaipur",
                "Personalised catalogue and invoice within 2 hours",
                "Dedicated account manager for repeat clients",
              ].map(item => (
                <div key={item} className="flex items-start gap-3 text-sm text-white/60">
                  <span className="w-1 h-1 rounded-full bg-brand-gold flex-shrink-0 mt-2" />
                  {item}
                </div>
              ))}
            </div>
            {!showB2BForm && (
              <button
                onClick={() => setShowB2BForm(true)}
                className="btn-gold px-8 py-3.5 text-[10px] tracking-[3px]"
              >
                Request Corporate Catalogue
              </button>
            )}
          </div>
          {/* Right: Form */}
          <div className="px-8 py-10 md:px-10 md:py-14">
            {showB2BForm ? (
              <B2BGiftingForm theme="dark" onClose={() => setShowB2BForm(false)} />
            ) : (
              <div className="grid grid-cols-2 gap-4 h-full content-center">
                {[
                  { num: "50+", label: "Min units" },
                  { num: "₹500–₹5K", label: "Per box range" },
                  { num: "2 hrs", label: "Response time" },
                  { num: "100+", label: "Corporates served" },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.12)" }}>
                    <p className="font-serif text-2xl font-semibold text-brand-gold">{s.num}</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div>
          <h2 className="section-title text-left mb-2">You May Also Like</h2>
          <div className="w-12 h-1 bg-brand-gold rounded-full mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="mt-12">
          <h2 className="section-title text-left mb-2">Recently Viewed</h2>
          <div className="w-12 h-1 bg-brand-gold rounded-full mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {recentlyViewed.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Sheet ── */}
      <MobileCartSheet product={product} open={mobileSheetOpen} onClose={() => setMobileSheetOpen(false)} />

      {/* ═══ STICKY ADD TO CART BAR ═══════════════════════════════ */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${stickyVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}
        style={{ background: "linear-gradient(135deg, #0D1B35, #1A2744)", borderTop: "1px solid rgba(201,168,76,0.2)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 hidden sm:block" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{product.name}</p>
            <p className="text-brand-gold text-sm font-bold">{formatPrice(selectedVariant.price)} <span className="text-white/40 text-xs font-normal">/ {selectedVariant.weight}</span></p>
          </div>
          {/* On mobile: open bottom sheet. On desktop: add directly */}
          <button
            onClick={() => window.innerWidth < 768 ? setMobileSheetOpen(true) : handleAddToCart()}
            className="flex items-center gap-2 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all hover:scale-105 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #2C4B8C, #1A2744)", border: "1px solid rgba(201,168,76,0.3)", boxShadow: "0 4px 16px rgba(26,39,68,0.5)" }}>
            <ShoppingCart size={16} /> Add to Cart
          </button>
          <button onClick={handleBuyNow}
            className="flex items-center gap-2 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all hover:scale-105 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #C9A84C, #9E7A2E)", boxShadow: "0 4px 16px rgba(201,168,76,0.3)" }}>
            <Zap size={16} /> Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
