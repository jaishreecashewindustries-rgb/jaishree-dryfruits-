import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import { CoinsProvider } from "./context/CoinsContext";
import { WishlistProvider } from "./context/WishlistContext";
import { CompareProvider } from "./context/CompareContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import { ProductsProvider } from "./context/ProductsContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartSidebar from "./components/CartSidebar";
import CompareBar from "./components/CompareBar";
import ScrollProgress from "./components/ScrollProgress";
import StickyCTA from "./components/StickyCTA";
import MobileBottomNav from "./components/MobileBottomNav";
import ScrollToTop from "./components/ScrollToTop";
import AbandonedCartReminder from "./components/AbandonedCartReminder";
import LiveSocialProof from "./components/LiveSocialProof";
import LeadCapturePopup from "./components/LeadCapturePopup";
import CustomCursor from "./components/CustomCursor";
import PageTransition from "./components/PageTransition";
import SEO from "./components/SEO";

// Home is eager — it's the most common landing route, no point delaying first paint
import Home from "./pages/Home";

// Everything else loads on demand to keep the initial bundle small
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Compare = lazy(() => import("./pages/Compare"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const SourcingStory = lazy(() => import("./pages/SourcingStory"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ProductManagement = lazy(() => import("./pages/admin/ProductManagement"));
const OrderManagement = lazy(() => import("./pages/admin/OrderManagement"));
const CustomerManagement = lazy(() => import("./pages/admin/CustomerManagement"));
const ReviewManagement = lazy(() => import("./pages/admin/ReviewManagement"));
const ColorManagement = lazy(() => import("./pages/admin/ColorManagement"));
const CouponManagement = lazy(() => import("./pages/admin/CouponManagement"));
const BlogManagement = lazy(() => import("./pages/admin/BlogManagement"));
const InquiryManagement = lazy(() => import("./pages/admin/InquiryManagement"));
const CoinsManagement = lazy(() => import("./pages/admin/CoinsManagement"));
const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
const LoginSettings = lazy(() => import("./pages/admin/LoginSettings"));

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function MainLayout({ children }) {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <CartSidebar />
      <main><PageTransition>{children}</PageTransition></main>
      <Footer />
      <StickyCTA />
      <CompareBar />
      <MobileBottomNav />
      <AbandonedCartReminder />
      <LiveSocialProof />
      <LeadCapturePopup />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CustomCursor />
      <SiteSettingsProvider>
        <ProductsProvider>
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
                    <Suspense fallback={<RouteLoader />}>
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
                      <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />
                      <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />
                      <Route path="/faq" element={<MainLayout><FAQ /></MainLayout>} />
                      <Route path="/blog" element={<MainLayout><Blog /></MainLayout>} />
                      <Route path="/blog/:id" element={<MainLayout><BlogPost /></MainLayout>} />
                      <Route path="/sourcing" element={<MainLayout><SourcingStory /></MainLayout>} />
                      <Route path="/shipping" element={<MainLayout><ShippingPage /></MainLayout>} />
                      <Route path="/returns" element={<MainLayout><ReturnsPage /></MainLayout>} />
                      <Route path="/privacy" element={<MainLayout><PrivacyPage /></MainLayout>} />
                      <Route path="/terms" element={<MainLayout><TermsPage /></MainLayout>} />

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
                    </Suspense>
                  </CompareProvider>
                </WishlistProvider>
              </CartProvider>
            </CoinsProvider>
          </LanguageProvider>
        </AuthProvider>
        </ProductsProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  );
}

function PolicyPageShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-brand-brown py-14 px-4 text-center">
        <p className="text-brand-gold text-xs font-semibold tracking-widest uppercase mb-3">Jai Shree Dryfruits</p>
        <h1 className="font-serif text-4xl font-bold text-white mb-3">{title}</h1>
        {subtitle && <p className="text-white/60 text-sm mb-3">{subtitle}</p>}
        <div className="w-12 h-0.5 bg-brand-gold mx-auto" />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-14 prose prose-sm prose-headings:font-serif prose-headings:text-brand-brown prose-a:text-brand-gold">
        {children}
      </div>
    </div>
  );
}

function PolicySection({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-xl font-semibold text-brand-brown mb-3 flex items-center gap-2">
        <span className="w-5 h-0.5 bg-brand-gold inline-block flex-shrink-0" />
        {title}
      </h2>
      <div className="text-gray-600 text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function AboutPage() {
  return (
    <>
      <SEO
        title="About Us"
        description="Jai Shree Dryfruits — 25+ years of pure quality from Jaipur's heart. FSSAI certified, direct-sourced from Kashmir, California & Iran. Serving 50,000+ families since 1999."
      />
    <PolicyPageShell title="About Us" subtitle="25+ years of pure quality from Jaipur's heart">
      <PolicySection title="Our Story">
        <p>Jai Shree Dryfruits was born in 1999 inside Jaipur's historic Gangauri Bazar — one of Rajasthan's oldest trading districts, where merchants have exchanged the world's finest spices and dry fruits for centuries. What started as a small family shop run by a single promise — <strong>quality you can taste</strong> — has grown into one of India's most trusted dry fruit brands.</p>
        <p>Today we serve over 50,000 families across India, supplying to homes, hotels, corporate offices, and wedding caterers. Yet our sourcing philosophy remains unchanged: every almond, cashew, walnut, pistachio, and date is hand-selected from its origin farm before it reaches your door.</p>
      </PolicySection>
      <PolicySection title="Where We Source">
        <p><strong>Kashmir, India</strong> — Walnuts and saffron from the Sopore valley, harvested each October by the same farming families we've partnered with for over a decade.</p>
        <p><strong>California, USA</strong> — Premium almonds and pistachios from the San Joaquin Valley, processed within 48 hours of shelling.</p>
        <p><strong>Iran</strong> — Hand-picked Iranian green pistachios and dried figs, sourced from licensed exporters with FSSAI approval.</p>
        <p><strong>Saudi Arabia &amp; Afghanistan</strong> — Medjool dates, Afghani figs, and Irani dry apricots.</p>
      </PolicySection>
      <PolicySection title="Quality Promise">
        <p>Every batch we receive is inspected for moisture content (below 5%), kernel integrity (minimum 98% whole), zero foreign matter, and absence of mineral oil coating or chemical preservatives. We are FSSAI certified (License No. on every package) and maintain lab test records for every batch dispatched.</p>
        <p>We never use sulphur dioxide, artificial colouring, or mineral oil — common adulterants in the Indian market. Our products are 100% natural, exactly as they come from the farm.</p>
      </PolicySection>
      <PolicySection title="Contact Us">
        <p>📍 41, Barah Ji Ki Gali, Gangauri Bazar, Jaipur – 302001, Rajasthan</p>
        <p>📞 +91 75685 77968 &nbsp;|&nbsp; +91 99500 62186</p>
        <p>✉️ info@jaishreedryfruits.com</p>
        <p>🕐 Mon–Sat: 9:00 AM – 7:00 PM</p>
      </PolicySection>
    </PolicyPageShell>
    </>
  );
}

function ShippingPage() {
  return (
    <>
      <SEO title="Shipping Policy" description="Free shipping above ₹499. Metro delivery in 2-3 days, tracked via Delhivery/Shiprocket/India Post. Read Jai Shree Dryfruits' full shipping timelines and charges." />
    <PolicyPageShell title="Shipping Policy" subtitle="Last updated: June 2025">
      <PolicySection title="Delivery Timelines">
        <p><strong>Metro cities</strong> (Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Pune, Kolkata): 2–3 business days.</p>
        <p><strong>Tier-2 &amp; Tier-3 cities</strong>: 3–5 business days.</p>
        <p><strong>Remote/hill areas</strong>: 5–7 business days.</p>
        <p>Orders placed before 2:00 PM (Mon–Sat) are dispatched the same day. Orders after 2 PM or on Sunday are dispatched the next business day.</p>
      </PolicySection>
      <PolicySection title="Shipping Charges">
        <p><strong>Free shipping</strong> on all orders above ₹499.</p>
        <p>For orders below ₹499, a flat ₹60 shipping charge applies.</p>
        <p>Bulk/wholesale orders above 5 kg: shipping calculated at checkout based on weight and destination. WhatsApp us for corporate shipping rates.</p>
      </PolicySection>
      <PolicySection title="Logistics Partners">
        <p>We ship via Delhivery, Shiprocket, and India Post depending on your pincode. A tracking link is sent via WhatsApp/email within 24 hours of dispatch.</p>
      </PolicySection>
      <PolicySection title="Packaging">
        <p>All products are vacuum-sealed or nitrogen-flushed in food-grade, resealable pouches before being placed in tamper-evident outer packaging. Gift hampers are packed in premium rigid boxes with tissue lining.</p>
        <p>We do not use styrofoam. All packaging materials are recyclable.</p>
      </PolicySection>
      <PolicySection title="Damaged in Transit">
        <p>If your order arrives with visible damage to the outer packaging or any product appears compromised, photograph it immediately upon opening and WhatsApp us at +91 75685 77968 within 48 hours of delivery. We will replace or refund at no cost.</p>
      </PolicySection>
      <PolicySection title="Contact for Shipping Queries">
        <p>📞 +91 75685 77968 (WhatsApp preferred) &nbsp;|&nbsp; ✉️ info@jaishreedryfruits.com</p>
      </PolicySection>
    </PolicyPageShell>
    </>
  );
}

function ReturnsPage() {
  return (
    <>
      <SEO title="Return & Refund Policy" description="7-day hassle-free returns on all Jai Shree Dryfruits orders. Free pickup, instant JS Coins credit or bank refund within 5-7 days. 100% satisfaction guaranteed." />
    <PolicyPageShell title="Return & Refund Policy" subtitle="Happiness guaranteed — last updated June 2025">
      <PolicySection title="Our Guarantee">
        <p>We stand 100% behind every product we sell. If you are not completely satisfied with the quality, taste, or freshness of any item, we will replace it or refund you in full — no questions asked.</p>
      </PolicySection>
      <PolicySection title="Return Window">
        <p>You have <strong>7 days from the date of delivery</strong> to raise a return or refund request. After 7 days, we are unable to accept returns unless the product has a quality or safety defect.</p>
      </PolicySection>
      <PolicySection title="What Can Be Returned">
        <ul className="list-disc pl-5 space-y-1">
          <li>Product does not match description (different variety, wrong weight)</li>
          <li>Product is stale, mouldy, or has an off taste/smell upon opening</li>
          <li>Wrong item delivered</li>
          <li>Damaged packaging or broken seal on arrival</li>
          <li>Missing items from a combo or gift hamper</li>
        </ul>
        <p className="mt-2"><strong>Note:</strong> We cannot accept returns for products that have been consumed (more than 20% used) unless there is a genuine quality issue.</p>
      </PolicySection>
      <PolicySection title="How to Raise a Return">
        <ol className="list-decimal pl-5 space-y-1">
          <li>WhatsApp us at <strong>+91 75685 77968</strong> with your Order ID and a photo of the product.</li>
          <li>Our team will review and respond within 4 business hours.</li>
          <li>For approved returns, we arrange a free pickup from your address.</li>
          <li>Refunds are processed within 5–7 business days to your original payment method (UPI/card) or as JS Coins credit instantly.</li>
        </ol>
      </PolicySection>
      <PolicySection title="Refund Timeline">
        <p><strong>UPI / Net Banking:</strong> 3–5 business days after approval.</p>
        <p><strong>Debit / Credit Card:</strong> 5–7 business days (bank processing time).</p>
        <p><strong>Cash on Delivery:</strong> Refund issued as bank transfer. Please share account details when raising the return.</p>
        <p><strong>JS Coins Credit:</strong> Instant — the equivalent coin value is credited to your account immediately.</p>
      </PolicySection>
      <PolicySection title="Non-Returnable Items">
        <p>Custom-branded corporate gifting orders once dispatched cannot be returned unless defective. Saffron and specialty spice sachets are non-returnable once opened.</p>
      </PolicySection>
    </PolicyPageShell>
    </>
  );
}

function PrivacyPage() {
  return (
    <>
      <SEO title="Privacy Policy" description="How Jai Shree Dryfruits collects, uses, and protects your personal data. We never sell your information to third parties." noIndex />
    <PolicyPageShell title="Privacy Policy" subtitle="Last updated: June 2025">
      <PolicySection title="Introduction">
        <p>Jai Shree Dryfruits ("we", "our", "us") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding it. By using our website (jaishreedryfruits.com), you agree to this policy.</p>
      </PolicySection>
      <PolicySection title="Information We Collect">
        <p><strong>Account information:</strong> Name, email address, phone number, and password when you create an account or sign in with Google.</p>
        <p><strong>Order information:</strong> Delivery address, payment method type (we do not store card numbers), and order history.</p>
        <p><strong>Usage data:</strong> Pages visited, products viewed, and session duration — collected via Firebase Analytics to improve the website experience.</p>
        <p><strong>Communications:</strong> WhatsApp and email messages you send us are retained for customer service purposes.</p>
      </PolicySection>
      <PolicySection title="How We Use Your Information">
        <ul className="list-disc pl-5 space-y-1">
          <li>Process and fulfil your orders</li>
          <li>Send order confirmation, dispatch updates, and delivery notifications via WhatsApp/email</li>
          <li>Manage your loyalty coins (JS Coins) balance</li>
          <li>Respond to customer service queries</li>
          <li>Improve our product catalogue and website based on usage patterns</li>
          <li>Send promotional offers (only if you have opted in; unsubscribe anytime)</li>
        </ul>
      </PolicySection>
      <PolicySection title="Data Sharing">
        <p>We do <strong>not sell, rent, or trade</strong> your personal data to any third party.</p>
        <p>We share your delivery address with our logistics partners (Delhivery, Shiprocket, India Post) solely to fulfil your order. Payment processing is handled by Razorpay — their privacy policy applies to payment data.</p>
      </PolicySection>
      <PolicySection title="Data Storage & Security">
        <p>Your data is stored securely on Google Firebase servers (Mumbai region, India). All data in transit is encrypted via 256-bit SSL/TLS. Firebase enforces strict access controls — only authorised team members can view order data.</p>
      </PolicySection>
      <PolicySection title="Your Rights">
        <p>You may request access to, correction of, or deletion of your personal data at any time by emailing info@jaishreedryfruits.com. Account deletion removes all personal data within 30 days.</p>
      </PolicySection>
      <PolicySection title="Cookies">
        <p>We use essential cookies for authentication (Firebase Auth) and localStorage for cart persistence. No third-party advertising cookies are used.</p>
      </PolicySection>
      <PolicySection title="Contact">
        <p>For privacy concerns: ✉️ info@jaishreedryfruits.com &nbsp;|&nbsp; 📞 +91 75685 77968</p>
      </PolicySection>
    </PolicyPageShell>
    </>
  );
}

function TermsPage() {
  return (
    <>
      <SEO title="Terms & Conditions" description="Terms and conditions for shopping on Jai Shree Dryfruits — order policies, payment, and legal terms." noIndex />
    <PolicyPageShell title="Terms & Conditions" subtitle="Last updated: June 2025">
      <PolicySection title="Acceptance of Terms">
        <p>By accessing or placing an order on jaishreedryfruits.com, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use this website.</p>
      </PolicySection>
      <PolicySection title="Products & Pricing">
        <p>All product descriptions, weights, and images are accurate to the best of our knowledge. Product photographs are representative; actual colour and appearance may slightly vary.</p>
        <p>Prices are in Indian Rupees (₹) and include applicable taxes. We reserve the right to change prices without prior notice. The price at the time of order confirmation is binding.</p>
        <p>Promotional discount codes (coupons) have individual terms — minimum order values, single-use restrictions, and expiry dates as stated at the time of issue.</p>
      </PolicySection>
      <PolicySection title="Orders & Payment">
        <p>An order is confirmed only after successful payment (online) or order acknowledgement (COD). We reserve the right to cancel any order in case of stock unavailability, pricing errors, or suspected fraudulent activity, with a full refund.</p>
        <p>Online payments are processed by Razorpay (PCI-DSS Level 1 certified). We do not store your card or bank details.</p>
        <p>Cash on Delivery (COD) is available for orders up to ₹5,000. Repeated COD order cancellations may result in restriction of the COD option for your account.</p>
      </PolicySection>
      <PolicySection title="JS Coins Loyalty Program">
        <p>JS Coins are a loyalty reward and have no cash value outside our platform. Coins earned on an order are reversed if that order is returned or refunded. Coins expire 12 months after the date of earning. We reserve the right to modify the earning/redemption rates with 30 days notice.</p>
      </PolicySection>
      <PolicySection title="Intellectual Property">
        <p>All content on this website — including text, images, logos, and design — is owned by Jai Shree Dryfruits and may not be reproduced without written permission.</p>
      </PolicySection>
      <PolicySection title="Limitation of Liability">
        <p>Our liability for any order is limited to the value of the order placed. We are not liable for indirect, incidental, or consequential damages arising from use of our products or website.</p>
      </PolicySection>
      <PolicySection title="Governing Law">
        <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Jaipur, Rajasthan.</p>
      </PolicySection>
      <PolicySection title="Contact">
        <p>For legal queries: ✉️ info@jaishreedryfruits.com &nbsp;|&nbsp; 📞 +91 75685 77968</p>
        <p>Jai Shree Dryfruits, 41 Barah Ji Ki Gali, Gangauri Bazar, Jaipur – 302001, Rajasthan, India.</p>
      </PolicySection>
    </PolicyPageShell>
    </>
  );
}

function ContactPage() {
  const [form, setForm] = React.useState({ name: "", email: "", subject: "", message: "" });
  const items = [
    { icon: "phone", label: "Phone",          lines: ["+91 75685 77968", "+91 99500 62186"] },
    { icon: "mail",  label: "Email",           lines: ["info@jaishreedryfruits.com"] },
    { icon: "clock", label: "Business Hours",  lines: ["Mon–Sat: 9:00 AM – 7:00 PM"] },
    { icon: "map",   label: "Address",         lines: ["41, Barah Ji Ki Gali, Gangauri Bazar", "Jaipur – 302001"] },
  ];
  const iconMap = { phone: "📱", mail: "✉", clock: "◷", map: "◎" };
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Contact Us"
        description="Get in touch with Jai Shree Dryfruits — call, WhatsApp, or email us. Jaipur-based, serving customers across India since 1999."
      />
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
              <a href={`mailto:info@jaishreedryfruits.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(form.message)}`} className="btn-primary block text-center py-3">Send Message</a>
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
