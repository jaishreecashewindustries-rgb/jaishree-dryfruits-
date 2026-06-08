import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(form.email, form.password);
        navigate(from, { replace: true });
      } else if (mode === "register") {
        if (form.password !== form.confirm) { toast.error("Passwords don't match!"); return; }
        await registerWithEmail(form.email, form.password, form.name);
        navigate(from, { replace: true });
      } else {
        await resetPassword(form.email);
        setMode("login");
      }
    } catch (err) {
      toast.error(err.message?.replace("Firebase: ", "").replace(" (auth/...)", "") || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      toast.error("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "linear-gradient(160deg, #F4F6FF 0%, #E8ECF8 50%, #F4F6FF 100%)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="Jai Shree Dry Fruits" className="h-16 w-auto mx-auto drop-shadow-md hover:scale-105 transition-transform" />
          </Link>
          <p className="text-brand-brown/50 text-xs tracking-widest uppercase mt-2 font-medium">Your Premium Dry Fruits Store</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Tabs */}
          {mode !== "forgot" && (
            <div className="flex bg-gray-100 rounded-xl p-1 mb-7">
              {["login", "register"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${mode === m ? "bg-white shadow text-brand-brown" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          {mode === "forgot" && (
            <h2 className="font-serif text-2xl font-bold text-brand-brown mb-6 text-center">Reset Password</h2>
          )}

          {/* Google login */}
          {mode !== "forgot" && (
            <>
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 mb-5"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or continue with email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input name="name" value={form.name} onChange={handle} type="text" placeholder="Full Name" required className="input-field pl-9" />
              </div>
            )}
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="email" value={form.email} onChange={handle} type="email" placeholder="Email address" required className="input-field pl-9" />
            </div>
            {mode !== "forgot" && (
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input name="password" value={form.password} onChange={handle} type={showPwd ? "text" : "password"} placeholder="Password" required className="input-field pl-9 pr-10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}
            {mode === "register" && (
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input name="confirm" value={form.confirm} onChange={handle} type={showPwd ? "text" : "password"} placeholder="Confirm Password" required className="input-field pl-9" />
              </div>
            )}

            {mode === "login" && (
              <div className="text-right">
                <button type="button" onClick={() => setMode("forgot")} className="text-xs text-brand-gold hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-lg text-white font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #2C4B8C 0%, #1A2744 100%)", boxShadow: "0 4px 20px rgba(26,39,68,0.35)" }}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Send Reset Email"}
            </button>

            {mode === "forgot" && (
              <button type="button" onClick={() => setMode("login")} className="w-full text-center text-sm text-gray-500 hover:text-brand-brown transition-colors">
                ← Back to Sign In
              </button>
            )}
          </form>

          {mode === "login" && (
            <p className="text-center text-xs text-gray-400 mt-6">
              By signing in, you agree to our{" "}
              <Link to="/terms" className="text-brand-gold hover:underline">Terms</Link> and{" "}
              <Link to="/privacy" className="text-brand-gold hover:underline">Privacy Policy</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
