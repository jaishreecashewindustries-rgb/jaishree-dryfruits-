import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import { CoinsProvider } from "./context/CoinsContext";
import { WishlistProvider } from "./context/WishlistContext";
import { CompareProvider } from "./context/CompareContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartSidebar from "./components/CartSidebar";
import WhatsAppButton from "./components/WhatsAppButton";
import CompareBar from "./components/CompareBar";
import ScrollProgress from "./components/ScrollProgress";
import StickyCTA from "./components/StickyCTA";
import MobileBottomNav from "./components/MobileBottomNav";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import Wishlist from "./pages/Wishlist";
import TrackOrder from "./pages/TrackOrder";
import SearchResults from "./pages/SearchResults";
import Compare from "./pages/Compare";
import NotFound from "./pages/NotFound";
import FAQ from "./pages/FAQ";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import SourcingStory from "./pages/SourcingStory";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductManagement from "./pages/admin/ProductManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import CustomerManagement from "./pages/admin/CustomerManagement";
import ReviewManagement from "./pages/admin/ReviewManagement";
import ColorManagement from "./pages/admin/ColorManagement";
import CouponManagement from "./pages/admin/CouponManagement";
import BlogManagement from "./pages/admin/BlogManagement";
import InquiryManagement from "./pages/admin/InquiryManagement";
import CoinsManagement from "./pages/admin/CoinsManagement";
import ContentManagement from "./pages/admin/ContentManagement";
import LoginSettings from "./pages/admin/LoginSettings";

function MainLayout({ children }) {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <CartSidebar />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton />
      <StickyCTA />
      <CompareBar />
      <MobileBottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SiteSettingsProvider>
        <AuthProvider>
          <LanguageProvider>
            <CoinsProvider>
              <CartProvider>
                <WishlistProvider>
                  <CompareProvider>
                    <Toaster
                      position="top-center"
                      toastOptions={{
                        duration: 3000,
                        style: { borderRadius: "12px", fontSize: "14px" },
                      }}
                    />
                    <ScrollToTop />
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<MainLayout><Home /></MainLayout>} />
                      <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
                      <Route path="/product/:id" element={<MainLayout><ProductDetail /></MainLayout>} />
                      <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
                      <Route path="/checkout" element={<MainLayout><Checkout /></MainLayout>} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/dashboard/*" element={<MainLayout><UserDashboard /></MainLayout>} />
                      <Route path="/wishlist" element={<MainLayout><Wishlist /></MainLayout>} />
                      <Route path="/track-order" element={<MainLayout><TrackOrder /></MainLayout>} />
                      <Route path="/search" element={<MainLayout><SearchResults /></MainLayout>} />
                      <Route path="/compare" element={<MainLayout><Compare /></MainLayout>} />

                      {/* Static pages */}
                      <Route path="/about" element={<MainLayout><StaticPage title="About Us" content="We are JAI SHREE DRYFRUITS, committed to bringing you the finest quality dry fruits and nuts from around the world." /></MainLayout>} />
                      <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />
                      <Route path="/faq" element={<MainLayout><FAQ /></MainLayout>} />
                      <Route path="/blog" element={<MainLayout><Blog /></MainLayout>} />
                      <Route path="/blog/:id" element={<MainLayout><BlogPost /></MainLayout>} />
                      <Route path="/sourcing" element={<MainLayout><SourcingStory /></MainLayout>} />
                      <Route path="/shipping" element={<MainLayout><StaticPage title="Shipping Policy" content="We ship pan-India. Free shipping on orders above ₹499. Delivery in 3-5 business days." /></MainLayout>} />
                      <Route path="/returns" element={<MainLayout><StaticPage title="Return & Refund Policy" content="We offer a 7-day hassle-free return policy. Contact us within 7 days of delivery for returns." /></MainLayout>} />
                      <Route path="/privacy" element={<MainLayout><StaticPage title="Privacy Policy" content="Your privacy is important to us. We never sell or share your personal data." /></MainLayout>} />
                      <Route path="/terms" element={<MainLayout><StaticPage title="Terms & Conditions" content="By using our website, you agree to our terms of service." /></MainLayout>} />

                      {/* Admin routes */}
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="products" element={<ProductManagement />} />
                        <Route path="orders" element={<OrderManagement />} />
                        <Route path="customers" element={<CustomerManagement />} />
                        <Route path="reviews" element={<ReviewManagement />} />
                        <Route path="colors" element={<ColorManagement />} />
                        <Route path="coupons" element={<CouponManagement />} />
                        <Route path="blog" element={<BlogManagement />} />
                        <Route path="inquiries" element={<InquiryManagement />} />
                        <Route path="coins" element={<CoinsManagement />} />
                        <Route path="content" element={<ContentManagement />} />
                        <Route path="settings" element={<LoginSettings />} />
                      </Route>

                      {/* 404 */}
                      <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
                    </Routes>
                  </CompareProvider>
                </WishlistProvider>
              </CartProvider>
            </CoinsProvider>
          </LanguageProvider>
        </AuthProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  );
}

function StaticPage({ title, content }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-brand-brown py-14 px-4 text-center">
        <h1 className="font-serif text-4xl font-bold text-white mb-3">{title}</h1>
        <div className="w-12 h-0.5 bg-brand-gold mx-auto" />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-gray-600 leading-relaxed text-base">{content}</p>
      </div>
    </div>
  );
}

function ContactPage() {
  const [form, setForm] = React.useState({ name: "", email: "", subject: "", message: "" });
  const items = [
    { icon: "phone", label: "Phone",          lines: ["+91 75685 77968", "+91 99500 62186"] },
    { icon: "mail",  label: "Email",           lines: ["info@jaishreegryfruits.com"] },
    { icon: "clock", label: "Business Hours",  lines: ["Mon–Sat: 9:00 AM – 7:00 PM"] },
    { icon: "map",   label: "Address",         lines: ["41, Barah Ji Ki Gali, Gangauri Bazar", "Jaipur – 302001"] },
  ];
  const iconMap = { phone: "📱", mail: "✉", clock: "◷", map: "◎" };
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-brand-brown py-16 px-4 text-center">
        <p className="text-brand-gold text-xs font-semibold tracking-widest uppercase mb-3">Get In Touch</p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-3">Contact Us</h1>
        <div className="w-12 h-0.5 bg-brand-gold mx-auto" />
      </div>
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-brand-brown mb-6">Send a Message</h2>
            <div className="space-y-4">
              <input className="input-field" placeholder="Your Name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              <input className="input-field" placeholder="Email Address" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
              <input className="input-field" placeholder="Subject" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} />
              <textarea className="input-field resize-none" rows={4} placeholder="Your message…" value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} />
              <a href={`mailto:info@jaishreegryfruits.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(form.message)}`} className="btn-primary block text-center py-3">Send Message</a>
            </div>
          </div>
          <div className="space-y-5">
            {items.map(item => (
              <div key={item.label} className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl">
                <span className="text-2xl">{iconMap[item.icon]}</span>
                <div>
                  <p className="font-semibold text-brand-brown text-sm mb-1">{item.label}</p>
                  {item.lines.map(l => <p key={l} className="text-gray-500 text-sm">{l}</p>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
