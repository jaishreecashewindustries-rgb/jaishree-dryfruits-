/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: "#C9A84C",
          "gold-light": "#E8C97A",
          "gold-dark": "#9E7A2E",
          brown: "#1A2744",
          "brown-light": "#2C4B8C",
          cream: "#F4F6FF",
          "cream-dark": "#E8ECF8",
          warm: "#1E3A8A",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "Helvetica Neue", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        shimmer: "shimmer 1.5s infinite",
        float: "float 3s ease-in-out infinite",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        marquee: "marquee 18s linear infinite",
        testimonialScroll: "testimonialScroll 28s linear infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: { "0%": { transform: "translateY(20px)", opacity: 0 }, "100%": { transform: "translateY(0)", opacity: 1 } },
        slideInRight: { "0%": { transform: "translateX(100%)" }, "100%": { transform: "translateX(0)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        float: { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-12px)" } },
        pulseGold: { "0%, 100%": { boxShadow: "0 0 0 0 rgba(201,168,76,0.4)" }, "50%": { boxShadow: "0 0 20px 8px rgba(201,168,76,0.1)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        testimonialScroll: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-33.333%)" } },
      },
      transitionDuration: { 400: "400ms" },
    },
  },
  plugins: [],
};
