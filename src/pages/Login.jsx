import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, ChevronRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// Login method tabs: email/password, phone OTP, email OTP, Google
const METHODS = [
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone OTP" },
  { id: "emailOtp", label: "Email OTP" },
];

export default function Login() {
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [method, setMethod] = useState("email"); // email | phone | emailOtp
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Phone OTP state
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);

  // Email OTP state (login) — reuses the same 6-box `otp` array above
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpAddress, setEmailOtpAddress] = useState("");

  // Forgot-password OTP state — step 1: request code, step 2: enter code + new password
  const [resetStep, setResetStep] = useState("email"); // email | verify
  const [resetOtp, setResetOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");

  const {
    user, loginWithEmail, registerWithEmail, loginWithGoogle,
    sendPhoneOTP, verifyPhoneOTP,
    sendEmailOTP, verifyEmailOTPLogin, verifyEmailOTPReset,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  // Mobile Google sign-in uses a full-page redirect (see AuthContext) — the
  // page reloads back on this same /login route once it completes, so there's
  // no in-flight promise to await here. Once `user` becomes truthy, move on.
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user]);

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
      }
    } catch (err) {
      // Existing-user sign-in failing because there's no account with these
      // details is a very different situation from a wrong password — point
      // them at Create Account instead of a generic Firebase error string.
      const noAccountCodes = ["auth/user-not-found", "auth/invalid-credential", "auth/wrong-password"];
      if (mode === "login" && noAccountCodes.includes(err.code)) {
        toast.error("No account found with these details. Please create a new account first.");
        setMode("register");
      } else {
        toast.error(err.message?.replace("Firebase: ", "").split(" (auth/")[0] || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password — OTP code, not the old email-link flow ──
  const handleSendResetOTP = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) { toast.error("Enter your email"); return; }
    setLoading(true);
    try {
      await sendEmailOTP(form.email.trim(), "reset");
      setResetStep("verify");
      toast.success("If that account exists, a code has been sent.");
    } catch (err) {
      toast.error(err.message || "Could not send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOTP = async () => {
    const code = resetOtp.join("");
    if (code.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    if (newPassword.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await verifyEmailOTPReset(form.email.trim(), code, newPassword);
      setMode("login");
      setResetStep("email");
      setResetOtp(["", "", "", "", "", ""]);
      setNewPassword("");
    } catch (err) {
      toast.error(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  // ── Email OTP login ──
  const handleSendEmailLoginOTP = async () => {
    if (!form.email.trim()) { toast.error("Enter your email"); return; }
    setOtpLoading(true);
    try {
      await sendEmailOTP(form.email.trim(), "login");
      setEmailOtpAddress(form.email.trim());
      setEmailOtpSent(true);
      toast.success("If that account exists, a code has been sent.");
    } catch (err) {
      toast.error(err.message || "Could not send code");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyEmailLoginOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setOtpLoading(true);
    try {
      await verifyEmailOTPLogin(emailOtpAddress, code);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || "Invalid code");
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch {
      toast.error("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) { toast.error("Enter a valid 10-digit mobile number"); return; }
    setOtpLoading(true);
    try {
      await sendPhoneOTP(`+91${digits}`);
      setOtpSent(true);
    } catch (err) {
      toast.error(err.message?.replace("Firebase: ", "").split(" (auth/")[0] || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) { toast.error("Enter the 6-digit OTP"); return; }
    setOtpLoading(true);
    try {
      await verifyPhoneOTP(code);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message?.replace("Firebase: ", "").split(" (auth/")[0] || "Invalid OTP");
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-start md:items-center justify-center px-4 pt-8 pb-24 md:py-12"
      style={{ background: "linear-gradient(160deg, #F4F6FF 0%, #E8ECF8 50%, #F4F6FF 100%)" }}
    >
      <div className="w-full max-w-md">
        {/* Back to home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-4"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-brown/60 hover:text-brand-gold transition-colors"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="Jai Shree Dry Fruits" className="h-16 w-auto mx-auto drop-shadow-md hover:scale-105 transition-transform" />
          </Link>
          <p className="text-brand-brown/50 text-xs tracking-widest uppercase mt-2 font-medium">Your Premium Dry Fruits Store</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${method}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
            >

              {/* ── Forgot password ── */}
              {mode === "forgot" ? (
                <>
                  <button onClick={() => { setMode("login"); setResetStep("email"); setResetOtp(["", "", "", "", "", ""]); setNewPassword(""); }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-brown mb-5 transition-colors">
                    <ArrowLeft size={14} /> Back to Sign In
                  </button>
                  <h2 className="font-serif text-2xl font-bold text-brand-brown mb-1">Reset Password</h2>
                  {resetStep === "email" ? (
                    <>
                      <p className="text-sm text-gray-500 mb-6">We'll email you a 6-digit code.</p>
                      <form onSubmit={handleSendResetOTP} className="space-y-4">
                        <div className="relative">
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input name="email" value={form.email} onChange={handle} type="email" placeholder="Email address" required className="input-field pl-9" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-3.5 rounded-lg text-white font-semibold disabled:opacity-60 transition-all hover:scale-[1.02]"
                          style={{ background: "linear-gradient(135deg, #2C4B8C, #1A2744)" }}>
                          {loading ? "Sending..." : "Send Code"}
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500 mb-6">Enter the code sent to {form.email} and choose a new password.</p>
                      <div className="space-y-4">
                        <div className="flex gap-2 justify-between">
                          {resetOtp.map((d, i) => (
                            <input
                              key={i}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={d}
                              onChange={e => {
                                if (!/^\d?$/.test(e.target.value)) return;
                                const next = [...resetOtp]; next[i] = e.target.value; setResetOtp(next);
                                if (e.target.value && i < 5) document.getElementById(`reset-otp-${i + 1}`)?.focus();
                              }}
                              onKeyDown={e => { if (e.key === "Backspace" && !resetOtp[i] && i > 0) document.getElementById(`reset-otp-${i - 1}`)?.focus(); }}
                              id={`reset-otp-${i}`}
                              className="w-10 h-12 text-center text-lg font-bold border-2 rounded-xl focus:outline-none transition-colors"
                              style={{ borderColor: d ? "#C9A84C" : "#E2E8F0", color: "#1B2E4B", fontSize: 20 }}
                              autoFocus={i === 0}
                            />
                          ))}
                        </div>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type={showPwd ? "text" : "password"} placeholder="New password" className="input-field pl-9 pr-10" style={{ fontSize: 16 }} />
                          <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <button onClick={handleVerifyResetOTP} disabled={loading} className="w-full py-3.5 rounded-lg text-white font-semibold disabled:opacity-60 transition-all"
                          style={{ background: "linear-gradient(135deg, #2C4B8C, #1A2744)" }}>
                          {loading ? "Updating..." : "Reset Password"}
                        </button>
                        <button type="button" onClick={handleSendResetOTP} className="text-xs text-brand-gold hover:underline block mx-auto">Resend code</button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Mode tabs: Sign In / Create Account */}
                  <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                    {["login", "register"].map((m) => (
                      <button
                        key={m}
                        onClick={() => { setMode(m); setOtpSent(false); setOtp(["","","","","",""]); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${mode === m ? "bg-white shadow text-brand-brown" : "text-gray-500 hover:text-gray-700"}`}
                      >
                        {m === "login" ? "Sign In" : "Create Account"}
                      </button>
                    ))}
                  </div>

                  {/* Google */}
                  <button
                    onClick={handleGoogle}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 mb-4"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    Continue with Google
                  </button>

                  {/* Method switcher: Email | Phone OTP */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex-1 h-px bg-gray-200" />
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                      {METHODS.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setMethod(m.id); setOtpSent(false); setEmailOtpSent(false); setOtp(["","","","","",""]); }}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${method === m.id ? "bg-white shadow text-brand-brown" : "text-gray-500"}`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* ── EMAIL / PASSWORD ── */}
                  {method === "email" && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {mode === "register" && (
                        <div className="relative">
                          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input name="name" value={form.name} onChange={handle} type="text" placeholder="Full Name" required className="input-field pl-9" />
                        </div>
                      )}
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input name="email" value={form.email} onChange={handle} type="email" placeholder="Email address" required className="input-field pl-9" style={{ fontSize: 16 }} />
                      </div>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input name="password" value={form.password} onChange={handle} type={showPwd ? "text" : "password"} placeholder="Password" required className="input-field pl-9 pr-10" style={{ fontSize: 16 }} />
                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {mode === "register" && (
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input name="confirm" value={form.confirm} onChange={handle} type={showPwd ? "text" : "password"} placeholder="Confirm Password" required className="input-field pl-9" style={{ fontSize: 16 }} />
                        </div>
                      )}
                      {mode === "login" && (
                        <div className="text-right -mt-1">
                          <button type="button" onClick={() => setMode("forgot")} className="text-xs text-brand-gold hover:underline">Forgot password?</button>
                        </div>
                      )}
                      <button type="submit" disabled={loading} className="w-full py-3.5 rounded-lg text-white font-semibold disabled:opacity-60 transition-all hover:scale-[1.02] hover:shadow-lg"
                        style={{ background: "linear-gradient(135deg, #2C4B8C 0%, #1A2744 100%)", boxShadow: "0 4px 20px rgba(26,39,68,0.35)" }}>
                        {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
                      </button>
                    </form>
                  )}

                  {/* ── PHONE OTP ── */}
                  {method === "phone" && (
                    <div className="space-y-5">
                      {!otpSent ? (
                        <>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-2">Mobile Number</label>
                            <div className="flex gap-2">
                              <div className="flex items-center px-3 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 flex-shrink-0">
                                🇮🇳 +91
                              </div>
                              <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                                placeholder="10-digit mobile number"
                                className="input-field flex-1"
                                style={{ fontSize: 16 }}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">A 6-digit OTP will be sent via SMS</p>
                          </div>

                          {/* invisible recaptcha anchor */}
                          <button
                            id="phone-otp-btn"
                            onClick={handleSendOTP}
                            disabled={otpLoading || phone.length < 10}
                            className="w-full py-3.5 rounded-lg text-white font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, #C9A84C, #9E7A2E)", boxShadow: "0 4px 20px rgba(201,168,76,0.3)" }}
                          >
                            {otpLoading ? (
                              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending OTP...</>
                            ) : (
                              <><Phone size={16} />Send OTP</>
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-xs font-semibold text-gray-500">Enter OTP sent to +91 {phone}</label>
                              <button onClick={() => { setOtpSent(false); setOtp(["","","","","",""]); }} className="text-xs text-brand-gold hover:underline">Change</button>
                            </div>
                            {/* 6-box OTP input */}
                            <div className="flex gap-2 justify-between">
                              {otp.map((d, i) => (
                                <input
                                  key={i}
                                  id={`otp-${i}`}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  value={d}
                                  onChange={e => handleOtpChange(i, e.target.value)}
                                  onKeyDown={e => handleOtpKeyDown(i, e)}
                                  className="w-10 h-12 text-center text-lg font-bold border-2 rounded-xl focus:outline-none transition-colors"
                                  style={{
                                    borderColor: d ? "#C9A84C" : "#E2E8F0",
                                    color: "#1B2E4B",
                                    fontSize: 20,
                                  }}
                                  onFocus={e => e.currentTarget.style.borderColor = "#C9A84C"}
                                  onBlur={e => e.currentTarget.style.borderColor = d ? "#C9A84C" : "#E2E8F0"}
                                  autoFocus={i === 0}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2 text-center">
                              Didn't receive it?{" "}
                              <button onClick={handleSendOTP} className="text-brand-gold hover:underline font-semibold">Resend OTP</button>
                            </p>
                          </div>

                          <button
                            onClick={handleVerifyOTP}
                            disabled={otpLoading || otp.join("").length < 6}
                            className="w-full py-3.5 rounded-lg text-white font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, #2C4B8C, #1A2744)", boxShadow: "0 4px 20px rgba(26,39,68,0.35)" }}
                          >
                            {otpLoading ? (
                              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Verifying...</>
                            ) : (
                              <>Verify & Sign In <ChevronRight size={16} /></>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── EMAIL OTP ── */}
                  {method === "emailOtp" && (
                    <div className="space-y-5">
                      {!emailOtpSent ? (
                        <>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-2">Email address</label>
                            <div className="relative">
                              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input name="email" value={form.email} onChange={handle} type="email" placeholder="Email address" className="input-field pl-9" style={{ fontSize: 16 }} />
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">A 6-digit code will be sent to your inbox</p>
                          </div>
                          <button
                            onClick={handleSendEmailLoginOTP}
                            disabled={otpLoading || !form.email.trim()}
                            className="w-full py-3.5 rounded-lg text-white font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, #C9A84C, #9E7A2E)", boxShadow: "0 4px 20px rgba(201,168,76,0.3)" }}
                          >
                            {otpLoading ? (
                              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending code...</>
                            ) : (
                              <><Mail size={16} />Send Code</>
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-xs font-semibold text-gray-500">Enter code sent to {emailOtpAddress}</label>
                              <button onClick={() => { setEmailOtpSent(false); setOtp(["", "", "", "", "", ""]); }} className="text-xs text-brand-gold hover:underline">Change</button>
                            </div>
                            <div className="flex gap-2 justify-between">
                              {otp.map((d, i) => (
                                <input
                                  key={i}
                                  id={`otp-${i}`}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  value={d}
                                  onChange={e => handleOtpChange(i, e.target.value)}
                                  onKeyDown={e => handleOtpKeyDown(i, e)}
                                  className="w-10 h-12 text-center text-lg font-bold border-2 rounded-xl focus:outline-none transition-colors"
                                  style={{ borderColor: d ? "#C9A84C" : "#E2E8F0", color: "#1B2E4B", fontSize: 20 }}
                                  onFocus={e => e.currentTarget.style.borderColor = "#C9A84C"}
                                  onBlur={e => e.currentTarget.style.borderColor = d ? "#C9A84C" : "#E2E8F0"}
                                  autoFocus={i === 0}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2 text-center">
                              Didn't receive it?{" "}
                              <button onClick={handleSendEmailLoginOTP} className="text-brand-gold hover:underline font-semibold">Resend code</button>
                            </p>
                          </div>
                          <button
                            onClick={handleVerifyEmailLoginOTP}
                            disabled={otpLoading || otp.join("").length < 6}
                            className="w-full py-3.5 rounded-lg text-white font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, #2C4B8C, #1A2744)", boxShadow: "0 4px 20px rgba(26,39,68,0.35)" }}
                          >
                            {otpLoading ? (
                              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Verifying...</>
                            ) : (
                              <>Verify & Sign In <ChevronRight size={16} /></>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  <p className="text-center text-xs text-gray-400 mt-5">
                    By continuing, you agree to our{" "}
                    <Link to="/terms" className="text-brand-gold hover:underline">Terms</Link> &amp;{" "}
                    <Link to="/privacy" className="text-brand-gold hover:underline">Privacy Policy</Link>
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
      {/* Invisible reCAPTCHA host for Firebase Phone OTP — required by sendPhoneOTP */}
      <div id="recaptcha-container" />
    </div>
  );
}
