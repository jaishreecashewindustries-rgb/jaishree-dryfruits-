import React, { useState } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Users, Star, Tag, LogOut, Menu, ChevronRight, MessageSquare, BookOpen, Coins, Image, TrendingUp, FileText, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/coupons", label: "Coupons", icon: Tag },
  { to: "/admin/blog", label: "Blog", icon: BookOpen },
  { to: "/admin/inquiries", label: "Inquiries", icon: MessageSquare },
  { to: "/admin/coins", label: "JS Coins", icon: Coins },
  { to: "/admin/content", label: "Content", icon: FileText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentLabel = NAV_LINKS.find(l => l.end ? location.pathname === l.to : location.pathname.startsWith(l.to))?.label || "Admin";

  if (!user) return <Navigate to="/login" state={{ from: "/admin" }} />;
  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <p className="text-4xl mb-3">🔒</p>
        <h2 className="font-serif text-2xl font-bold text-brand-brown mb-2">Access Denied</h2>
        <p className="text-gray-500 text-sm">You don't have admin privileges.</p>
      </div>
    </div>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(180deg, #0D1B2A 0%, #1B2E4B 100%)" }}>
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <h2 className="font-serif text-xl font-bold" style={{ color: "#C9A84C" }}>JAI SHREE</h2>
        <p className="text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>ADMIN PANEL</p>
      </div>
      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-xs font-semibold tracking-wider uppercase transition-all ${
                isActive
                  ? "text-brand-brown"
                  : "text-white/50 hover:text-white hover:bg-white/8"
              }`
            }
            style={({ isActive }) => isActive ? { background: "#C9A84C", color: "#1B2E4B" } : {}}
          >
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>
      {/* Signout */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold tracking-wider uppercase text-red-400 hover:bg-red-900/20 transition-all w-full">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F8FAFE" }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-52 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-52 z-50 md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg">
              <Menu size={20} className="text-brand-brown" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs" style={{ color: "#8A9AAA" }}>
              <span>Admin</span>
              <ChevronRight size={12} />
              <span className="font-semibold" style={{ color: "#1B2E4B" }}>{currentLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 transition-all" style={{ border: "1px solid #E2E8F0", color: "#5A6A7A" }}>
              🌐 View Site
            </a>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "#C9A84C", color: "#1B2E4B" }}>A</div>
              <span className="hidden md:block text-sm font-semibold" style={{ color: "#1B2E4B" }}>Admin</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
