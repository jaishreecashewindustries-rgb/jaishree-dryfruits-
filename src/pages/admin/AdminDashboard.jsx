import React, { useEffect, useState } from "react";
import { Package, Building2, Layers, ChevronDown, RefreshCw, Save } from "lucide-react";
import { collection, getDocs, doc, updateDoc, query, orderBy, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { formatPrice, formatDate, getStatusStyle, ORDER_STATUSES } from "../../utils/helpers";
import { useProducts } from "../../context/ProductsContext";
import toast from "react-hot-toast";

const VIEWS = [
  { id: "pipeline",  label: "Order Pipeline",      icon: Package },
  { id: "gst",       label: "Corporate / GST Queue", icon: Building2 },
  { id: "batch",     label: "Batch Controller",    icon: Layers },
];

const STATUS_FLOW = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function AdminDashboard() {
  const { products: DEMO_PRODUCTS } = useProducts();
  const [view, setView] = useState("pipeline");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  // Batch controller state
  const [batchProduct, setBatchProduct] = useState(DEMO_PRODUCTS[0]?.id || "");
  const [batchFields, setBatchFields] = useState({ batchId: "", moisture: "", farm: "", harvestMonth: "" });
  const [batchSaving, setBatchSaving] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId, newStatus) {
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Status → ${newStatus}`);
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  async function saveBatch() {
    if (!batchFields.batchId.trim()) { toast.error("Batch ID is required"); return; }
    setBatchSaving(true);
    try {
      await setDoc(doc(db, "product_batches", batchProduct), {
        productId: batchProduct,
        batchId: batchFields.batchId.trim(),
        moisture: batchFields.moisture.trim(),
        sourcingFarm: batchFields.farm.trim(),
        harvestMonth: batchFields.harvestMonth.trim(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast.success("Batch data published to Firestore");
      setBatchFields({ batchId: "", moisture: "", farm: "", harvestMonth: "" });
    } catch {
      toast.error("Save failed");
    } finally {
      setBatchSaving(false);
    }
  }

  const displayedOrders = filterStatus === "all"
    ? orders
    : orders.filter(o => o.status === filterStatus);

  const gstOrders = orders.filter(o => o.gstin);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    gst: gstOrders.length,
    revenue: orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-brown">Admin Control Centre</h1>
          <p className="text-gray-400 text-sm">Jai Shree Dry Fruits — Operations Dashboard</p>
        </div>
        <button onClick={loadOrders} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-brown transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders",    val: stats.total },
          { label: "Pending",         val: stats.pending },
          { label: "GST Orders",      val: stats.gst },
          { label: "Net Revenue",     val: formatPrice(stats.revenue) },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-serif text-2xl font-bold text-brand-brown">{s.val}</p>
          </div>
        ))}
      </div>

      {/* View switcher */}
      <div className="flex gap-1 border-b border-gray-100">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              view === id
                ? "border-brand-brown text-brand-brown"
                : "border-transparent text-gray-400 hover:text-brand-brown"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── ORDER PIPELINE ── */}
      {view === "pipeline" && (
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {["all", ...STATUS_FLOW].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1.5 font-medium transition-all capitalize ${
                  filterStatus === s
                    ? "bg-brand-brown text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {s === "all" ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 animate-pulse" />)}
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No orders in this category</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrders.map(order => (
                    <tr key={order.id}>
                      <td className="font-mono text-xs font-bold text-brand-brown">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td>
                        <p className="text-sm font-medium">{order.customerName || "Guest"}</p>
                        <p className="text-xs text-gray-400">{order.customerPhone || ""}</p>
                      </td>
                      <td>
                        <p className="text-sm">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[120px]">
                          {order.items?.map(i => i.name).join(", ")}
                        </p>
                      </td>
                      <td className="font-bold text-brand-brown">{formatPrice(order.total)}</td>
                      <td className="text-xs text-gray-400">{formatDate(order.createdAt)}</td>
                      <td>
                        <span className={`text-xs font-semibold px-2 py-1 ${getStatusStyle(order.status)}`}>
                          {ORDER_STATUSES.find(s => s.value === order.status)?.label || order.status}
                        </span>
                      </td>
                      <td>
                        <div className="relative">
                          <select
                            value={order.status}
                            onChange={e => updateStatus(order.id, e.target.value)}
                            disabled={updatingId === order.id}
                            className="text-xs border border-gray-200 px-2 py-1.5 pr-6 appearance-none bg-white cursor-pointer disabled:opacity-50"
                          >
                            {STATUS_FLOW.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CORPORATE / GST QUEUE ── */}
      {view === "gst" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{gstOrders.length} orders with GSTIN attached</p>
          {gstOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Building2 size={36} className="mx-auto mb-3 text-gray-200" />
              No GST orders yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Company</th>
                    <th>GSTIN</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {gstOrders.map(order => (
                    <tr key={order.id}>
                      <td className="font-mono text-xs font-bold text-brand-brown">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="font-medium text-sm">{order.gstinCompany || "—"}</td>
                      <td className="font-mono text-xs text-brand-brown tracking-wider">{order.gstin}</td>
                      <td className="text-sm">{order.customerName}</td>
                      <td className="font-bold text-brand-brown">{formatPrice(order.total)}</td>
                      <td className="text-xs text-gray-400">{formatDate(order.createdAt)}</td>
                      <td>
                        <span className={`text-xs font-semibold px-2 py-1 ${getStatusStyle(order.status)}`}>
                          {ORDER_STATUSES.find(s => s.value === order.status)?.label || order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── BATCH CONTROLLER ── */}
      {view === "batch" && (
        <div className="max-w-lg space-y-5">
          <p className="text-sm text-gray-500">
            Publish live batch provenance data to Firestore — surfaced in the Provenance Passport tab on each product page.
          </p>

          {/* Product selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">Product</label>
            <div className="relative">
              <select
                value={batchProduct}
                onChange={e => setBatchProduct(e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 text-sm appearance-none bg-white pr-8"
              >
                {DEMO_PRODUCTS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Batch fields */}
          {[
            { key: "batchId",      label: "Batch Reference ID",    placeholder: "JSF-ALM-OCT24-V2" },
            { key: "moisture",     label: "Moisture Level",         placeholder: "< 4.5% — AOAC 925.10" },
            { key: "farm",         label: "Sourcing Farm / Region", placeholder: "San Joaquin Valley, California" },
            { key: "harvestMonth", label: "Harvest Month",          placeholder: "October 2024" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={batchFields[key]}
                onChange={e => setBatchFields(p => ({ ...p, [key]: e.target.value }))}
                className="gstin-input w-full"
              />
            </div>
          ))}

          <button
            onClick={saveBatch}
            disabled={batchSaving}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {batchSaving
              ? <><RefreshCw size={14} className="animate-spin" /> Publishing...</>
              : <><Save size={14} /> Publish Batch Data</>
            }
          </button>
          <p className="text-xs text-gray-400 text-center">
            Data is written to <code className="bg-gray-100 px-1 py-0.5">product_batches/{batchProduct}</code> in Firestore
          </p>
        </div>
      )}
    </div>
  );
}
