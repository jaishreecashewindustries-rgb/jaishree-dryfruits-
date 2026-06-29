import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Shield } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, form.email, form.password);
      // Check if admin
      const userDoc = await getDoc(doc(db, "users", res.user.uid));
      if (userDoc.exists() && userDoc.data().role === "admin") {
        toast.success("Admin login successful! 👑");
        navigate("/admin");
      } else {
        await auth.signOut();
        toast.error("Access denied! Admin account required.");
      }
    } catch (err) {
      toast.error("Invalid credentials. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-brown flex items-center justify-center px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute text-6xl" style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: `rotate(${Math.random() * 360}deg)`
          }}>🌰</div>
        ))}
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-brand-gold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-white">JAI SHREE</h1>
          <p className="text-brand-gold text-xs tracking-widest font-semibold mt-1">DRYFRUITS — ADMIN PORTAL</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-white font-semibold text-lg text-center mb-6">🔐 Admin Login</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/70 text-xs font-semibold block mb-1.5">Admin Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@jaishree.com"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            <div>
              <label className="text-white/70 text-xs font-semibold block mb-1.5">Admin Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-11 text-white placeholder-white/30 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-brand-gold hover:bg-brand-gold-dark text-white font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg disabled:opacity-60 mt-2 flex items-center justify-center gap-2">
              <Lock size={18} />
              {loading ? "Verifying..." : "Login to Admin Panel"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <a href="/" className="text-white/40 text-xs hover:text-white/70 transition-colors">
              ← Back to Website
            </a>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          🔒 Secured Admin Access Only • JAI SHREE CASHEW INDUSTRIES
        </p>
      </div>
    </div>
  );
}
