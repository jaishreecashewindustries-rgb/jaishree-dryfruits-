import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Heart, ShoppingCart, Zap, Shield, Truck, MessageCircle, ChevronRight, Minus, Plus, Share2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import { DEMO_PRODUCTS, formatPrice, discountPercent, whatsappProductLink } from "../utils/helpers";
import toast from "react-hot-toast";

const DUMMY_REVIEWS = [
  { id: 1, user: "Priya S.", rating: 5, title: "Absolutely fresh!", body: "Best quality almonds I've ever tasted. The packaging is beautiful and delivery was super fast.", date: "12 Jan 2025", verified: true, variant: "500g" },
  { id: 2, user: "Rahul K.", rating: 4, title: "Great product", body: "Very fresh and crunchy. A bit pricey but worth the quality. Would recommend!", date: "5 Jan 2025", verified: true, variant: "250g" },
  { id: 3, user: "Ananya P.", rating: 5, title: "Perfect gifting option!", body: "Bought for Diwali gifting. Everyone loved it. Will order again for sure.", date: "28 Dec 2024", verified: true, variant: "1kg" },
];

export default function ProductDetail() {
  const { id } = useParams();
  const product = DEMO_PRODUCTS.find((p) => p.id === id) || DEMO_PRODUCTS[0];
  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [wishlist, setWishlist] = useState(false);
  const { addToCart } = useCart();
  const related = DEMO_PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
  const discount = selectedVariant?.originalPrice ? discountPercent(selectedVariant.originalPrice, selectedVariant.price) : 0;

  const handleAddToCart = () => {
    addToCart({ id: product.id, variantId: selectedVariant.id, name: product.name, variant: selectedVariant.weight, price: selectedVariant.price, image: product.images[0], qty });
  };

  const handleBuyNow = () => {
    handleAddToCart();
  };

  const avgRating = (DUMMY_REVIEWS.reduce((s, r) => s + r.rating, 0) / DUMMY_REVIEWS.length).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
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

      <div className="grid md:grid-cols-2 gap-10 mb-16">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-brand-cream aspect-square">
            <img
              src={product.images[selectedImg]}
              alt={product.name}
              className="w-full h-full object-cover product-image-zoom"
            />
            {discount >= 5 && (
              <div className="absolute top-4 left-4 badge-sale text-sm px-3 py-1">-{discount}% OFF</div>
            )}
            {product.badge && (
              <div className="absolute top-4 right-4 badge-gold text-sm px-3 py-1">{product.badge}</div>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImg(i)}
                className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImg ? "border-brand-gold" : "border-transparent"}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
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
              <span className="text-sm text-green-600 font-medium">✓ In Stock</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 py-3 border-y border-gray-100">
            <span className="font-bold text-3xl text-brand-brown">{formatPrice(selectedVariant.price)}</span>
            {selectedVariant.originalPrice && (
              <>
                <span className="text-gray-400 text-lg line-through">{formatPrice(selectedVariant.originalPrice)}</span>
                <span className="badge-sale text-sm px-2 py-0.5">Save {discount}%</span>
              </>
            )}
          </div>

          {/* Variants */}
          <div>
            <p className="text-sm font-semibold text-brand-brown mb-2">Size / Weight</p>
            <div className="flex gap-2 flex-wrap">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${selectedVariant.id === v.id ? "border-brand-gold bg-brand-cream text-brand-brown font-bold" : "border-gray-200 text-gray-600 hover:border-brand-gold"}`}
                >
                  <div>{v.weight}</div>
                  <div className="text-xs text-gray-500">{formatPrice(v.price)}</div>
                </button>
              ))}
            </div>
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
              {selectedVariant.stock <= 10 && (
                <span className="text-xs text-red-500 font-medium">Only {selectedVariant.stock} left!</span>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleAddToCart} className="flex-1 btn-brown flex items-center justify-center gap-2 py-3.5">
              <ShoppingCart size={18} /> Add to Cart
            </button>
            <Link to="/checkout" onClick={handleAddToCart} className="flex-1 btn-primary flex items-center justify-center gap-2 py-3.5">
              <Zap size={18} /> Buy Now
            </Link>
            <button
              onClick={() => setWishlist(!wishlist)}
              className={`w-12 h-12 border-2 rounded-xl flex items-center justify-center transition-all ${wishlist ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-brand-gold"}`}
            >
              <Heart size={20} className={wishlist ? "fill-red-500 text-red-500" : "text-gray-400"} />
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
              { icon: <Truck size={18} />, text: "Free shipping ₹999+" },
              { icon: <Shield size={18} />, text: "100% Authentic" },
              { icon: <Share2 size={18} />, text: "Easy Returns" },
            ].map((b) => (
              <div key={b.text} className="flex flex-col items-center gap-1.5 text-center">
                <div className="text-brand-gold">{b.icon}</div>
                <span className="text-xs text-gray-500">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs: Description / Nutrition / Reviews */}
      <div className="mb-16">
        <div className="flex border-b border-gray-200 mb-6">
          {["description", "nutrition", "reviews"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${activeTab === tab ? "border-brand-gold text-brand-gold" : "border-transparent text-gray-500 hover:text-brand-brown"}`}
            >
              {tab} {tab === "reviews" ? `(${DUMMY_REVIEWS.length})` : ""}
            </button>
          ))}
        </div>

        {activeTab === "description" && (
          <div className="max-w-3xl">
            <p className="text-gray-600 leading-relaxed mb-4">{product.description}</p>
            <ul className="space-y-2">
              {["Premium grade quality", "No artificial additives or preservatives", "Rich in protein, fiber, and healthy fats", "Ideal for snacking, cooking, and gifting", "Hygienic sealed packaging"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
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
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${(count / DUMMY_REVIEWS.length) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-4">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Reviews list */}
            <div className="space-y-5">
              {DUMMY_REVIEWS.map((r) => (
                <div key={r.id} className="p-5 border border-gray-100 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex gap-0.5 mb-1">
                        {[1,2,3,4,5].map((s) => <Star key={s} size={13} className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />)}
                      </div>
                      <p className="font-semibold text-brand-brown text-sm">{r.title}</p>
                    </div>
                    <span className="text-xs text-gray-400">{r.date}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{r.body}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs font-semibold text-gray-500">{r.user}</span>
                    {r.verified && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">✓ Verified Purchase</span>}
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{r.variant}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
    </div>
  );
}
