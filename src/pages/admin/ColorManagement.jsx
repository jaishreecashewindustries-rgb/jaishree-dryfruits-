import React, { useState } from "react";
import { Plus, X, Edit2, Save, Package } from "lucide-react";
import toast from "react-hot-toast";

const DEFAULT_COLORS = [
  { id: "c1", name: "Brand Gold", hex: "#C9A84C", usage: "Primary CTA, badges, accents" },
  { id: "c2", name: "Brand Brown", hex: "#3E2723", usage: "Navigation, headings, footer" },
  { id: "c3", name: "Cream Background", hex: "#FBF5E6", usage: "Section backgrounds, cards" },
  { id: "c4", name: "Success Green", hex: "#10B981", usage: "In-stock badge, success messages" },
  { id: "c5", name: "Sale Red", hex: "#EF4444", usage: "Sale badge, low stock warnings" },
  { id: "c6", name: "New Badge", hex: "#22C55E", usage: "New product badge" },
];

const DEFAULT_TAGS = [
  { id: "t1", label: "Best Seller", color: "#C9A84C", bgColor: "#FEF3C7" },
  { id: "t2", label: "New", color: "#16A34A", bgColor: "#DCFCE7" },
  { id: "t3", label: "Premium", color: "#7C3AED", bgColor: "#F3E8FF" },
  { id: "t4", label: "Limited", color: "#DC2626", bgColor: "#FEE2E2" },
  { id: "t5", label: "Sale", color: "#EA580C", bgColor: "#FFEDD5" },
  { id: "t6", label: "Organic", color: "#15803D", bgColor: "#DCFCE7" },
];

export default function ColorManagement() {
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [newTag, setNewTag] = useState({ label: "", color: "#000000", bgColor: "#FFFFFF" });
  const [editingColor, setEditingColor] = useState(null);

  const addTag = () => {
    if (!newTag.label.trim()) { toast.error("Enter tag label"); return; }
    setTags([...tags, { id: `t${Date.now()}`, ...newTag }]);
    setNewTag({ label: "", color: "#000000", bgColor: "#FFFFFF" });
    toast.success("Tag added!");
  };

  const removeTag = (id) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    toast.success("Tag removed");
  };

  const updateColor = (id, hex) => {
    setColors((prev) => prev.map((c) => c.id === id ? { ...c, hex } : c));
  };

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl font-bold text-brand-brown">Color & Tag Management</h1>

      {/* Brand Colors */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-brand-brown mb-5">Brand Color Palette</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {colors.map((c) => (
            <div key={c.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-brand-gold/30 transition-all">
              <div className="relative group">
                <div className="w-14 h-14 rounded-xl shadow-sm border border-gray-200 cursor-pointer" style={{ background: c.hex }} />
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => updateColor(c.id, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-brand-brown text-sm">{c.name}</p>
                <p className="font-mono text-xs text-gray-400 mt-0.5">{c.hex}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.usage}</p>
              </div>
              <button onClick={() => toast.success(`Copied ${c.hex}`)} className="text-xs text-brand-gold hover:underline px-2 py-1">
                Copy
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => toast.success("Colors saved to theme!")} className="btn-primary mt-5 flex items-center gap-2">
          <Save size={16} /> Save Brand Colors
        </button>
      </div>

      {/* Product Badges / Tags */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-brand-brown mb-2">Product Badges & Tags</h2>
        <p className="text-xs text-gray-400 mb-5">These tags appear on product cards to highlight special attributes</p>

        {/* Existing tags */}
        <div className="flex flex-wrap gap-3 mb-6">
          {tags.map((t) => (
            <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ borderColor: t.color, backgroundColor: t.bgColor }}>
              <span className="text-xs font-bold" style={{ color: t.color }}>{t.label}</span>
              <div className="w-4 h-4 rounded-full" style={{ background: t.color }} />
              <button onClick={() => removeTag(t.id)} className="text-gray-400 hover:text-red-500 ml-1">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Add new tag */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Add New Tag</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tag Label</label>
              <input
                value={newTag.label}
                onChange={(e) => setNewTag({ ...newTag, label: e.target.value })}
                placeholder="e.g. Seasonal"
                className="input-field w-36"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Text Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={newTag.color} onChange={(e) => setNewTag({ ...newTag, color: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                <span className="text-xs font-mono text-gray-400">{newTag.color}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Background Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={newTag.bgColor} onChange={(e) => setNewTag({ ...newTag, bgColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                <span className="text-xs font-mono text-gray-400">{newTag.bgColor}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Preview</label>
              <div className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ color: newTag.color, backgroundColor: newTag.bgColor, border: `1px solid ${newTag.color}` }}>
                {newTag.label || "Preview"}
              </div>
            </div>
            <button onClick={addTag} className="btn-primary py-2.5 px-4 flex items-center gap-1 text-sm">
              <Plus size={15} /> Add Tag
            </button>
          </div>
        </div>
      </div>

      {/* Theme preview */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-brand-brown mb-4">Live Theme Preview</h2>
        <div className="rounded-2xl overflow-hidden border border-gray-200">
          <div className="bg-brand-brown text-white px-5 py-3 flex items-center justify-between">
            <span className="font-serif font-bold text-brand-gold">JAI SHREE DRYFRUITS</span>
            <div className="flex gap-4 text-sm text-white/70">
              <span>Shop</span><span>About</span><span>Contact</span>
            </div>
          </div>
          <div className="bg-brand-cream p-5">
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
                  <div className="h-20 bg-brand-cream rounded-lg mb-2 flex items-center justify-center"><Package size={28} className="text-brand-gold/40" /></div>
                  <p className="text-xs font-semibold text-brand-brown">Premium Almonds</p>
                  <p className="text-xs text-brand-gold font-bold mt-1">₹349</p>
                  <div className="mt-2 bg-brand-gold text-white text-xs py-1 rounded-lg text-center font-semibold">Add to Cart</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
