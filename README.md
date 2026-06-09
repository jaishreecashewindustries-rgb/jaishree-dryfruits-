# Jai Shree Dry Fruits — Premium E-Commerce Website

A modern, luxury e-commerce platform for Jai Shree Dry Fruits, built with React 18, Tailwind CSS, Firebase, and Framer Motion.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Styling | Tailwind CSS, Framer Motion |
| Backend | Firebase Firestore, Firebase Auth |
| Payments | Razorpay (UPI / Cards / Net Banking) |
| Hosting | Firebase Hosting / Vercel / Netlify |

## Features

- Full e-commerce flow: Products → Cart → Checkout → Order tracking
- Razorpay payment gateway (UPI, cards, net banking, EMI)
- PIN code auto-fill (India Post API) in checkout
- WhatsApp admin order notifications
- JS Coins loyalty programme (earn on purchase, redeem for discount)
- Coupon system with Firestore validation + fallback codes
- Admin panel: Orders, Products, Reviews, Coupons, Blog, Inquiries, Coins
- Blog with seed posts + Firestore CMS
- FAQ, Sourcing Story, About pages
- Multi-language support
- Framer Motion animations throughout
- Mobile-first responsive design

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/jaishree-dryfruits.git
cd jaishree-dryfruits
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:
- Firebase project credentials (from Firebase Console)
- Razorpay key (use `rzp_test_...` for dev, `rzp_live_...` for production)
- Admin WhatsApp number

### 4. Set up Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password + Google
3. Enable **Firestore Database**
4. Enable **Storage**
5. Deploy Firestore rules: `firebase deploy --only firestore:rules`

### 5. Start development server

```bash
npm start
```

### 6. Build for production

```bash
npm run build
```

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── CartSidebar.jsx
│   ├── ProductCard.jsx
│   └── WhatsAppButton.jsx
├── context/            # React Context providers
│   ├── AuthContext.jsx
│   ├── CartContext.jsx
│   ├── CoinsContext.jsx
│   └── LanguageContext.jsx
├── firebase/
│   └── config.js       # Firebase initialisation (reads from .env)
├── pages/
│   ├── Home.jsx
│   ├── Products.jsx
│   ├── ProductDetail.jsx
│   ├── Cart.jsx
│   ├── Checkout.jsx
│   ├── Blog.jsx
│   ├── BlogPost.jsx
│   ├── FAQ.jsx
│   ├── SourcingStory.jsx
│   ├── UserDashboard.jsx
│   ├── Login.jsx
│   └── admin/          # Admin panel pages
├── utils/
│   ├── helpers.js      # Formatters, demo data, constants
│   └── translations.js # Multi-language strings
├── App.jsx             # Routes
├── index.js            # Entry point
└── index.css           # Global styles + Tailwind
public/
├── index.html          # HTML shell (Razorpay script loaded here)
├── logo.png
├── favicon.png
└── hero.mp4
```

## Admin Access

Set `isAdmin: true` on a user document in Firestore:
```
Firestore → users → {uid} → isAdmin: true
```

## Coupon Codes (Demo)

| Code | Discount | Min Order |
|------|---------|-----------|
| WELCOME15 | 15% off | ₹299 |
| CASHEW10 | 10% off | ₹199 |
| MONSOON20 | 20% off | ₹499 |
| FLAT50 | ₹50 off | ₹499 |

## Security Notes

- Firebase API keys in `.env` (never committed)
- Razorpay key in `.env` (use test key in dev)
- Admin gate enforced server-side via Firestore `isAdmin` field
- All payments via Razorpay — PCI-DSS Level 1 compliant
- Firestore security rules in `firestore.rules`

## License

Private — Jai Shree Cashew Industries, Jaipur, Rajasthan
