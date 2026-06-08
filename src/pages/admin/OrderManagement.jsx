import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Search, ChevronDown, MessageCircle, Eye, X } from "lucide-react";
import { formatPrice, formatDate, getStatusStyle, ORDER_STATUSES, whatsappOrderLink } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { setOrders([]); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder((o) => ({ ...o, status }));
      toast.success(`Order status updated to ${status}`);
    } catch { toast.error("Failed to update status"); }
  };

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.id.includes(search) || (o.customerName || "").toLowerCase().includes(search.toLowerCase()) || (o.userEmail || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-2xl font-bold text-brand-brown">Order Management</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order ID, customer..." className="input-field pl-9" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field pr-8 appearance-none cursor-pointer">
            <option value="all">All Status</option>
            {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {ORDER_STATUSES.map((s) => {
          const count = orders.filter((o) => o.status === s.value).length;
          return (
            <button key={s.value} onClick={() => setFilterStatus(filterStatus === s.value ? "all" : s.value)}
              className={`p-2 rounded-xl text-center text-xs transition-all ${filterStatus === s.value ? "ring-2 ring-brand-gold" : ""} ${s.color}`}>
              <p className="font-bold text-base">{count}</p>
              <p className="font-medium">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map((i) => <div key={i} className="h-14 skeleton rounded-lg" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Order ID", "Customer", "Items", "Total", "Status", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-brand-brown">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-700 text-sm">{order.customerName || "Guest"}</p>
                      <p className="text-xs text-gray-400">{order.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {order.items?.slice(0, 2).map((item, i) => (
                          <img key={i} src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ))}
                        {(order.items?.length || 0) > 2 && <span className="text-xs text-gray-400">+{order.items.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-brown">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${getStatusStyle(order.status)}`}
                      >
                        {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setSelectedOrder(order)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg">
                          <Eye size={14} />
                        </button>
                        <a
                          href={whatsappOrderLink(`Order #${order.id.slice(0,8).toUpperCase()} — ${formatPrice(order.total)}`)}
                          target="_blank" rel="noreferrer"
                          className="p-1.5 hover:bg-green-50 text-green-500 rounded-lg"
                        >
                          <MessageCircle size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedOrder(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-serif font-bold text-brand-brown">Order #{selectedOrder.id.slice(0,8).toUpperCase()}</h3>
                <button onClick={() => setSelectedOrder(null)}><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-gray-400">Customer</p><p className="font-medium text-brand-brown">{selectedOrder.customerName}</p></div>
                  <div><p className="text-xs text-gray-400">Status</p><span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusStyle(selectedOrder.status)}`}>{selectedOrder.status}</span></div>
                  <div><p className="text-xs text-gray-400">Email</p><p className="font-medium text-sm break-all">{selectedOrder.userEmail}</p></div>
                  <div><p className="text-xs text-gray-400">Phone</p><p className="font-medium">{selectedOrder.address?.phone || "—"}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-400">Address</p><p className="font-medium">{selectedOrder.address?.address}, {selectedOrder.address?.city}, {selectedOrder.address?.state} {selectedOrder.address?.pincode}</p></div>
                  <div><p className="text-xs text-gray-400">Payment</p><p className="font-medium capitalize">{selectedOrder.paymentMethod}</p></div>
                  <div><p className="text-xs text-gray-400">Date</p><p className="font-medium">{formatDate(selectedOrder.createdAt)}</p></div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-400 mb-3">ITEMS</p>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                        <img src={item.image} alt="" className="w-12 h-12 object-cover rounded-lg" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-brand-brown">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.variant} × {item.qty}</p>
                        </div>
                        <p className="font-bold text-brand-gold text-sm">{formatPrice(item.price * item.qty)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-brand-cream rounded-xl p-3 text-sm space-y-1">
                  <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPrice(selectedOrder.subtotal)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{selectedOrder.shipping === 0 ? "FREE" : formatPrice(selectedOrder.shipping)}</span></div>
                  <div className="flex justify-between font-bold text-brand-brown border-t border-gray-200 pt-2 mt-1"><span>Total</span><span>{formatPrice(selectedOrder.total)}</span></div>
                </div>
                <div className="flex gap-3">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                    className="input-field flex-1 text-sm"
                  >
                    {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <a
                    href={whatsappOrderLink(`Order #${selectedOrder.id.slice(0,8).toUpperCase()}`)}
                    target="_blank" rel="noreferrer"
                    className="bg-green-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
