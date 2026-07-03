import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, User, ArrowRight, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import SEO from "../components/SEO";

// Static seed posts (shown if Firestore empty)
export const SEED_POSTS = [
  {
    id: "almond-benefits",
    title: "10 Science-Backed Benefits of Eating Almonds Daily",
    excerpt: "From brain health to heart protection, almonds are one of nature's most powerful superfoods. Here's what happens to your body when you eat a handful every day.",
    category: "Health & Nutrition",
    author: "Jitesh Pansari",
    date: "5 Jun 2025",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800&q=80",
    tags: ["Almonds", "Health", "Nutrition"],
    featured: true,
  },
  {
    id: "cashew-grades-explained",
    title: "W180, W240, W320: The Ultimate Guide to Cashew Grades",
    excerpt: "Confused by cashew grade labels? We break down every grade — what the numbers mean, which grade suits which use case, and how to choose the right one for your business or kitchen.",
    category: "Product Guide",
    author: "Praveen Pansari",
    date: "1 Jun 2025",
    readTime: "7 min",
    image: "https://images.unsplash.com/photo-1573555657105-47a0bb37c3ea?w=800&q=80",
    tags: ["Cashews", "Grades", "B2B"],
    featured: false,
  },
  {
    id: "diwali-gifting-guide",
    title: "The Ultimate Diwali Dry Fruit Gifting Guide 2025",
    excerpt: "From corporate gifting to family hampers — our complete guide to choosing the perfect dry fruit gift box this Diwali. Includes budget ranges and personalisation tips.",
    category: "Gifting",
    author: "Jitesh Pansari",
    date: "28 May 2025",
    readTime: "4 min",
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80",
    tags: ["Gifting", "Diwali", "Gift Hampers"],
    featured: false,
  },
  {
    id: "walnuts-brain-food",
    title: "Why Walnuts Are Called 'Brain Food' — The Science",
    excerpt: "The walnut's uncanny resemblance to a human brain isn't coincidence. Packed with Omega-3, DHA, and antioxidants, find out exactly how walnuts support cognitive function.",
    category: "Health & Nutrition",
    author: "Jitesh Pansari",
    date: "22 May 2025",
    readTime: "6 min",
    image: "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?w=800&q=80",
    tags: ["Walnuts", "Brain Health", "Omega-3"],
    featured: false,
  },
  {
    id: "dates-ramadan",
    title: "Medjool vs Ajwa vs Safawi: Which Dates Should You Buy?",
    excerpt: "Not all dates are created equal. A deep dive into the three most popular premium date varieties — their origin, taste profile, nutritional differences, and best uses.",
    category: "Product Guide",
    author: "Praveen Pansari",
    date: "18 May 2025",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1691657917109-c6e027eac44a?w=800&q=80",
    tags: ["Dates", "Guide"],
    featured: false,
  },
  {
    id: "dry-fruits-for-kids",
    title: "Best Dry Fruits for Kids (Age-wise Guide for Indian Parents)",
    excerpt: "When to introduce which dry fruit, how much is safe, and the smartest ways to include them in your child's diet — a practical guide from nutrition experts.",
    category: "Health & Nutrition",
    author: "Jitesh Pansari",
    date: "12 May 2025",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1502825751399-28baa9b81efe?w=800&q=80",
    tags: ["Kids", "Nutrition", "Parenting"],
    featured: false,
  },
];

const ALL_CATS = ["All", "Health & Nutrition", "Product Guide", "Gifting", "Sourcing & Farming", "Recipes"];

export default function Blog() {
  const [posts, setPosts] = useState(SEED_POSTS);
  const [activeTag, setActiveTag] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, "blog_posts"), where("published", "==", true), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setPosts([...snap.docs.map(d => ({ id: d.id, ...d.data() })), ...SEED_POSTS]);
        }
      } catch (e) { /* use seed */ }
    };
    load();
  }, []);

  const filtered = posts.filter(p => {
    if (activeTag !== "All" && p.category !== activeTag) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.excerpt.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const featured = filtered.find(p => p.featured);
  const rest = filtered.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Blog — Dry Fruit Guides & Health Tips"
        description="Cashew grades, almond health benefits, gifting guides & sourcing stories from Jai Shree Dryfruits — practical dry fruit knowledge from a 25+ year Jaipur-based supplier."
      />
      {/* Hero */}
      <div className="py-14 px-4 text-center" style={{ background: "linear-gradient(135deg, #0D1B2A 0%, #1B2E4B 100%)" }}>
        <p className="sec-tag justify-center mb-3" style={{ color: "#C9A84C" }}>Our Blog</p>
        <h1 className="section-title text-white mb-3">Insights, <em style={{ color: "#E2C06A" }}>Recipes & Guides</em></h1>
        <p className="text-white/50 text-sm max-w-sm mx-auto">Expert knowledge about dry fruits, health, nutrition, and the stories behind our sourcing.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          {ALL_CATS.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTag(cat)}
              className={`px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all ${activeTag === cat ? "text-white" : "bg-gray-50 text-gray-500 border border-gray-200 hover:border-brand-brown"}`}
              style={activeTag === cat ? { background: "var(--navy)", color: "white" } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {featured && activeTag === "All" && !search && (
          <Link to={`/blog/${featured.id}`} className="group block mb-10">
            <div className="grid md:grid-cols-2 overflow-hidden" style={{ border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(27,46,75,0.08)" }}>
              <div className="relative overflow-hidden aspect-[4/3] md:aspect-auto">
                <img src={featured.image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <span className="absolute top-4 left-4 bg-brand-gold text-brand-brown text-xs font-bold px-3 py-1 tracking-wider uppercase">Featured</span>
              </div>
              <div className="p-8 md:p-10 flex flex-col justify-center" style={{ background: "linear-gradient(135deg, #1B2E4B, #243D63)" }}>
                <span className="text-brand-gold text-xs font-semibold tracking-widest uppercase mb-3">{featured.category}</span>
                <h2 className="font-serif text-2xl md:text-3xl text-white font-normal leading-tight mb-4 group-hover:text-brand-gold-light transition-colors">{featured.title}</h2>
                <p className="text-white/60 text-sm leading-relaxed mb-6">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-white/40 text-xs">
                  <span className="flex items-center gap-1.5"><User size={12} />{featured.author}</span>
                  <span className="flex items-center gap-1.5"><Clock size={12} />{featured.readTime} read</span>
                </div>
                <div className="mt-6 flex items-center gap-2 text-brand-gold text-sm font-semibold">Read Article <ArrowRight size={16} /></div>
              </div>
            </div>
          </Link>
        )}

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(search || activeTag !== "All" ? filtered : rest).map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: Math.min(i, 6) * 0.04, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link to={`/blog/${post.id}`} className="group card-luxury overflow-hidden block">
                <div className="relative overflow-hidden" style={{ height: 200 }}>
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <span className="absolute top-3 left-3 bg-white text-brand-brown text-xs font-semibold px-2 py-1">{post.category}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg text-brand-brown font-normal leading-snug mb-3 group-hover:text-brand-gold transition-colors line-clamp-2">{post.title}</h3>
                  <p className="text-brand-text-soft text-xs leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                    <span className="flex items-center gap-1.5"><User size={11} />{post.author}</span>
                    <span className="flex items-center gap-1.5"><Clock size={11} />{post.readTime} read</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📝</p>
            <p className="font-semibold text-gray-600">No posts found</p>
          </div>
        )}
      </div>
    </div>
  );
}
