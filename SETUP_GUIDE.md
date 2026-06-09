# 🌰 JAI SHREE DRYFRUITS — Complete Setup & Deployment Guide

## 📦 What's Included

| Feature | Status |
|---|---|
| 🛒 Full E-Commerce (Cart, Checkout) | ✅ |
| 🔐 Google + Email Login | ✅ |
| 📦 Product Management (CRUD) | ✅ |
| 🛍️ Order Management | ✅ |
| 👥 Customer Management | ✅ |
| ⭐ Review Management | ✅ |
| 🎨 Color & Tag Management | ✅ |
| 📱 WhatsApp Integration | ✅ |
| 🏆 Admin Dashboard | ✅ |
| 📱 Fully Responsive Mobile | ✅ |
| 🔥 Firebase Database | ✅ |
| 🚀 Firebase Hosting | ✅ |

---

## 🔥 STEP 1: Create Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Add Project"**
3. Name it: `jaishree-dryfruits`
4. Enable Google Analytics (optional)
5. Click **"Create Project"**

### Enable Firebase Services:

**Authentication:**
- Go to Build → Authentication → Get Started
- Enable **Email/Password** provider
- Enable **Google** provider
- Add your domain to Authorized domains

**Firestore Database:**
- Go to Build → Firestore Database → Create database
- Start in **Production mode**
- Choose region: `asia-south1` (Mumbai) for India

**Storage:**
- Go to Build → Storage → Get started
- Start in Production mode

### Get Firebase Config:
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" → Add Web App
3. Register app name: `jaishree-web`
4. Copy the `firebaseConfig` object

---

## 🔧 STEP 2: Configure Environment

1. In the project folder, copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase values:
   ```
   REACT_APP_FIREBASE_API_KEY=AIzaSy...
   REACT_APP_FIREBASE_AUTH_DOMAIN=jaishree-dryfruits.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=jaishree-dryfruits
   REACT_APP_FIREBASE_STORAGE_BUCKET=jaishree-dryfruits.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

3. Open `src/utils/helpers.js` and update:
   ```js
   export const WHATSAPP_NUMBER = "91XXXXXXXXXX"; // Your WhatsApp number with country code
   ```

4. Open `.firebaserc` and update:
   ```json
   { "projects": { "default": "jaishree-dryfruits" } }
   ```

---

## 🖥️ STEP 3: Install & Run Locally

**Requirements:** Node.js 16+ installed

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Open http://localhost:3000 — your website is running!

---

## 👑 STEP 4: Set Yourself as Admin

1. Register/Login to your website
2. Go to **Firebase Console → Firestore → users collection**
3. Find your user document (by email)
4. Edit the `role` field: change `"customer"` → `"admin"`
5. Now visit `/admin` on your website to access Admin Dashboard

---

## 🚀 STEP 5: Deploy to Firebase Hosting

```bash
# Install Firebase CLI (one time)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Build the project
npm run build

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Or deploy everything at once
firebase deploy
```

Your website will be live at: **https://jaishree-dryfruits.web.app**

---

## 🌐 STEP 6: Custom Domain (Optional)

1. Firebase Console → Hosting → Add custom domain
2. Enter your domain: `www.jaishreegryfruits.com`
3. Add the DNS records shown to your domain registrar
4. Wait 24-48 hours for SSL certificate

---

## 📱 STEP 7: Configure WhatsApp Business

1. Open `src/utils/helpers.js`
2. Find `WHATSAPP_NUMBER` and replace with your WhatsApp Business number:
   ```
   91XXXXXXXXXX  (91 = India code, then 10-digit number)
   ```
3. Test by clicking the WhatsApp button on your website

---

## 📦 STEP 8: Add Your Real Products

**Option A: Admin Dashboard (Recommended)**
1. Login as admin → go to `/admin/products`
2. Click "Add Product"
3. Fill in name, category, description
4. Add product images (use Unsplash or your own hosted images)
5. Add variants (250g, 500g, 1kg) with prices
6. Save

**Option B: Firebase Console**
1. Go to Firestore → products collection
2. Add documents manually

---

## 🖼️ STEP 9: Upload Your Product Images

**Using Firebase Storage:**
1. Firebase Console → Storage
2. Upload your product images
3. Click image → Copy download URL
4. Use this URL in product images field

**Using Free Image Hosting:**
- Cloudinary.com (free tier: 25GB)
- ImgBB.com (free unlimited)

---

## 🎨 STEP 10: Customize Branding

**Logo / Name:** Edit `src/components/Navbar.jsx` lines with "JAI SHREE"

**Colors:** Edit `tailwind.config.js`:
```js
brand: {
  gold: "#C9A84C",    // Change to your gold shade
  brown: "#3E2723",   // Change to your brown shade
}
```

**Hero slides:** Edit `src/pages/Home.jsx` — `HERO_SLIDES` array

**Footer info:** Edit `src/components/Footer.jsx`

---

## 📊 Firebase Firestore Data Structure

```
firestore/
├── users/
│   └── {userId}/
│       ├── displayName, email, phone
│       ├── role: "customer" | "admin"
│       ├── loyaltyPoints: 0
│       └── address: {}
│
├── products/
│   └── {productId}/
│       ├── name, category, description
│       ├── images: [url1, url2...]
│       ├── variants: [{id, weight, price, stock}]
│       ├── badge, featured, tags
│       └── rating, reviewCount
│
├── orders/
│   └── {orderId}/
│       ├── userId, userEmail, customerName
│       ├── items: [{name, qty, price, image}]
│       ├── address, paymentMethod
│       ├── subtotal, shipping, total
│       └── status: "pending|confirmed|shipped|delivered|cancelled"
│
└── reviews/
    └── {reviewId}/
        ├── productId, userId, rating
        ├── title, body, images
        ├── verified_purchase, status
        └── adminReply
```

---

## 🔒 Security Checklist

- [ ] Firestore rules deployed (restrict admin access)
- [ ] `.env` file NOT committed to GitHub (add to .gitignore)
- [ ] Admin role assigned only to your account
- [ ] Firebase Auth domain restrictions set
- [ ] HTTPS enabled (automatic with Firebase Hosting)

---

## 📱 GitHub Deployment (Alternative)

If you want to host on **GitHub Pages** instead of Firebase:

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"predeploy": "npm run build",
"deploy": "gh-pages -d build"

# Add to package.json (top level):
"homepage": "https://yourusername.github.io/jaishree-dryfruits"

# Deploy
npm run deploy
```

**Note:** GitHub Pages doesn't support Firebase Auth redirects as well as Firebase Hosting. **Firebase Hosting is recommended.**

---

## 🆘 Common Issues & Fixes

| Issue | Fix |
|---|---|
| `Module not found` error | Run `npm install` |
| Firebase permission denied | Check Firestore rules, check user role |
| Google login fails | Add localhost to Firebase Auth authorized domains |
| Admin page shows "Access Denied" | Set role to "admin" in Firestore users collection |
| Images not loading | Check image URLs are valid and publicly accessible |
| WhatsApp button not working | Update WHATSAPP_NUMBER in helpers.js |

---

## 📞 Features Reference

| Page | URL | Description |
|---|---|---|
| Home | `/` | Hero slider, categories, featured products |
| Shop | `/products` | All products with filters |
| Product | `/product/p1` | Detail page with gallery, reviews |
| Cart | `/cart` | Cart page |
| Checkout | `/checkout` | 3-step checkout |
| Login | `/login` | Google + Email login |
| My Account | `/dashboard` | Orders, profile, wishlist |
| Admin | `/admin` | Admin dashboard |
| Admin Products | `/admin/products` | Add/edit/delete products |
| Admin Orders | `/admin/orders` | Manage all orders |
| Admin Customers | `/admin/customers` | View customers |
| Admin Reviews | `/admin/reviews` | Moderate reviews |
| Admin Colors | `/admin/colors` | Brand colors & tags |

---

*Built with React 18 + Firebase + Tailwind CSS*
*JAI SHREE DRYFRUITS — Premium Quality Since Day One 🌰*
