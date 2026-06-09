import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import { CoinsProvider } from "./context/CoinsContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartSidebar from "./components/CartSidebar";
import WhatsAppButton from "./components/WhatsAppButton";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
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
import MobileBottomNav from "./components/MobileBottomNav";
import ScrollToTop from "./components/ScrollToTop";

function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <CartSidebar />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton />
      <MobileBottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
        <CoinsProvider>
        <CartProvider>
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
            </Route>

            {/* 404 */}
            <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
          </Routes>
        </CartProvider>
        </CoinsProvider>
        </LanguageProvider>
      </AuthProvider>
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
    { icon: "phone", label: "Phone", lines: ["+91 75685 77968", "+91 99500 62186"] },
    { icon: "mail", label: "Email", lines: ["info@jaishreegryfruits.com"] },
    { icon: "clock", label: "Business Hours", lines: ["Mon–Sat: 9:00 AM – 7:00 PM"] },
    { icon: "map", label: "Address", lines: ["41, Barah Ji Ki Gali, Gangauri Bazar", "Jaipur – 302001"] },
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
              <input className="input-field" type="email" placeholder="Email Address" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
              <input className="input-field" placeholder="Subject" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} />
              <textarea className="input-field resize-none" rows={4} placeholder="Your Message" value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} />
              <button className="btn-primary w-full">Send Message</button>
            </div>
          </div>
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.label} className="flex gap-4 p-5 bg-brand-cream rounded-2xl">
                <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center text-brand-gold font-bold flex-shrink-0">
                  <span className="text-sm">{iconMap[item.icon]}</span>
                </div>
                <div>
                  <p className="font-semibold text-brand-brown text-sm mb-1">{item.label}</p>
                  {item.lines.map(l => <p key={l} className="text-gray-600 text-sm">{l}</p>)}
                </div>
              </div>
            ))}
            <a
              href="https://wa.me/917568577968?text=Hello! I need help."
              target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20B858] text-white font-semibold py-4 rounded-2xl transition-all hover:scale-[1.02]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl mb-4">🔍</p>
      <h1 className="font-serif text-3xl font-bold text-brand-brown mb-2">Page Not Found</h1>
      <p className="text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-primary">Go Home</a>
    </div>
  );
}
