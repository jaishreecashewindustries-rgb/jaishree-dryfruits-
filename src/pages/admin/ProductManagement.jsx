import React, { useState, useEffect } from "react";
import { collection, addDoc, deleteDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Plus, Edit2, Trash2, Search, X, Image, Save } from "lucide-react";
import { DEMO_PRODUCTS, PRODUCT_CATEGORIES, formatPrice } from "../../utils/helpers";
import { useProducts } from "../../context/ProductsContext";
import ImageUpload from "../../components/ImageUpload";
import toast from "react-hot-toast";

const EMPTY_PRODUCT = {
  name: "", category: "", description: "", badge: "",
  images: [""], featured: false, tags: "",
  variants: [{ id: "v1", weight: "250g", price: "", originalPrice: "", stock: "" }],
};

export default function ProductManagement() {
  const { products: liveProducts, loading: liveLoading, refresh: refreshLiveProducts } = useProducts();
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);

  // Keep this page's working list in sync with the shared live catalogue
  // (Firestore products merged with any un-overridden demo products) so
  // products added/edited here actually persist across reloads.
  useEffect(() => {
    if (!liveLoading) setProducts(liveProducts);
  }, [liveProducts, liveLoading]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleField = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFeatured = () => setForm({ ...form, featured: !form.featured });

  const handleVariant = (i, field, value) => {
    const vars = [...form.variants];
    vars[i] = { ...vars[i], [field]: value };
    setForm({ ...form, variants: vars });
  };

  const addVariant = () => setForm({
    ...form,
    variants: [...form.variants, { id: `v${Date.now()}`, weight: "", price: "", originalPrice: "", stock: "" }],
  });

  const removeVariant = (i) => setForm({ ...form, variants: form.variants.filter((_, idx) => idx !== i) });

  const handleImage = (i, value) => {
    const imgs = [...form.images];
    imgs[i] = value;
    setForm({ ...form, images: imgs });
  };

  const addImage = () => setForm({ ...form, images: [...form.images, ""] });
  const removeImage = (i) => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) });
  const moveImage = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= form.images.length) return;
    const imgs = [...form.images];
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    setForm({ ...form, images: imgs });
  };

  const openAdd = () => { setForm(EMPTY_PRODUCT); setEditingId(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({
      ...p,
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : p.tags || "",
      images: p.images?.length ? p.images : [""],
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category) { toast.error("Name and category are required"); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
        // A variant ever saved without an id breaks more than just the React
        // key on the storefront — ProductCard uses variant.id as the cart
        // line-item identifier, so an id-less variant (this happened once,
        // in production) means "add to cart" sends variantId: undefined,
        // silently merging/misidentifying cart lines. Guarantee one here so
        // it can never reach Firestore again regardless of how the form
        // state got into a bad shape.
        variants: form.variants.map((v, i) => ({
          ...v,
          id: v.id || `v${Date.now()}${i}`,
          price: Number(v.price),
          originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
          stock: Number(v.stock),
        })),
        rating: form.rating || 4.5,
        reviewCount: form.reviewCount || 0,
        updatedAt: serverTimestamp(),
      };
      if (editingId) {
        // Works for both real Firestore products and built-in demo products —
        // setDoc-with-merge creates a Firestore override using the same id,
        // so the live catalogue picks it up in place of the static demo entry.
        await setDoc(doc(db, "products", editingId), data, { merge: true });
        setProducts((prev) => prev.map((p) => p.id === editingId ? { ...data, id: editingId } : p));
        toast.success("Product updated!");
      } else {
        const ref = await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
        setProducts((prev) => [...prev, { ...data, id: ref.id }]);
        toast.success("Product added!");
      }
      setShowForm(false);
      refreshLiveProducts();
    } catch (e) {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted");
      refreshLiveProducts();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold text-brand-brown">Product Management</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 py-2.5 px-5">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="input-field pl-9" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Product", "Category", "Variants", "Rating", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]} alt="" className="w-12 h-12 object-cover rounded-xl" />
                      <div>
                        <p className="font-semibold text-brand-brown text-sm">{p.name}</p>
                        {p.badge && <span className="badge-gold text-xs">{p.badge}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.variants?.map((v) => (
                        <span key={v.id} className="text-xs bg-brand-cream text-brand-brown px-2 py-0.5 rounded-lg">
                          {v.weight} — {formatPrice(v.price)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-amber-500 font-semibold text-sm">★ {p.rating}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.featured ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.featured ? "Featured" : "Normal"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal form */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="font-serif text-xl font-bold text-brand-brown">{editingId ? "Edit Product" : "Add New Product"}</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-5 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Product Name *</label>
                    <input name="name" value={form.name} onChange={handleField} className="input-field" placeholder="e.g. Premium California Almonds" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Category *</label>
                    <select name="category" value={form.category} onChange={handleField} className="input-field">
                      <option value="">Select...</option>
                      {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Badge</label>
                    <select name="badge" value={form.badge} onChange={handleField} className="input-field">
                      <option value="">None</option>
                      {["Best Seller", "New", "Premium", "Limited", "Sale"].map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
                    <textarea name="description" value={form.description} onChange={handleField} rows={3} className="input-field resize-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Tags (comma-separated)</label>
                    <input name="tags" value={form.tags} onChange={handleField} className="input-field" placeholder="almond, protein, premium" />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input type="checkbox" id="featured" checked={form.featured} onChange={handleFeatured} className="accent-brand-gold w-4 h-4" />
                    <label htmlFor="featured" className="text-sm text-gray-600 cursor-pointer">Show as Featured Product on Homepage</label>
                  </div>
                </div>

                {/* Images */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Product Images</label>
                    <button type="button" onClick={addImage} className="text-xs text-brand-gold flex items-center gap-1 hover:underline">
                      <Image size={12} /> Add Image Slot
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mb-2">First image is the main product photo. Use the arrows to reorder.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {form.images.map((img, i) => (
                      <div key={`${i}-${img || "empty"}`} className="relative">
                        <ImageUpload
                          value={img}
                          onChange={(url) => handleImage(i, url)}
                          folder="products"
                          compact
                        />
                        {form.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 z-10"
                          >
                            <X size={12} />
                          </button>
                        )}
                        {form.images.length > 1 && (
                          <div className="absolute bottom-1 left-1 flex gap-1 z-10">
                            <button
                              type="button"
                              onClick={() => moveImage(i, -1)}
                              disabled={i === 0}
                              className="bg-white/90 shadow rounded px-1.5 py-0.5 text-xs disabled:opacity-30 hover:bg-white"
                              title="Move left"
                            >
                              ◀
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(i, 1)}
                              disabled={i === form.images.length - 1}
                              className="bg-white/90 shadow rounded px-1.5 py-0.5 text-xs disabled:opacity-30 hover:bg-white"
                              title="Move right"
                            >
                              ▶
                            </button>
                          </div>
                        )}
                        {i === 0 && (
                          <span className="absolute top-1 left-1 bg-brand-gold text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold z-10">MAIN</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variants */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Variants (Size / Price)</label>
                    <button type="button" onClick={addVariant} className="text-xs text-brand-gold flex items-center gap-1 hover:underline">
                      <Plus size={12} /> Add Variant
                    </button>
                  </div>
                  <div className="space-y-3">
                    {form.variants.map((v, i) => (
                      <div key={v.id} className="grid grid-cols-4 gap-2 bg-gray-50 p-3 rounded-xl">
                        <input value={v.weight} onChange={(e) => handleVariant(i, "weight", e.target.value)} className="input-field text-xs py-2" placeholder="Weight (e.g. 250g)" />
                        <input value={v.price} onChange={(e) => handleVariant(i, "price", e.target.value)} className="input-field text-xs py-2" placeholder="Sale Price ₹" type="number" />
                        <input value={v.originalPrice} onChange={(e) => handleVariant(i, "originalPrice", e.target.value)} className="input-field text-xs py-2" placeholder="MRP ₹" type="number" />
                        <div className="flex gap-1">
                          <input value={v.stock} onChange={(e) => handleVariant(i, "stock", e.target.value)} className="input-field text-xs py-2 flex-1" placeholder="Stock" type="number" />
                          {form.variants.length > 1 && (
                            <button type="button" onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600 p-1"><X size={14} /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end flex-shrink-0">
                <button onClick={() => setShowForm(false)} className="btn-outline py-2.5 px-5">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 py-2.5 px-5">
                  <Save size={16} /> {saving ? "Saving..." : "Save Product"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
