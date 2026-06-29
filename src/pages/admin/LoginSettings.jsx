import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Lock, Phone, Mail, Chrome, Save, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";

const DEFAULT_SETTINGS = {
  emailPasswordEnabled: true,
  googleEnabled: true,
  phoneOtpEnabled: true,
};

const METHOD_INFO = [
  {
    key: "emailPasswordEnabled",
    icon: Mail,
    label: "Email & Password",
    desc: "Classic email + password login. Users can register and reset password via email.",
    color: "text-blue-600 bg-blue-50",
  },
  {
    key: "googleEnabled",
    icon: Chrome,
    label: "Google Sign-In",
    desc: "One-tap Google OAuth login. Recommended — lowest friction for new users.",
    color: "text-red-500 bg-red-50",
  },
  {
    key: "phoneOtpEnabled",
    icon: Phone,
    label: "Phone OTP (SMS)",
    desc: "Firebase Phone Auth sends a 6-digit OTP via SMS to the user's Indian mobile number.",
    color: "text-green-600 bg-green-50",
  },
];

export default function LoginSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "app_settings", "login"));
        if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const toggle = (key) => {
    const active = Object.values({ ...settings, [key]: !settings[key] }).filter(Boolean).length;
    if (active === 0) { toast.error("At least one login method must remain active"); return; }
    setSettings(s => ({ ...s, [key]: !s[key] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "app_settings", "login"), settings);
      toast.success("Login settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 animate-pulse rounded-xl" />
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-brown">Login Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Control which login methods are available to customers</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 btn-primary py-2.5 px-5 text-sm"
        >
          <Save size={15} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Status banner */}
      <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(27,46,75,0.05)", border: "1px solid rgba(27,46,75,0.08)" }}>
        <ShieldCheck size={18} className="text-brand-gold flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-brand-brown">Secure Authentication</p>
          <p className="text-xs text-gray-400">Powered by Firebase Authentication. Changes take effect immediately on the live site.</p>
        </div>
      </div>

      {/* Method cards */}
      <div className="space-y-3">
        {METHOD_INFO.map(({ key, icon: Icon, label, desc, color }) => {
          const enabled = settings[key];
          return (
            <div
              key={key}
              className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${enabled ? "border-gray-100" : "border-gray-100 opacity-60"}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-brand-brown">{label}</p>
                    <button
                      onClick={() => toggle(key)}
                      className="flex items-center gap-2 transition-all"
                      title={enabled ? "Click to disable" : "Click to enable"}
                    >
                      {enabled ? (
                        <><ToggleRight size={28} className="text-green-500" /><span className="text-xs font-semibold text-green-600">Active</span></>
                      ) : (
                        <><ToggleLeft size={28} className="text-gray-300" /><span className="text-xs font-semibold text-gray-400">Disabled</span></>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{desc}</p>

                  {key === "phoneOtpEnabled" && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="text-xs font-semibold text-amber-700 mb-1">Firebase Setup Required</p>
                      <p className="text-xs text-amber-600">
                        Enable Phone Authentication in Firebase Console → Authentication → Sign-in method. SMS charges apply per-country.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info note */}
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-500">
        <strong className="text-gray-700">Note:</strong> Disabling a login method here shows/hides the option on the login page but does not revoke existing sessions. At least one method must always remain active.
      </div>
    </div>
  );
}
