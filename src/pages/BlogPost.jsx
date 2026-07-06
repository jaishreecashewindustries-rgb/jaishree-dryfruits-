import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../firebase/config";
import { ArrowLeft, Clock, User, Tag, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { SEED_POSTS } from "./Blog";
import { useProducts } from "../context/ProductsContext";
import ProductCard from "../components/ProductCard";

export default function BlogPost() {
  const { id } = useParams();
  const { products } = useProducts();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    setLoading(true);
    // Check seed posts first
    const seed = SEED_POSTS.find(p => p.id === id);
    if (seed) {
      setPost(seed);
      setRelated(SEED_POSTS.filter(p => p.id !== id && p.category === seed.category).slice(0, 3));
      setLoading(false);
      return;
    }
    // Then check Firestore
    try {
      const snap = await getDoc(doc(db, "blog_posts", id));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setPost(data);
        // Load related by same category
        const relSnap = await getDocs(
          query(collection(db, "blog_posts"), where("category", "==", data.category), limit(4))
        );
        setRelated(
          relSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(p => p.id !== id)
            .slice(0, 3)
        );
      } else {
        setPost(null);
      }
    } catch (e) {
      setPost(null);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <p className="text-5xl mb-4">📄</p>
        <h1 className="font-serif text-2xl font-bold text-brand-brown mb-2">Post Not Found</h1>
        <p className="text-gray-400 mb-6">This article doesn't exist or has been removed.</p>
        <Link to="/blog" className="btn-primary">Back to Blog</Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-white"
    >
      {/* Hero */}
      <div className="relative" style={{ background: "linear-gradient(135deg, #0D1B2A 0%, #1B2E4B 100%)" }}>
        {post.image && (
          <img
            src={post.image}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        )}
        <div className="relative max-w-3xl mx-auto px-4 py-20 text-center">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-brand-gold text-xs font-semibold tracking-widest uppercase mb-6 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={14} /> Back to Blog
          </Link>
          <p className="text-brand-gold text-xs font-semibold tracking-[3px] uppercase mb-4">{post.category}</p>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-white leading-tight mb-6">{post.title}</h1>
          <div className="flex items-center justify-center gap-6 text-white/50 text-xs">
            {post.author && (
              <span className="flex items-center gap-1.5">
                <User size={12} /> {post.author}
              </span>
            )}
            {post.readTime && (
              <span className="flex items-center gap-1.5">
                <Clock size={12} /> {post.readTime} read
              </span>
            )}
            {post.date && (
              <span className="flex items-center gap-1.5">
                <Calendar size={12} /> {post.date}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-14">
        {post.image && (
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover rounded-xl mb-10 shadow-md"
          />
        )}

        {/* Excerpt / lead */}
        {post.excerpt && (
          <p className="font-serif text-xl text-brand-brown leading-relaxed mb-8 border-l-4 border-brand-gold pl-5 italic">
            {post.excerpt}
          </p>
        )}

        {/* Full content */}
        {post.content ? (
          <div
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            style={{ lineHeight: "1.9" }}
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br/>") }}
          />
        ) : (
          /* Fallback: render sections from seed post */
          post.sections && (
            <div className="space-y-10">
              {post.sections.map((section, i) => (
                <div key={i}>
                  {section.heading && (
                    <h2 className="font-serif text-2xl font-bold text-brand-brown mb-4">{section.heading}</h2>
                  )}
                  {section.text && (
                    <p className="text-gray-700 leading-loose">{section.text}</p>
                  )}
                  {section.list && (
                    <ul className="space-y-2 mt-3">
                      {section.list.map((item, j) => (
                        <li key={j} className="flex items-start gap-3 text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="flex items-center gap-3 flex-wrap">
              <Tag size={14} className="text-brand-gold" />
              {(Array.isArray(post.tags) ? post.tags : post.tags.split(",")).map(tag => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 bg-brand-cream text-brand-brown font-semibold uppercase tracking-wider"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Shop Related Products — matched by tag/category against this
            post's tags, so a post tagged "Almonds" links straight to
            almond products instead of a generic /products CTA. Real
            internal linking between content and catalog pages, which
            search engines weight for topical relevance. */}
        {(() => {
          const postTags = (Array.isArray(post.tags) ? post.tags : (post.tags || "").split(",")).map((t) => t.trim().toLowerCase()).filter(Boolean);
          const shopRelated = products.filter((p) =>
            postTags.some((t) => p.category?.toLowerCase().includes(t) || p.name?.toLowerCase().includes(t))
          ).slice(0, 4);
          return shopRelated.length > 0 ? (
            <div className="mt-14 pt-8 border-t border-gray-100">
              <h2 className="font-serif text-xl font-bold text-brand-brown mb-6">Shop What's Mentioned</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {shopRelated.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          ) : null;
        })()}

        {/* CTA */}
        <div
          className="mt-14 rounded-xl p-8 text-center"
          style={{ background: "linear-gradient(135deg, #1B2E4B, #243D63)" }}
        >
          <p className="font-serif text-2xl font-bold text-white mb-2">Shop Premium Dry Fruits</p>
          <p className="text-white/60 text-sm mb-6">Fresh stock. Directly sourced. Delivered to your door.</p>
          <Link to="/products" className="btn-gold inline-block px-8 py-3">
            Browse Products
          </Link>
        </div>
      </div>

      {/* Related Posts */}
      {related.length > 0 && (
        <div className="bg-brand-cream py-14">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="font-serif text-2xl font-bold text-brand-brown mb-8 text-center">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map(rp => (
                <Link
                  key={rp.id}
                  to={`/blog/${rp.id}`}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                >
                  {rp.image && (
                    <img
                      src={rp.image}
                      alt={rp.title}
                      className="w-full h-40 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  )}
                  <div className="p-5">
                    <p className="text-brand-gold text-xs font-semibold tracking-widest uppercase mb-2">{rp.category}</p>
                    <h3 className="font-serif text-base font-bold text-brand-brown leading-snug mb-2 line-clamp-2">{rp.title}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Clock size={10} /> {rp.readTime || "5 min"} read
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
