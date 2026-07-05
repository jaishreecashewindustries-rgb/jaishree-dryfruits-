import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Truck, Search, Package, CheckCircle, MapPin, Phone, ExternalLink } from "lucide-react";
import { formatPrice, formatDate, getStatusStyle, ORDER_STATUSES, WHATSAPP_NUMBER } from "../../utils/helpers";
import toast from "react-hot-toast";

// Major Indian Couriers
const COURIERS = [
  { id: "shiprocket", name: "Shiprocket", logo: "🚀", tracking: "https://app.shiprocket.in/tracking/" },
  { id: "delhivery", name: "Delhivery", logo: "📦", tracking: "https://www.delhivery.com/track/package/" },
  { id: "dtdc", name: "DTDC", logo: "🏎️", tracking: "https://tracking.dtdc.com/ctbs-tracking/customerTracking.tr?AWB=" },
  { id: "bluedart", name: "Blue Dart", logo: "🔵", tracking: "https://www.bluedart.com/tracking?trackfor=" },
  { id: "ekart", name: "Ekart", logo: "🛵", tracking: "https://ekartlogistics.com/shipmenttrack/" },
  { id: "xpressbees", name: "XpressBees", logo: "🐝", tracking: "https://www.xpressbees.com/shipment/tracking?awbNo=" },
  { id: "shadowfax", name: "Shadowfax", logo: "⚡", tracking: "https://tracker.shadowfax.in/?awb=" },
  { id: "self", name: "Khud Deliver", logo: "🏍️", tracking: "" },
];

export default function CourierManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("confirmed");
  const [updating, setUpdating] = useState(null);
  const [trackingModal, setTrackingModal] = useState(null);
  const [trackForm, setTrackForm] = useState({ courier: "shiprocket", trackingNumber: "", estimatedDate: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "orders"));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setOrders(list);
      } catch { setOrders([]); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = orders.filter(o => {
    const ms = filterStatus === "all" || o.status === filterStatus;
    const msearch = !search || (o.customerName||"").toLowerCase().includes(search.toLowerCase()) ||
      o.id.includes(search) || (o.trackingNumber||"").includes(search);
    return ms && msearch;
  });

  const assignCourier = async (orderId) => {
    if (!trackForm.trackingNumber.trim()) { toast.error("Tracking number daalo!"); return; }
    setUpdating(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        courier: trackForm.courier,
        trackingNumber: trackForm.trackingNumber,
        estimatedDelivery: trackForm.estimatedDate,
        status: "shipped",
        courierStatus: "shipped",
        shippedAt: new Date(),
      });
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o, courier: trackForm.courier,
        trackingNumber: trackForm.trackingNumber,
        status: "shipped", courierStatus: "shipped"
      } : o));
      toast.success("Courier assign kar diya! Order shipped ✅");
      setTrackingModal(null);

      // WhatsApp customer notification
      const order = orders.find(o => o.id === orderId);
      if (order?.customerPhone) {
        const courier = COURIERS.find(c => c.id === trackForm.courier);
        const msg = encodeURIComponent(
          `🚚 *JAI SHREE DRYFRUITS — Shipment Update*\n\n` +
          `Namaste ${order.customerName}! 🙏\n\n` +
          `Aapka order ship ho gaya hai!\n\n` +
          `📦 Order: #${orderId.slice(0,8).toUpperCase()}\n` +
          `🚀 Courier: ${courier?.name}\n` +
          `📍 Tracking: ${trackForm.trackingNumber}\n` +
          `📅 Expected: ${trackForm.estimatedDate || "3-5 din"}\n\n` +
          `Track: ${courier?.tracking}${trackForm.trackingNumber}\n\n` +
          `Dhanyawad! 🌰❤️`
        );
        window.open(`https://wa.me/91${order.customerPhone}?text=${msg}`, '_blank');
      }
    } catch { toast.error("Update failed"); }
    finally { setUpdating(null); }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success(`Status: ${status}`);
    } catch { toast.error("Update failed"); }
  };

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-serif text-2xl font-bold text-brand-brown flex items-center gap-2">
          <Truck size={24} className="text-brand-gold"/> Courier & Shipment Management
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Orders", value: stats.total, color: "bg-gray-100 text-gray-700" },
          { label: "Pending", value: stats.pending, color: "bg-yellow-100 text-yellow-700" },
          { label: "Confirmed", value: stats.confirmed, color: "bg-blue-100 text-blue-700" },
          { label: "Shipped", value: stats.shipped, color: "bg-orange-100 text-orange-700" },
          { label: "Delivered", value: stats.delivered, color: "bg-green-100 text-green-700" },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
            <p className="font-bold text-2xl">{s.value}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Order ID, customer, tracking..." className="input-field pl-9"/>
        </div>
        <div className="flex flex-wrap gap-2">
          {["all","pending","confirmed","shipped","delivered","cancelled"].map(s => (
            <button key={s} onClick={()=>setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${filterStatus===s ? "bg-brand-gold text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 skeleton rounded-lg"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-2 text-gray-200"/>
            <p>Koi order nahi mila</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Order", "Customer", "Amount", "Payment", "Status", "Courier/Tracking", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const courierInfo = COURIERS.find(c => c.id === order.courier);
                  return (
                    <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-mono font-bold text-xs text-brand-brown">#{order.id.slice(0,8).toUpperCase()}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-700 text-sm">{order.customerName}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={10}/> {order.address?.city}, {order.address?.state}
                        </div>
                        {order.customerPhone && (
                          <a href={`https://wa.me/91${order.customerPhone}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-green-500 hover:underline mt-0.5">
                            <Phone size={10}/> {order.customerPhone}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-brand-brown">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${order.paymentMethod==="cod" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                          {order.paymentMethod?.toUpperCase()}
                        </span>
                        {order.paymentStatus === "paid" && <p className="text-xs text-green-500 mt-0.5">✅ Paid</p>}
                      </td>
                      <td className="px-4 py-3">
                        <select value={order.status}
                          onChange={e=>updateOrderStatus(order.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${getStatusStyle(order.status)}`}>
                          {ORDER_STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {order.trackingNumber ? (
                          <div>
                            <p className="text-xs font-semibold text-brand-brown">{courierInfo?.name || order.courier}</p>
                            <p className="font-mono text-xs text-gray-500">{order.trackingNumber}</p>
                            {courierInfo?.tracking && (
                              <a href={`${courierInfo.tracking}${order.trackingNumber}`}
                                target="_blank" rel="noreferrer"
                                className="text-xs text-brand-gold hover:underline flex items-center gap-0.5 mt-0.5">
                                Track <ExternalLink size={10}/>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not shipped yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          {!order.trackingNumber && order.status !== "cancelled" && (
                            <button onClick={()=>{ setTrackingModal(order); setTrackForm({courier:"shiprocket", trackingNumber:"", estimatedDate:""}); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-gold text-white rounded-lg text-xs font-semibold hover:bg-brand-gold-dark transition-colors">
                              <Truck size={12}/> Ship
                            </button>
                          )}
                          {order.trackingNumber && (
                            <button onClick={()=>{ setTrackingModal(order); setTrackForm({courier:order.courier||"shiprocket", trackingNumber:order.trackingNumber||"", estimatedDate:""}); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors">
                              ✏️ Update
                            </button>
                          )}
                          {order.customerPhone && (
                            <a href={`https://wa.me/91${order.customerPhone}?text=${encodeURIComponent(`Hi ${order.customerName}! Your JAI SHREE DRYFRUITS order #${order.id.slice(0,8).toUpperCase()} update.`)}`}
                              target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">
                              💬 WA
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Courier Modal */}
      {trackingModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={()=>setTrackingModal(null)}/>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <h3 className="font-serif font-bold text-brand-brown">
                  🚚 Courier Assign — #{trackingModal.id.slice(0,8).toUpperCase()}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{trackingModal.customerName} • {trackingModal.address?.city}</p>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto">
                {/* Courier Selection */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-2">Courier Company</label>
                  <div className="grid grid-cols-2 gap-2">
                    {COURIERS.map(c => (
                      <button key={c.id} onClick={()=>setTrackForm({...trackForm, courier:c.id})}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm font-medium transition-all ${trackForm.courier===c.id ? "border-brand-gold bg-brand-cream text-brand-brown" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}>
                        <span>{c.logo}</span> {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Tracking Number / AWB</label>
                  <input value={trackForm.trackingNumber}
                    onChange={e=>setTrackForm({...trackForm, trackingNumber:e.target.value})}
                    placeholder="e.g. SHP123456789" className="input-field font-mono"/>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Expected Delivery Date</label>
                  <input type="date" value={trackForm.estimatedDate}
                    onChange={e=>setTrackForm({...trackForm, estimatedDate:e.target.value})}
                    className="input-field"/>
                </div>

                <div className="bg-green-50 rounded-xl p-3 text-xs text-green-700 flex items-start gap-2">
                  <span>💬</span>
                  <span>Customer ko automatically WhatsApp par tracking details bhej di jayegi!</span>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                <button onClick={()=>setTrackingModal(null)} className="btn-outline py-2.5 px-4">Cancel</button>
                <button onClick={()=>assignCourier(trackingModal.id)}
                  disabled={updating===trackingModal.id}
                  className="btn-primary flex items-center gap-2 flex-1 justify-center py-2.5">
                  <Truck size={16}/>
                  {updating===trackingModal.id ? "Saving..." : "Courier Assign Karo & WhatsApp Bhejo"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
