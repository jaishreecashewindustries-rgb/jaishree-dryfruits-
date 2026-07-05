import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Boxes, Search, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import { formatPrice } from "../../utils/helpers";
import toast from "react-hot-toast";

const LOW_STOCK_THRESHOLD = 10;

export default function StockManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | low | out
  const [saving, setSaving] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      toast.error("Failed to load stock");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Flatten every product+variant into one row for a single balance-stock view.
  const rows = products.flatMap((p) =>
    (p.variants || []).map((v, i) => ({
      productId: p.id,
      productName: p.name,
      category: p.category,
      variantIndex: i,
      variant: v,
    }))
  );

  const filtered = rows.filter((r) => {
    const matchSearch = !search || r.productName?.toLowerCase().includes(search.toLowerCase());
    const stock = Number(r.variant.stock) || 0;
    const matchFilter = filter === "all" || (filter === "low" && stock > 0 && stock <= LOW_STOCK_THRESHOLD) || (filter === "out" && stock <= 0);
    return matchSearch && matchFilter;
  });

  const stats = {
    totalVariants: rows.length,
    lowStock: rows.filter((r) => { const s = Number(r.variant.stock) || 0; return s > 0 && s <= LOW_STOCK_THRESHOLD; }).length,
    outOfStock: rows.filter((r) => (Number(r.variant.stock) || 0) <= 0).length,
    totalUnits: rows.reduce((a, r) => a + (Number(r.variant.stock) || 0), 0),
  };

  const updateStock = async (row, newStock) => {
    const value = Math.max(0, Number(newStock) || 0);
    const key = `${row.productId}-${row.variantIndex}`;
    setSaving(key);
    try {
      const product = products.find((p) => p.id === row.productId);
      const newVariants = product.variants.map((v, i) => (i === row.variantIndex ? { ...v, stock: value } : v));
      await updateDoc(doc(db, "products", row.productId), { variants: newVariants });
      setProducts((prev) => prev.map((p) => (p.id === row.productId ? { ...p, variants: newVariants } : p)));
      toast.success("Stock updated");
    } catch {
      toast.error("Failed to update stock");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-brown flex items-center gap-2">
          <Boxes size={24} className="text-brand-gold" /> Stock Management
        </h1>
        <p className="text-sm text-gray-400">Live balance stock across all products and variants</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Variants", val: stats.totalVariants, color: "bg-blue-500" },
          { label: "Total Units in Stock", val: stats.totalUnits, color: "bg-green-500" },
          { label: "Low Stock (≤10)", val: stats.lowStock, color: "bg-amber-500" },
          { label: "Out of Stock", val: stats.outOfStock, color: "bg-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4 border border-gray-100 rounded-xl">
            <div className={`w-2 h-2 rounded-full ${s.color} mb-2`} />
            <p className="font-bold text-2xl text-brand-brown">{s.val}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product..." className="input-field pl-9" />
        </div>
        <div className="flex gap-2">
          {[["all", "All"], ["low", "Low Stock"], ["out", "Out of Stock"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${filter === val ? "bg-brand-gold text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading stock...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Boxes size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No products match this filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  {["Product", "Category", "Variant", "Price", "Stock", "Status", ""].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const stock = Number(r.variant.stock) || 0;
                  const key = `${r.productId}-${r.variantIndex}`;
                  return (
                    <tr key={key}>
                      <td className="font-medium text-brand-brown">{r.productName}</td>
                      <td className="text-gray-500 text-sm">{r.category}</td>
                      <td className="text-sm">{r.variant.weight}</td>
                      <td className="text-sm">{formatPrice(r.variant.price)}</td>
                      <td>
                        <input
                          type="number"
                          defaultValue={stock}
                          onBlur={(e) => { if (Number(e.target.value) !== stock) updateStock(r, e.target.value); }}
                          disabled={saving === key}
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm"
                        />
                      </td>
                      <td>
                        {stock <= 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 font-semibold bg-red-50 text-red-600"><XCircle size={12} /> Out of Stock</span>
                        ) : stock <= LOW_STOCK_THRESHOLD ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 font-semibold bg-amber-50 text-amber-700"><AlertTriangle size={12} /> Low Stock</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 font-semibold bg-green-50 text-green-700"><CheckCircle2 size={12} /> In Stock</span>
                        )}
                      </td>
                      <td className="text-xs text-gray-400">{saving === key ? "Saving..." : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
