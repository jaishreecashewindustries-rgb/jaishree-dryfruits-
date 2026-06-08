import React, { useState } from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Users, Star, Palette, LogOut, Menu, X, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/colors", label: "Color / Tags", icon: Palette },
];

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10">
        <h2 className="font-serif text-xl font-bold text-brand-gold">JAI SHREE</h2>
        <p className="text-white/40 text-xs tracking-widest">ADMIN PANEL</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-brand-gold text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/20 transition-all w-full">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-brand-brown flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-56 bg-brand-brown z-50 md:hidden animate-slide-in-right">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg">
            <Menu size={20} className="text-brand-brown" />
          </button>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
            <span>Admin</span> <ChevronRight size={12} /> <span className="text-brand-brown font-medium">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden md:block">Admin Panel</span>
            <div className="w-8 h-8 bg-brand-gold rounded-full flex items-center justify-center text-white text-sm font-bold">A</div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
