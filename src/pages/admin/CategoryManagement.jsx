import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Plus, Edit2, Trash2, X, Save, Loader2, ArrowUp, ArrowDown, LayoutTemplate } from "lucide-react";
import ImageUpload from "../../components/ImageUpload";
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS_HEADER, useSiteSettings } from "../../context/SiteSettingsContext";
import toast from "react-hot-toast";

const EMPTY_CATEGORY = { name: "", img: "", headerImage: "" };

export default function CategoryManagement() {
  const { refreshCategories } = useSiteSettings() || {};
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [productsHeader, setProductsHeader] = useState(DEFAULT_PRODUCTS_HEADER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState(EMPTY_CATEGORY);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "homepage"));
        if (snap.exists()) {
          const d = snap.data();
          if (d.categories?.length) setCategories(d.categories);
          if (d.productsHeader) setProductsHeader((h) => ({ ...h, ...d.productsHeader }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (next) => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "homepage"), { ...next, updatedAt: serverTimestamp() }, { merge: true });
      return true;
    } catch (e) {
      toast.error("Failed to save — please try again");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => { setForm(EMPTY_CATEGORY); setEditingIndex(null); setShowForm(true); };
  const openEdit = (i) => { setForm(categories[i]); setEditingIndex(i); setShowForm(true); };

  const handleSaveCategory = async () => {
    if (!form.name.trim()) { toast.error("Category name is required"); return; }
    const link = `/products?category=${encodeURIComponent(form.name.trim())}`;
    const entry = { ...form, name: form.name.trim(), link };
    let next;
    if (editingIndex !== null) {
      next = categories.map((c, i) => (i === editingIndex ? entry : c));
    } else {
      if (categories.some((c) => c.name.toLowerCase() === entry.name.toLowerCase())) {
        toast.error("A category with this name already exists");
        return;
      }
      next = [...categories, entry];
    }
    const ok = await persist({ categories: next });
    if (ok) {
      setCategories(next);
      setShowForm(false);
      toast.success(editingIndex !== null ? "Category updated!" : "Category added!");
      refreshCategories?.();
    }
  };

  const handleDelete = async (i) => {
    if (!window.confirm(`Delete "${categories[i].name}"? Products already assigned to it will keep the old category name.`)) return;
    const next = categories.filter((_, idx) => idx !== i);
    const ok = await persist({ categories: next });
    if (ok) { setCategories(next); toast.success("Category deleted"); refreshCategories?.(); }
  };

  const moveCategory = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= categories.length) return;
    const next = [...categories];
    [next[i], next[j]] = [next[j], next[i]];
    setCategories(next);
    await persist({ categories: next });
    refreshCategories?.();
  };

  const handleSaveHeader = async () => {
    const ok = await persist({ productsHeader });
    if (ok) { toast.success("Products page header saved!"); refreshCategories?.(); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <Loader2 size={32} className="animate-spin text-brand-gold" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-brown">Category Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Add, edit, delete categories and manage their photos</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 py-2.5 px-5">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Category list */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["", "Photo", "Category", "Header Banner", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={`${c.name}-${i}`} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => moveCategory(i, -1)} disabled={i === 0} className="p-0.5 text-gray-400 hover:text-brand-gold disabled:opacity-20"><ArrowUp size={13} /></button>
                      <button onClick={() => moveCategory(i, 1)} disabled={i === categories.length - 1} className="p-0.5 text-gray-400 hover:text-brand-gold disabled:opacity-20"><ArrowDown size={13} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.img ? (
                      <img src={c.img} alt="" className="w-12 h-12 object-cover rounded-xl" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 text-[10px]">No photo</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-brand-brown text-sm">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.link}</p>
                  </td>
                  <td className="px-4 py-3">
                    {c.headerImage ? (
                      <img src={c.headerImage} alt="" className="w-16 h-9 object-cover rounded-lg" />
                    ) : (
                      <span className="text-xs text-gray-300">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(i)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(i)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No categories yet — add your first one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Products page header banner */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <LayoutTemplate size={18} className="text-brand-gold" />
          <h2 className="font-serif text-lg font-bold text-brand-brown">All Products Page Header</h2>
        </div>
        <p className="text-xs text-gray-400">
          This banner shows at the top of the "All Products" page (when no specific category is selected).
          Each category above has its own header banner — set it via "Edit" on that category.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Title (optional)</label>
            <input value={productsHeader.title} onChange={(e) => setProductsHeader({ ...productsHeader, title: e.target.value })} className="input-field" placeholder="e.g. Shop Our Premium Range" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Subtitle (optional)</label>
            <input value={productsHeader.subtitle} onChange={(e) => setProductsHeader({ ...productsHeader, subtitle: e.target.value })} className="input-field" placeholder="e.g. Fresh from Kashmir, California & Iran" />
          </div>
        </div>
        <ImageUpload label="Banner Image" value={productsHeader.image} onChange={(url) => setProductsHeader({ ...productsHeader, image: url })} folder="categories/header" />
        <div className="flex justify-end">
          <button onClick={handleSaveHeader} disabled={saving} className="btn-primary flex items-center gap-2 py-2.5 px-5">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving…" : "Save Header"}
          </button>
        </div>
      </div>

      {/* Modal form */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="font-serif text-xl font-bold text-brand-brown">{editingIndex !== null ? "Edit Category" : "Add New Category"}</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-5 overflow-y-auto">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Category Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Almonds" />
                  {form.name && <p className="text-[11px] text-gray-400 mt-1">Link: /products?category={encodeURIComponent(form.name.trim())}</p>}
                </div>
                <ImageUpload label="Category Photo (shown as a tile on the homepage)" value={form.img} onChange={(url) => setForm({ ...form, img: url })} folder="categories" />
                <ImageUpload label="Category Page Header Banner (shown at top of /products when this category is selected)" value={form.headerImage} onChange={(url) => setForm({ ...form, headerImage: url })} folder="categories/header" />
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end flex-shrink-0">
                <button onClick={() => setShowForm(false)} className="btn-outline py-2.5 px-5">Cancel</button>
                <button onClick={handleSaveCategory} disabled={saving} className="btn-primary flex items-center gap-2 py-2.5 px-5">
                  <Save size={16} /> {saving ? "Saving..." : "Save Category"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
