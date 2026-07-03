import React, { useState, useEffect } from "react";
import { ChevronDown, Search, Package, Truck, CreditCard, RotateCcw, Leaf, MessageCircle, Mail, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";

const FAQ_CATEGORIES = [
  {
    cat: "Products & Quality",
    Icon: Package,
    faqs: [
      { q: "What makes Jai Shree dry fruits different from market products?", a: "Our dry fruits are sourced directly from origin farms — almonds from California & Spain, cashews from Vietnam & West Africa, pistachios from Iran & USA, and dates from Saudi Arabia. Every batch is vacuum-packed within 48 hours of grading, with zero artificial preservatives or sulphur treatment. We are FSSAI certified and follow international food safety standards." },
      { q: "Are your products free from preservatives and chemicals?", a: "Yes, 100%. We never use sulphur dioxide, artificial colours, mineral oil coating, or any chemical preservatives. What you get is the pure, natural dry fruit — nothing added. Our packaging uses food-grade nitrogen flushing to extend shelf life naturally." },
      { q: "What is the shelf life of your products?", a: "Vacuum-packed whole dry fruits: 12 months. Roasted/salted variants: 6 months. Dates and figs: 8–10 months. Always store in a cool, dry place. After opening, refrigerate and consume within 30 days for best flavour." },
      { q: "Do you offer organic certified products?", a: "We currently offer conventional premium grades that are free from chemical treatment. Certified organic variants for almonds and cashews are available in our bulk B2B range. Retail organic range is launching Q3 2025." },
      { q: "What does 'A+ Grade' mean on your products?", a: "A+ Grade refers to our internal quality classification. It means: uniform kernel size, minimum 98% whole kernels (no broken), whiteness score above 8/10 for cashews, moisture below 5%, and zero insect/foreign matter. This is stricter than standard FSSAI norms." },
    ],
  },
  {
    cat: "Orders & Shipping",
    Icon: Truck,
    faqs: [
      { q: "How long does delivery take?", a: "Metro cities (Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Pune, Kolkata): 2–3 business days. Tier-2 cities: 3–5 business days. Remote areas: 5–7 business days. All orders are dispatched within 24 hours of payment confirmation (Monday–Saturday)." },
      { q: "Is there a minimum order value?", a: "For retail orders: minimum cart value is ₹149. Free shipping on orders above ₹499. For B2B/bulk orders: minimum 5 kg per variant. Contact us on WhatsApp for bulk pricing and logistics." },
      { q: "Do you ship pan-India?", a: "Yes, we ship to all 28 states and 8 union territories. We use Delhivery, Shiprocket, and Xpressbees as our logistics partners for reliable, trackable delivery." },
      { q: "How do I track my order?", a: "Once your order is dispatched, you will receive an SMS/WhatsApp message with the tracking number and courier partner details. You can also log in to your account and check 'My Orders' for real-time status updates." },
      { q: "What if my order arrives damaged or tampered?", a: "Please take an unboxing video at the time of delivery. Contact us within 24 hours via WhatsApp (+91 75685 77968) with the video. We will send a fresh replacement at no cost — no questions asked." },
    ],
  },
  {
    cat: "Payments & Offers",
    Icon: CreditCard,
    faqs: [
      { q: "What payment methods do you accept?", a: "We accept UPI (PhonePe, GPay, Paytm), all debit/credit cards (Visa, Mastercard, RuPay), net banking, and EMI on cards above ₹3,000. All payments are processed via Razorpay — a PCI-DSS compliant gateway with 256-bit SSL encryption." },
      { q: "How do promo codes and discounts work?", a: "Enter your promo code in the cart before checkout. Codes are case-insensitive. WELCOME15 gives 15% off your first order. CASHEW10 gives 10% off cashew products. Codes cannot be combined. Minimum order values may apply." },
      { q: "What are JS Coins and how do I earn them?", a: "JS Coins are our loyalty reward points. You earn 1 coin per ₹1 spent. Signup bonus: 50 coins. Review bonus: 20 coins per review. Referral bonus: 100 coins. 100 JS Coins = ₹25 discount on your next order. Coins are valid for 12 months." },
      { q: "Do you offer bulk/wholesale pricing?", a: "Yes. For orders above 5 kg, we offer special B2B pricing — typically 15–25% lower than retail MRP. WhatsApp us at +91 75685 77968 with your requirement (product, quantity, delivery state) for a custom quote within 2 hours." },
      { q: "Are GST invoices provided?", a: "Yes. We provide GST-compliant tax invoices for all orders. Our GSTIN is 08XXXXX1234Z1. For B2B buyers needing specific invoice formats, contact us before placing the order." },
    ],
  },
  {
    cat: "Returns & Refunds",
    Icon: RotateCcw,
    faqs: [
      { q: "What is your return policy?", a: "We offer a 7-day hassle-free return/replacement policy from the date of delivery. If you are not satisfied with the quality for any reason — size, freshness, taste — contact us within 7 days. We will arrange a pickup and full refund or replacement." },
      { q: "How long does a refund take?", a: "Refunds are processed within 24–48 hours of pickup confirmation. It typically reflects in your bank account within 3–7 business days depending on your bank. UPI refunds are faster — usually within 2 hours." },
      { q: "What items cannot be returned?", a: "Opened/partially consumed products cannot be returned unless there is a genuine quality issue. Gift hampers and custom combo packs are non-returnable once opened." },
    ],
  },
  {
    cat: "Health & Nutrition",
    Icon: Leaf,
    faqs: [
      { q: "Are dry fruits good for weight loss?", a: "Yes — in moderation. Almonds, walnuts, and pistachios are excellent for weight management due to their fibre and healthy fat combination that keeps you satiated longer. Portion size: 20–30g per day. Avoid salted or sugar-coated variants for best results." },
      { q: "Which dry fruits are best for diabetics?", a: "Walnuts, almonds, and pistachios have low glycaemic index and are safe for most Type 2 diabetics. They help regulate blood sugar. Avoid dates, figs, and raisins in large quantities as they are higher in natural sugars. Always consult your doctor for personalised advice." },
      { q: "Can children eat dry fruits daily?", a: "Yes, dry fruits are excellent nutrition for children above 3 years. Recommended: almonds for brain development, cashews for zinc and immunity, raisins for energy. Powder or soak overnight in water for toddlers. Whole nuts are a choking hazard for children under 3." },
      { q: "Which dry fruits help with hair and skin health?", a: "Almonds (Vitamin E — skin glow), walnuts (Omega-3 — hair growth), cashews (biotin and zinc — nail and hair strength), dried apricots (beta-carotene — skin health). Our premium grades retain maximum micronutrients due to minimal processing." },
    ],
  },
];

function AccordionItem({ faq, index, isOpen, onToggle }) {
  return (
    <div
      className="border-b border-gray-100 overflow-hidden transition-all duration-200"
      style={{ borderLeft: isOpen ? "2px solid #C9A84C" : "2px solid transparent" }}
    >
      <button
        onClick={() => onToggle(index)}
        className="w-full flex items-start justify-between gap-6 px-6 py-5 text-left group"
      >
        <span className="font-sans text-sm font-medium text-brand-brown leading-snug group-hover:text-brand-gold transition-colors"
          style={{ letterSpacing: "0.1px" }}>
          {faq.q}
        </span>
        <ChevronDown
          size={16}
          className="flex-shrink-0 text-brand-gold mt-0.5 transition-transform duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-6 pb-6 pt-0">
              <p className="text-gray-500 text-sm leading-relaxed" style={{ lineHeight: "1.8" }}>{faq.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [search, setSearch] = useState("");

  const handleToggle = (i) => setOpenFaq(openFaq === i ? null : i);

  const searchResults = search
    ? FAQ_CATEGORIES.flatMap(c => c.faqs).filter(
        f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const displayFaqs = search ? searchResults : FAQ_CATEGORIES[activeTab].faqs;

  // FAQPage structured data — lets Google show expandable Q&A directly in
  // search results (rich snippets), which is free extra visibility/clicks.
  useEffect(() => {
    const allFaqs = FAQ_CATEGORIES.flatMap((c) => c.faqs);
    const el = document.getElementById("sd-faq") || document.createElement("script");
    el.id = "sd-faq";
    el.type = "application/ld+json";
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: allFaqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Frequently Asked Questions"
        description="Answers about Jai Shree Dryfruits orders, shipping, quality, payments & returns. Everything you need to know before you shop premium dry fruits online."
      />
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0D1B2A 0%, #1B2E4B 60%, #243D63 100%)" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #C9A84C 0%, transparent 40%)" }} />
        <div className="relative max-w-3xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="sec-tag justify-center mb-5" style={{ color: "#C9A84C" }}>Help Centre</p>
            <h1 className="font-serif text-white mb-5" style={{ fontSize: "clamp(32px,5vw,58px)", fontWeight: 400, lineHeight: 1.1 }}>
              Frequently Asked <em style={{ color: "#E2C06A" }}>Questions</em>
            </h1>
            <p className="text-white/50 text-sm leading-relaxed max-w-md mx-auto mb-10">
              Everything you need to know about our products, shipping, payments, and returns.
            </p>
            {/* Search */}
            <div className="relative max-w-lg mx-auto">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search your question..."
                value={search}
                onChange={e => { setSearch(e.target.value); setOpenFaq(null); }}
                className="w-full pl-11 pr-4 py-4 bg-white/8 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:border-brand-gold text-sm transition-all"
                style={{ backdropFilter: "blur(8px)" }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Category Tabs */}
        {!search && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex gap-0 mb-0 border border-gray-100 overflow-x-auto"
          >
            {FAQ_CATEGORIES.map((cat, i) => (
              <button
                key={cat.cat}
                onClick={() => { setActiveTab(i); setOpenFaq(null); }}
                className="flex-shrink-0 flex items-center gap-2.5 px-6 py-4 text-xs font-semibold tracking-widest uppercase transition-all border-r border-gray-100 last:border-r-0"
                style={
                  activeTab === i
                    ? { background: "#1B2E4B", color: "#C9A84C" }
                    : { background: "#fff", color: "#8A9AAA" }
                }
              >
                <cat.Icon size={13} />
                <span className="hidden sm:inline">{cat.cat}</span>
              </button>
            ))}
          </motion.div>
        )}

        {/* FAQ Accordion */}
        <div className="border border-gray-100 bg-white" style={{ borderTop: search ? undefined : "none" }}>
          {search && searchResults.length === 0 ? (
            <div className="text-center py-20">
              <Search size={32} className="text-gray-200 mx-auto mb-4" />
              <p className="font-serif text-xl text-brand-brown mb-2">No results found</p>
              <p className="text-gray-400 text-sm mb-6">
                Try different keywords or ask us directly
              </p>
              <a
                href="https://wa.me/917568577968"
                target="_blank" rel="noreferrer"
                className="btn-primary inline-flex text-sm px-6 py-3"
              >
                Ask on WhatsApp
              </a>
            </div>
          ) : (
            displayFaqs.map((faq, i) => (
              <AccordionItem
                key={i}
                faq={faq}
                index={i}
                isOpen={openFaq === i}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-3 gap-px bg-gray-100 border border-gray-100 mt-16"
        >
          {[
            { val: "22+", label: "Questions Answered" },
            { val: "5", label: "Topic Categories" },
            { val: "24h", label: "Response Time" },
          ].map(s => (
            <div key={s.label} className="bg-white text-center py-8 px-4">
              <p className="font-serif text-3xl font-normal text-brand-brown mb-1">{s.val}</p>
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 p-10 text-center"
          style={{ background: "linear-gradient(135deg, #1B2E4B 0%, #243D63 100%)" }}
        >
          <p className="text-white/40 text-xs tracking-[3px] uppercase mb-3">Still have questions?</p>
          <h3 className="font-serif text-2xl text-white font-normal mb-6">We're here to help</h3>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href="https://wa.me/917568577968"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 transition-all hover:scale-[1.02]"
              style={{ background: "#25D366" }}
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
            <a
              href="mailto:info@jaishreedryfuits.com"
              className="inline-flex items-center gap-2 border border-white/25 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 hover:bg-white/10 transition-all"
            >
              <Mail size={14} /> Email Us
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-brand-gold text-brand-brown text-xs font-bold uppercase tracking-widest px-6 py-3 hover:bg-brand-gold-light transition-all"
            >
              Contact Page <ArrowRight size={13} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
