import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Plus, Trash2, Edit2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { SEED_POSTS } from "../../pages/Blog";

const EMPTY_POST = { title: "", excerpt: "", category: "Health & Nutrition", author: "", readTime: "5 min", image: "", tags: "", content: "", published: false, featured: false };
const CATEGORIES = ["Health & Nutrition", "Product Guide", "Gifting", "Sourcing & Farming", "Recipes"];

export default function BlogManagement() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_POST);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "blog_posts"), orderBy("createdAt", "desc")));
      const firestorePosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts([...firestorePosts, ...SEED_POSTS.map(p => ({ ...p, isStatic: true }))]);
    } catch (e) {
      setPosts(SEED_POSTS.map(p => ({ ...p, isStatic: true })));
    }
    setLoading(false);
  };

  const save = async () => {
    if (!form.title || !form.excerpt) { toast.error("Title and excerpt required"); return; }
    const data = { ...form, tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [], createdAt: editing?.createdAt || new Date(), updatedAt: new Date() };
    try {
      if (editing && !editing.isStatic) {
        await updateDoc(doc(db, "blog_posts", editing.id), data);
        toast.success("Post updated!");
      } else {
        await addDoc(collection(db, "blog_posts"), data);
        toast.success("Post published!");
      }
      setShowForm(false); setEditing(null); setForm(EMPTY_POST); load();
    } catch (e) { toast.error("Save failed: " + e.message); }
  };

  const deletePost = async (id, isStatic) => {
    if (isStatic) { toast.error("Cannot delete built-in posts"); return; }
    if (!window.confirm("Delete this post?")) return;
    await deleteDoc(doc(db, "blog_posts", id));
    toast.success("Deleted"); load();
  };

  const edit = (p) => {
    setEditing(p);
    setForm({ ...EMPTY_POST, ...p, tags: Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || "") });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-brown">Blog Management</h1>
          <p className="text-sm text-gray-400">{posts.length} total posts</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY_POST); }} className="flex items-center gap-2 btn-primary text-sm px-4 py-2">
          <Plus size={16} /> New Post
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-brand-brown">{editing ? "Edit Post" : "New Blog Post"}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Title *</label>
              <input className="input-field text-sm" placeholder="Blog post title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Excerpt *</label>
              <textarea className="input-field text-sm resize-none" rows={2} placeholder="Short description..." value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
              <select className="input-field text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Author</label>
              <input className="input-field text-sm" placeholder="Jitesh Pansari" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cover Image URL</label>
              <input className="input-field text-sm" placeholder="https://..." value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tags (comma separated)</label>
              <input className="input-field text-sm" placeholder="Almonds, Health, Nutrition" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Content (HTML or text)</label>
              <textarea className="input-field text-sm resize-none font-mono" rows={6} placeholder="Full blog post content..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} className="accent-brand-brown" />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="accent-brand-gold" />
                Featured
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} className="btn-primary text-sm px-5 py-2">Save Post</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-outline text-sm px-5 py-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-3">
        {loading ? <div className="text-center py-10 text-gray-400">Loading posts...</div> : posts.map(post => (
          <div key={post.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
            {post.image && <img src={post.image} alt={post.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-brand-brown text-sm truncate">{post.title}</p>
                {post.isStatic && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Built-in</span>}
                {post.featured && <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">Featured</span>}
                {!post.isStatic && <span className={`text-xs px-2 py-0.5 rounded ${post.published ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>{post.published ? "Published" : "Draft"}</span>}
              </div>
              <p className="text-xs text-gray-400 truncate">{post.excerpt}</p>
              <p className="text-xs text-brand-gold mt-1">{post.category} · {post.readTime || "5 min"} read</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <a href={`/blog/${post.id}`} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"><Eye size={15} /></a>
              {!post.isStatic && <button onClick={() => edit(post)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={15} /></button>}
              {!post.isStatic && <button onClick={() => deletePost(post.id, post.isStatic)} className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 size={15} /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
