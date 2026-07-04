import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Save, Loader2, LayoutDashboard, Users, Home, MapPin, Phone, Star } from "lucide-react";
import ImageUpload from "../../components/ImageUpload";
import toast from "react-hot-toast";

const TABS = [
  { id: "hero", label: "Hero / Banner", icon: Home },
  { id: "about", label: "About & Story", icon: LayoutDashboard },
  { id: "team", label: "Team", icon: Users },
  { id: "sourcing", label: "Sourcing Story", icon: MapPin },
  { id: "contact", label: "Contact & Footer", icon: Phone },
  { id: "trust", label: "Trust Bar", icon: Star },
];

const DEFAULTS = {
  hero: {
    headline: "Premium Dry Fruits,\nDelivered Fresh",
    subheadline: "Sourced from the world's finest farms. Freshness guaranteed.",
    backgroundImage: "",
    ctaText: "Shop Premium Collection",
    ctaSecondary: "Our Story",
  },
  about: {
    storyTitle: "Our Story",
    storyText: "Founded with a passion for purity, Jai Shree Dry Fruits sources the finest nuts and dry fruits from trusted farms around the world.",
    missionTitle: "Our Mission",
    missionText: "To bring premium-quality, authentic dry fruits to every Indian home — fresh, pure, and fairly priced.",
    bannerImage: "",
    values: [
      { title: "Pure & Natural", desc: "No artificial preservatives or additives" },
      { title: "Ethically Sourced", desc: "Direct farm partnerships for fair pricing" },
      { title: "Quality Assured", desc: "Triple-tested for freshness and purity" },
    ],
  },
  team: {
    members: [
      { name: "Jitesh Pansari", title: "Co-Founder & CEO", bio: "Leads sourcing and quality control, carrying forward 25+ years of the family business built in Jaipur's Gangauri Bazar.", photo: "" },
      { name: "Praveen Pansari", title: "Co-Founder & COO", bio: "Oversees operations and logistics, ensuring every order across India is packed fresh and delivered on time.", photo: "" },
    ],
  },
  sourcing: {
    title: "From Farm to Your Table",
    text: "We travel to the source — California almonds, Iranian pistachios, Kashmiri walnuts — building direct relationships with farmers who share our commitment to quality.",
    image: "",
    highlights: [
      { label: "Farm Partners", value: "50+" },
      { label: "Countries Sourced", value: "12" },
      { label: "Quality Checks", value: "3-Stage" },
      { label: "Years Experience", value: "15+" },
    ],
  },
  contact: {
    phone: "+91 75685 77968",
    email: "info@jaishreedryfruits.com",
    address: "41, Barah Ji Ki Gali, Gangauri Bazar, Jaipur – 302001",
    whatsapp: "+91 75685 77968",
    footerTagline: "Premium Dry Fruits & Nuts — Fresh, Pure, Authentic",
    socialInstagram: "",
    socialFacebook: "",
    socialTwitter: "",
  },
  trust: {
    items: [
      { icon: "🌿", text: "100% Natural" },
      { icon: "🚚", text: "Free Delivery ₹999+" },
      { icon: "⭐", text: "4.9 Rated" },
      { icon: "🔒", text: "Secure Payments" },
      { icon: "↩️", text: "Easy Returns" },
    ],
  },
};

export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState("hero");
  const [data, setData] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "siteContent"));
        if (snap.exists()) {
          setData((prev) => ({ ...prev, ...snap.data() }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "siteContent"), { ...data, updatedAt: serverTimestamp() }, { merge: true });
      toast.success("Content saved!");
    } catch (e) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const update = (tab, field, value) => {
    setData((prev) => ({ ...prev, [tab]: { ...prev[tab], [field]: value } }));
  };

  const updateNested = (tab, arrayField, index, field, value) => {
    setData((prev) => {
      const arr = [...(prev[tab][arrayField] || [])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [tab]: { ...prev[tab], [arrayField]: arr } };
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <Loader2 size={32} className="animate-spin text-brand-gold" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-brown">Content Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Edit all website pages, photos, and text from here</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 py-2.5 px-5">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving…" : "Save All Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === t.id
                  ? "bg-brand-brown text-white shadow"
                  : "bg-white text-gray-500 hover:text-brand-brown"
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        {/* HERO */}
        {activeTab === "hero" && (
          <>
            <Section title="Homepage Hero Banner">
              <Field label="Main Headline">
                <textarea value={data.hero.headline} onChange={e => update("hero", "headline", e.target.value)} rows={2} className="input-field resize-none" />
              </Field>
              <Field label="Subheadline">
                <input value={data.hero.subheadline} onChange={e => update("hero", "subheadline", e.target.value)} className="input-field" />
              </Field>
              <Field label="Primary CTA Button Text">
                <input value={data.hero.ctaText} onChange={e => update("hero", "ctaText", e.target.value)} className="input-field" />
              </Field>
              <Field label="Secondary CTA Text">
                <input value={data.hero.ctaSecondary} onChange={e => update("hero", "ctaSecondary", e.target.value)} className="input-field" />
              </Field>
              <ImageUpload label="Hero Background Image" value={data.hero.backgroundImage} onChange={url => update("hero", "backgroundImage", url)} folder="content/hero" />
            </Section>
          </>
        )}

        {/* ABOUT */}
        {activeTab === "about" && (
          <>
            <Section title="Our Story Section">
              <Field label="Section Title">
                <input value={data.about.storyTitle} onChange={e => update("about", "storyTitle", e.target.value)} className="input-field" />
              </Field>
              <Field label="Story Text">
                <textarea value={data.about.storyText} onChange={e => update("about", "storyText", e.target.value)} rows={4} className="input-field resize-none" />
              </Field>
              <Field label="Mission Title">
                <input value={data.about.missionTitle} onChange={e => update("about", "missionTitle", e.target.value)} className="input-field" />
              </Field>
              <Field label="Mission Text">
                <textarea value={data.about.missionText} onChange={e => update("about", "missionText", e.target.value)} rows={3} className="input-field resize-none" />
              </Field>
              <ImageUpload label="About Page Banner Image" value={data.about.bannerImage} onChange={url => update("about", "bannerImage", url)} folder="content/about" />
            </Section>
            <Section title="Our Values (3 cards)">
              {(data.about.values || []).map((v, i) => (
                <div key={i} className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl">
                  <Field label={`Value ${i + 1} Title`}>
                    <input value={v.title} onChange={e => updateNested("about", "values", i, "title", e.target.value)} className="input-field text-sm py-2" />
                  </Field>
                  <Field label="Description">
                    <input value={v.desc} onChange={e => updateNested("about", "values", i, "desc", e.target.value)} className="input-field text-sm py-2" />
                  </Field>
                </div>
              ))}
            </Section>
          </>
        )}

        {/* TEAM */}
        {activeTab === "team" && (
          <Section title="Team Members">
            {(data.team.members || []).map((m, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl p-4 space-y-4">
                <p className="text-xs font-bold text-brand-brown uppercase tracking-widest">Member {i + 1}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Full Name">
                    <input value={m.name} onChange={e => updateNested("team", "members", i, "name", e.target.value)} className="input-field" />
                  </Field>
                  <Field label="Title / Role">
                    <input value={m.title} onChange={e => updateNested("team", "members", i, "title", e.target.value)} className="input-field" />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Bio">
                      <textarea value={m.bio} onChange={e => updateNested("team", "members", i, "bio", e.target.value)} rows={2} className="input-field resize-none" />
                    </Field>
                  </div>
                </div>
                <ImageUpload label="Profile Photo" value={m.photo} onChange={url => updateNested("team", "members", i, "photo", url)} folder="content/team" />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setData(prev => ({ ...prev, team: { ...prev.team, members: [...(prev.team.members || []), { name: "", title: "", bio: "", photo: "" }] } }))}
              className="text-sm text-brand-gold hover:underline"
            >
              + Add Team Member
            </button>
          </Section>
        )}

        {/* SOURCING */}
        {activeTab === "sourcing" && (
          <>
            <Section title="Sourcing Story">
              <Field label="Section Title">
                <input value={data.sourcing.title} onChange={e => update("sourcing", "title", e.target.value)} className="input-field" />
              </Field>
              <Field label="Story Text">
                <textarea value={data.sourcing.text} onChange={e => update("sourcing", "text", e.target.value)} rows={4} className="input-field resize-none" />
              </Field>
              <ImageUpload label="Sourcing Image" value={data.sourcing.image} onChange={url => update("sourcing", "image", url)} folder="content/sourcing" />
            </Section>
            <Section title="Stats Highlights (4 numbers)">
              <div className="grid grid-cols-2 gap-3">
                {(data.sourcing.highlights || []).map((h, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-xl space-y-2">
                    <Field label="Label">
                      <input value={h.label} onChange={e => updateNested("sourcing", "highlights", i, "label", e.target.value)} className="input-field text-sm py-1.5" />
                    </Field>
                    <Field label="Value">
                      <input value={h.value} onChange={e => updateNested("sourcing", "highlights", i, "value", e.target.value)} className="input-field text-sm py-1.5" />
                    </Field>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* CONTACT */}
        {activeTab === "contact" && (
          <Section title="Contact & Footer Info">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone">
                <input value={data.contact.phone} onChange={e => update("contact", "phone", e.target.value)} className="input-field" />
              </Field>
              <Field label="WhatsApp">
                <input value={data.contact.whatsapp} onChange={e => update("contact", "whatsapp", e.target.value)} className="input-field" />
              </Field>
              <Field label="Email">
                <input value={data.contact.email} onChange={e => update("contact", "email", e.target.value)} className="input-field" />
              </Field>
              <Field label="Address">
                <input value={data.contact.address} onChange={e => update("contact", "address", e.target.value)} className="input-field" />
              </Field>
              <div className="col-span-2">
                <Field label="Footer Tagline">
                  <input value={data.contact.footerTagline} onChange={e => update("contact", "footerTagline", e.target.value)} className="input-field" />
                </Field>
              </div>
              <Field label="Instagram URL">
                <input value={data.contact.socialInstagram} onChange={e => update("contact", "socialInstagram", e.target.value)} className="input-field" placeholder="https://instagram.com/..." />
              </Field>
              <Field label="Facebook URL">
                <input value={data.contact.socialFacebook} onChange={e => update("contact", "socialFacebook", e.target.value)} className="input-field" placeholder="https://facebook.com/..." />
              </Field>
            </div>
          </Section>
        )}

        {/* TRUST BAR */}
        {activeTab === "trust" && (
          <Section title="Trust Bar (shown site-wide)">
            <p className="text-xs text-gray-400 mb-3">These items appear in the scrolling trust marquee at top of pages</p>
            {(data.trust.items || []).map((item, i) => (
              <div key={i} className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl">
                <Field label="Icon (emoji)">
                  <input value={item.icon} onChange={e => updateNested("trust", "items", i, "icon", e.target.value)} className="input-field" maxLength={4} />
                </Field>
                <Field label="Text">
                  <input value={item.text} onChange={e => updateNested("trust", "items", i, "text", e.target.value)} className="input-field" />
                </Field>
              </div>
            ))}
          </Section>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 py-2.5 px-6">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving…" : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-brand-brown border-b border-gray-100 pb-2">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
      {children}
    </div>
  );
}
