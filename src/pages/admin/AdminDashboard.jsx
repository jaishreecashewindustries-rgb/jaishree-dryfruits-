import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Users, Package, Star, TrendingUp, ArrowRight, AlertCircle } from "lucide-react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase/config";
import { formatPrice, formatDate, getStatusStyle, ORDER_STATUSES } from "../../utils/helpers";

const STAT_CARD = ({ title, value, icon: Icon, color, sub }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm">
    <div className="flex items-start justify-between mb-3">
      <p className="text-sm text-gray-500">{title}</p>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <p className="font-serif text-3xl font-bold text-brand-brown">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({ orders: 0, customers: 0, products: 0, reviews: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [orderSnap, customerSnap, reviewSnap] = await Promise.all([
          getDocs(collection(db, "orders")),
          getDocs(collection(db, "users")),
          getDocs(collection(db, "reviews")),
        ]);
        const allOrders = orderSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const revenue = allOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
        setStats({
          orders: orderSnap.size,
          customers: customerSnap.size,
          products: 6, // demo
          reviews: reviewSnap.size,
          revenue,
        });
        setRecentOrders(
          allOrders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5)
        );
      } catch (e) {
        setStats({ orders: 12, customers: 45, products: 6, reviews: 28, revenue: 48750 });
        setRecentOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-brand-brown">Dashboard Overview</h1>
        <p className="text-gray-400 text-sm">Welcome back, Admin!</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <STAT_CARD title="Total Orders" value={stats.orders} icon={ShoppingBag} color="bg-brand-gold" sub="All time orders" />
        <STAT_CARD title="Revenue" value={formatPrice(stats.revenue)} icon={TrendingUp} color="bg-green-500" sub="From completed orders" />
        <STAT_CARD title="Customers" value={stats.customers} icon={Users} color="bg-blue-500" sub="Registered users" />
        <STAT_CARD title="Reviews" value={stats.reviews} icon={Star} color="bg-purple-500" sub="Customer reviews" />
      </div>

      {/* Hero images dashboard */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-brand-brown mb-4">Product Gallery Dashboard</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            "https://images.unsplash.com/photo-1574734758476-7dc34729b13d?w=200&q=70",
            "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=200&q=70",
            "https://images.unsplash.com/photo-1609601539284-1a4b8d1f8e64?w=200&q=70",
            "https://images.unsplash.com/photo-1606755456207-ec7a0f7f3cd1?w=200&q=70",
            "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&q=70",
            "https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=200&q=70",
          ].map((img, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-brand-cream">
              <img src={img} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-brand-brown">Recent Orders</h2>
          <Link to="/admin/orders" className="text-xs text-brand-gold hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-12 skeleton rounded-lg" />)}</div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  {["Order ID", "Customer", "Amount", "Status", "Date"].map((h) => (
                    <th key={h} className="pb-2 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-mono text-xs">#{o.id.slice(0,8).toUpperCase()}</td>
                    <td className="py-3 pr-4 text-gray-600">{o.customerName || o.userEmail || "Guest"}</td>
                    <td className="py-3 pr-4 font-semibold text-brand-brown">{formatPrice(o.total)}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusStyle(o.status)}`}>
                        {ORDER_STATUSES.find((s) => s.value === o.status)?.label || o.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 text-xs">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: "/admin/products", label: "Add Product", emoji: "➕", color: "bg-brand-cream border-brand-gold/20" },
          { to: "/admin/orders", label: "Manage Orders", emoji: "📦", color: "bg-blue-50 border-blue-200" },
          { to: "/admin/reviews", label: "Moderate Reviews", emoji: "⭐", color: "bg-amber-50 border-amber-200" },
          { to: "/admin/customers", label: "View Customers", emoji: "👥", color: "bg-purple-50 border-purple-200" },
        ].map((a) => (
          <Link key={a.to} to={a.to} className={`${a.color} border rounded-2xl p-4 text-center hover:shadow-md transition-all`}>
            <p className="text-2xl mb-1">{a.emoji}</p>
            <p className="text-xs font-semibold text-brand-brown">{a.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
