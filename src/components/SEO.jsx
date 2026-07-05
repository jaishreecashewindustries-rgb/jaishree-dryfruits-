import { useEffect } from "react";

const SITE_NAME = "Jai Shree Dryfruits";
const SITE_URL = "https://jaishreedryfruits.com";
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;
const DEFAULT_DESC =
  "India's finest dry fruits — premium California almonds, Kashmiri walnuts, Iranian pistachios & more. FSSAI certified. Free shipping above ₹499. Est. 1999, Jaipur.";

function setMeta(name, content, property = false) {
  const selector = property
    ? `meta[property="${name}"]`
    : `meta[name="${name}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    if (property) el.setAttribute("property", name);
    else el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLinkCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

function injectStructuredData(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * SEO component — call at the top of each page.
 *
 * Props:
 *   title       — page title (appended with " | Jai Shree Dryfruits")
 *   description — meta description (155 chars max recommended)
 *   image       — absolute URL for OG image
 *   canonical   — canonical URL (defaults to current href)
 *   type        — og:type ("website" | "product" | "article")
 *   product     — optional product object for Product structured data
 *   article     — optional article metadata { publishedAt, modifiedAt }
 *   noIndex     — set true for admin/private pages
 */
export default function SEO({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  canonical,
  type = "website",
  product,
  article,
  noIndex = false,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — India's Finest Dry Fruits`;
  // Always anchor to the real production origin, never window.location.href —
  // the prerender build runs Puppeteer against a local static server
  // (http://localhost:5050), and window.location.href there bakes
  // "localhost:5050" into the canonical tag of every prerendered page
  // shipped to production. That tells Google the real page lives at an
  // unreachable localhost URL, which is why pages were stuck on
  // "Crawled - currently not indexed" in Search Console.
  const canonicalURL = canonical || `${SITE_URL}${window.location.pathname}${window.location.search}`;

  useEffect(() => {
    document.title = fullTitle;

    // Basic meta
    setMeta("description", description);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large");

    // Open Graph
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:image", image, true);
    setMeta("og:url", canonicalURL, true);
    setMeta("og:type", type, true);
    setMeta("og:site_name", SITE_NAME, true);
    setMeta("og:locale", "en_IN", true);

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", image);

    // Canonical
    setLinkCanonical(canonicalURL);

    // Organization structured data (always present)
    injectStructuredData("sd-org", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      foundingDate: "1999",
      address: {
        "@type": "PostalAddress",
        streetAddress: "41, Barah Ji Ki Gali, Gangauri Bazar",
        addressLocality: "Jaipur",
        addressRegion: "Rajasthan",
        postalCode: "302001",
        addressCountry: "IN",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+91-75685-77968",
          contactType: "customer service",
          availableLanguage: ["en", "hi"],
        },
      ],
      sameAs: [],
    });

    // Product structured data
    if (product) {
      const lowestPrice = Math.min(...(product.variants || [{ price: 0 }]).map((v) => v.price));
      const inStock = (product.variants || []).some((v) => (Number(v.stock) ?? 1) > 0);
      injectStructuredData("sd-product", {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.images || [],
        sku: product.id,
        brand: { "@type": "Brand", name: SITE_NAME },
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: lowestPrice,
          availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: SITE_NAME },
        },
        aggregateRating: product.rating
          ? {
              "@type": "AggregateRating",
              ratingValue: product.rating,
              reviewCount: product.reviewCount || 1,
            }
          : undefined,
      });
    } else {
      // Remove stale product SD when navigating away
      const el = document.getElementById("sd-product");
      if (el) el.remove();
    }

    // Article structured data
    if (article) {
      injectStructuredData("sd-article", {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: fullTitle,
        image,
        datePublished: article.publishedAt,
        dateModified: article.modifiedAt || article.publishedAt,
        author: { "@type": "Organization", name: SITE_NAME },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
        },
      });
    } else {
      const el = document.getElementById("sd-article");
      if (el) el.remove();
    }
  }, [fullTitle, description, image, canonicalURL, type, noIndex, product, article]);

  return null;
}
